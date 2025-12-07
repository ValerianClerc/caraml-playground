import { TrashIcon } from "lucide-react";
import { Button } from "./retroui/Button";
import { Tooltip } from "./retroui/Tooltip";
import { useAppState } from "@/state";
import { useCallback } from "react";

export const DeleteButton = () => {
  const { clearRuns } = useAppState()

  const onDeleteAll = useCallback(() => {
    clearRuns();
  }, [clearRuns]);

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Button onClick={onDeleteAll} size="icon" variant="secondary" className="p-2"><TrashIcon /></Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        Delete all runs
      </Tooltip.Content>
    </Tooltip>
  );
}