import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { insertRiskSchema, type Risk } from "@shared/schema";
import { calculateRiskRating } from "@/lib/utils/riskCalculations";

// Field instructions from documentation
const fieldInstructions = {
  priorityRank: "This will self populate when the function is performed via the filter.",
  riskId: "This is a required input field. Refer to the top of page summary for the total number of risks. Then add a higher number for the new risk.",
  issueId: "This is a required input field. Refer to the top of page summary for the total number of issues. Then add a higher number for the new issue.",
  openDate: "The date of raising a risk is a required input. The date format is to be followed.",
  raisedBy: "Name of the person that raised the risk is an input.",
  ownedBy: "Name of the person who's responsibility the risk is.",
  cause: "Input required i.e. Caused by power failure",
  event: "Input required i.e. May be a power failure",
  effect: "Input required i.e. There is power failure",
  riskCategory: "Input required from drop down list.",
  probability: "Input required from drop down list.",
  impact: "Input required from drop down list.",
  riskRating: "Auto generates. Provides a quantitative assessment of the risk.",
  riskStatus: "Input required from drop down list. Selects open or closed.",
  responseType: "Input required from drop down list.",
  mitigation: "What can be done to reduce the impact of the risk if it occurs.",
  prevention: "What can be done to prevent the risk from eventuating",
  comment: "Additional information.",
  resolution: "Plan of action to deal with issue.",
  issueCategory: "Input required from drop down list.",
  closeBy: "The expected date for the issue to be resolved.",
  closedOn: "The actual date the issue is resolved."
};

// Field instruction tooltip component
interface FieldHelpProps {
  instruction: string;
}

const FieldHelp = ({ instruction }: FieldHelpProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger type="button" className="ml-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted">
            <InfoIcon className="h-3 w-3" />
            <span className="sr-only">Info</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4">
          <p>{instruction}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface EditRiskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: z.infer<typeof formSchema>) => void;
  isSubmitting: boolean;
  risk: Risk | null;
}

// Create a form schema extending the insertRiskSchema
const formSchema = insertRiskSchema.extend({
  // Add any additional validation rules here
  probability: z.coerce.number().min(0).max(1).step(0.1),
  impact: z.coerce.number().min(0).max(100).step(1),
  riskRating: z.coerce.number().optional(),
});

const EditRiskModal = ({ open, onClose, onSave, isSubmitting, risk }: EditRiskModalProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priorityRank: 1,
      riskId: "",
      issueId: "",
      openDate: "",
      raisedBy: "",
      ownedBy: "",
      riskCause: "",
      riskEvent: "",
      riskEffect: "",
      riskCategory: "",
      probability: 0.5,
      impact: 50,
      riskRating: 25,
      riskStatus: "Open",
      responseType: "Accept",
      mitigation: "",
      prevention: "",
      comment: "",
      projectId: 1,
    },
  });

  // Set form values when risk changes
  useEffect(() => {
    if (risk) {
      form.reset(risk);
    }
  }, [risk, form]);

  // Watch probability and impact to calculate risk rating
  const probability = form.watch("probability");
  const impact = form.watch("impact");

  useEffect(() => {
    const rating = calculateRiskRating(probability, impact);
    form.setValue("riskRating", rating);
  }, [probability, impact, form]);

  const handleFormSubmit = (data: z.infer<typeof formSchema>) => {
    if (risk) {
      onSave(risk.id, data);
    }
  };

  if (!risk) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Edit Risk {risk.riskId}</DialogTitle>
          <DialogDescription>
            Make changes to the risk details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risk ID Field */}
              <FormField
                control={form.control}
                name="riskId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Open Date Field */}
              <FormField
                control={form.control}
                name="openDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open Date</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Raised By Field */}
              <FormField
                control={form.control}
                name="raisedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raised By</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Owned By Field */}
              <FormField
                control={form.control}
                name="ownedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owned By</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BlueCHP">BlueCHP</SelectItem>
                          <SelectItem value="Developer">Developer</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority / Rank Field */}
              <FormField
                control={form.control}
                name="priorityRank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority / Rank</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Category Field */}
              <FormField
                control={form.control}
                name="riskCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Category</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Site">Site</SelectItem>
                          <SelectItem value="Budget">Budget</SelectItem>
                          <SelectItem value="Design Construction and Commissioning">
                            Design Construction and Commissioning
                          </SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Cause Field */}
              <FormField
                control={form.control}
                name="riskCause"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Risk Cause (Due to)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Event Field */}
              <FormField
                control={form.control}
                name="riskEvent"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Risk Event (There is a risk that)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Effect Field */}
              <FormField
                control={form.control}
                name="riskEffect"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Risk Effect (Which may occur)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Probability Field */}
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (0-1)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Impact Field */}
              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impact (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Rating Field - Calculated */}
              <FormField
                control={form.control}
                name="riskRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Rating (Calculated)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        disabled
                        className="bg-neutral-100"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Status Field */}
              <FormField
                control={form.control}
                name="riskStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risk Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Eventuated">Eventuated (Convert to Issue)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Response Type Field */}
              <FormField
                control={form.control}
                name="responseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended Response Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Response" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Accept">Accept</SelectItem>
                          <SelectItem value="Transfer">Transfer</SelectItem>
                          <SelectItem value="Mitigate">Mitigate</SelectItem>
                          <SelectItem value="Avoid">Avoid</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mitigation Field */}
              <FormField
                control={form.control}
                name="mitigation"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>
                      Mitigation
                      <FieldHelp instruction={fieldInstructions.mitigation} />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Strategies to mitigate this risk"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prevention Field */}
              <FormField
                control={form.control}
                name="prevention"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>
                      Prevention
                      <FieldHelp instruction={fieldInstructions.prevention} />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Strategies to prevent this risk"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Comment Field */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>
                      Comment
                      <FieldHelp instruction={fieldInstructions.comment} />
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Additional information"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isSubmitting ? "Saving..." : "Update Risk"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRiskModal;
