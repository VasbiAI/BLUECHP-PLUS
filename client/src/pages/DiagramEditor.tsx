import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityManager } from '../components/diagram-editor/EntityManager';
import { TemplateManager } from '../components/diagram-editor/TemplateManager';
import { DiagramManager } from '../components/diagram-editor/DiagramManager';

export default function DiagramEditor() {
  const [activeTab, setActiveTab] = useState('entities');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Diagram Editor</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="diagrams">Diagrams</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entities" className="mt-6">
          <EntityManager />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <TemplateManager />
        </TabsContent>
        
        <TabsContent value="diagrams" className="mt-6">
          <DiagramManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}