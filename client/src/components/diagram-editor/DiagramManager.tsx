import React, { useState, useCallback, useEffect } from 'react';
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
import { ReactFlowProvider, useNodesState, useEdgesState, ReactFlow, Controls, Background, MiniMap, Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

// Type definitions
type Diagram = {
  id: number;
  name: string;
  description: string | null;
  projectId: number | null;
  documentId: number | null;
  templateId: number;
  nodeEntities: unknown;
  createdAt: Date;
  updatedAt: Date;
};

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

type Entity = {
  id: number;
  name: string;
  categoryId: number;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  createdAt: Date;
};

type Project = {
  id: number;
  projectName: string;
};

type Document = {
  id: number;
  title: string;
  projectId: number | null;
};

// Graph layout utility
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // Set nodes
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  // Set edges
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply layout to nodes
  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 75,
      y: nodeWithPosition.y - 25
    };
  });

  return { nodes, edges };
};

// Initial nodes and edges
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export function DiagramManager() {
  const [isAddDiagramOpen, setIsAddDiagramOpen] = useState(false);
  const [isEditDiagramOpen, setIsEditDiagramOpen] = useState(false);
  const [isViewDiagramOpen, setIsViewDiagramOpen] = useState(false);
  const [isDeleteDiagramConfirmOpen, setIsDeleteDiagramConfirmOpen] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);
  const [diagramForm, setDiagramForm] = useState({
    name: '',
    description: '',
    templateId: 0,
    projectId: null as number | null,
    documentId: null as number | null,
  });
  const [nodeEntityMapping, setNodeEntityMapping] = useState<Record<string, number>>({});

  // Flow editor states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const queryClient = useQueryClient();

  // Query to fetch diagrams
  const diagramsQuery = useQuery({
    queryKey: ['/api/diagrams'],
    queryFn: async () => {
      const response = await fetch('/api/diagrams');
      if (!response.ok) {
        throw new Error('Failed to fetch diagrams');
      }
      return response.json();
    }
  });

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

  // Query to fetch entities
  const entitiesQuery = useQuery({
    queryKey: ['/api/entities'],
    queryFn: async () => {
      const response = await fetch('/api/entities');
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      return response.json();
    }
  });

  // Query to fetch projects
  const projectsQuery = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
  });

  // Query to fetch documents
  const documentsQuery = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    }
  });

  // Create diagram mutation
  const createDiagramMutation = useMutation({
    mutationFn: (data: { 
      name: string; 
      description: string;
      templateId: number;
      projectId: number | null;
      documentId: number | null;
      nodeEntities: Record<string, number>;
    }) => {
      return apiRequest('/api/diagrams', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagrams'] });
      setIsAddDiagramOpen(false);
      resetDiagramForm();
      toast({
        title: 'Success',
        description: 'Diagram created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating diagram:', error);
      toast({
        title: 'Error',
        description: 'Failed to create diagram',
        variant: 'destructive',
      });
    }
  });

  // Update diagram mutation
  const updateDiagramMutation = useMutation({
    mutationFn: (data: { 
      id: number; 
      name: string; 
      description: string;
      templateId: number;
      projectId: number | null;
      documentId: number | null;
      nodeEntities: Record<string, number>;
    }) => {
      return apiRequest(`/api/diagrams/${data.id}`, 'PUT', {
        name: data.name,
        description: data.description,
        templateId: data.templateId,
        projectId: data.projectId,
        documentId: data.documentId,
        nodeEntities: data.nodeEntities
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagrams'] });
      setIsEditDiagramOpen(false);
      resetDiagramForm();
      toast({
        title: 'Success',
        description: 'Diagram updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating diagram:', error);
      toast({
        title: 'Error',
        description: 'Failed to update diagram',
        variant: 'destructive',
      });
    }
  });

  // Delete diagram mutation
  const deleteDiagramMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/diagrams/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/diagrams'] });
      setIsDeleteDiagramConfirmOpen(false);
      setSelectedDiagram(null);
      toast({
        title: 'Success',
        description: 'Diagram deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting diagram:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete diagram',
        variant: 'destructive',
      });
    }
  });

  // Reset form helpers
  const resetDiagramForm = () => {
    setDiagramForm({
      name: '',
      description: '',
      templateId: 0,
      projectId: null,
      documentId: null
    });
    setNodes(initialNodes);
    setEdges(initialEdges);
    setNodeEntityMapping({});
  };

  // Handle template selection for new diagram
  const handleTemplateChange = (templateId: number) => {
    if (!templatesQuery.data) return;
    
    const template = templatesQuery.data.find((t: DiagramTemplate) => t.id === templateId);
    if (!template) return;
    
    setDiagramForm({
      ...diagramForm,
      templateId
    });
    
    // Set nodes and edges from template
    if (template.nodes) {
      try {
        const nodeData = typeof template.nodes === 'string' 
          ? JSON.parse(template.nodes as string) 
          : template.nodes;
        setNodes(nodeData as Node[]);
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
        setEdges(edgeData as Edge[]);
      } catch (error) {
        console.error('Error parsing edges:', error);
        setEdges(initialEdges);
      }
    }

    // Initialize entity mapping with empty values
    const newMapping: Record<string, number> = {};
    if (nodes) {
      nodes.forEach(node => {
        newMapping[node.id] = 0; // Default to none
      });
    }
    setNodeEntityMapping(newMapping);
  };

  // Handle edit diagram
  const handleEditDiagram = (diagram: Diagram) => {
    setSelectedDiagram(diagram);
    setDiagramForm({
      name: diagram.name,
      description: diagram.description || '',
      templateId: diagram.templateId,
      projectId: diagram.projectId,
      documentId: diagram.documentId
    });
    
    // Set node entity mapping
    if (diagram.nodeEntities) {
      try {
        const nodeEntitiesData = typeof diagram.nodeEntities === 'string' 
          ? JSON.parse(diagram.nodeEntities as string) 
          : diagram.nodeEntities;
        setNodeEntityMapping(nodeEntitiesData as Record<string, number>);
      } catch (error) {
        console.error('Error parsing node entities:', error);
        setNodeEntityMapping({});
      }
    }
    
    // Get template to set nodes and edges
    if (templatesQuery.data) {
      const template = templatesQuery.data.find((t: DiagramTemplate) => t.id === diagram.templateId);
      if (template) {
        // Set nodes from template
        if (template.nodes) {
          try {
            const nodeData = typeof template.nodes === 'string' 
              ? JSON.parse(template.nodes as string) 
              : template.nodes;
            setNodes(nodeData as Node[]);
          } catch (error) {
            console.error('Error parsing nodes:', error);
            setNodes(initialNodes);
          }
        }
        
        // Set edges from template
        if (template.edges) {
          try {
            const edgeData = typeof template.edges === 'string' 
              ? JSON.parse(template.edges as string) 
              : template.edges;
            setEdges(edgeData as Edge[]);
          } catch (error) {
            console.error('Error parsing edges:', error);
            setEdges(initialEdges);
          }
        }
      }
    }
    
    setIsEditDiagramOpen(true);
  };

  // Handle view diagram
  const handleViewDiagram = (diagram: Diagram) => {
    setSelectedDiagram(diagram);
    
    // Get template to set nodes and edges
    if (templatesQuery.data) {
      const template = templatesQuery.data.find((t: DiagramTemplate) => t.id === diagram.templateId);
      if (template) {
        // Set nodes from template
        if (template.nodes) {
          try {
            const nodeData = typeof template.nodes === 'string' 
              ? JSON.parse(template.nodes as string) 
              : template.nodes;
            
            // Apply layout
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
              nodeData as Node[],
              (typeof template.edges === 'string' 
                ? JSON.parse(template.edges as string) 
                : template.edges) as Edge[],
              template.layout === 'horizontal' ? 'LR' : 'TB'
            );
            
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
          } catch (error) {
            console.error('Error parsing nodes:', error);
            setNodes(initialNodes);
          }
        }
      }
    }
    
    // Set node entity mapping
    if (diagram.nodeEntities) {
      try {
        const nodeEntitiesData = typeof diagram.nodeEntities === 'string' 
          ? JSON.parse(diagram.nodeEntities as string) 
          : diagram.nodeEntities;
        setNodeEntityMapping(nodeEntitiesData as Record<string, number>);
      } catch (error) {
        console.error('Error parsing node entities:', error);
        setNodeEntityMapping({});
      }
    }
    
    setIsViewDiagramOpen(true);
  };

  // Handle delete diagram
  const handleDeleteDiagram = (diagram: Diagram) => {
    setSelectedDiagram(diagram);
    setIsDeleteDiagramConfirmOpen(true);
  };

  // Handle new diagram
  const handleAddDiagram = () => {
    resetDiagramForm();
    setIsAddDiagramOpen(true);
  };

  // Get entity name by ID helper
  const getEntityNameById = (entityId: number | null | undefined): string => {
    if (!entityId) return 'None';
    if (entitiesQuery.isLoading || !entitiesQuery.data) return 'Loading...';
    const entity = entitiesQuery.data.find((e: Entity) => e.id === entityId);
    return entity ? entity.name : 'Unknown';
  };

  // Get template name by ID helper
  const getTemplateNameById = (templateId: number): string => {
    if (templatesQuery.isLoading || !templatesQuery.data) return 'Loading...';
    const template = templatesQuery.data.find((t: DiagramTemplate) => t.id === templateId);
    return template ? template.name : 'Unknown';
  };

  // Get project name by ID helper
  const getProjectNameById = (projectId: number | null): string => {
    if (!projectId) return 'None';
    if (projectsQuery.isLoading || !projectsQuery.data) return 'Loading...';
    const project = projectsQuery.data.find((p: Project) => p.id === projectId);
    return project ? project.projectName : 'Unknown';
  };

  // Get document name by ID helper
  const getDocumentNameById = (documentId: number | null): string => {
    if (!documentId) return 'None';
    if (documentsQuery.isLoading || !documentsQuery.data) return 'Loading...';
    const document = documentsQuery.data.find((d: Document) => d.id === documentId);
    return document ? document.title : 'Unknown';
  };

  // Handle connection when edges are manually created in the editor
  const onConnect = (connection: Connection) => {
    setEdges((eds) => [...eds, { ...connection, animated: true }]);
  };

  // Custom node that shows the assigned entity
  const CustomNode = ({ data, id }: { data: any, id: string }) => {
    const entityId = nodeEntityMapping[id];
    const entityName = getEntityNameById(entityId);
    
    return (
      <div className="px-4 py-2 rounded bg-white border border-gray-200 shadow-md w-[200px]">
        <div className="font-medium text-gray-900">{data.label}</div>
        {entityId > 0 && (
          <div className="text-sm text-gray-500 mt-1">
            Entity: {entityName}
          </div>
        )}
      </div>
    );
  };

  // Flow editor components for viewing
  const ViewFlowEditor = () => {
    return (
      <div style={{ width: '100%', height: '500px' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes.map(node => ({
              ...node,
              type: 'custom',
              data: {
                ...node.data,
                entity: nodeEntityMapping[node.id] 
                  ? getEntityNameById(nodeEntityMapping[node.id])
                  : null
              }
            }))}
            edges={edges}
            nodeTypes={{ custom: CustomNode }}
            fitView
            attributionPosition="bottom-right"
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    );
  };

  // Node entity assignment editor
  const NodeEntityAssignmentEditor = () => {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Assign Entities to Nodes</h3>
        <div className="grid grid-cols-1 gap-4">
          {nodes.map((node) => (
            <div key={node.id} className="flex items-center gap-4 p-3 rounded border border-gray-200">
              <div className="flex-1">
                <span className="font-medium">{node.data.label}</span>
              </div>
              <div className="flex-1">
                <select
                  value={nodeEntityMapping[node.id] || 0}
                  onChange={(e) => {
                    setNodeEntityMapping({
                      ...nodeEntityMapping,
                      [node.id]: parseInt(e.target.value)
                    });
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>None</option>
                  {entitiesQuery.data && entitiesQuery.data.map((entity: Entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Diagrams</CardTitle>
          <Button onClick={handleAddDiagram} disabled={!templatesQuery.data || templatesQuery.data.length === 0}>
            Create Diagram
          </Button>
        </CardHeader>
        <CardContent>
          {diagramsQuery.isLoading ? (
            <div className="flex justify-center py-8">Loading diagrams...</div>
          ) : diagramsQuery.isError ? (
            <div className="flex justify-center py-8 text-red-500">Error loading diagrams</div>
          ) : (
            <Table>
              <TableCaption>List of diagrams in the system</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagramsQuery.data && diagramsQuery.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No diagrams found</TableCell>
                  </TableRow>
                ) : (
                  diagramsQuery.data && diagramsQuery.data.map((diagram: Diagram) => (
                    <TableRow key={diagram.id}>
                      <TableCell className="font-medium">{diagram.name}</TableCell>
                      <TableCell>{getTemplateNameById(diagram.templateId)}</TableCell>
                      <TableCell>{getProjectNameById(diagram.projectId)}</TableCell>
                      <TableCell>{getDocumentNameById(diagram.documentId)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" className="mr-2" onClick={() => handleViewDiagram(diagram)}>
                          View
                        </Button>
                        <Button variant="outline" className="mr-2" onClick={() => handleEditDiagram(diagram)}>
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteDiagram(diagram)}>
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

      {/* Add Diagram Dialog */}
      <Dialog open={isAddDiagramOpen} onOpenChange={setIsAddDiagramOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Diagram</DialogTitle>
            <DialogDescription>
              Create a new diagram based on a template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={diagramForm.name}
                onChange={(e) => setDiagramForm({...diagramForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={diagramForm.description}
                onChange={(e) => setDiagramForm({...diagramForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template" className="text-right">
                Template
              </Label>
              <select
                id="template"
                value={diagramForm.templateId}
                onChange={(e) => handleTemplateChange(parseInt(e.target.value))}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value={0} disabled>Select a template</option>
                {!templatesQuery.isLoading && templatesQuery.data && templatesQuery.data.map((template: DiagramTemplate) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project (Optional)
              </Label>
              <select
                id="project"
                value={diagramForm.projectId || ''}
                onChange={(e) => setDiagramForm({
                  ...diagramForm, 
                  projectId: e.target.value ? parseInt(e.target.value) : null
                })}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {!projectsQuery.isLoading && projectsQuery.data && projectsQuery.data.map((project: Project) => (
                  <option key={project.id} value={project.id}>{project.projectName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="document" className="text-right">
                Document (Optional)
              </Label>
              <select
                id="document"
                value={diagramForm.documentId || ''}
                onChange={(e) => setDiagramForm({
                  ...diagramForm, 
                  documentId: e.target.value ? parseInt(e.target.value) : null
                })}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {!documentsQuery.isLoading && documentsQuery.data && documentsQuery.data.map((document: Document) => (
                  <option key={document.id} value={document.id}>{document.title}</option>
                ))}
              </select>
            </div>
            
            {diagramForm.templateId !== 0 && nodes.length > 0 && (
              <NodeEntityAssignmentEditor />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDiagramOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createDiagramMutation.mutate({
                name: diagramForm.name,
                description: diagramForm.description,
                templateId: diagramForm.templateId,
                projectId: diagramForm.projectId,
                documentId: diagramForm.documentId,
                nodeEntities: nodeEntityMapping
              })}
              disabled={!diagramForm.name || diagramForm.templateId === 0 || createDiagramMutation.isPending}
            >
              {createDiagramMutation.isPending ? 'Saving...' : 'Save Diagram'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Diagram Dialog */}
      <Dialog open={isEditDiagramOpen} onOpenChange={setIsEditDiagramOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Diagram</DialogTitle>
            <DialogDescription>
              Update diagram details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={diagramForm.name}
                onChange={(e) => setDiagramForm({...diagramForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={diagramForm.description}
                onChange={(e) => setDiagramForm({...diagramForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-project" className="text-right">
                Project (Optional)
              </Label>
              <select
                id="edit-project"
                value={diagramForm.projectId || ''}
                onChange={(e) => setDiagramForm({
                  ...diagramForm, 
                  projectId: e.target.value ? parseInt(e.target.value) : null
                })}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {!projectsQuery.isLoading && projectsQuery.data && projectsQuery.data.map((project: Project) => (
                  <option key={project.id} value={project.id}>{project.projectName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-document" className="text-right">
                Document (Optional)
              </Label>
              <select
                id="edit-document"
                value={diagramForm.documentId || ''}
                onChange={(e) => setDiagramForm({
                  ...diagramForm, 
                  documentId: e.target.value ? parseInt(e.target.value) : null
                })}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None</option>
                {!documentsQuery.isLoading && documentsQuery.data && documentsQuery.data.map((document: Document) => (
                  <option key={document.id} value={document.id}>{document.title}</option>
                ))}
              </select>
            </div>
            
            {nodes.length > 0 && (
              <NodeEntityAssignmentEditor />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDiagramOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedDiagram) {
                  updateDiagramMutation.mutate({
                    id: selectedDiagram.id,
                    name: diagramForm.name,
                    description: diagramForm.description,
                    templateId: diagramForm.templateId,
                    projectId: diagramForm.projectId,
                    documentId: diagramForm.documentId,
                    nodeEntities: nodeEntityMapping
                  });
                }
              }}
              disabled={!diagramForm.name || updateDiagramMutation.isPending}
            >
              {updateDiagramMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Diagram Dialog */}
      <Dialog open={isViewDiagramOpen} onOpenChange={setIsViewDiagramOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDiagram?.name}</DialogTitle>
            <DialogDescription>
              {selectedDiagram?.description || 'No description'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedDiagram && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Template</span>
                  <p>{getTemplateNameById(selectedDiagram.templateId)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Project</span>
                  <p>{getProjectNameById(selectedDiagram.projectId)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="text-sm font-medium text-gray-500">Document</span>
                  <p>{getDocumentNameById(selectedDiagram.documentId)}</p>
                </div>
              </div>
            )}
            <ViewFlowEditor />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewDiagramOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Diagram Confirmation */}
      <AlertDialog open={isDeleteDiagramConfirmOpen} onOpenChange={setIsDeleteDiagramConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the diagram "{selectedDiagram?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDiagram) {
                  deleteDiagramMutation.mutate(selectedDiagram.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDiagramMutation.isPending}
            >
              {deleteDiagramMutation.isPending ? 'Deleting...' : 'Delete Diagram'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}