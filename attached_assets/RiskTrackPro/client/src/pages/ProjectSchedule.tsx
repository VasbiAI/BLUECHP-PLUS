import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ExcelUploader from "@/components/ExcelUploader";
import TaskLinkingPanel from "@/components/TaskLinkingPanel";
import TaskProgressSlider from "@/components/TaskProgressSlider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { queryClient } from '@/lib/queryClient';
import { exportLinkedTasksToCSV } from "@/lib/utils/csvExport";
import { useToast } from "@/hooks/use-toast";
import { 
  CircleAlert, 
  FilePlus2, 
  ClipboardList, 
  Calendar, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  BarChart4, 
  Search,
  CheckCircle,
  ArrowUpDown,
  Filter,
  Download
} from "lucide-react";
import { format } from 'date-fns';

type Project = {
  id: number;
  name: string;
  registerName: string;
  organization: string;
};

interface Task {
  id: number;
  taskId: string;
  taskName: string;
  percentComplete: number;
  startDate: string | null;
  finishDate: string | null;
  duration: number | null;
  resources: string | null;
  notes: string | null;
  links?: any[];
  projectId: number;
}

export default function ProjectSchedule() {
  const params = useParams<{ projectId: string }>();
  const projectId = parseInt(params.projectId, 10);
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Check localStorage for activeTab
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      // Clear it after reading
      localStorage.removeItem('activeTab');
      return savedTab;
    }
    return "uploaded-files";
  });
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [showLinkedOnly, setShowLinkedOnly] = useState(true);
  const [sortField, setSortField] = useState<'taskId' | 'taskName' | 'percentComplete'>('taskId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      if (isNaN(projectId)) {
        setError("Invalid project ID");
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);
  
  // Fetch schedules for this project
  useEffect(() => {
    const fetchSchedules = async () => {
      if (isNaN(projectId)) return;
      
      try {
        const response = await fetch(`/api/projects/${projectId}/schedules`);
        const data = await response.json();
        setSchedules(data);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
      }
    };
    
    fetchSchedules();
  }, [projectId]);
  
  // Fetch project tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (isNaN(projectId) || activeTab !== 'task-progress') {
        return;
      }
      
      setIsLoadingTasks(true);
      
      try {
        const response = await fetch(`/api/projects/${projectId}/tasks`);
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data);
        
        // Check localStorage for enableLinkedOnly flag
        const enableLinkedOnly = localStorage.getItem('enableLinkedOnly');
        if (enableLinkedOnly === 'true') {
          setShowLinkedOnly(true);
          localStorage.removeItem('enableLinkedOnly'); // Clear the flag
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    
    fetchTasks();
    
    // Listen for custom event to filter to linked tasks
    const handleFilterToLinkedTasks = (e: Event) => {
      // Set active tab to task progress
      setActiveTab('task-progress');
      // Enable the linked-only filter
      setShowLinkedOnly(true);
      
      // Get the filtered task IDs from the event if available
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        console.log('Filtering to task IDs:', customEvent.detail);
      }
    };
    
    window.addEventListener('filterToLinkedTasks', handleFilterToLinkedTasks);
    
    return () => {
      window.removeEventListener('filterToLinkedTasks', handleFilterToLinkedTasks);
    };
  }, [projectId, activeTab, setActiveTab, setShowLinkedOnly]);
  
  // Filter and sort tasks
  useEffect(() => {
    let result = [...tasks];
    
    // Filter by completion status
    if (!showCompleted) {
      result = result.filter(task => task.percentComplete < 100);
    }
    
    // Filter to show only tasks linked to risks
    if (showLinkedOnly) {
      result = result.filter(task => 
        task.links && task.links.length > 0
      );
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        task.taskId.toLowerCase().includes(query) || 
        task.taskName.toLowerCase().includes(query) ||
        (task.notes && task.notes.toLowerCase().includes(query))
      );
    }
    
    // Sort tasks
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredTasks(result);
  }, [tasks, searchQuery, showCompleted, showLinkedOnly, sortField, sortOrder]);
  
  // Handle task update
  const handleTaskUpdate = (taskId: number, newProgress: number, updatedRisksCount?: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, percentComplete: newProgress } 
          : task
      )
    );
  };
  
  // Handle CSV export of linked tasks
  const handleExportCSV = () => {
    try {
      if (filteredTasks.length === 0) {
        toast({
          title: "No tasks to export",
          description: "There are no tasks available to export.",
          variant: "destructive",
        });
        return;
      }
      
      const projectName = project?.name || "Project_Schedule";
      exportLinkedTasksToCSV(filteredTasks, projectName);
      
      toast({
        title: "Export successful",
        description: "Linked tasks have been exported to CSV.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Failed to export linked tasks to CSV.",
        variant: "destructive",
      });
    }
  };
  
  // Handle sort toggle
  const handleSortToggle = (field: 'taskId' | 'taskName' | 'percentComplete') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleUploadComplete = (result: any) => {
    // Refresh schedules list
    const fetchSchedules = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/schedules`);
        const data = await response.json();
        setSchedules(data);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
      }
    };
    
    fetchSchedules();
    
    // Switch to linking tab after upload
    setActiveTab("task-linking");
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load project schedule. Please try again."}
          </AlertDescription>
        </Alert>
        
        <Button asChild variant="outline">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.registerName} • {project.organization}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/risk-register">
              <ClipboardList className="mr-2 h-4 w-4" />
              Risk Register
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/issues">
              <CircleAlert className="mr-2 h-4 w-4" />
              Issues Register
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/critical-dates`}>
              <Calendar className="mr-2 h-4 w-4" />
              Critical Dates
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="uploaded-files">Uploaded Schedules</TabsTrigger>
            <TabsTrigger value="task-risk-links">Task-Risk Linking</TabsTrigger>
            <TabsTrigger value="task-progress">Task Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="uploaded-files" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <ExcelUploader 
                  projectId={projectId} 
                  onUploadComplete={handleUploadComplete} 
                />
              </div>
              
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Upload History
                    </CardTitle>
                    <CardDescription>
                      Previously uploaded MS Project schedules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {schedules.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No schedules have been uploaded yet.</p>
                        <p className="text-sm mt-2">Use the upload form to import your first MS Project schedule.</p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 p-3 bg-muted text-sm font-medium border-b">
                          <div className="col-span-4">File Name</div>
                          <div className="col-span-3">Uploaded By</div>
                          <div className="col-span-2">Date</div>
                          <div className="col-span-3">Tasks</div>
                        </div>
                        
                        <div className="divide-y">
                          {schedules && schedules.length > 0 ? (
                            schedules.slice(0, 10).map((schedule) => (
                              <div key={schedule.id} className="grid grid-cols-12 p-3 items-center">
                                <div className="col-span-4">
                                  <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                                    <div className="font-medium truncate">{schedule.fileName}</div>
                                  </div>
                                </div>
                                
                                <div className="col-span-3">
                                  <span className="text-sm">{schedule.uploadedBy || 'Anonymous'}</span>
                                </div>
                                
                                <div className="col-span-2">
                                  <span className="text-sm">
                                    {schedule.uploadedAt ? format(new Date(schedule.uploadedAt), 'dd MMM yyyy') : ''}
                                  </span>
                                </div>
                                
                                <div className="col-span-3">
                                  <div className="text-sm flex gap-2">
                                    <Badge variant="outline">
                                      {schedule.taskCount || 0} Tasks
                                    </Badge>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {schedule.completedTaskCount || 0} Complete
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-neutral-500">
                              No schedule files uploaded yet
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  {schedules && schedules.length > 0 && (
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => setActiveTab("task-linking")}
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Manage Task Links
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="task-risk-links">
            <TaskLinkingPanel projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="task-progress">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart4 className="h-5 w-5" />
                      Task Progress Tracking
                    </CardTitle>
                    <CardDescription>
                      Update task progress to automatically close linked risks when tasks are completed
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleExportCSV}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Tasks CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center w-full md:w-auto space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-full md:w-[250px]"
                      />
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                      <div className="flex items-center space-x-2 mr-4">
                        <Checkbox 
                          id="show-linked-only" 
                          checked={showLinkedOnly}
                          onCheckedChange={(checked) => setShowLinkedOnly(checked as boolean)}
                        />
                        <label
                          htmlFor="show-linked-only"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Show only linked tasks
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-completed" 
                          checked={showCompleted}
                          onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
                        />
                        <label
                          htmlFor="show-completed"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Show completed tasks
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {isLoadingTasks ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No tasks found{searchQuery ? " matching your search" : ""}.</p>
                      {!searchQuery && showLinkedOnly && tasks.length > 0 && (
                        <p className="text-sm mt-2">
                          No tasks are linked to risks. Try unchecking "Show only linked tasks" to see all tasks,
                          or go to the "Task-Risk Links" tab to create links.
                        </p>
                      )}
                      {!searchQuery && !showLinkedOnly && (
                        <p className="text-sm mt-2">
                          Upload a project schedule to see tasks here.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 items-center py-2 border-b text-sm font-medium text-muted-foreground">
                        <div className="col-span-2">
                          <button 
                            className="flex items-center" 
                            onClick={() => handleSortToggle('taskId')}
                          >
                            Task ID
                            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === 'taskId' ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </div>
                        <div className="col-span-5">
                          <button 
                            className="flex items-center" 
                            onClick={() => handleSortToggle('taskName')}
                          >
                            Name
                            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === 'taskName' ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </div>
                        <div className="col-span-3">
                          <button 
                            className="flex items-center" 
                            onClick={() => handleSortToggle('percentComplete')}
                          >
                            Progress
                            <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === 'percentComplete' ? 'text-primary' : 'text-muted-foreground'}`} />
                          </button>
                        </div>
                        <div className="col-span-2">Links</div>
                      </div>
                      
                      {filteredTasks.map((task) => (
                        <div key={task.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0">
                          <div className="col-span-2">
                            <div className="font-medium text-sm">{task.taskId}</div>
                          </div>
                          <div className="col-span-5">
                            <div className="text-sm">{task.taskName}</div>
                          </div>
                          <div className="col-span-3">
                            <TaskProgressSlider
                              taskId={task.id}
                              initialProgress={task.percentComplete}
                              taskName={task.taskName}
                              onUpdate={handleTaskUpdate}
                            />
                          </div>
                          <div className="col-span-2">
                            {task.links && task.links.length > 0 ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {task.links.length} Risk{task.links.length !== 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No linked risks</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("task-linking")}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Manage Task Links
                </Button>
                {filteredTasks.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} •&nbsp;
                    {filteredTasks.filter(t => t.percentComplete === 100).length} completed
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}