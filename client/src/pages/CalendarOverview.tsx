import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Grid,
  LayoutList,
  Plus,
  Search,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Types for Critical Dates
interface CriticalDate {
  id: string;
  title: string;
  dueDate: string;
  description?: string;
  category?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  assignedTo?: string;
  projectId: number;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for critical dates
const getMockCriticalDates = (): CriticalDate[] => [
  {
    id: "date-1",
    title: "Construction Start - Adelaide Project",
    description: "Official commencement of construction activities",
    dueDate: "2024-05-28",
    category: "Construction",
    priority: "high",
    status: "pending",
    assignedTo: "John Smith",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "date-2",
    title: "First Progress Payment Due",
    description: "First milestone payment due from Housing Authority",
    dueDate: "2024-05-15",
    category: "Finance",
    priority: "high",
    status: "overdue",
    assignedTo: "Sarah Johnson",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-02-20T00:00:00Z"
  },
  {
    id: "date-3",
    title: "Board Meeting - Quarterly Review",
    description: "Review of all active projects",
    dueDate: "2024-06-10",
    category: "Governance",
    priority: "medium",
    status: "pending",
    assignedTo: "David Williams",
    projectId: 0, // Organization-level event
    projectName: "All Projects",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z"
  },
  {
    id: "date-4",
    title: "Development Approval Deadline",
    description: "Final date to submit revised plans to council",
    dueDate: "2024-05-05",
    category: "Regulatory",
    priority: "high",
    status: "completed",
    assignedTo: "Michael Brown",
    projectId: 2,
    projectName: "Brisbane Affordable Housing",
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-05-04T00:00:00Z"
  },
  {
    id: "date-5",
    title: "Environmental Assessment Due",
    description: "Complete environmental impact report",
    dueDate: "2024-06-15",
    category: "Regulatory",
    priority: "medium",
    status: "in-progress",
    assignedTo: "Lisa Chen",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-04-10T00:00:00Z"
  },
  {
    id: "date-6",
    title: "Partner Agreement Renewal",
    description: "Renewal of agreement with construction partner",
    dueDate: "2024-07-01",
    category: "Legal",
    priority: "medium",
    status: "pending",
    assignedTo: "Robert Thomas",
    projectId: 0, // Organization-level event
    projectName: "All Projects",
    createdAt: "2024-03-15T00:00:00Z",
    updatedAt: "2024-03-15T00:00:00Z"
  },
  {
    id: "date-7",
    title: "Foundation Completion",
    description: "Target date for completion of foundation work",
    dueDate: "2024-08-15",
    category: "Construction",
    priority: "medium",
    status: "pending",
    assignedTo: "John Smith",
    projectId: 1,
    projectName: "Adelaide Community Housing",
    createdAt: "2024-03-20T00:00:00Z",
    updatedAt: "2024-03-20T00:00:00Z"
  },
  {
    id: "date-8",
    title: "Annual Compliance Report",
    description: "Submission of annual compliance report to regulators",
    dueDate: "2024-05-31",
    category: "Regulatory",
    priority: "high",
    status: "in-progress",
    assignedTo: "Sarah Johnson",
    projectId: 0, // Organization-level event
    projectName: "All Projects",
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-05-01T00:00:00Z"
  }
];

export default function CalendarOverview() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Fetch critical dates - using mock data for now
  const { data: criticalDates, isLoading } = useQuery<CriticalDate[]>({
    queryKey: ["/api/critical-dates"],
    queryFn: () => Promise.resolve(getMockCriticalDates()),
  });

  // Helper functions for calendar view
  const daysInMonth = () => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, "d MMM yyyy");
  };

  // Get priority badge color
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter critical dates based on search, category, priority, and project
  const getFilteredDates = () => {
    if (!criticalDates) return [];

    return criticalDates.filter(date => {
      // Filter by search query
      const matchesSearch =
        searchQuery === "" ||
        date.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (date.description && date.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (date.projectName && date.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter by category
      const matchesCategory = !selectedCategory || selectedCategory === "all" || date.category === selectedCategory;

      // Filter by priority
      const matchesPriority = !selectedPriority || selectedPriority === "all" || date.priority === selectedPriority;

      // Filter by project
      const matchesProject = selectedProject === null || selectedProject === "all" || date.projectId === selectedProject;

      return matchesSearch && matchesCategory && matchesPriority && matchesProject;
    });
  };

  // Get unique categories, projects for filters
  const getUniqueCategories = () => {
    if (!criticalDates) return [];
    const categories = new Set<string>();
    criticalDates.forEach(date => {
      if (date.category) categories.add(date.category);
    });
    return Array.from(categories).sort();
  };

  const getUniqueProjects = () => {
    if (!criticalDates) return [];
    const projects = new Map<number, string>();
    criticalDates.forEach(date => {
      if (date.projectName) projects.set(date.projectId, date.projectName);
    });
    return Array.from(projects.entries()).map(([id, name]) => ({ id, name }));
  };

  // Get dates for a specific day
  const getDatesForDay = (day: Date) => {
    if (!criticalDates) return [];
    
    return criticalDates.filter(date => {
      const dueDate = new Date(date.dueDate);
      return isSameDay(dueDate, day);
    });
  };

  const filteredDates = getFilteredDates();
  const daysInCurrentMonth = daysInMonth();
  const uniqueCategories = getUniqueCategories();
  const uniqueProjects = getUniqueProjects();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Critical Dates</h1>
          <p className="text-gray-500">
            Manage important project milestones and deadlines
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Date
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search critical dates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select onValueChange={(value) => setSelectedCategory(value || null)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category || "unknown"}>
                  {category || "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => setSelectedPriority(value || null)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select onValueChange={(value) => setSelectedProject(value ? parseInt(value) : null)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {uniqueProjects.map(project => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="p-0.5 bg-gray-100 rounded-md flex">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("calendar")}
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

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
            <p className="mt-4 text-gray-500">Loading critical dates...</p>
          </div>
        </div>
      ) : filteredDates.length > 0 ? (
        <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(value) => setViewMode(value as "calendar" | "list")}>
          <TabsContent value="calendar" className="mt-0">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={previousMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date())}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {daysInCurrentMonth.map((day, dayIdx) => {
                    const datesForDay = getDatesForDay(day);
                    return (
                      <div
                        key={day.toString()}
                        className={cn(
                          "min-h-[120px] p-1.5 border border-gray-200",
                          !isSameMonth(day, currentMonth) && "bg-gray-50 text-gray-300",
                          isToday(day) && "bg-blue-50 border-blue-200",
                          "overflow-hidden"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isToday(day) && "bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                          {datesForDay.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {datesForDay.length}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 space-y-1 max-h-[80px] overflow-hidden">
                          {datesForDay.slice(0, 3).map((date) => (
                            <div
                              key={date.id}
                              className={cn(
                                "text-xs p-1 rounded truncate",
                                getPriorityColor(date.priority)
                              )}
                            >
                              {date.title}
                            </div>
                          ))}
                          {datesForDay.length > 3 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{datesForDay.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Critical Dates List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredDates.map((date) => (
                    <div
                      key={date.id}
                      className="border rounded-md p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-medium">{date.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>{date.projectName}</span>
                            {date.category && (
                              <>
                                <span>•</span>
                                <span>{date.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={getPriorityColor(date.priority)}>
                            {date.priority.charAt(0).toUpperCase() + date.priority.slice(1)} Priority
                          </Badge>
                          <Badge className={getStatusColor(date.status)}>
                            {date.status.charAt(0).toUpperCase() + date.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      {date.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {date.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span>Due: {formatDate(date.dueDate)}</span>
                        </div>
                        
                        {date.assignedTo && (
                          <div className="flex items-center text-gray-500">
                            <span className="flex items-center">
                              <span className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 mr-1">
                                {date.assignedTo.charAt(0)}
                              </span>
                              {date.assignedTo}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="h-52 flex items-center justify-center mt-6">
          <div className="text-center">
            <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1">No critical dates found</h3>
            <p className="text-gray-500 mb-4">
              No dates match your current filters. Try changing your search or filters.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory(null);
              setSelectedPriority(null);
              setSelectedProject(null);
            }}>
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}