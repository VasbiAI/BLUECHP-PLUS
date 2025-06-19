import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { apiRequest } from '@/lib/queryClient';
import { ReactFlowProvider, useNodesState, useEdgesState, ReactFlow, Controls, Background, Panel, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

type DiagramTemplate = {
  id: number;
  name: string;
  description: string | null;
  layout: string;
  nodes: unknown;
  edges: unknown;
  createdAt: Date;
  updatedAt: Date;
};

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Template Node' },
    position: { x: 250, y: 25 },
  },
];

const initialEdges = [];

export function TemplateManager() {
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [isDeleteTemplateConfirmOpen, setIsDeleteTemplateConfirmOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DiagramTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    layout: 'dagre',  // Default layout
  });

  // Flow editor states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const queryClient = useQueryClient();

  // Query to fetch diagram templates
  const templatesQuery = useQuery({
    queryKey: ['/api/diagram-templates'],
    queryFn: async () => {
      const response = await fetch('/api/diagram-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch diagram templates');
      }
      return response.json();
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: { 
      name: string; 
      description: string;
      layout: string;
      nodes: unknown;
      edges: unknown;
    }) => {
      return apiRequest('/api/diagram-templates', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagram-templates'] });
      setIsAddTemplateOpen(false);
      resetTemplateForm();
      toast({
        title: 'Success',
        description: 'Template created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive',
      });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: (data: { 
      id: number; 
      name: string; 
      description: string;
      layout: string;
      nodes: unknown;
      edges: unknown;
    }) => {
      return apiRequest(`/api/diagram-templates/${data.id}`, 'PUT', {
        name: data.name,
        description: data.description,
        layout: data.layout,
        nodes: data.nodes,
        edges: data.edges
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagram-templates'] });
      setIsEditTemplateOpen(false);
      resetTemplateForm();
      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/diagram-templates/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagram-templates'] });
      setIsDeleteTemplateConfirmOpen(false);
      setSelectedTemplate(null);
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  });

  // Reset form helpers
  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      layout: 'dagre'
    });
    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  // Handle edit template
  const handleEditTemplate = (template: DiagramTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      layout: template.layout || 'dagre'
    });
    
    // Set nodes and edges from template
    if (template.nodes) {
      try {
        const nodeData = typeof template.nodes === 'string' 
          ? JSON.parse(template.nodes as string) 
          : template.nodes;
        setNodes(nodeData as any[]);
      } catch (error) {
        console.error('Error parsing nodes:', error);
        setNodes(initialNodes);
      }
    }
    
    if (template.edges) {
      try {
        const edgeData = typeof template.edges === 'string' 
          ? JSON.parse(template.edges as string) 
          : template.edges;
        setEdges(edgeData as any[]);
      } catch (error) {
        console.error('Error parsing edges:', error);
        setEdges(initialEdges);
      }
    }
    
    setIsEditTemplateOpen(true);
  };

  // Handle delete template
  const handleDeleteTemplate = (template: DiagramTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteTemplateConfirmOpen(true);
  };

  // Handle new template
  const handleAddTemplate = () => {
    resetTemplateForm();
    setIsAddTemplateOpen(true);
  };

  // Flow editor components
  const FlowEditor = () => {
    return (
      <div style={{ width: '100%', height: '400px' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
            <Panel position="top-right">
              <Button variant="outline" size="sm" onClick={() => {
                const newId = (nodes.length + 1).toString();
                const newNode = {
                  id: newId,
                  data: { label: `Node ${newId}` },
                  position: { x: Math.random() * 300 + 50, y: Math.random() * 300 + 50 },
                };
                setNodes((nds) => [...nds, newNode]);
              }}>
                Add Node
              </Button>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Diagram Templates</CardTitle>
          <Button onClick={handleAddTemplate}>Create Template</Button>
        </CardHeader>
        <CardContent>
          {templatesQuery.isLoading ? (
            <div className="flex justify-center py-8">Loading diagram templates...</div>
          ) : templatesQuery.isError ? (
            <div className="flex justify-center py-8 text-red-500">Error loading diagram templates</div>
          ) : (
            <Table>
              <TableCaption>List of diagram templates in the system</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Layout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesQuery.data && templatesQuery.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No templates found</TableCell>
                  </TableRow>
                ) : (
                  templatesQuery.data && templatesQuery.data.map((template: DiagramTemplate) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.description || 'No description'}</TableCell>
                      <TableCell>{template.layout || 'Default'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" className="mr-2" onClick={() => handleEditTemplate(template)}>
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteTemplate(template)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Template Dialog */}
      <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Template</DialogTitle>
            <DialogDescription>
              Design a new diagram template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="layout" className="text-right">
                Layout
              </Label>
              <select
                id="layout"
                value={templateForm.layout}
                onChange={(e) => setTemplateForm({...templateForm, layout: e.target.value})}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="dagre">Dagre (Tree Layout)</option>
                <option value="grid">Grid</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Label>Template Design</Label>
              <FlowEditor />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createTemplateMutation.mutate({
                name: templateForm.name,
                description: templateForm.description,
                layout: templateForm.layout,
                nodes: nodes,
                edges: edges
              })}
              disabled={!templateForm.name || createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditTemplateOpen} onOpenChange={setIsEditTemplateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update diagram template details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-layout" className="text-right">
                Layout
              </Label>
              <select
                id="edit-layout"
                value={templateForm.layout}
                onChange={(e) => setTemplateForm({...templateForm, layout: e.target.value})}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="dagre">Dagre (Tree Layout)</option>
                <option value="grid">Grid</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Label>Template Design</Label>
              <FlowEditor />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTemplateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTemplate) {
                  updateTemplateMutation.mutate({
                    id: selectedTemplate.id,
                    name: templateForm.name,
                    description: templateForm.description,
                    layout: templateForm.layout,
                    nodes: nodes,
                    edges: edges
                  });
                }
              }}
              disabled={!templateForm.name || updateTemplateMutation.isPending}
            >
              {updateTemplateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={isDeleteTemplateConfirmOpen} onOpenChange={setIsDeleteTemplateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{selectedTemplate?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedTemplate) {
                  deleteTemplateMutation.mutate(selectedTemplate.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}