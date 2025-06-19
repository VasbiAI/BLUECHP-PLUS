import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Link2, Link2Off, CheckCircle2, LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ViewLinkedTasksButtonProps {
  riskId: number;
  linkedTaskCount?: number;
}

interface Task {
  id: number;
  taskId: string;
  taskName: string;
  percentComplete: number;
  startDate: string | null;
  finishDate: string | null;
  duration: number | null;
  projectId: number;
}

export default function ViewLinkedTasksButton({ riskId, linkedTaskCount = 0 }: ViewLinkedTasksButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [, navigate] = useLocation();
  
  const fetchLinkedTasks = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    
    try {
      // First get all task-risk links for this risk
      const linksResponse = await fetch(`/api/risks/${riskId}/links`);
      const links = await linksResponse.json();
      
      if (links.length === 0) {
        setTasks([]);
        setIsLoading(false);
        setHasLoadedOnce(true);
        return;
      }
      
      // Then get the task details for each linked task
      const taskDetails = await Promise.all(
        links.map(async (link: any) => {
          const taskResponse = await fetch(`/api/project-tasks/${link.taskId}`);
          if (!taskResponse.ok) {
            return null;
          }
          return taskResponse.json();
        })
      );
      
      setTasks(taskDetails.filter(Boolean));
      setHasLoadedOnce(true);
    } catch (error) {
      console.error('Error fetching linked tasks:', error);
      setHasLoadedOnce(true);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, riskId]);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchLinkedTasks();
    }
  };
  
  const navigateToTaskProgress = (projectId: number) => {
    // Store the current set of task IDs in localStorage so we can filter for them after navigation
    const filteredTaskIds = tasks.map(task => task.id);
    localStorage.setItem('filterToTaskIds', JSON.stringify(filteredTaskIds));
    
    // Navigate to the project schedule page - ensure this matches the route in App.tsx
    console.log('Navigating to:', `/projects/${projectId}/schedule`);
    navigate(`/projects/${projectId}/schedule`);
    
    setTimeout(() => {
      // This is a hack to set the active tab after navigation
      console.log('Finding tab element...');
      const tabElements = document.querySelectorAll('[value="task-progress"]');
      console.log('Found tab elements:', tabElements.length);
      
      if (tabElements.length > 0) {
        console.log('Clicking tab element');
        (tabElements[0] as HTMLElement).click();
      } else {
        console.log('Tab element not found, using alternative method');
        // Set the tab value directly via localStorage as a fallback
        localStorage.setItem('activeTab', 'task-progress');
      }
      
      // Add a flag in localStorage indicating we should enable the linked-only filter
      localStorage.setItem('enableLinkedOnly', 'true');
      
      // Also trigger a custom event that the project schedule page can listen for
      const event = new CustomEvent('filterToLinkedTasks', { detail: filteredTaskIds });
      window.dispatchEvent(event);
    }, 500);
  };
  
  const navigateToTaskLinks = (projectId: number) => {
    navigate(`/projects/${projectId}/schedule`);
    setTimeout(() => {
      // This is a hack to set the active tab after navigation
      const tabElement = document.querySelector('[value="task-risk-links"]');
      if (tabElement) {
        (tabElement as HTMLElement).click();
      }
    }, 500);
  };
  
  // Effect to auto-load the tasks when the dialog opens and there are linked tasks
  useEffect(() => {
    if (isOpen && linkedTaskCount > 0) {
      fetchLinkedTasks();
    }
  }, [isOpen, linkedTaskCount, fetchLinkedTasks]);
  
  // Only auto-open dialogs when the user clicks on the button, not on automatic load
  // This prevents multiple dialogs from opening simultaneously
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <Link2 className="h-4 w-4" />
          {linkedTaskCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-medium">
              {linkedTaskCount}
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Linked Tasks</DialogTitle>
          <DialogDescription>
            View MS Project tasks linked to this risk. All linked tasks must reach 100% completion for the risk to auto-close.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Link2Off className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tasks linked to this risk</p>
              <DialogClose asChild>
                <Button 
                  variant="link" 
                  className="text-sm p-0 h-auto mt-1 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    // We need to get the project ID from the URL
                    const urlMatch = window.location.pathname.match(/\/projects\/(\d+)/);
                    const projectId = urlMatch ? parseInt(urlMatch[1]) : 1;
                    navigateToTaskLinks(projectId);
                  }}
                >
                  Go to the Project Schedule page to link tasks
                </Button>
              </DialogClose>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div 
                className="overflow-auto pr-2 flex-1 custom-scrollbar" 
                style={{
                  maxHeight: '300px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                  padding: '2px'
                }}>
                <div className="space-y-4 pb-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{task.taskId}</span>
                            <Badge variant="outline" className={task.percentComplete === 100 ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                              {task.percentComplete}%
                            </Badge>
                          </div>
                          <p className="mt-1">{task.taskName}</p>
                          {task.startDate && task.finishDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(task.startDate).toLocaleDateString()} - {new Date(task.finishDate).toLocaleDateString()}
                              {task.duration && ` (${task.duration} days)`}
                            </p>
                          )}
                        </div>
                        
                        {task.percentComplete === 100 && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="mb-4 p-3 border rounded-md bg-muted/30">
                    <h4 className="text-sm font-medium mb-1">Completion Status</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {tasks.filter(t => t.percentComplete === 100).length} of {tasks.length} tasks complete
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(tasks.filter(t => t.percentComplete === 100).length / tasks.length) * 100}%` }} 
                          />
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {Math.round((tasks.filter(t => t.percentComplete === 100).length / tasks.length) * 100)}%
                      </div>
                    </div>
                    <div className="text-xs mt-2">
                      {tasks.filter(t => t.percentComplete === 100).length === tasks.length ? (
                        <span className="text-green-600 font-medium">All tasks are complete - risk will be closed automatically.</span>
                      ) : (
                        <span className="text-amber-600 font-medium">Not all tasks are complete - risk remains open.</span>
                      )}
                    </div>
                  </div>
                  
                  {tasks[0].projectId && (
                    <div className="flex justify-end">
                      <DialogClose asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigateToTaskProgress(tasks[0].projectId)}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          View in Project Schedule
                        </Button>
                      </DialogClose>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}