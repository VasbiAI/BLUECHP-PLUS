import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Folder,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Calendar,
  ClipboardList,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Project type from schema
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
  createdAt: string;
  updatedAt: string;
}

// Project status - this would typically come from the API
interface ProjectStatus {
  id: number;
  status: "active" | "planning" | "completed" | "on-hold";
  progress: number;
}

export default function Projects() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch projects data
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Status data - for demo purposes, normally this would be fetched from the API
  const projectStatuses: Record<number, ProjectStatus> = {
    1: { id: 1, status: "active", progress: 65 },
    2: { id: 2, status: "planning", progress: 25 },
    3: { id: 3, status: "completed", progress: 100 },
    4: { id: 4, status: "on-hold", progress: 40 },
  };

  // Get development types from projects for filter dropdown
  const developmentTypes = projects
    ? [...new Set(projects.map((p) => p.developmentType))]
    : [];

  // Filter projects based on search and dropdown filters
  const filteredProjects = projects
    ? projects.filter((project) => {
        const matchesSearch =
          searchQuery === "" ||
          project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus =
          !selectedStatus || 
          selectedStatus === "all" ||
          (projectStatuses[project.id]?.status || "active") === selectedStatus;
        
        const matchesType =
          !selectedType || 
          selectedType === "all" || 
          project.developmentType === selectedType;
        
        return matchesSearch && matchesStatus && matchesType;
      })
    : [];

  // Status badge component with color based on status
  const StatusBadge = ({ status }: { status: string }) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      planning: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
      "on-hold": "bg-amber-100 text-amber-800",
    };
    
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-gray-500">
            Manage your development projects and related documentation
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/projects/new")}>
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select onValueChange={(value) => setSelectedStatus(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => setSelectedType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Development Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {developmentTypes.map((type) => (
                <SelectItem key={type} value={type || "unknown"}>
                  {type || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project list */}
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : projects && projects.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Est. Value</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-blue-500" />
                        <Link href={`/projects/${project.id}`}>
                          <span className="cursor-pointer hover:text-blue-600 hover:underline">
                            {project.projectName}
                          </span>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{project.clientName}</TableCell>
                    <TableCell>{project.developmentType}</TableCell>
                    <TableCell>
                      <StatusBadge 
                        status={projectStatuses[project.id]?.status || "active"} 
                      />
                    </TableCell>
                    <TableCell>${project.estimatedValue}</TableCell>
                    <TableCell>{formatDate(project.estimatedCompletionDate)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/projects/${project.id}/risks`)}
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Risk Register
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(`/projects/${project.id}/critical-dates`)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Critical Dates
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit Project</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col items-center p-8 text-center">
          <Folder className="h-12 w-12 text-blue-300 mb-4" />
          <CardTitle className="text-xl mb-2">No Projects Found</CardTitle>
          <CardDescription className="max-w-md mb-6">
            Create your first project to start managing development projects, risks, and critical dates.
          </CardDescription>
          <Button onClick={() => navigate("/projects/new")}>
            Create Project
          </Button>
        </Card>
      )}

      {/* Quick stats */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Active Projects
              </CardTitle>
              <div className="text-2xl font-bold">
                {projects.filter(p => 
                  (projectStatuses[p.id]?.status || "") === "active"
                ).length}
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Project Value
              </CardTitle>
              <div className="text-2xl font-bold">
                ${projects.reduce((sum, p) => 
                  sum + parseFloat(p.estimatedValue.replace(/[^0-9.-]+/g, "")), 
                  0
                ).toLocaleString()}
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Projects Completed
              </CardTitle>
              <div className="text-2xl font-bold">
                {projects.filter(p => 
                  (projectStatuses[p.id]?.status || "") === "completed"
                ).length}
              </div>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}