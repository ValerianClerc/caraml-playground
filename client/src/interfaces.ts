
export const RUN_STATUSES = ['pending', 'running', 'succeeded', 'failed'] as const;

export type RunStatus = typeof RUN_STATUSES[number];

export interface Run {
  id: string;
  code: string;
  status: RunStatus;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}