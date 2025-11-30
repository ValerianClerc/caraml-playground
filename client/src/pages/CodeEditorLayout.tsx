import { CodeEditor } from "@/components/CodeEditor";
import { ExecSidePanel } from "@/components/side-panel/ExecSidePanel";
import { RunSelector } from "@/components/RunSelector";

export const CodeEditorLayout = () => {
  return (
    <div className="flex flex-row gap-4 p-4 h-full">
      <div className="w-3/5">
        <CodeEditor />
      </div>
      <div className="w-2/5 flex flex-col gap-2">
        <RunSelector />
        <ExecSidePanel />
      </div>
    </div>
  );
}