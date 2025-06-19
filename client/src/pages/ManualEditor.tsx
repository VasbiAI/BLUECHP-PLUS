import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { 
  Book, ChevronRight, ChevronDown, Plus, Edit, Trash2, 
  Save, X, FilePlus, FolderPlus, ArrowRight, MoveVertical  
} from "lucide-react";
import { TreeView } from "@syncfusion/ej2-react-navigations";
import { RichTextEditorComponent, Inject, Toolbar, Link, Image, 
         HtmlEditor, QuickToolbar, Table, EmojiPicker, Video, Audio,
         FormatPainter, PasteCleanup, Count } from '@syncfusion/ej2-react-richtexteditor';
import { DialogComponent } from '@syncfusion/ej2-react-popups';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Types
interface Manual {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ManualSection {
  id: number;
  manualId: number;
  parentId: number | null;
  title: string;
  orderId: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

interface TreeViewItem extends ManualSection {
  expanded?: boolean;
  isParent?: boolean;
  hasChildren?: boolean;
  items?: TreeViewItem[];
}

interface State {
  id: number;
  name: string;
  code: string;
}

interface DevelopmentType {
  id: number;
  name: string;
  description: string | null;
}

interface FinanceModel {
  id: number;
  name: string;
  description: string | null;
}

interface ContractType {
  id: number;
  name: string;
  description: string | null;
}

interface FundingSource {
  id: number;
  name: string;
  description: string | null;
}

interface RevenueStream {
  id: number;
  name: string;
  description: string | null;
}

interface DocumentCategory {
  id: number;
  name: string;
  description: string | null;
  iconName: string | null;
}

interface ContentType {
  id: number;
  name: string;
  description: string | null;
}

interface ManualContent {
  id: number;
  sectionId: number;
  contentTypeId: number;
  title: string;
  sfdtData: string;
  htmlData: string;
  orderId: number;
  createdAt: string;
  updatedAt: string;
  states?: State[];
}

const ManualEditor = () => {
  const { id } = useParams<{ id: string }>();
  const manualId = parseInt(id);
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Tree view state
  const [selectedSection, setSelectedSection] = useState<ManualSection | null>(null);
  const [treeData, setTreeData] = useState<TreeViewItem[]>([]);
  const treeViewRef = useRef<TreeView | null>(null);

  // Section management state
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false);
  const [newSection, setNewSection] = useState({ title: "", parentId: null });

  // Content management state
  const [sectionContents, setSectionContents] = useState<ManualContent[]>([]);
  const [isContentEditorOpen, setIsContentEditorOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState<Partial<ManualContent> | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<number | null>(null);

  // Create refs for Syncfusion components
  const richTextEditorRef = useRef<RichTextEditorComponent>(null);
  const [selectedStates, setSelectedStates] = useState<number[]>([]);
  const [selectedDevelopmentTypes, setSelectedDevelopmentTypes] = useState<number[]>([]);
  const [selectedFinanceModels, setSelectedFinanceModels] = useState<number[]>([]);
  const [selectedContractTypes, setSelectedContractTypes] = useState<number[]>([]);
  const [selectedFundingSources, setSelectedFundingSources] = useState<number[]>([]);
  const [selectedRevenueStreams, setSelectedRevenueStreams] = useState<number[]>([]);
  const [selectedDocumentCategories, setSelectedDocumentCategories] = useState<number[]>([]);

  // Fetch manual details
  const { data: manual, isLoading: isLoadingManual } = useQuery<Manual>({
    queryKey: [`/api/manuals/${manualId}`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/manuals/${manualId}`);
      } catch (error) {
        console.error("Error fetching manual:", error);
        throw error;
      }
    },
    enabled: !isNaN(manualId),
  });

  // Fetch manual sections
  const { data: sections = [], isLoading: isLoadingSections, refetch: refetchSections } = useQuery<ManualSection[]>({
    queryKey: [`/api/manuals/${manualId}/sections`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/manuals/${manualId}/sections`);
      } catch (error) {
        console.error("Error fetching sections:", error);
        return [];
      }
    },
    enabled: !isNaN(manualId),
  });

  // Fetch content types
  const { data: contentTypes = [], isLoading: isLoadingContentTypes } = useQuery<ContentType[]>({
    queryKey: ['/api/content-types'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/content-types');
      } catch (error) {
        console.error("Error fetching content types:", error);
        return [];
      }
    },
  });

  // Fetch Australian states
  const { data: states = [], isLoading: isLoadingStates } = useQuery<State[]>({
    queryKey: ['/api/states'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/states');
      } catch (error) {
        console.error("Error fetching states:", error);
        return [];
      }
    },
  });

  // Fetch Development Types
  const { data: developmentTypes = [], isLoading: isLoadingDevelopmentTypes } = useQuery<DevelopmentType[]>({
    queryKey: ['/api/admin/lookups/developmentTypes'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/admin/lookups/developmentTypes');
      } catch (error) {
        console.error("Error fetching development types:", error);
        return [];
      }
    },
  });

  // Fetch Finance Models
  const { data: financeModels = [], isLoading: isLoadingFinanceModels } = useQuery<FinanceModel[]>({
    queryKey: ['/api/admin/lookups/financeModels'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/admin/lookups/financeModels');
      } catch (error) {
        console.error("Error fetching finance models:", error);
        return [];
      }
    },
  });

  // Fetch Contract Types
  const { data: contractTypes = [], isLoading: isLoadingContractTypes } = useQuery<ContractType[]>({
    queryKey: ['/api/admin/lookups/contractTypes'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/admin/lookups/contractTypes');
      } catch (error) {
        console.error("Error fetching contract types:", error);
        return [];
      }
    },
  });

  // Fetch Funding Sources
  const { data: fundingSources = [], isLoading: isLoadingFundingSources } = useQuery<FundingSource[]>({
    queryKey: ['/api/admin/lookups/fundingSources'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/admin/lookups/fundingSources');
      } catch (error) {
        console.error("Error fetching funding sources:", error);
        return [];
      }
    },
  });

  // Fetch Revenue Streams
  const { data: revenueStreams = [], isLoading: isLoadingRevenueStreams } = useQuery<RevenueStream[]>({
    queryKey: ['/api/admin/lookups/revenueStreams'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/admin/lookups/revenueStreams');
      } catch (error) {
        console.error("Error fetching revenue streams:", error);
        return [];
      }
    },
  });

  // Fetch Document Categories
  const { data: documentCategories = [], isLoading: isLoadingDocumentCategories } = useQuery<DocumentCategory[]>({
    queryKey: ['/api/admin/lookups/documentCategories'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/admin/lookups/documentCategories');
      } catch (error) {
        console.error("Error fetching document categories:", error);
        return [];
      }
    },
  });

  // Fetch section contents when a section is selected
  useEffect(() => {
    if (selectedSection) {
      const fetchContents = async () => {
        try {
          const contents = await apiRequest('GET', `/api/manual-sections/${selectedSection.id}/contents`);
          setSectionContents(contents || []);
        } catch (error) {
          console.error("Error fetching section contents:", error);
          setSectionContents([]);
        }
      };

      fetchContents();
    } else {
      setSectionContents([]);
    }
  }, [selectedSection]);

  // Transform sections into tree structure
  useEffect(() => {
    if (sections.length > 0) {
      const buildTree = (parentId: number | null): TreeViewItem[] => {
        return sections
          .filter(section => section.parentId === parentId)
          .sort((a, b) => a.orderId - b.orderId)
          .map(section => {
            const children = buildTree(section.id);
            return {
              ...section,
              expanded: true,
              isParent: children.length > 0,
              hasChildren: children.length > 0,
              items: children.length > 0 ? children : undefined
            };
          });
      };

      const tree = buildTree(null);
      setTreeData(tree);

      // If no section is selected, select the first one
      if (!selectedSection && tree.length > 0) {
        setSelectedSection(tree[0]);
      }
    }
  }, [sections, selectedSection]);

  // Handle tree node selection
  const handleNodeSelected = (e: any) => {
    const nodeId = e.nodeData.id;
    const selectedNode = sections.find(section => section.id === parseInt(nodeId));
    if (selectedNode) {
      setSelectedSection(selectedNode);
    }
  };

  // Handle adding a new section
  const handleAddSection = async () => {
    if (!newSection.title || !newSection.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the section.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get max order ID for this level
      const siblingSections = sections.filter(s => s.parentId === newSection.parentId);
      const maxOrderId = siblingSections.length > 0
        ? Math.max(...siblingSections.map(s => s.orderId))
        : 0;

      const parentSection = newSection.parentId 
        ? sections.find(s => s.id === newSection.parentId) 
        : null;

      // Ensure parentId is explicitly null when it's not set
      // This prevents date-related issues in the database
      const sectionData = {
        manualId,
        title: newSection.title,
        parentId: newSection.parentId === undefined ? null : newSection.parentId,
        orderId: maxOrderId + 1,
        level: parentSection ? parentSection.level + 1 : 1
      };

      await apiRequest('POST', '/api/manual-sections', sectionData);

      toast({
        title: "Section Added",
        description: "The section has been added successfully.",
      });

      // Reset form and close modal
      setNewSection({ title: "", parentId: null });
      setIsAddSectionModalOpen(false);

      // Refetch sections
      refetchSections();
    } catch (error) {
      console.error("Error adding section:", error);
      toast({
        title: "Error",
        description: "Failed to add section. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle editing a section
  const handleEditSection = async () => {
    if (!selectedSection) return;

    if (!newSection.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the section.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sectionData = {
        title: newSection.title
      };

      await apiRequest('PUT', `/api/manual-sections/${selectedSection.id}`, sectionData);

      toast({
        title: "Section Updated",
        description: "The section has been updated successfully.",
      });

      // Reset form and close modal
      setNewSection({ title: "", parentId: null });
      setIsEditSectionModalOpen(false);

      // Refetch sections
      refetchSections();
    } catch (error) {
      console.error("Error updating section:", error);
      toast({
        title: "Error",
        description: "Failed to update section. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a section
  const handleDeleteSection = async () => {
    if (!selectedSection) return;

    try {
      await apiRequest('DELETE', `/api/manual-sections/${selectedSection.id}`);

      toast({
        title: "Section Deleted",
        description: "The section has been deleted successfully.",
      });

      // Reset selected section and close modal
      setSelectedSection(null);
      setIsDeleteSectionModalOpen(false);

      // Refetch sections
      refetchSections();
    } catch (error) {
      console.error("Error deleting section:", error);
      toast({
        title: "Error",
        description: "Failed to delete section. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Open the content editor for creating new content
  const handleAddContent = () => {
    if (!selectedSection) return;

    setCurrentContent({
      sectionId: selectedSection.id,
      title: "",
      sfdtData: "",
      htmlData: "",
      orderId: sectionContents.length > 0
        ? Math.max(...sectionContents.map(c => c.orderId)) + 1
        : 1
    });
    setSelectedContentType(contentTypes.length > 0 ? contentTypes[0].id : null);
    setSelectedStates([]);
    setSelectedDevelopmentTypes([]);
    setSelectedFinanceModels([]);
    setSelectedContractTypes([]);
    setSelectedFundingSources([]);
    setSelectedRevenueStreams([]);
    setSelectedDocumentCategories([]);
    setIsContentEditorOpen(true);
  };

  // Open the content editor for editing existing content
  const handleEditContent = (content: ManualContent) => {
    console.log("Opening editor for content:", content);
    setCurrentContent(content);
    setSelectedContentType(content.contentTypeId);

    // Extract state IDs from content.states
    const stateIds = content.states?.map(s => s.id) || [];
    console.log("Setting selected states:", stateIds);
    setSelectedStates(stateIds);

    // Reset all other tag selections for now (will be populated from content if available)
    setSelectedDevelopmentTypes([]);
    setSelectedFinanceModels([]);
    setSelectedContractTypes([]);
    setSelectedFundingSources([]);
    setSelectedRevenueStreams([]);
    setSelectedDocumentCategories([]);

    setIsContentEditorOpen(true);
  };

  // Save content (create or update)
  const handleSaveContent = async () => {
    // Get updated values directly from the form at save time
    const contentTypeSelect = document.getElementById('content-type') as HTMLSelectElement;

    // Make sure we have the latest values
    const updatedContentTypeId = contentTypeSelect ? parseInt(contentTypeSelect.value) : selectedContentType;

    // Update the current content with the latest values
    const updatedContent = {
      ...currentContent,
      title: "",
    };

    if (!updatedContent || !selectedSection || !updatedContentTypeId) {
      console.log("Cannot save, missing required fields:", {
        updatedContent: !!updatedContent,
        selectedSection: !!selectedSection,
        contentTypeId: updatedContentTypeId
      });
      toast({
        title: "Error",
        description: "Missing required fields. Make sure to select a content type.",
        variant: "destructive",
      });
      return;
    }

    try {
      // In this implementation, we're using the value directly from currentContent
      // which is updated by the RichTextEditorComponent's change event
      const htmlData = updatedContent.htmlData || "";
      const sfdtData = updatedContent.sfdtData || htmlData; // In a real app, this would be real SFDT format

      // Get all checkboxes for states
      const stateCheckboxes = document.querySelectorAll('input[id^="state-checkbox-"]');
      const selectedStateIds: number[] = [];
      stateCheckboxes.forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        if (input.checked) {
          const stateId = parseInt(input.dataset.stateId || '0');
          if (stateId > 0) {
            selectedStateIds.push(stateId);
          }
        }
      });

      // Get all checkboxes for development types
      const developmentTypeCheckboxes = document.querySelectorAll('input[id^="development-type-checkbox-"]');
      const selectedDevelopmentTypeIds: number[] = [];
      developmentTypeCheckboxes.forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        if (input.checked) {
          const typeId = parseInt(input.dataset.typeId || '0');
          if (typeId > 0) {
            selectedDevelopmentTypeIds.push(typeId);
          }
        }
      });

      // Get all checkboxes for finance models
      const financeModelCheckboxes = document.querySelectorAll('input[id^="finance-model-checkbox-"]');
      const selectedFinanceModelIds: number[] = [];
      financeModelCheckboxes.forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        if (input.checked) {
          const modelId = parseInt(input.dataset.modelId || '0');
          if (modelId > 0) {
            selectedFinanceModelIds.push(modelId);
          }
        }
      });

      // Get all checkboxes for contract types
      const contractTypeCheckboxes = document.querySelectorAll('input[id^="contract-type-checkbox-"]');
      const selectedContractTypeIds: number[] = [];
      contractTypeCheckboxes.forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        if (input.checked) {
          const typeId = parseInt(input.dataset.typeId || '0');
          if (typeId > 0) {
            selectedContractTypeIds.push(typeId);
          }
        }
      });

      // Get all checkboxes for funding sources
      const fundingSourceCheckboxes = document.querySelectorAll('input[id^="funding-source-checkbox-"]');
      const selectedFundingSourceIds: number[] = [];
      fundingSourceCheckboxes.forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        if (input.checked) {
          const sourceId = parseInt(input.dataset.sourceId || '0');
          if (sourceId > 0) {
            selectedFundingSourceIds.push(sourceId);
          }
        }
      });

      // Get all checkboxes for revenue streams
      const revenueStreamCheckboxes = document.querySelectorAll('input[id^="revenue-stream-checkbox-"]');
      const selectedRevenueStreamIds: number[] = [];
      revenueStreamCheckboxes.forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        if (input.checked) {
          const streamId = parseInt(input.dataset.streamId || '0');
          if (streamId > 0) {
            selectedRevenueStreamIds.push(streamId);
          }
        }
      });

      // Get all checkboxes for document categories
      const documentCategoryCheckboxes = document.querySelectorAll('input[id^="document-category-checkbox-"]');
      const selectedDocumentCategoryIds: number[] = [];
      documentCategoryCheckboxes.forEach((checkbox: Element) => {
        const input = checkbox as HTMLInputElement;
        if (input.checked) {
          const categoryId = parseInt(input.dataset.categoryId || '0');
          if (categoryId > 0) {
            selectedDocumentCategoryIds.push(categoryId);
          }
        }
      });

      // Log all the tag ids that we're going to save - for debugging
      console.log("Saving content with all tags:", {
        contentTypeId: updatedContentTypeId,
        stateIds: selectedStateIds,
        developmentTypeIds: selectedDevelopmentTypeIds,
        financeModelIds: selectedFinanceModelIds,
        contractTypeIds: selectedContractTypeIds,
        fundingSourceIds: selectedFundingSourceIds,
        revenueStreamIds: selectedRevenueStreamIds,
        documentCategoryIds: selectedDocumentCategoryIds
      });

      const contentData = {
        sectionId: selectedSection.id,
        contentTypeId: updatedContentTypeId,
        title: "",
        sfdtData,
        htmlData,
        orderId: updatedContent.orderId || 1,
        stateIds: selectedStateIds,
        developmentTypeIds: selectedDevelopmentTypeIds,
        financeModelIds: selectedFinanceModelIds,
        contractTypeIds: selectedContractTypeIds,
        fundingSourceIds: selectedFundingSourceIds,
        revenueStreamIds: selectedRevenueStreamIds,
        documentCategoryIds: selectedDocumentCategoryIds
      };

      if (updatedContent.id) {
        // Update existing content
        console.log("Sending update request with data:", contentData);
        const updatedContentData = await apiRequest('PUT', `/api/manual-contents/${updatedContent.id}`, contentData);
        console.log("Content updated successfully:", updatedContentData);
        toast({
          title: "Content Updated",
          description: "The content has been updated successfully.",
        });
      } else {
        // Create new content
        console.log("Sending create request with data:", contentData);
        const newContent = await apiRequest('POST', '/api/manual-contents', contentData);
        console.log("Content created successfully:", newContent);
        toast({
          title: "Content Added",
          description: "The content has been added successfully.",
        });
      }

      // Close editor and reset state
      setIsContentEditorOpen(false);
      setCurrentContent(null);
      setSelectedContentType(null);
      setSelectedStates([]);
      setSelectedDevelopmentTypes([]);
      setSelectedFinanceModels([]);
      setSelectedContractTypes([]);
      setSelectedFundingSources([]);
      setSelectedRevenueStreams([]);
      setSelectedDocumentCategories([]);

      // Refetch section contents
      if (selectedSection) {
        const contents = await apiRequest('GET', `/api/manual-sections/${selectedSection.id}/contents`);
        setSectionContents(contents || []);
      }
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting content
  const handleDeleteContent = async (contentId: number) => {
    try {
      await apiRequest('DELETE', `/api/manual-contents/${contentId}`);

      toast({
        title: "Content Deleted",
        description: "The content has been deleted successfully.",
      });

      // Refetch section contents
      if (selectedSection) {
        const contents = await apiRequest('GET', `/api/manual-sections/${selectedSection.id}/contents`);
        setSectionContents(contents || []);
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle state selection in the content editor
  const handleStateChange = (stateId: number) => {
    console.log(`Toggling state ${stateId}, current states:`, selectedStates);

    // Create a new array to ensure React detects the change
    let updatedStates = [...selectedStates];

    if (selectedStates.includes(stateId)) {
      // Remove the state
      updatedStates = updatedStates.filter(id => id !== stateId);
    } else {
      // Add the state
      updatedStates.push(stateId);
    }

    console.log('Setting updated states:', updatedStates);
    setSelectedStates(updatedStates);

    // Also update the current content with the new states
    if (currentContent) {
      // Update the states in the current content
      const updatedStateObjects = states
        .filter(state => updatedStates.includes(state.id))
        .map(state => ({ id: state.id, name: state.name, code: state.code }));

      setCurrentContent({
        ...currentContent,
        states: updatedStateObjects
      });
    }
  };

  if (isLoadingManual) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!manual) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Manual Not Found</h1>
          <p className="mt-2">The manual you're looking for doesn't exist or you don't have access to it.</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/manuals')}
          >
            Back to Manuals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/manuals')}
              >
                <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">{manual.title}</h1>
            </div>
            {manual.description && (
              <p className="text-muted-foreground mt-1">{manual.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with tree view */}
          <div className="col-span-1 bg-white rounded-lg border overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-medium">Manual Sections</h2>
              <Button 
                size="sm" 
                onClick={() => {
                  setNewSection({ title: "", parentId: null });
                  setIsAddSectionModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="p-2 h-[calc(100vh-240px)] overflow-y-auto">
              {isLoadingSections ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : treeData.length === 0 ? (
                <div className="text-center p-4 text-sm text-gray-500">
                  <p>No sections found</p>
                  <p className="mt-1">Click 'Add' to create a section</p>
                </div>
              ) : (
                <div className="tree-view-component">
                  {/* This is a placeholder for the TreeView component */}
                  {/* In a real implementation, we would use the Syncfusion TreeView */}
                  <div className="custom-tree border rounded p-2">
                    {treeData.map(node => renderTreeNode(node, 0))}
                  </div>
                </div>
              )}
            </div>
            {selectedSection && (
              <div className="p-3 border-t flex justify-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setNewSection({ 
                      title: "",
                      parentId: selectedSection.id || null
                    });
                    setIsAddSectionModalOpen(true);
                  }}
                >
                  <FolderPlus className="h-3.5 w-3.5 mr-1" />
                  Add Child
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setNewSection({ 
                      title: selectedSection.title,
                      parentId: selectedSection.parentId || null
                    });
                    setIsEditSectionModalOpen(true);
                  }}
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setIsDeleteSectionModalOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Right content area */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-lg border overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-medium">
                {selectedSection ? selectedSection.title : "Select a section"}
              </h2>
              {selectedSection && (
                <Button 
                  size="sm" 
                  onClick={handleAddContent}
                >
                  <FilePlus className="h-4 w-4 mr-1" />
                  Add Content
                </Button>
              )}
            </div>
            <div className="p-4 h-[calc(100vh-240px)] overflow-y-auto">
              {!selectedSection ? (
                <div className="text-center p-4 text-gray-500">
                  <Book className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No Section Selected</p>
                  <p className="mt-1 text-sm">
                    Select a section from the left sidebar to view or edit its content
                  </p>
                </div>
              ) : sectionContents.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  <FilePlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No Content Found</p>
                  <p className="mt-1 text-sm">
                    This section doesn't have any content yet
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={handleAddContent}
                  >
                    Add Content
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sectionContents.map((content) => (
                    <div
                      key={content.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="bg-blue-50 p-3 flex justify-between items-center border-b">
                        <div>
                          <h3 className="font-medium">{content.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {contentTypes.find(ct => ct.id === content.contentTypeId)?.name || 'Unknown Type'}
                            </Badge>
                            {content.states && content.states.map(state => (
                              <Badge key={state.id} variant="secondary" className="text-xs">
                                {state.code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditContent(content)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this content? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-600"
                                  onClick={() => handleDeleteContent(content.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="p-4">
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: content.htmlData }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add New Section</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-title">Title</Label>
                <Input
                  id="section-title"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  placeholder="Enter section title"
                />
              </div>
              <div>
                <Label htmlFor="parent-section">Parent Section</Label>
                <Select
                  value={newSection.parentId !== null ? String(newSection.parentId) : "root"}
                  onValueChange={(value) => setNewSection({ 
                    ...newSection, 
                    parentId: value && value !== "root" ? parseInt(value) : null 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Root Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Root Level</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={String(section.id)}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddSectionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddSection}>
                  Add Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {isEditSectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Edit Section</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-title">Title</Label>
                <Input
                  id="section-title"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  placeholder="Enter section title"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditSectionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditSection}>
                  Update Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Confirmation */}
      {isDeleteSectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2">Delete Section</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this section? All content in this section will be lost.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteSectionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteSection}
              >
                Delete Section
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content Editor Modal using Syncfusion DialogComponent */}
      {isContentEditorOpen && (
        <DialogComponent
          width="90%"
          height="90%"
          isModal={true}
          showCloseIcon={true}
          visible={isContentEditorOpen}
          close={() => setIsContentEditorOpen(false)}
          created={() => {
            // Refresh the RichTextEditor when dialog opens
            setTimeout(() => {
              if (richTextEditorRef.current) {
                richTextEditorRef.current.refresh();
              }
            }, 100);
          }}
          header={currentContent?.id ? "Edit Content" : "Add New Content"}
          target="body"
          closeOnEscape={true}
          buttons={[
            {
              buttonModel: {
                content: "Cancel",
                cssClass: "e-flat",
                isPrimary: false
              },
              click: () => setIsContentEditorOpen(false)
            },
            {
              buttonModel: {
                content: currentContent?.id ? "Update Content" : "Add Content",
                cssClass: "e-flat",
                isPrimary: true
              },
              click: handleSaveContent
            }
          ]}
        >
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="content-type">Content Type</Label>
                <div className="relative z-50">
                  <div className="mb-1">
                    {isLoadingContentTypes ? (
                      <div className="text-sm text-muted-foreground">Loading content types...</div>
                    ) : contentTypes.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No content types available</div>
                    ) : (
                      <div className="text-sm font-medium">
                        Current: {contentTypes.find(ct => ct.id === selectedContentType)?.name || 'None selected'}
                      </div>
                    )}
                  </div>

                  <select
                    id="content-type"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedContentType || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('Selected content type:', value);
                      const contentTypeId = value ? parseInt(value) : null;
                      setSelectedContentType(contentTypeId);

                      // Also update the current content with the new content type
                      if (currentContent && contentTypeId) {
                        setCurrentContent({
                          ...currentContent,
                          contentTypeId: contentTypeId
                        });
                      }
                    }}
                    disabled={isLoadingContentTypes || contentTypes.length === 0}
                  >
                    <option value="">Select a content type</option>
                    {contentTypes.map((contentType) => (
                      <option key={contentType.id} value={contentType.id}>
                        {contentType.name}
                      </option>
                    ))}
                  </select>

                  {isLoadingContentTypes && (
                    <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comprehensive Tagging System */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Content Tags</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tag this content to enable filtering and automated document generation. Select all applicable options for each category.
                </p>
              </div>

              {/* States */}
              <div>
                <Label className="mb-3 block font-medium">Australian States</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  {isLoadingStates ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  ) : states.length === 0 ? (
                    <p className="text-sm text-gray-500">No states available</p>
                  ) : (
                    states.map((state) => {
                      const isSelected = selectedStates.includes(state.id);
                      return (
                        <div 
                          key={state.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => handleStateChange(state.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleStateChange(state.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            data-state-id={state.id}
                            id={`state-checkbox-${state.id}`}
                            name={`state-${state.id}`}
                            value={state.id.toString()}
                          />
                          <label 
                            htmlFor={`state-${state.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {state.code}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedStates.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedStates.map(id => {
                      const state = states.find(s => s.id === id);
                      return state ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {state.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Development Types */}
              <div>
                <Label className="mb-3 block font-medium">Development Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {isLoadingDevelopmentTypes ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  ) : developmentTypes.length === 0 ? (
                    <p className="text-sm text-gray-500">No development types available</p>
                  ) : (
                    developmentTypes.map((type) => {
                      const isSelected = selectedDevelopmentTypes.includes(type.id);
                      return (
                        <div 
                          key={type.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (selectedDevelopmentTypes.includes(type.id)) {
                              setSelectedDevelopmentTypes(selectedDevelopmentTypes.filter(id => id !== type.id));
                            } else {
                              setSelectedDevelopmentTypes([...selectedDevelopmentTypes, type.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (selectedDevelopmentTypes.includes(type.id)) {
                                setSelectedDevelopmentTypes(selectedDevelopmentTypes.filter(id => id !== type.id));
                              } else {
                                setSelectedDevelopmentTypes([...selectedDevelopmentTypes, type.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            data-type-id={type.id}
                            id={`development-type-checkbox-${type.id}`}
                            name={`development-type-${type.id}`}
                            value={type.id.toString()}
                          />
                          <label 
                            htmlFor={`development-type-${type.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {type.name}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedDevelopmentTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedDevelopmentTypes.map(id => {
                      const type = developmentTypes.find(t => t.id === id);
                      return type ? (
                        <Badge key={id} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {type.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Contract Types */}
              <div>
                <Label className="mb-3 block font-medium">Contract Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {isLoadingContractTypes ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  ) : contractTypes.length === 0 ? (
                    <p className="text-sm text-gray-500">No contract types available</p>
                  ) : (
                    contractTypes.map((type) => {
                      const isSelected = selectedContractTypes.includes(type.id);
                      return (
                        <div 
                          key={type.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (selectedContractTypes.includes(type.id)) {
                              setSelectedContractTypes(selectedContractTypes.filter(id => id !== type.id));
                            } else {
                              setSelectedContractTypes([...selectedContractTypes, type.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (selectedContractTypes.includes(type.id)) {
                                setSelectedContractTypes(selectedContractTypes.filter(id => id !== type.id));
                              } else {
                                setSelectedContractTypes([...selectedContractTypes, type.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            data-type-id={type.id}
                            id={`contract-type-checkbox-${type.id}`}
                            name={`contract-type-${type.id}`}
                            value={type.id.toString()}
                          />
                          <label 
                            htmlFor={`contract-type-${type.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {type.name}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedContractTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedContractTypes.map(id => {
                      const type = contractTypes.find(t => t.id === id);
                      return type ? (
                        <Badge key={id} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {type.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Finance Models */}
              <div>
                <Label className="mb-3 block font-medium">Finance Models</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {isLoadingFinanceModels ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  ) : financeModels.length === 0 ? (
                    <p className="text-sm text-gray-500">No finance models available</p>
                  ) : (
                    financeModels.map((model) => {
                      const isSelected = selectedFinanceModels.includes(model.id);
                      return (
                        <div 
                          key={model.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (selectedFinanceModels.includes(model.id)) {
                              setSelectedFinanceModels(selectedFinanceModels.filter(id => id !== model.id));
                            } else {
                              setSelectedFinanceModels([...selectedFinanceModels, model.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (selectedFinanceModels.includes(model.id)) {
                                setSelectedFinanceModels(selectedFinanceModels.filter(id => id !== model.id));
                              } else {
                                setSelectedFinanceModels([...selectedFinanceModels, model.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                            data-model-id={model.id}
                            id={`finance-model-checkbox-${model.id}`}
                            name={`finance-model-${model.id}`}
                            value={model.id.toString()}
                          />
                          <label 
                            htmlFor={`finance-model-${model.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {model.name}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedFinanceModels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedFinanceModels.map(id => {
                      const model = financeModels.find(m => m.id === id);
                      return model ? (
                        <Badge key={id} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          {model.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Funding Sources */}
              <div>
                <Label className="mb-3 block font-medium">Funding Sources</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {isLoadingFundingSources ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  ) : fundingSources.length === 0 ? (
                    <p className="text-sm text-gray-500">No funding sources available</p>
                  ) : (
                    fundingSources.map((source) => {
                      const isSelected = selectedFundingSources.includes(source.id);
                      return (
                        <div 
                          key={source.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (selectedFundingSources.includes(source.id)) {
                              setSelectedFundingSources(selectedFundingSources.filter(id => id !== source.id));
                            } else {
                              setSelectedFundingSources([...selectedFundingSources, source.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (selectedFundingSources.includes(source.id)) {
                                setSelectedFundingSources(selectedFundingSources.filter(id => id !== source.id));
                              } else {
                                setSelectedFundingSources([...selectedFundingSources, source.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            data-source-id={source.id}
                            id={`funding-source-checkbox-${source.id}`}
                            name={`funding-source-${source.id}`}
                            value={source.id.toString()}
                          />
                          <label 
                            htmlFor={`funding-source-${source.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {source.name}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedFundingSources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedFundingSources.map(id => {
                      const source = fundingSources.find(s => s.id === id);
                      return source ? (
                        <Badge key={id} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          {source.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Revenue Streams */}
              <div>
                <Label className="mb-3 block font-medium">Revenue Streams</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {isLoadingRevenueStreams ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  ) : revenueStreams.length === 0 ? (
                    <p className="text-sm text-gray-500">No revenue streams available</p>
                  ) : (
                    revenueStreams.map((stream) => {
                      const isSelected = selectedRevenueStreams.includes(stream.id);
                      return (
                        <div 
                          key={stream.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (selectedRevenueStreams.includes(stream.id)) {
                              setSelectedRevenueStreams(selectedRevenueStreams.filter(id => id !== stream.id));
                            } else {
                              setSelectedRevenueStreams([...selectedRevenueStreams, stream.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (selectedRevenueStreams.includes(stream.id)) {
                                setSelectedRevenueStreams(selectedRevenueStreams.filter(id => id !== stream.id));
                              } else {
                                setSelectedRevenueStreams([...selectedRevenueStreams, stream.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            data-stream-id={stream.id}
                            id={`revenue-stream-checkbox-${stream.id}`}
                            name={`revenue-stream-${stream.id}`}
                            value={stream.id.toString()}
                          />
                          <label 
                            htmlFor={`revenue-stream-${stream.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {stream.name}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedRevenueStreams.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedRevenueStreams.map(id => {
                      const stream = revenueStreams.find(s => s.id === id);
                      return stream ? (
                        <Badge key={id} variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                          {stream.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Document Categories */}
              <div>
                <Label className="mb-3 block font-medium">Document Categories</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {isLoadingDocumentCategories ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  ) : documentCategories.length === 0 ? (
                    <p className="text-sm text-gray-500">No document categories available</p>
                  ) : (
                    documentCategories.map((category) => {
                      const isSelected = selectedDocumentCategories.includes(category.id);
                      return (
                        <div 
                          key={category.id}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (selectedDocumentCategories.includes(category.id)) {
                              setSelectedDocumentCategories(selectedDocumentCategories.filter(id => id !== category.id));
                            } else {
                              setSelectedDocumentCategories([...selectedDocumentCategories, category.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (selectedDocumentCategories.includes(category.id)) {
                                setSelectedDocumentCategories(selectedDocumentCategories.filter(id => id !== category.id));
                              } else {
                                setSelectedDocumentCategories([...selectedDocumentCategories, category.id]);
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            data-category-id={category.id}
                            id={`document-category-checkbox-${category.id}`}
                            name={`document-category-${category.id}`}
                            value={category.id.toString()}
                          />
                          <label 
                            htmlFor={`document-category-${category.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {category.name}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedDocumentCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedDocumentCategories.map(id => {
                      const category = documentCategories.find(c => c.id === id);
                      return category ? (
                        <Badge key={id} variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                          {category.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Content</Label>
              <div className="border rounded-md min-h-[300px]">
                {isContentEditorOpen && (
                  <RichTextEditorComponent
                    ref={richTextEditorRef}
                    id="manual-content-editor"
                    height={400}
                    value={currentContent?.htmlData || ""}
                    change={(args) => {
                      if (args && args.value) {
                        setCurrentContent({
                          ...currentContent as ManualContent,
                          htmlData: args.value,
                          // In a real application, you'd store proper SFDT data
                          // This is a simplification for this demo
                          sfdtData: args.value
                        });
                      }
                    }}
                    created={() => {
                      // Refresh the RichTextEditor when component is created
                      setTimeout(() => {
                        if (richTextEditorRef.current) {
                          richTextEditorRef.current.refresh();
                        }
                      }, 100);
                    }}
                    toolbarSettings={{
                      items: [
                        'Undo', 'Redo', '|',
                        'Bold', 'Italic', 'Underline', 'StrikeThrough', 'SuperScript', 'SubScript', '|',
                        'FontName', 'FontSize', 'FontColor', 'BackgroundColor', '|',
                        'LowerCase', 'UpperCase', '|',
                        'Formats', 'Alignments', 'Blockquote', '|', 
                        'NumberFormatList', 'BulletFormatList', '|',
                        'Outdent', 'Indent', '|', 
                        'CreateLink', 'Image', 'Video', 'Audio', 'CreateTable', '|', 
                        'FormatPainter', 'ClearFormat', '|',
                        'EmojiPicker', 'Print', '|',
                        'SourceCode', 'FullScreen'
                      ]
                    }}
                    quickToolbarSettings={{
                      table: ['TableHeader', 'TableRows', 'TableColumns', 'TableCell', '-', 'BackgroundColor', 'TableRemove', 'TableCellVerticalAlign', 'Styles'],
                      showOnRightClick: true,
                    }}
                    placeholder="Type your content here..."
                    enableTabKey={true}
                    enableXhtml={true}
                  >
                    <Inject services={[
                      Toolbar, 
                      Link, 
                      Image, 
                      HtmlEditor, 
                      QuickToolbar, 
                      Table, 
                      EmojiPicker, 
                      Video, 
                      Audio, 
                      FormatPainter, 
                      PasteCleanup,
                      Count
                    ]} />
                  </RichTextEditorComponent>
                )}
              </div>
            </div>
          </div>
        </DialogComponent>
      )}
    </div>
  );
};

// Helper function to render tree nodes recursively
const renderTreeNode = (node: TreeViewItem, level: number) => {
  const paddingLeft = `${level * 16}px`;

  return (
    <div key={node.id} className="tree-node">
      <div 
        className="flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
        style={{ paddingLeft }}
      >
        {node.items && node.items.length > 0 ? (
          <ChevronDown className="h-4 w-4 mr-1 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 mr-1 text-gray-400 opacity-0" />
        )}
        <span className="truncate">{node.title}</span>
      </div>
      {node.items && node.items.length > 0 && (
        <div className="tree-children">
          {node.items.map(childNode => renderTreeNode(childNode, level + 1))}
        </div>
      )}
    </div>
  );
};

export default ManualEditor;