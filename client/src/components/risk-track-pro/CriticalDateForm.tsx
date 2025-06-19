import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CriticalDateFormProps {
  isOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose: () => void;
  onSave: (formData: any) => void;
  initialData?: any;
  projectId?: string;
  isSubmitting?: boolean;
}

export function CriticalDateForm({
  isOpen,
  open,
  onOpenChange,
  onClose,
  onSave,
  initialData,
  projectId,
  isSubmitting = false
}: CriticalDateFormProps) {
  // Use open prop if provided, otherwise use isOpen
  const isDialogOpen = open !== undefined ? open : isOpen;
  const handleOpenChange = onOpenChange || onClose;

  const [date, setDate] = useState<Date | undefined>(
    initialData?.date ? new Date(initialData.date) : undefined
  );

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'milestone');
  const [assignedTo, setAssignedTo] = useState(initialData?.assignedTo || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const categoryOptions = [
    { value: 'milestone', label: 'Milestone' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'contractual', label: 'Contractual' },
    { value: 'regulatory', label: 'Regulatory' },
    { value: 'meeting', label: 'Meeting' },
  ];

  const handleSubmit = () => {
    if (!title || !date) return;

    onSave({
      title,
      description,
      category,
      date: date ? format(date, 'yyyy-MM-dd') : '',
      assignedTo,
      notes,
      ...(projectId && { projectId }),
      ...(initialData?.id && { id: initialData.id }),
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Critical Date' : 'Add Critical Date'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
              placeholder="Enter date title" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description" 
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Input 
              id="assignedTo" 
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Enter person responsible" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes" 
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !date}
          >
            {isSubmitting ? "Saving..." : (initialData ? "Update" : "Add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CriticalDateForm;