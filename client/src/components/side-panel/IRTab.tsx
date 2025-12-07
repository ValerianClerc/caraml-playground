import { fetchArtifact } from "@/api";
import { selectCurrentRun, useAppState } from "@/state";
import { QueryFunction, useQuery } from "@tanstack/react-query";
import { Code } from "../Code";

const getIR: QueryFunction<string> = async ({ queryKey }) => {
  const [_key, runId] = queryKey;
  if (typeof runId !== 'string') {
    throw new Error('Invalid run ID');
  }
  const irText = await fetchArtifact(runId, "ir");
  return irText;
}

export const IRTab = () => {
  const currentRun = useAppState(selectCurrentRun);
  const currentSuccessfulRunId = currentRun?.status === "succeeded" ? currentRun.id : undefined;

  const { data: irText, isLoading, error } = useQuery({
    queryKey: ['ir', currentSuccessfulRunId],
    queryFn: getIR
  })

  if (!currentRun) {
    return <div className="p-4">No run selected.</div>;
  }

  if (currentRun.status !== "succeeded") {
    return <div className="p-4">IR is only available for successful runs.</div>;
  }

  if (isLoading) {
    return <div className="p-4">Loading IR...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading IR: {(error as Error).message}</div>;
  }

  return (
    <Code disableBorder>{irText?.trim()}</Code>
  );
}