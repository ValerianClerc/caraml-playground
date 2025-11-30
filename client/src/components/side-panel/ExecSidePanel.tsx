import { selectCurrentRun, useAppState } from "@/state";
import { Card } from "../retroui/Card";
import { Tabs, TabsContent, TabsPanels, TabsTrigger, TabsTriggerList } from "../retroui/Tab";
import { CompilationTab } from "./CompilationTab";
import { useEffect, useState } from "react";

export const ExecSidePanel = () => {
  const currentRun = useAppState(selectCurrentRun)
  const [selectedTabIndex, setSelectedTabIndex] = useState<number | undefined>(0);

  useEffect(() => {
    // if current tab is IR or Execution, and currentRun becomes invalid, switch to Compilation tab
    if (selectedTabIndex && selectedTabIndex > 0) {
      if (!currentRun || currentRun.status !== "succeeded") {
        setSelectedTabIndex(0);
      }
    }
  }, [currentRun])

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
            <CompilationTab />
          </TabsContent>
          <TabsContent>
            IR tab
          </TabsContent>
          <TabsContent>
            Execution tab
          </TabsContent>
        </TabsPanels>
      </Tabs>
    </Card>
  );
}