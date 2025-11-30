import { UseExecReturn } from "@/exec/useExec"
import { Button } from "@/components/retroui/Button"
import { Code } from "../Code";

type Props = UseExecReturn & {
  stdout: string;
  stderr: string;
}

export const ExecutionTab = ({ run, error, loading, stdout, stderr }: Props) => {
  if (error) return <div className="text-red-600">Load error: {error}</div>

  return <div className="gap-2 flex flex-col">
    <Button className="w-fit" onClick={() => run()} disabled={loading}>{loading ? "Loading..." : "Run"}</Button>
    <h3>Stdout</h3>
    <Code>{stdout || "\n"}</Code>
    <h3>Stderr</h3>
    <Code>{stderr || "\n"}</Code>
  </div>
}