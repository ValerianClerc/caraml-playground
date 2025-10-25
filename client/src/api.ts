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
  errorMessage: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});
type FetchRunStatusResponse = z.infer<typeof FetchRunStatusResponse>;

export async function fetchRunStatus(id: string): Promise<FetchRunStatusResponse> {
  const res = await fetch(`${API_URL}/job-status/${id}`);
  if (!res.ok) return { id, status: 'failed', errorMessage: 'Failed to fetch run status', startedAt: undefined, completedAt: undefined };
  return FetchRunStatusResponse.parse(await res.json());
}