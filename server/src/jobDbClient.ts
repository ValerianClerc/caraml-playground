import { DefaultAzureCredential } from '@azure/identity';
import { Pool } from 'pg';

const DB_SCOPE_URL = 'https://ossrdbms-aad.database.windows.net/.default';

type Job = {
  id: string;
  sourceCode: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  errorMessage: string | null;
  artifactJsPath: string | null;
  artifactWasmPath: string | null;
  artifactIrPath: string | null;
}

export type ArtifactPaths = {
  js: string | null;
  wasm: string | null;
  ir: string | null;
}

export interface IJobDBClient {
  init(): Promise<void>;
  createJob(sourceCode: string): Promise<Pick<Job, 'id' | 'status'>>; // returns job ID (UUID)
  getJobStatus(jobId: string): Promise<Pick<Job, 'id' | 'status' | 'errorMessage' | 'startedAt' | 'completedAt'>>; // returns job status
  claimJob(): Promise<Pick<Job, 'id' | 'status' | 'sourceCode'> | null>;
  updateJob(jobId: string, job: Partial<Job>): Promise<void>;
  getJobArtifacts(jobId: string): Promise<ArtifactPaths>;
}

class AzurePostGresJobDBClient implements IJobDBClient {
  private pool: Pool | null = null;
  private credential = new DefaultAzureCredential();
  private token: string | null = null;
  private tokenExpiry: number | undefined;

  async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      console.debug("Reusing existing token");
      return this.token;
    }
    const token = await this.credential.getToken(DB_SCOPE_URL);
    this.tokenExpiry = token.refreshAfterTimestamp;
    this.token = token.token;
    return this.token;
  }

  async init(): Promise<void> {
    this.pool = new Pool({
      host: process.env.PGHOST ?? 'caraml-postgres.postgres.database.azure.com',
      port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE ?? 'postgres',
      password: await this.getToken(),
      user: process.env.PGUSER ?? "caraml-server",
      ssl: true,
    });

    await this.pool.query(`CREATE TABLE IF NOT EXISTS jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_code TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending','running','succeeded','failed'
      )),
      error_message TEXT,
      artifact_js_path TEXT,
      artifact_wasm_path TEXT,
      artifact_ir_path TEXT
    )`);
    return Promise.resolve();
  }

  async getJobStatus(jobId: string): Promise<Pick<Job, 'id' | 'status' | 'errorMessage' | 'startedAt' | 'completedAt'>> {
    if (!this.pool) throw new Error('DB not initialized');
    const response = await this.pool.query<Pick<Job, 'id' | 'status' | 'errorMessage' | 'startedAt' | 'completedAt'>>(
      `SELECT id, status, error_message, started_at, completed_at FROM jobs WHERE id = $1`,
      [jobId]
    );
    return response.rows[0] ?? { id: jobId, status: 'unknown', errorMessage: null, startedAt: null, completedAt: null };
  }

  async updateJob(jobId: string, job: Partial<Job>): Promise<void> {
    if (!this.pool) throw new Error('DB not initialized');
    if (!jobId) throw new Error('Job ID is required to update job');
    // Map of allowed Job fields (camelCase) to DB columns (snake_case)
    const colMap: Record<string, string> = {
      sourceCode: 'source_code',
      status: 'status',
      startedAt: 'started_at',
      completedAt: 'completed_at',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      errorMessage: 'error_message',
      artifactJsPath: 'artifact_js_path',
      artifactWasmPath: 'artifact_wasm_path',
      artifactIrPath: 'artifact_ir_path',
    };

    const entries = Object.entries(job).filter(([k, v]) => v !== undefined && k in colMap);
    if (entries.length === 0) return Promise.resolve();

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of entries) {
      const col = colMap[key];
      setClauses.push(`${col} = $${idx}`);
      // let pg handle JS Date <-> timestamptz and Buffer for BYTEA
      values.push(val as any);
      idx++;
    }

    // If caller didn't explicitly set updatedAt, update it to now()
    if (!('updatedAt' in job)) {
      setClauses.push(`updated_at = now()`);
    }

    const sql = `UPDATE jobs SET ${setClauses.join(', ')} WHERE id = $${idx}`;
    values.push(jobId);
    await this.pool.query(sql, values);
    return Promise.resolve();
  }

  async createJob(sourceCode: string): Promise<Pick<Job, 'id' | 'status'>> {
    if (!this.pool) throw new Error('DB not initialized');
    const jobId = crypto.randomUUID()
    await this.pool.query(`INSERT INTO jobs (id, source_code, status) VALUES ($1, $2, 'pending')`, [jobId, sourceCode]);
    return { id: jobId, status: 'pending' };
  }

  async claimJob(): Promise<Pick<Job, 'id' | 'status' | 'sourceCode'> | null> {
    if (!this.pool) throw new Error('DB not initialized');

    // Use a CTE to atomically select and update a pending job
    const sql = `WITH picked AS (
        SELECT id FROM jobs
        WHERE status = 'pending'
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE jobs
      SET status = 'running', started_at = now(), updated_at = now()
      FROM picked
      WHERE jobs.id = picked.id
      RETURNING jobs.id, jobs.status, jobs.source_code`;

    const res = await this.pool.query<{ id: string; status: Job['status']; source_code: string }>(sql);
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return { id: r.id, status: r.status, sourceCode: r.source_code };
  }

  getJobArtifacts(jobId: string): Promise<ArtifactPaths> {
    if (!this.pool) throw new Error('DB not initialized');
    return this.pool.query<ArtifactPaths>(
      `SELECT artifact_js_path AS "js", artifact_wasm_path AS "wasm", artifact_ir_path AS "ir" FROM jobs WHERE id = $1`,
      [jobId]
    ).then(res => {
      if (res.rowCount === 0) {
        return { js: null, wasm: null, ir: null };
      }
      return res.rows[0];
    });
  }
}

export function createJobDBClient(): IJobDBClient {
  return new AzurePostGresJobDBClient();
} 