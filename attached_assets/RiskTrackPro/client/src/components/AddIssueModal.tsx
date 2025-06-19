import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Issue, insertIssueSchema, Risk } from '@shared/schema';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface AddIssueModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: z.infer<typeof formSchema>) => void;
  isSubmitting: boolean;
  projectId: number;
  issues: Issue[];
  fromRisk?: Risk; // Optional risk to convert from
}

// Extend the schema with validation
const formSchema = insertIssueSchema.extend({
  projectId: z.number(),
  uniqueId: z.string().min(1, { message: "Issue ID is required" })
    .refine((val) => /^I-\d+$/.test(val), { 
      message: 'Issue ID must be in format I-XX (where XX is a number)' 
    }),
  raisedBy: z.string().min(1, { message: "Raised By is required" }),
  ownedBy: z.string().min(1, { message: "Owned By is required" }),
  issueEvent: z.string().min(1, { message: "Issue Event is required" }),
  issueEffect: z.string().min(1, { message: "Issue Effect is required" }),
  resolution: z.string().optional(),
  category: z.string().min(1, { message: "Category is required" }),
  impact: z.number().min(1, { message: "Impact is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  assignedTo: z.string().min(1, { message: "Assigned To is required" }),
  closedDate: z.string().optional(),
  issueDate: z.string().min(1, { message: "Issue Date is required" }),
  priority: z.string().optional(),
  comments: z.string().optional(),
});

const AddIssueModal = ({ open, onClose, onSave, isSubmitting, projectId, issues, fromRisk }: AddIssueModalProps) => {
  const issueIds = issues.map(issue => issue.uniqueId);
  
  // Convert risk ID format (R-XX) to issue ID format (I-XX) if possible
  const generateIssueIdFromRisk = () => {
    if (fromRisk?.riskId) {
      const match = fromRisk.riskId.match(/R\s*-\s*(\d+)/i);
      if (match && match[1]) {
        return `I-${match[1]}`;
      }
    }
    return `I-${issues.length + 1}`;
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId,
      priorityRank: issues.length + 1,
      uniqueId: fromRisk ? generateIssueIdFromRisk() : `I-${issues.length + 1}`,
      issueDate: new Date().toLocaleDateString("en-CA"),
      raisedBy: fromRisk?.raisedBy || "",
      ownedBy: fromRisk?.ownedBy || "",
      issueEvent: fromRisk ? `Converted from risk ${fromRisk.riskId}: ${fromRisk.riskEvent}` : "",
      issueEffect: fromRisk?.riskEffect || "",
      resolution: fromRisk ? `Previous mitigation: ${fromRisk.mitigation || "None"}` : "",
      category: fromRisk?.riskCategory || "",
      impact: fromRisk?.impact || 0,
      status: "Open",
      assignedTo: fromRisk?.actionBy || "",
      closedDate: "",
      comments: fromRisk ? `Converted from risk. Original risk cause: ${fromRisk.riskCause}` : "",
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {fromRisk 
              ? `Convert Risk ${fromRisk.riskId} to Issue` 
              : 'Add New Issue'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="uniqueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="I-1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="closedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closed Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="raisedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raised By</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owned By</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Financial">Financial</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Operational">Operational</SelectItem>
                        <SelectItem value="Environmental">Environmental</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impact (1-100)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="100"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value || 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="issueEvent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Event</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="What happened" 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="issueEffect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Effect</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Impact of the issue" 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Resolution details" 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional comments" 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : (fromRisk ? "Convert to Issue" : "Save Issue")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIssueModal;