import { cn } from "@/lib/utils";
import {
  Tab,
  TabGroup,
  TabList,
  TabListProps,
  TabPanel,
  TabPanelProps,
  TabPanels,
  TabProps,
} from "@headlessui/react";
import { Tooltip } from "./Tooltip";

const Tabs = TabGroup;
const TabsPanels = TabPanels;

interface ITabsTriggerList extends TabListProps {
  className?: string;
}
const TabsTriggerList = ({
  children,
  className,
  ...props
}: ITabsTriggerList) => {
  return (
    <TabList className={cn("flex flex-row space-x-2", className)} {...props}>
      {children}
    </TabList>
  );
};

interface ITabsTrigger extends TabProps {
  className?: string;
  disabledText?: string;
}
const TabsTrigger = ({ children, className, disabledText, ...props }: ITabsTrigger) => {
  const triggerEl = (
    <Tab
      className={cn(
        "px-4 py-1 border-2 border-transparent focus:outline-hidden transition-colors",
        // hover state when not selected
        "hover:border-border hover:bg-muted",
        // selected state
        "data-selected:border-border data-selected:bg-primary data-selected:text-primary-foreground data-selected:font-semibold",
        // disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </Tab>
  );

  if (props.disabled && disabledText) {
    return (
      <Tooltip>
        <Tooltip.Trigger asChild>
          {triggerEl}
        </Tooltip.Trigger>
        <Tooltip.Content>{disabledText}</Tooltip.Content>
      </Tooltip>
    );
  }

  return triggerEl;
};

interface ITabsContent extends TabPanelProps {
  className?: string;
}
const TabsContent = ({ children, className, ...props }: ITabsContent) => {
  return (
    <TabPanel
      className={cn("border-2 border-border mt-2 p-4", className)}
      {...props}
    >
      {children}
    </TabPanel>
  );
};

export { Tabs, TabsPanels, TabsTrigger, TabsContent, TabsTriggerList };
