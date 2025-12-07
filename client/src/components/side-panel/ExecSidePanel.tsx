import { selectCurrentRun, useAppState } from "@/state";
import { Card } from "../retroui/Card";
import { Tabs, TabsContent, TabsPanels, TabsTrigger, TabsTriggerList } from "../retroui/Tab";
import { CompilationTab } from "./CompilationTab";
import { useEffect, useState } from "react";
import { ExecutionTab } from "./ExecutionTab";
import { useExec } from "@/exec/useExec";
import { API_URL } from "@/constants";
import { IRTab } from "./IRTab";

export const ExecSidePanel = () => {
  const currentRun = useAppState(selectCurrentRun)
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);

  const execState = useExec({
    execJsUrl: `${API_URL}/artifacts/${currentRun?.id}/js`,
    execWasmUrl: `${API_URL}/artifacts/${currentRun?.id}/wasm`
  });

  useEffect(() => {
    // if current tab is IR or Execution, and currentRun becomes invalid, switch to Compilation tab
    if (selectedTabIndex > 0) {
      if (!currentRun || currentRun.status !== "succeeded") {
        setSelectedTabIndex(0);
      }
    }
    execState.clear();
  }, [currentRun, execState.clear])

  const shouldDisableIRandExecTabs = !currentRun || currentRun.status !== "succeeded";
  const disabledText = "Must successfully compile code to enable this tab.";

  return (
    <Card>
      <Tabs selectedIndex={selectedTabIndex} onChange={setSelectedTabIndex} >
        <TabsTriggerList className="w-full">
          <TabsTrigger className="flex-1 min-w-0 truncate" >Compilation</TabsTrigger>
          <TabsTrigger className="flex-1 min-w-0 truncate" disabled={shouldDisableIRandExecTabs} disabledText={disabledText}>IR</TabsTrigger>
          <TabsTrigger className="flex-1 min-w-0 truncate" disabled={shouldDisableIRandExecTabs} disabledText={disabledText}>Execution</TabsTrigger>
        </TabsTriggerList>
        <TabsPanels>
          <TabsContent>
            <CompilationTab run={execState.run} navigateToExecTab={() => setSelectedTabIndex(2)} />
          </TabsContent>
          <TabsContent className="p-0">
            <IRTab />
          </TabsContent>
          <TabsContent>
            <ExecutionTab {...execState} />
          </TabsContent>
        </TabsPanels>
      </Tabs>
    </Card>
  );
}