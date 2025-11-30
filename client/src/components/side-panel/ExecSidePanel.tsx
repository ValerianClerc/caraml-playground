import { Card } from "../retroui/Card";
import { Tabs, TabsContent, TabsPanels, TabsTrigger, TabsTriggerList } from "../retroui/Tab";

export const ExecSidePanel = () => {
  return (
    <Card>
      <Tabs>
        <TabsTriggerList className="w-full">
          <TabsTrigger className="flex-1 min-w-0 truncate">Compilation</TabsTrigger>
          <TabsTrigger className="flex-1 min-w-0 truncate">IR</TabsTrigger>
          <TabsTrigger className="flex-1 min-w-0 truncate">Execution</TabsTrigger>
        </TabsTriggerList>
        <TabsPanels>
          <TabsContent>
            Compilation tab
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