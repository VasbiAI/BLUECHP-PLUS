import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { z } from 'zod';
import { insertCriticalDateSchema, type CriticalDate } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { DocumentsTab } from '@/components/DocumentsTab';

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
import { Badge } from '@/components/ui/badge';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Trash2,
  User,
  Users,
  Building,
  MapPin,
  FileText,
  Mail,
  Plus,
  X
} from 'lucide-react';

// Extended schema with validations
const formSchema = insertCriticalDateSchema.extend({
  emailInput: z.string().email("Invalid email format").optional().or(z.literal('')),
  hasRelatedClause: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EnhancedCriticalDateFormProps {
  initialData?: Partial<CriticalDate>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEdit?: boolean;
  readOnlyMode?: boolean;
}

// Company entities options
const COMPANY_ENTITIES = [
  "BlueCHP Limited",
  "BlueCHPQ Limited",
  "BCHP Epping Pty Ltd",
  "BlueCHP Victoria Ltd"
];

// Department options
const DEPARTMENTS = [
  "Finance",
  "Development",
  "Board",
  "Governance",
  "Asset and Tenancy",
  "Other"
];

// State options
const STATES = ["NSW", "QLD", "VIC", "SA", "TAS", "NT", "WA"];

// Critical issue types
const CRITICAL_ISSUES = [
  "Licence Renewal",
  "Insurance Renewal",
  "Board Approval",
  "Significant Contract",
  "Other"
];

// Agreement types
const AGREEMENT_TYPES = [
  "Land Contract",
  "Construction Works Contract",
  "Development Agreement",
  "Funding Agreement",
  "Insurance Policy",
  "Licence",
  "Service Agreement",
  "Other"
];

// Reminder frequency options
const OCCURRENCE_FREQUENCIES = [
  "Daily",
  "Weekly",
  "Monthly", 
  "Bi-Monthly",
  "Quarterly",
  "Bi-Annual",
  "Annually"
];

// Team members for responsible person selection
const TEAM_MEMBERS = [
  "Charles Northcote",
  "James Paver",
  "Caroline Beattie",
  "Mark Highfield",
  "Robert Hermann",
  "John George",
  "Other"
];

// Managers
const MANAGERS = [
  "Charles Northcote",
  "James Paver",
  "Mark Highfield",
  "Robert Hermann"
];

const EnhancedCriticalDateForm: React.FC<EnhancedCriticalDateFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isEdit = false,
  readOnlyMode = false,
}) => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDueDate, setSelectedDueDate] = useState<Date | undefined>(undefined);
  const [selectedTab, setSelectedTab] = useState('general');
  const [tempEmail, setTempEmail] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    }
  });

  // Helper function to safely get values from initialData
  const getInitialValue = <T extends keyof CriticalDate>(
    field: T, 
    defaultValue: CriticalDate[T] | string | number | string[] | undefined | boolean | null
  ): CriticalDate[T] | string | number | string[] | boolean | null => {
    if (initialData && field in initialData && initialData[field] !== undefined) {
      return initialData[field] as CriticalDate[T];
    }
    return defaultValue as any;
  };
  
  // Function to handle document analysis results and update form
  const handleAnalysisData = (data: any) => {
    console.log('Document analysis results:', data);
    setAnalysisData(data);
    
    if (!data || !data.extractedFields) return;
    
    const extractedFields = data.extractedFields;
    
    // Update form with extracted data from contract
    const formUpdates: any = {};
    
    // Map extracted fields to form fields
    if (extractedFields.title) formUpdates.title = extractedFields.title;
    
    // Handle contract value
    if (extractedFields.contractValue) {
      const contractValue = parseFloat(extractedFields.contractValue.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(contractValue)) {
        formUpdates.contractValue = contractValue;
      }
    }
    
    // Handle extracted text fields
    if (extractedFields.agreementType) formUpdates.agreementType = extractedFields.agreementType;
    if (extractedFields.entity) formUpdates.entity = extractedFields.entity;
    if (extractedFields.department) formUpdates.department = extractedFields.department;
    if (extractedFields.description) formUpdates.description = extractedFields.description;
    
    // Handle appropriate responsible person from team members
    if (extractedFields.responsiblePerson) {
      // If it's one of our team members, use it
      const matchedTeamMember = TEAM_MEMBERS.find(member => 
        member.toLowerCase().includes(extractedFields.responsiblePerson.toLowerCase())
      );
      formUpdates.responsiblePerson = matchedTeamMember || extractedFields.responsiblePerson;
    }
    
    // Handle date fields (with proper conversion to Date objects)
    if (extractedFields.contractStartDate) {
      try {
        const date = new Date(extractedFields.contractStartDate);
        if (!isNaN(date.getTime())) { // Valid date check
          formUpdates.contractStartDate = date;
        }
      } catch (error) {
        console.error('Invalid date format for contractStartDate:', error);
      }
    }
    
    if (extractedFields.dueDate) {
      try {
        const date = new Date(extractedFields.dueDate);
        if (!isNaN(date.getTime())) { // Valid date check
          formUpdates.dueDate = date;
          setSelectedDueDate(date);
        }
      } catch (error) {
        console.error('Invalid date format for dueDate:', error);
      }
    }
    
    // Handle contract terms
    if (extractedFields.termsDescription) formUpdates.termsDescription = extractedFields.termsDescription;
    if (extractedFields.termsClause) formUpdates.termsClause = extractedFields.termsClause;
    
    console.log('Updating form with extracted data:', formUpdates);
    
    // Update the form with the extracted data
    const currentValues = form.getValues();
    form.reset({
      ...currentValues,
      ...formUpdates
    });
    
    // Switch to the General tab to show the populated fields
    setSelectedTab('general');
    
    toast({
      title: "Form pre-populated",
      description: "The form has been pre-populated with data extracted from the document.",
    });
  };

  // Initialize form with default values or initial data
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: getInitialValue('title', '') as string,
      status: getInitialValue('status', 'Open') as string,
      
      // Company/Entity Information
      entity: getInitialValue('entity', '') as string,
      department: getInitialValue('department', '') as string,
      state: getInitialValue('state', '') as string,
      
      // Contract Information
      contractValue: getInitialValue('contractValue', null) as number | null,
      criticalIssue: getInitialValue('criticalIssue', '') as string,
      criticalIssueDescription: getInitialValue('criticalIssueDescription', '') as string,
      calendarOrBusinessDay: getInitialValue('calendarOrBusinessDay', 'Calendar') as string,
      
      // Project Information
      criticalDateReminderType: getInitialValue('criticalDateReminderType', 'Project') as string,
      projectName: getInitialValue('projectName', '') as string,
      projectAddress: getInitialValue('projectAddress', '') as string,
      projectId: getInitialValue('projectId', null) as number | null,
      
      // Agreement Information
      agreementType: getInitialValue('agreementType', '') as string,
      agreementDate: getInitialValue('agreementDate', null) as string | null,
      agreementReference: getInitialValue('agreementReference', '') as string,
      
      // Date Information
      dueDate: getInitialValue('dueDate', '') as string,
      reminderScheduling: getInitialValue('reminderScheduling', 'One Off Event') as string,
      occurrenceFrequency: getInitialValue('occurrenceFrequency', '') as string,
      occurrenceStartDate: getInitialValue('occurrenceStartDate', null) as string | null,
      
      // Reminder Settings
      firstReminderDaysBeforeDueDate: getInitialValue('firstReminderDaysBeforeDueDate', 14) as number | null,
      secondReminderDaysBeforeDueDate: getInitialValue('secondReminderDaysBeforeDueDate', 7) as number | null,
      thirdReminderDaysBeforeDueDate: getInitialValue('thirdReminderDaysBeforeDueDate', 3) as number | null,
      fourthReminderDaysBeforeDueDate: getInitialValue('fourthReminderDaysBeforeDueDate', 1) as number | null,
      postTriggerReminderDaysAfterDueDate: getInitialValue('postTriggerReminderDaysAfterDueDate', 0) as number | null,
      
      // Related Clause Information
      hasRelatedClause: getInitialValue('hasRelatedClause', false) as boolean,
      relatedClauseAndContractDetails: getInitialValue('relatedClauseAndContractDetails', '') as string,
      relatedClauseAction: getInitialValue('relatedClauseAction', '') as string,
      relatedAgreementType: getInitialValue('relatedAgreementType', '') as string,
      relatedAgreementDate: getInitialValue('relatedAgreementDate', null) as string | null,
      
      // Responsible Parties
      blueCHPResponsiblePerson: getInitialValue('blueCHPResponsiblePerson', '') as string,
      blueCHPManager: getInitialValue('blueCHPManager', '') as string,
      externalResponsiblePartyEmail: getInitialValue('externalResponsiblePartyEmail', '') as string,
      
      // Email notifications
      emails: getInitialValue('emails', []) as string[],
      emailInput: '',
    },
  });

  // Watch values for conditional display
  const reminderScheduling = form.watch('reminderScheduling');
  const criticalIssue = form.watch('criticalIssue');
  const criticalDateReminderType = form.watch('criticalDateReminderType');
  const hasRelatedClause = form.watch('hasRelatedClause');
  
  // Set selected date if initialData has dueDate
  useEffect(() => {
    if (initialData?.dueDate) {
      try {
        const parsedDate = new Date(initialData.dueDate);
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDueDate(parsedDate);
        }
      } catch (error) {
        console.error("Failed to parse due date:", error);
      }
    }
  }, [initialData]);

  // Handle due date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDueDate(date);
    if (date) {
      form.setValue('dueDate', date.toISOString());
    } else {
      form.setValue('dueDate', '');
    }
  };

  // Handle agreement date selection
  const handleAgreementDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('agreementDate', date.toISOString());
    } else {
      form.setValue('agreementDate', null);
    }
  };

  // Handle related agreement date selection
  const handleRelatedAgreementDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('relatedAgreementDate', date.toISOString());
    } else {
      form.setValue('relatedAgreementDate', null);
    }
  };

  // Handle occurrence start date selection
  const handleOccurrenceStartDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('occurrenceStartDate', date.toISOString());
    } else {
      form.setValue('occurrenceStartDate', null);
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

  // Calculate reminder dates based on due date
  const getReminderDatePreview = (days: number | null): string => {
    if (!selectedDueDate || days === null) return "N/A";
    
    try {
      const daysValue = Number(days);
      if (isNaN(daysValue)) return "N/A";
      
      const reminderDate = addDays(selectedDueDate, -daysValue);
      return format(reminderDate, 'dd MMM yyyy');
    } catch (error) {
      return "N/A";
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    // If in read-only mode, don't submit the form
    if (readOnlyMode) {
      if (onCancel) {
        onCancel();
      }
      return;
    }
    
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
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="general">General Details</TabsTrigger>
            <TabsTrigger value="project">Project & Agreement</TabsTrigger>
            <TabsTrigger value="reminders">Reminders & Scheduling</TabsTrigger>
            <TabsTrigger value="clauses">Related Clauses & People</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          {/* GENERAL DETAILS TAB */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter critical date title" 
                        {...field} 
                        value={field.value || ''}
                      />
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
                      value={field.value || ''} 
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
                        <SelectItem value="Completed">Completed</SelectItem>
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
                    <FormLabel>Company Entity</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company entity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPANY_ENTITIES.map(entity => (
                          <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Department</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
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
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
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
                      <Input 
                        type="number" 
                        placeholder="Enter contract value"
                        {...field}
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="criticalIssue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Critical Issue Type</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select critical issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRITICAL_ISSUES.map(issue => (
                          <SelectItem key={issue} value={issue}>{issue}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="calendarOrBusinessDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Calculation Method</FormLabel>
                    <Select 
                      value={field.value || 'Calendar'} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select calculation method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Calendar">Calendar Days</SelectItem>
                        <SelectItem value="Business">Business Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {criticalIssue === 'Other' && (
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="criticalIssueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Critical Issue Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe the critical issue"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                            className={`w-full pl-3 text-left font-normal ${!selectedDueDate ? "text-muted-foreground" : ""}`}
                          >
                            {selectedDueDate ? (
                              format(selectedDueDate, "PPP")
                            ) : (
                              <span>Select due date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDueDate}
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
          
          {/* PROJECT & AGREEMENT TAB */}
          <TabsContent value="project" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="criticalDateReminderType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Critical Date Type</FormLabel>
                    <Select 
                      value={field.value || 'Project'} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {criticalDateReminderType === 'Project' && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select 
                        value={field.value?.toString() || ''} 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects?.map((project: any) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {criticalDateReminderType === 'Project' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter project name" 
                          {...field} 
                          value={field.value || ''}
                        />
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
                        <Input 
                          placeholder="Enter project address" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="agreementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement Type</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agreement type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGREEMENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Agreement Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Select agreement date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={handleAgreementDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="agreementReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreement Reference</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter agreement reference number or identifier" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* REMINDERS & SCHEDULING TAB */}
          <TabsContent value="reminders" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reminderScheduling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Scheduling</FormLabel>
                    <Select 
                      value={field.value || 'One Off Event'} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reminder type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="One Off Event">One Off Event</SelectItem>
                        <SelectItem value="Ongoing / Series of Events">Ongoing / Series of Events</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {reminderScheduling === 'Ongoing / Series of Events' && (
                <FormField
                  control={form.control}
                  name="occurrenceFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occurrence Frequency</FormLabel>
                      <Select 
                        value={field.value || ''} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {OCCURRENCE_FREQUENCIES.map(freq => (
                            <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {reminderScheduling === 'Ongoing / Series of Events' && (
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="occurrenceStartDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Occurrence Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Select start date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={handleOccurrenceStartDateSelect}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-4 border rounded-md p-4 bg-gray-50">
              <h3 className="text-md font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Reminder Days
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstReminderDaysBeforeDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First reminder (days before)</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            type="number" 
                            placeholder="Days before due date"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                          {selectedDueDate && field.value !== null && (
                            <Badge variant="outline" className="whitespace-nowrap">
                              {getReminderDatePreview(field.value)}
                            </Badge>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="secondReminderDaysBeforeDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Second reminder (days before)</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            type="number" 
                            placeholder="Days before due date"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                          {selectedDueDate && field.value !== null && (
                            <Badge variant="outline" className="whitespace-nowrap">
                              {getReminderDatePreview(field.value)}
                            </Badge>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="thirdReminderDaysBeforeDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Third reminder (days before)</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            type="number" 
                            placeholder="Days before due date"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                          {selectedDueDate && field.value !== null && (
                            <Badge variant="outline" className="whitespace-nowrap">
                              {getReminderDatePreview(field.value)}
                            </Badge>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fourthReminderDaysBeforeDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fourth reminder (days before)</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            type="number" 
                            placeholder="Days before due date"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                          {selectedDueDate && field.value !== null && (
                            <Badge variant="outline" className="whitespace-nowrap">
                              {getReminderDatePreview(field.value)}
                            </Badge>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="postTriggerReminderDaysAfterDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post-trigger reminder (days after)</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            type="number" 
                            placeholder="Days after due date"
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                          {selectedDueDate && field.value !== null && field.value > 0 && (
                            <Badge variant="outline" className="whitespace-nowrap">
                              {format(addDays(selectedDueDate, field.value), 'dd MMM yyyy')}
                            </Badge>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 border rounded-md p-4 bg-gray-50">
              <h3 className="text-md font-medium flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email Notifications
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="emailInput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add Email Recipient</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input 
                            placeholder="Enter email address" 
                            {...field}
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setTempEmail(e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddEmail();
                              }
                            }}
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleAddEmail}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div>
                  <FormLabel>Email Recipients</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('emails')?.map((email, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1">
                        {email}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="ml-1 h-4 w-4 p-0" 
                          onClick={() => handleRemoveEmail(email)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {(!form.watch('emails') || form.watch('emails').length === 0) && (
                      <div className="text-sm text-muted-foreground">No recipients added</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* RELATED CLAUSES & PEOPLE TAB */}
          <TabsContent value="clauses" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="hasRelatedClause"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This critical date has related contract clause</FormLabel>
                      <FormDescription>
                        Enable this if there is a specific clause in an agreement related to this critical date.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {hasRelatedClause && (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="relatedClauseAndContractDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Clause and Contract Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter details about the related contract clause"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="relatedClauseAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Clause Action</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the required action for this clause"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="relatedAgreementType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Agreement Type</FormLabel>
                        <Select 
                          value={field.value || ''} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select agreement type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGREEMENT_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="relatedAgreementDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Related Agreement Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Select agreement date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={handleRelatedAgreementDateSelect}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <h3 className="text-md font-medium mt-4">Responsible Parties</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="blueCHPResponsiblePerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BlueCHP Responsible Person</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select responsible person" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEAM_MEMBERS.map(person => (
                          <SelectItem key={person} value={person}>{person}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="blueCHPManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BlueCHP Manager</FormLabel>
                    <Select 
                      value={field.value || ''} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MANAGERS.map(manager => (
                          <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="externalResponsiblePartyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Responsible Party Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email address of external responsible party" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Email address of external consultant, lawyer, or other party responsible for this critical date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="space-y-4">
            <DocumentsTab 
              criticalDateId={initialData?.id}
              readOnlyMode={readOnlyMode}
              onAnalysisComplete={handleAnalysisData}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
            >
              {readOnlyMode ? 'Back' : 'Cancel'}
            </Button>
          )}
          {!readOnlyMode && (
            <Button type="submit">
              {isEdit ? 'Update Critical Date' : 'Create Critical Date'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};

export default EnhancedCriticalDateForm;