import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart,
  Calendar,
  Clock,
  ClipboardList,
  Download,
  FileText,
  Folder,
  Link2,
  MoreHorizontal,
  PieChart,
  Plus,
  RefreshCw,
  Users,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Project type definition
interface Project {
  id: number;
  projectName: string;
  projectDescription?: string;
  clientName: string;
  developmentType: string;
  financeModel: string;
  contractType: string;
  estimatedValue: string;
  estimatedCompletionDate: string;
  includeCommercialStructure: boolean;
  includeFundingDiagram: boolean;
  requiresRiskMitigation: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project status data from database
interface ProjectStatus {
  id: number;
  projectId: number;
  status: "active" | "planning" | "on-hold" | "completed";
  progress: number;
  targetCompletion: string;
  stakeholders: string[];
  allocatedFunding: number;
  spentFunding: number;
  currencyCode: string;
  createdAt: string;
  updatedAt: string;
}

// Timeline event data from database
interface TimelineEvent {
  id: number;
  projectId: number;
  date: string;
  title: string;
  description: string;
  type: "milestone" | "document" | "risk" | "update";
  createdAt: string;
  updatedAt: string;
}

// Risk data from database
interface ProjectRisk {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: "active" | "mitigated" | "accepted";
  severity: "low" | "medium" | "high";
  dueDate?: string;
  assignedTo?: string;
  mitigationSteps?: string;
  createdAt: string;
  updatedAt: string;
}

// Document data from database
interface Document {
  id: number;
  title: string;
  type: string;
  status: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

// Critical date data from database
interface CriticalDate {
  id: number;
  projectId: number;
  title: string;
  description: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "upcoming" | "overdue" | "completed";
  assignedTo?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// Get mock data for a project
const getMockProject = (id: number): Project => ({
  id,
  projectName: "Adelaide Community Housing Project",
  projectDescription: "Development of 32 community housing units in Adelaide's western suburbs for low-income families.",
  clientName: "Adelaide Housing Authority",
  developmentType: "Community Housing",
  financeModel: "Government Grant",
  contractType: "Design and Construct",
  estimatedValue: "$8,500,000",
  estimatedCompletionDate: "2026-07-15",
  includeCommercialStructure: true,
  includeFundingDiagram: true,
  requiresRiskMitigation: true,
  createdAt: "2023-09-10T00:00:00Z",
  updatedAt: "2024-02-28T00:00:00Z",
});

// Get mock project status
const getMockProjectStatus = (): ProjectStatus => ({
  status: "active",
  progress: 37,
  targetCompletion: "July 15, 2026",
  stakeholders: ["Adelaide Housing Authority", "BlueCHP Limited", "Western Contractors", "Community Representatives"],
  funding: {
    allocated: 8500000,
    spent: 2840000,
    remaining: 5660000,
    currency: "AUD",
  },
});

// Get mock timeline events
const getMockTimelineEvents = (): TimelineEvent[] => [
  {
    id: "event-1",
    date: "2024-05-15",
    title: "Design Approval",
    description: "Final architectural designs approved by Adelaide Housing Authority",
    type: "milestone",
  },
  {
    id: "event-2",
    date: "2024-04-20",
    title: "Permit Acquisition",
    description: "Building permits acquired from local council",
    type: "document",
  },
  {
    id: "event-3",
    date: "2024-03-11",
    title: "Construction Delay Risk",
    description: "Potential delay in construction start due to material shortages",
    type: "risk",
  },
  {
    id: "event-4",
    date: "2024-02-28",
    title: "Project Kick-off",
    description: "Official project kick-off meeting with all stakeholders",
    type: "update",
  },
];

// Get mock risks
const getMockRisks = (): Risk[] => [
  {
    id: "risk-1",
    title: "Material Cost Increase",
    description: "Risk of increasing material costs affecting budget",
    status: "active",
    severity: "high",
    dueDate: "2024-06-30",
  },
  {
    id: "risk-2",
    title: "Construction Permit Delay",
    description: "Potential delay in receiving construction permits",
    status: "mitigated",
    severity: "medium",
    dueDate: "2024-05-15",
  },
  {
    id: "risk-3",
    title: "Contractor Availability",
    description: "Limited contractor availability in the region",
    status: "accepted",
    severity: "low",
    dueDate: "2024-08-01",
  },
];

// Get mock documents
const getMockDocuments = (): Document[] => [
  {
    id: 1,
    title: "Architectural Plans v2.0",
    type: "PDF",
    updatedAt: "2024-04-10T00:00:00Z",
    size: "5.2 MB",
  },
  {
    id: 2,
    title: "Project Schedule",
    type: "Excel",
    updatedAt: "2024-04-15T00:00:00Z",
    size: "1.7 MB",
  },
  {
    id: 3,
    title: "Environmental Impact Assessment",
    type: "PDF",
    updatedAt: "2024-03-22T00:00:00Z",
    size: "4.3 MB",
  },
];

// Get mock critical dates
const getMockCriticalDates = (): CriticalDate[] => [
  {
    id: "date-1",
    title: "Construction Start",
    dueDate: "2024-06-01",
    status: "upcoming",
    priority: "high",
  },
  {
    id: "date-2",
    title: "Foundation Completion",
    dueDate: "2024-08-15",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "date-3",
    title: "First Progress Payment",
    dueDate: "2024-04-30",
    status: "overdue",
    priority: "high",
  },
];

export default function ProjectDashboard() {
  const [match, params] = useRoute<{ id: string }>("/projects/:id");
  const [, navigate] = useLocation();
  const projectId = match ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real project data from the API
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch project status data
  const { data: projectStatus, isLoading: isLoadingStatus } = useQuery<ProjectStatus>({
    queryKey: [`/api/projects/${projectId}/status`],
    enabled: !!projectId,
    placeholderData: {
      id: 0,
      projectId: projectId || 0,
      status: "active",
      progress: 0,
      targetCompletion: "",
      stakeholders: [],
      allocatedFunding: 0,
      spentFunding: 0,
      currencyCode: "AUD",
      createdAt: "",
      updatedAt: ""
    }
  });

  // Fetch project risks data
  const { data: risks = [], isLoading: isLoadingRisks } = useQuery<ProjectRisk[]>({
    queryKey: [`/api/projects/${projectId}/risks`],
    enabled: !!projectId,
  });
  
  // For risk filtering by status
  const activeRisks = risks.filter(risk => risk.status === "active");
  const highRisks = risks.filter(risk => risk.severity === "high");

  // Fetch timeline events data
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/projects/${projectId}/timeline`],
    enabled: !!projectId,
  });

  // Fetch project documents data
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: [`/api/projects/${projectId}/documents`],
    enabled: !!projectId,
  });

  // Fetch critical dates data
  const { data: criticalDates = [], isLoading: isLoadingDates } = useQuery<CriticalDate[]>({
    queryKey: [`/api/projects/${projectId}/critical-dates`],
    enabled: !!projectId,
  });

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(amount);
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

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      planning: "bg-blue-100 text-blue-800",
      "on-hold": "bg-amber-100 text-amber-800",
      completed: "bg-gray-100 text-gray-800",
      upcoming: "bg-blue-100 text-blue-800",
      overdue: "bg-red-100 text-red-800",
      mitigated: "bg-green-100 text-green-800",
      accepted: "bg-blue-100 text-blue-800",
    };
    
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // If no project found, redirect to projects page
  useEffect(() => {
    if (!match) {
      navigate("/projects");
    }
  }, [match, navigate]);

  if (isLoadingProject) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/projects")}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {project.projectName}
            </h1>
            <p className="text-gray-500">Client: {project.clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9 gap-1">
                  <Plus className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/risks`)}>
                  Add Risk
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/critical-dates`)}>
                  Add Critical Date
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Upload Document
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Edit Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Project status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Project Status
            </CardTitle>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                <StatusBadge status={projectStatus?.status || "active"} />
              </div>
              <div className="text-sm text-gray-500">
                {projectStatus?.progress || 0}% Complete
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={projectStatus?.progress || 0} className="h-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Budget Utilization
            </CardTitle>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(projectStatus?.spentFunding || 0)}
              </div>
              <div className="text-sm text-gray-500">
                of {formatCurrency(projectStatus?.allocatedFunding || 0)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress 
              value={projectStatus?.allocatedFunding ? (projectStatus.spentFunding / projectStatus.allocatedFunding) * 100 : 0} 
              className="h-2" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Risks
            </CardTitle>
            <div className="text-2xl font-bold">
              {activeRisks.length}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-500">
                {highRisks.length} High Risk Items
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Timeline
            </CardTitle>
            <div className="text-2xl font-bold">
              {formatDate(project.estimatedCompletionDate)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-500">
                {criticalDates.filter(date => date.status === "upcoming").length} Upcoming Dates
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content area with tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="critical-dates">Critical Dates</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main project details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  All essential information about this development project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Development Type</h4>
                      <p>{project.developmentType}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Client</h4>
                      <p>{project.clientName}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Estimated Value</h4>
                      <p>{project.estimatedValue}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Target Completion</h4>
                      <p>{formatDate(project.estimatedCompletionDate)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Finance Model</h4>
                      <p>{project.financeModel}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Contract Type</h4>
                      <p>{project.contractType}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Project Description</h4>
                    <p className="text-gray-700">
                      {project.projectDescription || "No description provided."}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Project Configurations</h4>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full ${project.includeCommercialStructure ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Commercial Structure Included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full ${project.includeFundingDiagram ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Funding Diagram Included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full ${project.requiresRiskMitigation ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>Risk Mitigation Required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-5">
                <div className="text-sm text-gray-500">
                  Project Created: {formatDate(project.createdAt)}
                </div>
                <div className="text-sm text-gray-500">
                  Last Updated: {formatDate(project.updatedAt)}
                </div>
              </CardFooter>
            </Card>

            {/* Project Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative pl-6 pb-5">
                      {/* Timeline line */}
                      {index < timelineEvents.length - 1 && (
                        <div className="absolute left-[9px] top-[24px] bottom-0 w-[2px] bg-gray-200"></div>
                      )}
                      
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-[5px] h-[18px] w-[18px] rounded-full border-2 border-white bg-blue-500 shadow-sm"></div>
                      
                      {/* Event content */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(event.date)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-medium">{event.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate(`/projects/${projectId}/critical-dates`)}>
                  View Full Timeline
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Risks</span>
                    <Badge>{risks.filter(r => r.status === "active").length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mitigated</span>
                    <Badge variant="outline">{risks.filter(r => r.status === "mitigated").length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Priority</span>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                      {risks.filter(r => r.severity === "high").length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/projects/${projectId}/risks`)}
                >
                  Manage Risks
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Critical Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {criticalDates.slice(0, 3).map(date => (
                    <div key={date.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium block">{date.title}</span>
                        <span className="text-xs text-gray-500">{formatDate(date.dueDate)}</span>
                      </div>
                      <StatusBadge status={date.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/projects/${projectId}/critical-dates`)}
                >
                  View Calendar
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.slice(0, 3).map(doc => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium block">{doc.title}</span>
                        <span className="text-xs text-gray-500">
                          {doc.type} • {doc.size}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => setActiveTab("documents")}
                >
                  View All Documents
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Risks</CardTitle>
                <CardDescription>
                  Manage and monitor risks associated with this project
                </CardDescription>
              </div>
              <Button onClick={() => navigate(`/projects/${projectId}/risks`)}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Risk Register
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risks.map(risk => (
                  <div key={risk.id} className="border rounded-md p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{risk.title}</h3>
                        <Badge 
                          className={
                            risk.severity === "high" ? "bg-red-100 text-red-800" :
                            risk.severity === "medium" ? "bg-amber-100 text-amber-800" :
                            "bg-green-100 text-green-800"
                          }
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                      <StatusBadge status={risk.status} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                    {risk.dueDate && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Due: {formatDate(risk.dueDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/projects/${projectId}/risks`)}
              >
                View All Risks
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Critical Dates Tab */}
        <TabsContent value="critical-dates" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Critical Dates</CardTitle>
                <CardDescription>
                  Important milestones and deadlines for this project
                </CardDescription>
              </div>
              <Button onClick={() => navigate(`/projects/${projectId}/critical-dates`)}>
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalDates.map(date => (
                  <div key={date.id} className="border rounded-md p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{date.title}</h3>
                        <Badge 
                          className={
                            date.priority === "high" ? "bg-red-100 text-red-800" :
                            date.priority === "medium" ? "bg-amber-100 text-amber-800" :
                            "bg-green-100 text-green-800"
                          }
                        >
                          {date.priority}
                        </Badge>
                      </div>
                      <StatusBadge status={date.status} />
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date: {formatDate(date.dueDate)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/projects/${projectId}/critical-dates`)}
              >
                View All Dates
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Documents</CardTitle>
                <CardDescription>
                  Documents and files associated with this project
                </CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map(doc => (
                  <div key={doc.id} className="border rounded-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md bg-gray-100`}>
                        <FileText className={`h-5 w-5 
                          ${doc.type === 'PDF' ? 'text-red-500' : 
                            doc.type === 'Excel' ? 'text-green-600' : 
                            'text-blue-500'}`} 
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>{doc.type}</span>
                          <span className="mx-2">•</span>
                          <span>{doc.size}</span>
                          <span className="mx-2">•</span>
                          <span>Updated {formatDate(doc.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View</DropdownMenuItem>
                          <DropdownMenuItem>Download</DropdownMenuItem>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="text-sm text-gray-500">
                {documents.length} documents • {
                  documents.reduce((total, doc) => {
                    const size = parseFloat(doc.size.split(' ')[0]);
                    return total + size;
                  }, 0).toFixed(1)
                } MB total
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}