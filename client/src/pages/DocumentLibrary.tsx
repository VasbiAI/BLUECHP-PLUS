import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  FileText,
  Folder,
  Search,
  Filter,
  Plus,
  Download,
  Grid,
  LayoutList,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreHorizontal,
  ExternalLink,
  FileUp,
  X,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Document types
interface Document {
  id: number;
  title: string;
  filename: string;
  type: string;
  size: string;
  status: 'draft' | 'under-review' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  projectId: number;
  projectName?: string;
  category?: string;
  description?: string;
  version: string;
  downloadUrl?: string;
}

// Document category types
interface DocumentCategory {
  id: string;
  name: string;
  count: number;
}

// Mock document data
const getMockDocuments = (): Document[] => [
  {
    id: 1,
    title: "Project Brief - Adelaide Community Housing",
    filename: "adelaide_project_brief_v1.2.pdf",
    type: "PDF",
    size: "3.2 MB",
    status: 'approved',
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-02-10T14:45:00Z",
    createdBy: "John Smith",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Project Documentation",
    description: "Official project brief outlining scope, goals, and delivery timeline",
    version: "1.2",
    downloadUrl: "#",
  },
  {
    id: 2,
    title: "Site Assessment Report",
    filename: "site_assessment_adelaide_west.pdf",
    type: "PDF",
    size: "8.7 MB",
    status: 'approved',
    createdAt: "2024-01-20T09:15:00Z",
    updatedAt: "2024-01-20T09:15:00Z",
    createdBy: "Lisa Chen",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Technical Reports",
    description: "Environmental and soil analysis of the western Adelaide site",
    version: "1.0",
    downloadUrl: "#",
  },
  {
    id: 3,
    title: "Architectural Designs - Full Set",
    filename: "adelaide_housing_designs_v2.1.pdf",
    type: "PDF",
    size: "24.5 MB",
    status: 'under-review',
    createdAt: "2024-02-05T15:20:00Z",
    updatedAt: "2024-04-18T11:30:00Z",
    createdBy: "Michael Brown",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Design Documents",
    description: "Complete architectural designs including floor plans, elevations, and sections",
    version: "2.1",
    downloadUrl: "#",
  },
  {
    id: 4,
    title: "Budget Forecast - 2024-2026",
    filename: "ach_budget_forecast_2024-2026.xlsx",
    type: "Excel",
    size: "1.8 MB",
    status: 'draft',
    createdAt: "2024-03-10T13:45:00Z",
    updatedAt: "2024-04-28T09:20:00Z",
    createdBy: "Sarah Johnson",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Financial Documents",
    description: "Detailed budget forecast for the Adelaide project spanning 2024-2026",
    version: "0.9",
    downloadUrl: "#",
  },
  {
    id: 5,
    title: "Community Consultation Summary",
    filename: "community_consultation_q1_2024.docx",
    type: "Word",
    size: "2.3 MB",
    status: 'approved',
    createdAt: "2024-03-25T10:00:00Z",
    updatedAt: "2024-04-02T16:15:00Z",
    createdBy: "Emily Wilson",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Community Engagement",
    description: "Summary of community feedback from Q1 2024 consultation sessions",
    version: "1.0",
    downloadUrl: "#",
  },
  {
    id: 6,
    title: "Construction Timeline",
    filename: "construction_timeline_v3.xlsx",
    type: "Excel",
    size: "1.2 MB",
    status: 'approved',
    createdAt: "2024-02-12T11:30:00Z",
    updatedAt: "2024-05-01T10:45:00Z",
    createdBy: "John Smith",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Project Management",
    description: "Detailed timeline for construction phases with milestones",
    version: "3.0",
    downloadUrl: "#",
  },
  {
    id: 7,
    title: "Risk Management Plan",
    filename: "risk_management_plan.pdf",
    type: "PDF",
    size: "4.5 MB",
    status: 'approved',
    createdAt: "2024-02-18T14:20:00Z",
    updatedAt: "2024-04-10T09:30:00Z",
    createdBy: "Robert Thomas",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Risk Management",
    description: "Comprehensive risk assessment and mitigation strategies",
    version: "2.1",
    downloadUrl: "#",
  },
  {
    id: 8,
    title: "Stakeholder Management Plan",
    filename: "stakeholder_management.docx",
    type: "Word",
    size: "1.9 MB",
    status: 'under-review',
    createdAt: "2024-03-05T16:40:00Z",
    updatedAt: "2024-04-20T13:15:00Z",
    createdBy: "Sarah Johnson",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Project Management",
    description: "Plan for engagement with key stakeholders throughout the project lifecycle",
    version: "1.3",
    downloadUrl: "#",
  },
  {
    id: 9,
    title: "Accessibility Compliance Report",
    filename: "accessibility_compliance.pdf",
    type: "PDF",
    size: "5.7 MB",
    status: 'rejected',
    createdAt: "2024-04-12T10:30:00Z",
    updatedAt: "2024-05-05T15:20:00Z",
    createdBy: "Lisa Chen",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Compliance Documents",
    description: "Assessment of accessibility features against regulations",
    version: "1.0",
    downloadUrl: "#",
  },
  {
    id: 10,
    title: "Contractor Agreements",
    filename: "contractor_agreements_compiled.pdf",
    type: "PDF",
    size: "12.3 MB",
    status: 'approved',
    createdAt: "2024-02-28T09:45:00Z",
    updatedAt: "2024-02-28T09:45:00Z",
    createdBy: "David Williams",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    category: "Legal Documents",
    description: "Compiled agreements with all contractors for Adelaide project",
    version: "1.0",
    downloadUrl: "#",
  },
];

// Mock document categories
const getMockCategories = (): DocumentCategory[] => [
  { id: "project-documentation", name: "Project Documentation", count: 15 },
  { id: "design-documents", name: "Design Documents", count: 23 },
  { id: "technical-reports", name: "Technical Reports", count: 18 },
  { id: "financial-documents", name: "Financial Documents", count: 9 },
  { id: "legal-documents", name: "Legal Documents", count: 12 },
  { id: "community-engagement", name: "Community Engagement", count: 7 },
  { id: "risk-management", name: "Risk Management", count: 5 },
  { id: "project-management", name: "Project Management", count: 14 },
  { id: "compliance-documents", name: "Compliance Documents", count: 8 },
];

// Document Library component
export default function DocumentLibrary() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "",
    project: "",
    description: "",
  });

  // Fetch real documents from API
  const { data: documents = [], isLoading: isLoadingDocuments, refetch: refetchDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/documents');
        return response?.length ? response : getMockDocuments();
      } catch (error) {
        console.error("Error fetching documents:", error);
        return getMockDocuments();
      }
    },
  });
  
  // Fetch projects from API
  const { data: projectsData = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/projects');
        return response || [];
      } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
      }
    },
  });

  // Fetch document categories from API
  const { data: documentCategoriesData = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/admin/lookups/documentCategories'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/lookups/documentCategories');
        return response || [];
      } catch (error) {
        console.error("Error fetching document categories:", error);
        return [];
      }
    },
  });
  
  // Transform API categories to match expected format with count
  const categories = useMemo(() => {
    // If no API data, use mock categories
    if (!documentCategoriesData || documentCategoriesData.length === 0) {
      return getMockCategories();
    }
    
    // Count documents per category
    const categoryCounts = documents.reduce((counts: Record<string, number>, doc) => {
      const category = doc.category;
      if (category) {
        counts[category] = (counts[category] || 0) + 1;
      }
      return counts;
    }, {});
    
    // Map API categories to format needed for UI
    return documentCategoriesData.map(cat => ({
      id: cat.id.toString(),
      name: cat.name,
      count: categoryCounts[cat.name] || 0
    }));
  }, [documentCategoriesData, documents]);

  // Get projects for dropdown
  const getProjects = () => {
    // If we have projectsData from API, use that
    if (projectsData && projectsData.length > 0) {
      return projectsData.map(project => ({
        id: project.id,
        name: project.projectName
      }));
    }
    
    // Fallback to extracting from documents if API call didn't return data
    if (!documents) return [];
    const projects = new Map<number, string>();
    documents.forEach(doc => {
      if (doc.projectName) projects.set(doc.projectId, doc.projectName);
    });
    return Array.from(projects.entries()).map(([id, name]) => ({ id, name }));
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get icon for document type
  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'excel':
        return <FileText className="h-6 w-6 text-green-600" />;
      case 'word':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'ppt':
        return <FileText className="h-6 w-6 text-orange-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'under-review':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Filter documents based on search, category, status, and project
  const getFilteredDocuments = () => {
    if (!documents) return [];

    return documents.filter(doc => {
      // Filter by search query
      const matchesSearch =
        searchQuery === "" ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (doc.filename && doc.filename.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter by category
      const matchesCategory = !selectedCategory || doc.category === selectedCategory;

      // Filter by status
      const matchesStatus = !selectedStatus || selectedStatus === "all" || doc.status === selectedStatus;

      // Filter by project
      const matchesProject = selectedProject === null || doc.projectId === selectedProject;

      return matchesSearch && matchesCategory && matchesStatus && matchesProject;
    });
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      
      // Auto-fill title with filename if empty
      if (!uploadData.title) {
        const fileName = e.target.files[0].name;
        // Remove file extension
        const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        setUploadData({ ...uploadData, title });
      }
    }
  };
  
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      
      // Auto-fill title with filename if empty
      if (!uploadData.title) {
        const fileName = file.name;
        // Remove file extension
        const title = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        setUploadData({ ...uploadData, title });
      }
    }
  };

  // Handle upload form submission
  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload');
      return;
    }
    
    if (!uploadData.title.trim()) {
      alert('Please enter a document title');
      return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadData.title);
    formData.append('category', uploadData.category);
    formData.append('projectId', uploadData.project);
    formData.append('description', uploadData.description);
    
    try {
      // Send the file to the server
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      const result = await response.json();
      
      // Close the dialog and reset form
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadData({
        title: "",
        category: "",
        project: "",
        description: "",
      });
      
      // Force refresh the documents list
      if (typeof refetchDocuments === 'function') {
        refetchDocuments();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const filteredDocuments = getFilteredDocuments();
  const projects = getProjects();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Library</h1>
          <p className="text-gray-500">
            Manage and access all project-related documents
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Upload a new document to the library. Once uploaded, it will be available to all users with appropriate permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="doc-title">Document Title</Label>
                <Input
                  id="doc-title"
                  placeholder="Enter document title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="doc-category">Category</Label>
                  <Select onValueChange={(value) => setUploadData({ ...uploadData, category: value })}>
                    <SelectTrigger id="doc-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="doc-project">Project</Label>
                  <Select onValueChange={(value) => setUploadData({ ...uploadData, project: value })}>
                    <SelectTrigger id="doc-project">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="doc-description">Description</Label>
                <Input
                  id="doc-description"
                  placeholder="Enter document description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="doc-file">Document File</Label>
                {uploadFile ? (
                  <div className="flex items-center justify-between p-3 border border-green-400 bg-green-50 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-green-600" />
                      <div>
                        <span className="text-sm font-medium">{uploadFile.name}</span>
                        <p className="text-xs text-gray-500">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setUploadFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-center p-8 border-2 border-dashed rounded-md hover:bg-gray-50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <label htmlFor="doc-file-input" className="flex flex-col items-center cursor-pointer w-full h-full">
                      <FileUp className="h-10 w-10 text-blue-400 mb-3" />
                      <span className="text-sm font-medium">Click to select or drag and drop</span>
                      <span className="text-xs text-gray-500 mt-1">PDF, Word, Excel, or PowerPoint (max 20MB)</span>
                      <input
                        id="doc-file-input"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUploadSubmit} disabled={!uploadFile || !uploadData.title}>Upload Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Categories sidebar */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 px-4">
              <button
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-gray-100",
                  !selectedCategory && "bg-gray-100 font-semibold"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                <span>All Documents</span>
                <Badge variant="outline">{documents?.length || 0}</Badge>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-gray-100",
                    selectedCategory === category.name && "bg-gray-100 font-semibold"
                  )}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <span>{category.name}</span>
                  <Badge variant="outline">{category.count}</Badge>
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/admin?tab=documentCategories")}>
              Manage Categories
            </Button>
          </CardFooter>
        </Card>

        {/* Documents list */}
        <div className="md:col-span-3 space-y-4">
          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search documents..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={(value) => setSelectedProject(value === "all" ? null : parseInt(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select onValueChange={(value) => setSelectedStatus(value || null)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="p-0.5 bg-gray-100 rounded-md flex">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoadingDocuments ? (
            <div className="h-96 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
                <p className="mt-4 text-gray-500">Loading documents...</p>
              </div>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div>
              {viewMode === "list" ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-500">
                        <div className="col-span-5">Document</div>
                        <div className="col-span-2">Category</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2">Last Updated</div>
                        <div className="col-span-1"></div>
                      </div>
                      {filteredDocuments.map((doc) => (
                        <div key={doc.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50">
                          <div className="col-span-5 flex items-center">
                            <div className="p-2 rounded-md bg-gray-100 mr-3">
                              {getDocumentIcon(doc.type)}
                            </div>
                            <div>
                              <h4 className="font-medium line-clamp-1">{doc.title}</h4>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <span>{doc.type}</span>
                                <span className="mx-1">•</span>
                                <span>{doc.size}</span>
                                <span className="mx-1">•</span>
                                <span>v{doc.version}</span>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 text-sm">{doc.category}</div>
                          <div className="col-span-2 flex justify-center">{getStatusBadge(doc.status)}</div>
                          <div className="col-span-2 text-sm text-gray-500">{formatDate(doc.updatedAt)}</div>
                          <div className="col-span-1 flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.open(`/documents/${doc.id}`, '_blank')}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => doc.downloadUrl && window.open(doc.downloadUrl, '_blank')}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setUploadData({
                                    title: doc.title || "",
                                    category: doc.category || "",
                                    project: doc.projectId?.toString() || "",
                                    description: doc.description || ""
                                  });
                                  // Set a slight delay to ensure the form state is properly updated
                                  setTimeout(() => {
                                    setUploadDialogOpen(true);
                                  }, 100);
                                }}>
                                  Edit Properties
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert("Version history feature coming soon!")}>
                                  View Version History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert("Status change feature coming soon!")}>
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                                      alert("Document deletion will be implemented in the next phase");
                                    }
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-3">
                    <div className="text-sm text-gray-500">
                      Showing {filteredDocuments.length} of {documents?.length || 0} documents
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id} className="overflow-hidden hover:border-blue-200 transition-colors">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-gray-100">
                            {getDocumentIcon(doc.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1" title={doc.title}>
                              {doc.title}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {doc.type} • {doc.size} • v{doc.version}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        {doc.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3" title={doc.description}>
                            {doc.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Last updated: {formatDate(doc.updatedAt)}
                          </div>
                          {getStatusBadge(doc.status)}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between p-3 bg-gray-50 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          title="Download"
                          onClick={() => doc.downloadUrl && window.open(doc.downloadUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8"
                          onClick={() => window.open(`/documents/${doc.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setUploadData({
                                title: doc.title || "",
                                category: doc.category || "",
                                project: doc.projectId?.toString() || "",
                                description: doc.description || ""
                              });
                              setTimeout(() => {
                                setUploadDialogOpen(true);
                              }, 100);
                            }}>
                              Edit Properties
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("Version history feature coming soon!")}>
                              View Version History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("Status change feature coming soon!")}>
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                                  alert("Document deletion will be implemented in the next phase");
                                }
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center mt-6">
              <div className="text-center">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">No documents found</h3>
                <p className="text-gray-500 mb-4">
                  No documents match your current filters. Try changing your search or filters.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setSelectedStatus(null);
                  setSelectedProject(null);
                }}>
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}