import { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskProgressSliderProps {
  taskId: number;
  initialProgress: number;
  taskName: string;
  onUpdate: (taskId: number, newProgress: number, updatedRisksCount?: number) => void;
}

export default function TaskProgressSlider({ 
  taskId, 
  initialProgress, 
  taskName,
  onUpdate
}: TaskProgressSliderProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const { toast } = useToast();
  
  // Initialize progress state with initialProgress
  useEffect(() => {
    setProgress(initialProgress);
    setHasChanged(false);
  }, [initialProgress]);
  
  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    setHasChanged(newProgress !== initialProgress);
  };
  
  const handleSave = async () => {
    if (!hasChanged) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/project-tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ percentComplete: progress }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task progress');
      }
      
      const result = await response.json();
      
      // Check if any risks were closed by this update
      const updatedRisksCount = result.updatedRisksCount || 0;
      
      // Let parent component know about the update
      onUpdate(taskId, progress, updatedRisksCount);
      
      // Show success message
      if (updatedRisksCount > 0) {
        toast({
          title: `${updatedRisksCount} risk${updatedRisksCount > 1 ? 's' : ''} automatically closed`,
          description: `Task completion triggered auto-closure of ${updatedRisksCount} linked risk${updatedRisksCount > 1 ? 's' : ''}. Check the Risk Register for details.`,
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        toast({
          title: "Progress updated",
          description: progress === 100 
            ? "Task marked as complete. Linked risks will close when all their associated tasks are complete."
            : "Task progress was successfully saved",
        });
      }
      
      setHasChanged(false);
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast({
        title: "Error",
        description: "Failed to update task progress",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="w-full max-w-md flex-1">
          <Slider
            value={[progress]}
            max={100}
            step={5}
            onValueChange={handleProgressChange}
            disabled={isSaving}
            className={progress === 100 ? "accent-green-500" : ""}
          />
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className={`text-sm font-medium min-w-[40px] text-center ${
            progress === 100 ? "text-green-600" : "text-gray-700"
          }`}>
            {progress}%
          </div>
          
          {hasChanged && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 ml-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          )}
        </div>
      </div>
      
      {progress === 100 && (
        <div className="text-xs text-green-600 font-medium">
          Task is complete. Any linked risks will be automatically closed if all of their linked tasks are complete.
        </div>
      )}
      {progress > 0 && progress < 100 && (
        <div className="text-xs text-blue-600 font-medium">
          Task is {progress}% complete. Linked risks will remain open until all associated tasks are completed.
        </div>
      )}
    </div>
  );
}