import z from "zod";
import { API_URL } from "./constants";
import { RUN_STATUSES } from "./state";

const QueueCompilationResponse = z.object({
  jobId: z.string(),
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