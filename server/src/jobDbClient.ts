import { DefaultAzureCredential } from '@azure/identity';
import { Pool } from 'pg';

const DB_SCOPE_URL = 'https://ossrdbms-aad.database.windows.net/.default';

interface IJobDBClient {
  init(): Promise<void>;
  createJob(sourceCode: string): Promise<string>; // returns job ID (UUID)
  getJobStatus(jobId: string): Promise<string>; // returns job status
  setJobStatus(jobId: string, status: string): Promise<void>;
  // setJobArtifacts(jobId: string, jsUrl: string | null, inlineWasm: Buffer | null, inlineJs: string | null): Promise<void>;
  // getJobArtifacts(jobId: string): Promise<{ jsUrl: string | null; inlineWasm: Buffer | null; inlineJs: string | null }>;
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
      user: "valerian.clerc_gmail.com#EXT#@valerianclercgmail.onmicrosoft.co",// process.env.PGUSER,
      log: (msg) => console.log("DB Log:", msg),
      ssl: true
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
      artifact_inline_wasm BYTEA,
      artifact_inline_js TEXT
    )`);
    return Promise.resolve();
  }

  async getJobStatus(jobId: string): Promise<string> {
    if (!this.pool) throw new Error('DB not initialized');
    const response = await this.pool.query<{ status: string }>(`SELECT status FROM jobs WHERE id = $1`, [jobId])
      .then(res => res.rows[0]?.status ?? 'unknown');
    return response;
  }

  setJobStatus(jobId: string, status: string): Promise<void> {
    if (!this.pool) throw new Error('DB not initialized');
    return this.pool.query(`UPDATE jobs SET status = $1, updated_at = now() WHERE id = $2`, [status, jobId])
      .then(() => Promise.resolve());
  }

  async createJob(sourceCode: string): Promise<string> {
    if (!this.pool) throw new Error('DB not initialized');
    const jobId = crypto.randomUUID()
    await this.pool.query(`INSERT INTO jobs (id, source_code, status) VALUES ($1, $2, 'pending')`, [jobId, sourceCode]);
    return jobId;
  }
}

export function createJobDBClient(): IJobDBClient {
  return new AzurePostGresJobDBClient();
} 