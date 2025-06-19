import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link as LinkIcon, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Progress } from '@/components/ui/progress';

interface SuggestionProps {
  projectId: number;
  username?: string;
}

interface Suggestion {
  taskId: number;
  riskId: number;
  taskName: string;
  riskTitle: string;
  confidence: number;
  selected?: boolean;
}

interface Task {
  id: number;
  taskId: string;
  taskName: string;
  percentComplete: number;
  links?: any[];
}

interface Risk {
  id: number;
  riskId: string;
  riskEvent: string;
  riskStatus: string;
  taskLinks?: any[];
}

export default function TaskLinkingPanel({
  projectId,
  username = "Anonymous"
}: SuggestionProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectRisks, setProjectRisks] = useState<Risk[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Load suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/projects/${projectId}/suggest-links`);
        const data = await response.json();
        setSuggestions(data.map((s: Suggestion) => ({ ...s, selected: true })));
        setSelectedCount(data.length);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Failed to load suggestions. Please try again.");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [projectId]);
  
  // Load tasks and risks
  useEffect(() => {
    const fetchTasksAndRisks = async () => {
      try {
        // Load tasks
        const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`);
        const tasksData = await tasksResponse.json();
        setProjectTasks(tasksData);
        
        // Load risks
        const risksResponse = await fetch(`/api/risks?projectId=${projectId}`);
        const risksData = await risksResponse.json();
        setProjectRisks(risksData);
        
      } catch (err) {
        console.error("Error fetching tasks and risks:", err);
      }
    };
    
    fetchTasksAndRisks();
  }, [projectId]);
  
  const handleSaveSuggestions = async () => {
    const selectedSuggestions = suggestions.filter(s => s.selected);
    
    if (selectedSuggestions.length === 0) {
      toast({
        variant: "destructive",
        title: "No links selected",
        description: "Please select at least one link to save"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/task-risk-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          links: selectedSuggestions.map(s => ({
            taskId: s.taskId,
            riskId: s.riskId,
            aiSuggested: true
          })),
          createdBy: username
        })
      });
      
      const result = await response.json();
      
      toast({
        title: "Links saved",
        description: `Created ${result.length} task-risk links`
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/risks`] });
      
      // Fetch updated data
      loadExistingLinks();
      
    } catch (err) {
      console.error("Error saving links:", err);
      toast({
        variant: "destructive",
        title: "Failed to save links",
        description: "An error occurred while saving the links"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadExistingLinks = async () => {
    try {
      // Reload tasks with links
      const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`);
      setProjectTasks(await tasksResponse.json());
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };
  
  const handleDeleteLink = async (linkId: number) => {
    if (!confirm("Are you sure you want to delete this link?")) {
      return;
    }
    
    try {
      await fetch(`/api/task-risk-links/${linkId}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "Link deleted",
        description: "Task-risk link has been removed"
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/risks`] });
      
      // Fetch updated data
      loadExistingLinks();
      
    } catch (err) {
      console.error("Error deleting link:", err);
      toast({
        variant: "destructive", 
        title: "Failed to delete link",
        description: "An error occurred while deleting the link"
      });
    }
  };
  
  // Calculate stats
  const taskWithLinks = projectTasks.filter(task => 
    task.links && task.links.length > 0
  ).length;
  
  const risksWithLinks = projectRisks.filter(risk => 
    risk.taskLinks && risk.taskLinks.length > 0
  ).length;
  
  const completedTasksWithLinks = projectTasks.filter(task => 
    task.percentComplete === 100 && task.links && task.links.length > 0
  ).length;
  
  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Linked Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taskWithLinks} / {projectTasks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((taskWithLinks / (projectTasks.length || 1)) * 100).toFixed(0)}% of tasks are linked to risks
            </p>
            <Progress 
              value={(taskWithLinks / (projectTasks.length || 1)) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Linked Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {risksWithLinks} / {projectRisks.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((risksWithLinks / (projectRisks.length || 1)) * 100).toFixed(0)}% of risks are linked to tasks
            </p>
            <Progress 
              value={(risksWithLinks / (projectRisks.length || 1)) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Linked Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTasksWithLinks} / {taskWithLinks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((completedTasksWithLinks / (taskWithLinks || 1)) * 100).toFixed(0)}% of linked tasks are complete
            </p>
            <Progress 
              value={(completedTasksWithLinks / (taskWithLinks || 1)) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>
      
      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            AI-Powered Task-Risk Links
          </CardTitle>
          <CardDescription>
            Review and approve suggested links between project tasks and risks. These suggestions are generated using advanced AI analysis of your project data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center p-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-center">
                <span className="block font-medium text-muted-foreground">AI Analysis in Progress</span>
                <span className="block text-sm text-muted-foreground mt-1">
                  Our AI system is analyzing your tasks and risks to find meaningful connections...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center p-4 border rounded-md bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              <span>{error}</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No suggestions found. This could be because:</p>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>All relevant tasks are already linked to risks</li>
                <li>There are no active risks and tasks available</li>
                <li>The AI system couldn't find meaningful connections between tasks and risks</li>
                <li>There isn't enough descriptive text in your tasks or risks for analysis</li>
              </ul>
              <p className="mt-4 text-sm">
                Try adding more detailed descriptions to your tasks and risks to improve AI suggestions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium">Select All</span>
                <Checkbox 
                  checked={selectedCount === suggestions.length} 
                  onCheckedChange={(checked) => {
                    const newSuggestions = suggestions.map(s => ({...s, selected: !!checked}));
                    setSuggestions(newSuggestions);
                    setSelectedCount(checked ? newSuggestions.length : 0);
                  }}
                />
              </div>
              
              <div className="rounded-md border">
                <div className="grid grid-cols-12 p-3 bg-muted text-sm font-medium border-b">
                  <div className="col-span-5">Task</div>
                  <div className="col-span-5">Risk</div>
                  <div className="col-span-1 text-center">
                    <span title="AI confidence in this suggestion">AI Score</span>
                  </div>
                  <div className="col-span-1 text-center">Select</div>
                </div>
                
                <div className="divide-y">
                  {suggestions.map((suggestion, idx) => {
                    const task = projectTasks.find(t => t.id === suggestion.taskId);
                    const risk = projectRisks.find(r => r.id === suggestion.riskId);
                    
                    // Skip if task or risk wasn't found
                    if (!task || !risk) return null;
                    
                    return (
                      <div key={`${suggestion.taskId}-${suggestion.riskId}`} className="grid grid-cols-12 p-3 items-center">
                        <div className="col-span-5">
                          <div className="flex flex-col">
                            <span className="font-medium truncate">{task.taskName}</span>
                            <span className="text-xs text-muted-foreground">ID: {task.taskId}</span>
                            <span className="text-xs mt-1">
                              Progress: {task.percentComplete}%
                              <Progress value={task.percentComplete} className="h-1 mt-1" />
                            </span>
                          </div>
                        </div>
                        
                        <div className="col-span-5">
                          <div className="flex flex-col">
                            <span className="font-medium truncate">{risk.riskEvent}</span>
                            <span className="text-xs text-muted-foreground">ID: {risk.riskId}</span>
                            <div className="mt-1">
                              <Badge
                                variant={risk.riskStatus === 'Closed' ? 'outline' : 'default'}
                                className="text-xs"
                              >
                                {risk.riskStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <span 
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              suggestion.confidence > 0.7 
                                ? 'bg-green-100 text-green-800' 
                                : suggestion.confidence > 0.4 
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            title="AI confidence score"
                          >
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <Checkbox 
                            checked={suggestion.selected}
                            onCheckedChange={(checked) => {
                              const newSuggestions = [...suggestions];
                              newSuggestions[idx].selected = !!checked;
                              setSuggestions(newSuggestions);
                              setSelectedCount(newSuggestions.filter(s => s.selected).length);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}/risks`)}
            disabled={isLoading}
          >
            Back to Risks
          </Button>
          <Button
            onClick={handleSaveSuggestions}
            disabled={isLoading || selectedCount === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Save Selected Links ({selectedCount})
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Existing Links */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Task-Risk Links</CardTitle>
          <CardDescription>
            View and manage links between project tasks and risks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectTasks.filter(task => task.links && task.links.length > 0).length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No existing links found.</p>
              <p className="text-sm mt-2">Create links using the suggestions above or manually link tasks to risks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectTasks
                .filter(task => task.links && task.links.length > 0)
                .map(task => (
                  <div key={task.id} className="rounded-md border p-4">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <h4 className="font-medium">{task.taskName}</h4>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <span>ID: {task.taskId}</span>
                          <span>•</span>
                          <span>Progress: {task.percentComplete}%</span>
                        </div>
                      </div>
                      <Progress 
                        value={task.percentComplete} 
                        className="w-24 mt-2"
                      />
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="text-sm font-medium mt-2 mb-1">Linked Risks:</div>
                    <ul className="space-y-2">
                      {task.links && task.links.map((link: any) => {
                        const risk = projectRisks.find(r => r.id === link.riskId);
                        if (!risk) return null;
                        
                        return (
                          <li key={link.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                            <div className="flex items-center gap-2">
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{risk.riskEvent} ({risk.riskId})</span>
                              <Badge
                                variant={risk.riskStatus === 'Closed' ? 'outline' : 'default'}
                                className="ml-2 text-xs"
                              >
                                {risk.riskStatus}
                              </Badge>
                              {link.aiSuggested && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  AI Suggested
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLink(link.id)}
                              className="h-7 text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}