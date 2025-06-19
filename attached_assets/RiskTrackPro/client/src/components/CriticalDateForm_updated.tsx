import React, { useState, useEffect, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { z } from 'zod';
import { insertCriticalDateSchema, type CriticalDate } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Mail,
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-react';

// Extended schema with validations
const formSchema = insertCriticalDateSchema.extend({
  emails: z.array(z.string().email('Invalid email format')).optional(),
  emailInput: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CriticalDateFormProps {
  initialData?: Partial<CriticalDate>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

const CriticalDateForm: React.FC<CriticalDateFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isEdit = false,
}) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTab, setSelectedTab] = useState('general');
  const [tempEmail, setTempEmail] = useState('');
  
  // Helper function for safe form field rendering
  const renderInput = (field: any, props: { 
    placeholder?: string;
    className?: string; 
    type?: string;
    isTextarea?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  }) => {
    const { placeholder, className, type = "text", isTextarea = false, onChange } = props;
    
    // Ensure field.value is never null/undefined
    const safeValue = field.value !== null && field.value !== undefined 
      ? field.value 
      : type === "number" ? 0 : '';
      
    // Handle numeric inputs
    if (type === "number" && onChange === undefined) {
      // For number fields, add automatic conversion
      const numberOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        field.onChange(e.target.value === '' ? 0 : Number(e.target.value));
      };
      
      return (
        <Input
          type={type}
          value={safeValue}
          onChange={numberOnChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          placeholder={placeholder}
          className={className}
        />
      );
    }
    
    if (isTextarea) {
      return (
        <Textarea
          value={safeValue}
          onChange={onChange || field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          placeholder={placeholder}
          className={className}
        />
      );
    }
    
    return (
      <Input
        type={type}
        value={safeValue}
        onChange={onChange || field.onChange}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}
        placeholder={placeholder}
        className={className}
      />
    );
  };
  
  // Helper function to safely get values from initialData
  const getInitialValue = <T extends keyof CriticalDate>(
    field: T, 
    defaultValue: CriticalDate[T] | string | number | string[] | undefined
  ): CriticalDate[T] | string | number | string[] => {
    if (initialData && field in initialData && initialData[field] !== null && initialData[field] !== undefined) {
      return initialData[field] as CriticalDate[T];
    }
    return defaultValue as CriticalDate[T] | string | number | string[];
  };

  // Initialize form with default values or initial data
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: getInitialValue('title', '') as string,
      status: getInitialValue('status', 'Open') as string,
      entity: getInitialValue('entity', '') as string,
      department: getInitialValue('department', '') as string,
      state: getInitialValue('state', '') as string,
      contractValue: getInitialValue('contractValue', '') as string,
      criticalIssue: getInitialValue('criticalIssue', '') as string,
      criticalIssueDescription: getInitialValue('criticalIssueDescription', '') as string,
      reminderType: getInitialValue('reminderType', '') as string,
      projectName: getInitialValue('projectName', '') as string,
      projectAddress: getInitialValue('projectAddress', '') as string,
      agreementType: getInitialValue('agreementType', '') as string,
      agreementDate: getInitialValue('agreementDate', '') as string,
      agreementReference: getInitialValue('agreementReference', '') as string,
      dueDate: getInitialValue('dueDate', '') as string,
      reminderScheduling: getInitialValue('reminderScheduling', 'One Off Event') as string,
      occurrenceFrequency: getInitialValue('occurrenceFrequency', '') as string,
      occurrenceStartDate: getInitialValue('occurrenceStartDate', '') as string,
      occurrenceLastNotificationDate: getInitialValue('occurrenceLastNotificationDate', '') as string,
      reminder1Days: getInitialValue('reminder1Days', 14) as number,
      reminder2Days: getInitialValue('reminder2Days', 7) as number,
      reminder3Days: getInitialValue('reminder3Days', 3) as number,
      reminder4Days: getInitialValue('reminder4Days', 1) as number,
      postTriggerDateReminderDays: getInitialValue('postTriggerDateReminderDays', 0) as number,
      emails: getInitialValue('emails', []) as string[],
      emailInput: '',
    },
  });

  // Set selected date if initialData has dueDate
  useEffect(() => {
    if (initialData?.dueDate) {
      try {
        const parts = initialData.dueDate.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
          const year = parseInt(parts[2], 10);
          setSelectedDate(new Date(year, month, day));
        }
      } catch (err) {
        console.error('Failed to parse date:', err);
      }
    }
  }, [initialData]);

  // Show recurring options based on reminder scheduling
  const isRecurring = form.watch('reminderScheduling') !== 'One Off Event';

  // Handle due date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      form.setValue('dueDate', formattedDate);
    } else {
      form.setValue('dueDate', '');
    }
  };

  // Handle email array management
  const handleAddEmail = () => {
    const emailInput = form.getValues('emailInput');
    if (emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      const currentEmails = form.getValues('emails') || [];
      if (!currentEmails.includes(emailInput)) {
        form.setValue('emails', [...currentEmails, emailInput]);
        form.setValue('emailInput', '');
        setTempEmail('');
      }
    }
  };

  const handleRemoveEmail = (email: string) => {
    const currentEmails = form.getValues('emails') || [];
    form.setValue('emails', currentEmails.filter(e => e !== email));
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      // Remove the temporary email input field before submitting
      const { emailInput, ...submitData } = data;
      
      let response;
      if (isEdit && initialData?.id) {
        response = await apiRequest(`/api/critical-dates/${initialData.id}`, 'PATCH', submitData);
        toast({
          title: "Critical date updated",
          description: "The critical date has been updated successfully.",
        });
      } else {
        response = await apiRequest('/api/critical-dates', 'POST', submitData);
        toast({
          title: "Critical date created",
          description: "The critical date has been created successfully.",
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/critical-dates'] });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/critical-dates');
      }
      
      return response;
    } catch (error) {
      console.error('Error saving critical date:', error);
      toast({
        title: "Error",
        description: "Failed to save critical date. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="reminders">Reminders & Notifications</TabsTrigger>
            <TabsTrigger value="contract">Contract Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      {renderInput(field, { placeholder: "Enter title" })}
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
                    <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                    <Select 
                      defaultValue={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity</FormLabel>
                    <FormControl>
                      {renderInput(field, { placeholder: "Enter entity name" })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      {renderInput(field, { placeholder: "Enter department" })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select 
                      defaultValue={field.value} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NSW">NSW</SelectItem>
                        <SelectItem value="VIC">VIC</SelectItem>
                        <SelectItem value="QLD">QLD</SelectItem>
                        <SelectItem value="SA">SA</SelectItem>
                        <SelectItem value="WA">WA</SelectItem>
                        <SelectItem value="TAS">TAS</SelectItem>
                        <SelectItem value="NT">NT</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contractValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Value ($)</FormLabel>
                    <FormControl>
                      {renderInput(field, { placeholder: "Enter contract value" })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="criticalIssue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Critical Issue</FormLabel>
                    <FormControl>
                      {renderInput(field, { placeholder: "Enter critical issue title" })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="criticalIssueDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Critical Issue Description</FormLabel>
                    <FormControl>
                      {renderInput(field, { 
                        placeholder: "Enter a detailed description of the critical issue",
                        isTextarea: true 
                      })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      {renderInput(field, { placeholder: "Enter project name" })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Address</FormLabel>
                    <FormControl>
                      {renderInput(field, { placeholder: "Enter project address" })}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date <span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && 'text-muted-foreground'}`}
                          >
                            {field.value ? field.value : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reminder Settings</CardTitle>
                <CardDescription>Configure how reminders should be sent for this critical date</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="reminderScheduling"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="One Off Event" id="one-off" />
                              <Label htmlFor="one-off">One-Off Event</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Recurring" id="recurring" />
                              <Label htmlFor="recurring">Recurring Event</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="occurrenceFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select 
                            defaultValue={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="Yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="occurrenceStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            {renderInput(field, { placeholder: "DD/MM/YYYY" })}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="reminder1Days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1st Reminder (Days)</FormLabel>
                        <FormControl>
                          {renderInput(field, { type: "number" })}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reminder2Days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>2nd Reminder (Days)</FormLabel>
                        <FormControl>
                          {renderInput(field, { type: "number" })}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reminder3Days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>3rd Reminder (Days)</FormLabel>
                        <FormControl>
                          {renderInput(field, { type: "number" })}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reminder4Days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>4th Reminder (Days)</FormLabel>
                        <FormControl>
                          {renderInput(field, { type: "number" })}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="postTriggerDateReminderDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post-Trigger Reminder (Days)</FormLabel>
                      <FormControl>
                        {renderInput(field, { type: "number" })}
                      </FormControl>
                      <FormDescription>
                        Number of days after the due date to send a follow-up reminder (0 = no reminder)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Notification Recipients</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.watch('emails')?.map((email, index) => (
                      <div key={index} className="bg-primary-100 border border-primary-200 rounded-full px-3 py-1 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span className="text-sm">{email}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveEmail(email)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="emailInput"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            {renderInput(field, { 
                              placeholder: "Enter email address",
                              onChange: (e) => {
                                field.onChange(e);
                                setTempEmail(e.target.value);
                              }
                            })}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddEmail}
                      disabled={!tempEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempEmail)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contract" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
                <CardDescription>Additional information related to the contract</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="agreementType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agreement Type</FormLabel>
                        <Select 
                          defaultValue={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select agreement type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Construction Contract">Construction Contract</SelectItem>
                            <SelectItem value="Development Agreement">Development Agreement</SelectItem>
                            <SelectItem value="Design Agreement">Design Agreement</SelectItem>
                            <SelectItem value="Funding Agreement">Funding Agreement</SelectItem>
                            <SelectItem value="Management Agreement">Management Agreement</SelectItem>
                            <SelectItem value="Services Agreement">Services Agreement</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="agreementDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agreement Date</FormLabel>
                        <FormControl>
                          {renderInput(field, { placeholder: "DD/MM/YYYY" })}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="agreementReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agreement Reference</FormLabel>
                      <FormControl>
                        {renderInput(field, { placeholder: "Enter reference number or identifier" })}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Update' : 'Create'} Critical Date
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CriticalDateForm;