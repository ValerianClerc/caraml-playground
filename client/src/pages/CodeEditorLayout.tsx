import { CodeEditor } from "@/components/CodeEditor";
import { ExecDemo } from "@/components/ExecDemo";
import { RunSelector } from "@/components/RunSelector";

export const CodeEditorLayout = () => {
  return (
    <div className="flex flex-row gap-4 p-4 h-full">
      <div className="w-3/5">
        <CodeEditor />
      </div>
      <div className="w-2/5">
        <RunSelector />
        <ExecDemo />
      </div>
    </div>
  );
}