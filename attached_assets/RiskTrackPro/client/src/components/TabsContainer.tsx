import React, { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  show?: boolean;
}

interface TabsContainerProps {
  tabs: Tab[];
  defaultTab?: string;
}

const TabsContainer: React.FC<TabsContainerProps> = ({ 
  tabs, 
  defaultTab 
}) => {
  // Filter tabs to only show the ones with show=true or undefined (default to show)
  const visibleTabs = tabs.filter(tab => tab.show !== false);
  
  // If no tabs are visible, return nothing
  if (visibleTabs.length === 0) return null;
  
  // Use the first visible tab as default if none specified
  const defaultValue = defaultTab || visibleTabs[0]?.id;
  
  return (
    <div className="border rounded-md shadow-sm">
      <Tabs defaultValue={defaultValue} className="w-full">
        <TabsList className="w-full justify-start rounded-t-md rounded-b-none border-b bg-muted/50">
          {visibleTabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="py-2 data-[state=active]:bg-background"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {visibleTabs.map(tab => (
          <TabsContent 
            key={tab.id} 
            value={tab.id} 
            className="p-4"
          >
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TabsContainer;