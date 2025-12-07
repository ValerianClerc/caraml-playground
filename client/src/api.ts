import z from "zod";
import { API_URL } from "./constants";
import { RUN_STATUSES } from "./interfaces";

const QueueCompilationResponse = z.object({
  id: z.string(),
  status: z.enum(RUN_STATUSES),
});
type QueueCompilationResponse = z.infer<typeof QueueCompilationResponse>;

export const queueCompilation = async (sourceCode: string): Promise<QueueCompilationResponse> => {
  const response = await fetch(`${API_URL}/queue-compilation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sourceCode
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Error queueing compilation: ${JSON.stringify(body)}`);
  }
  return QueueCompilationResponse.parse(body);
}

const FetchRunStatusResponse = z.object({
  id: z.string(),
  status: z.enum(RUN_STATUSES),
  error_message: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
});
type FetchRunStatusResponse = z.infer<typeof FetchRunStatusResponse>;

export async function fetchRunStatus(id: string): Promise<FetchRunStatusResponse> {
  const res = await fetch(`${API_URL}/job-status/${id}`);
  if (!res.ok) return { id, status: 'failed', error_message: 'Failed to fetch run status', started_at: undefined, completed_at: undefined };
  return FetchRunStatusResponse.parse(await res.json());
}

export async function fetchArtifact(id: string, ext: 'js' | 'wasm' | 'ir'): Promise<string> {
  const res = await fetch(`${API_URL}/artifacts/${id}/${ext}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch artifact: ${res.statusText}`);
  }
  return res.text();
}