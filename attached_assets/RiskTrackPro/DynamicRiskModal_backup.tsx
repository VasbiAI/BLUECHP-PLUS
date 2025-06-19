import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Risk } from '@shared/schema';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import RegisterSelection from './RegisterSelection';
import { DepartmentType, RegisterType, createDynamicSchema, getFieldConfig } from '@/config/fieldVisibility';
import DynamicFormField from './DynamicFormField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CostEstimationForm from './CostEstimationForm';
import ScheduleImpactForm from './ScheduleImpactForm';
import CriticalDateLinkForm from './CriticalDateLinkForm';

interface DynamicRiskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  isSubmitting: boolean;
  projectId: number;
  risks: Risk[];
  initialData?: Risk;
  initialRegisterType?: RegisterType;
  initialDepartment?: DepartmentType;
  modalTitle?: string;
}

// Risk status options
const riskStatusOptions = [
  { value: 'Open', label: 'Open' },
  { value: 'Mitigated', label: 'Mitigated' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Transferred', label: 'Transferred' },
  { value: 'Eventuated', label: 'Eventuated' }
];

// Response type options
const responseTypeOptions = [
  { value: 'Avoid', label: 'Avoid' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Mitigate', label: 'Mitigate' },
  { value: 'Accept', label: 'Accept' }
];

// Risk category options
const riskCategoryOptions = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Financial', label: 'Financial' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Operational', label: 'Operational' },
  { value: 'Environmental', label: 'Environmental' },
  { value: 'Other', label: 'Other' }
];

const DynamicRiskModal = ({ 
  open, 
  onClose, 
  onSave, 
  isSubmitting, 
  projectId, 
  risks,
  initialData,
  initialRegisterType = 'default',
  initialDepartment = 'default',
  modalTitle = 'Add New Risk'
}: DynamicRiskModalProps) => {
  // State for register type and department
  const [registerType, setRegisterType] = useState<RegisterType>(initialRegisterType);
  const [department, setDepartment] = useState<DepartmentType>(initialDepartment);
  
  // Track the selected risk category for showing/hiding schedule impact fields
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<string>(initialData?.riskCategory || '');
  
  // Get field configuration based on current selections
  const fieldConfig = getFieldConfig(registerType, department);
  
  // Create dynamic schema based on field configuration
  const formSchema = createDynamicSchema(fieldConfig);
  
  // Prepare default values
  const getDefaultValues = () => {
    if (initialData) {
      return initialData;
    }
    
    return {
      projectId,
      priorityRank: risks.length + 1,
      riskId: `R - ${risks.length + 1}`,
      openDate: new Date().toLocaleDateString('en-CA'),
      raisedBy: '',
      ownedBy: '',
      riskCause: '',
      riskEvent: '',
      riskEffect: '',
      riskCategory: '',
      probability: 0,
      impact: 0,
      riskRating: 0,
      riskStatus: 'Open',
      responseType: 'Mitigate',
      mitigation: '',
      prevention: '',
      comment: '',
      registerType,
      department,
      
      // Cost estimation defaults
      includeCost: false,
      optimisticCost: 0,
      mostLikelyCost: 0,
      pessimisticCost: 0,
      expectedCost: 0,
      emv: 0,
      costAllocationModel: 'internal',
      contractDetails: '',
      
      // Schedule impact defaults
      delayDuration: 0,
      delayClassification: '',
      criticalPathImpact: false,
      floatConsumption: 0,
      
      // Critical date defaults
      criticalDateId: undefined
    };
  };
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });
  
  // Update schema when register type or department changes
  const handleRegisterTypeChange = (type: RegisterType) => {
    setRegisterType(type);
    // You may want to reset some fields here
  };
  
  const handleDepartmentChange = (dept: DepartmentType) => {
    setDepartment(dept);
    // You may want to reset some fields here
  };
  
  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Add the register type and department to the data
    const submissionData = {
      ...data,
      registerType,
      department
    };
    onSave(submissionData);
  };
  
  // Calculate risk rating when probability or impact changes
  const calculateRiskRating = () => {
    const probability = form.watch('probability') || 0;
    const impact = form.watch('impact') || 0;
    const riskRating = probability * impact;
    
    form.setValue('riskRating', riskRating);
  };
  
  // Watch for changes to probability and impact to update risk rating
  form.watch(() => {
    calculateRiskRating();
  });
  
  // Watch for risk category changes
  const riskCategory = form.watch('riskCategory');
  
  // Update selected risk category when form field changes
  useEffect(() => {
    if (riskCategory) {
      setSelectedRiskCategory(riskCategory);
    }
  }, [riskCategory]);
  
  // Check if the tabs should be shown
  const showCostEstimation = fieldConfig.includeCost?.visible;
  const showScheduleImpact = registerType === 'construction' || selectedRiskCategory?.toLowerCase() === 'construction';
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {/* Register Type and Department Selection */}
            <RegisterSelection
              registerType={registerType}
              department={department}
              onRegisterTypeChange={handleRegisterTypeChange}
              onDepartmentChange={handleDepartmentChange}
              form={form}
            />
            
            {/* Tabbed interface for main content */}
            <div className="border rounded-md shadow-sm">
              <Tabs defaultValue="risk-details" className="w-full">
                <TabsList className="w-full justify-start rounded-t-md rounded-b-none border-b bg-muted/50">
                  <TabsTrigger value="risk-details">Risk Details</TabsTrigger>
                  {showCostEstimation && (
                    <TabsTrigger value="cost-estimation">Cost Estimation</TabsTrigger>
                  )}
                  {showScheduleImpact && (
                    <TabsTrigger value="schedule-impact">Schedule Impact</TabsTrigger>
                  )}
                  <TabsTrigger value="critical-dates">Critical Dates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="risk-details" className="p-4">
                  <div className="space-y-8 py-2">
                    {/* Basic Details Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Details</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <DynamicFormField
                          name="priorityRank"
                          config={fieldConfig.priorityRank}
                          form={form}
                          type="number"
                        />
                        
                        <DynamicFormField
                          name="riskId"
                          config={fieldConfig.riskId}
                          form={form}
                          type="text"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <DynamicFormField
                          name="openDate"
                          config={fieldConfig.openDate}
                          form={form}
                          type="date"
                        />
                        
                        <DynamicFormField
                          name="dueDate"
                          config={fieldConfig.dueDate}
                          form={form}
                          type="date"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <DynamicFormField
                          name="raisedBy"
                          config={fieldConfig.raisedBy}
                          form={form}
                          type="text"
                        />
                        
                        <DynamicFormField
                          name="ownedBy"
                          config={fieldConfig.ownedBy}
                          form={form}
                          type="text"
                        />
                      </div>
                    </div>
                    
                    {/* Risk Description Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Risk Description</h3>
                      <DynamicFormField
                        name="riskCause"
                        config={fieldConfig.riskCause}
                        form={form}
                        type="textarea"
                      />
                      
                      <DynamicFormField
                        name="riskEvent"
                        config={fieldConfig.riskEvent}
                        form={form}
                        type="textarea"
                      />
                      
                      <DynamicFormField
                        name="riskEffect"
                        config={fieldConfig.riskEffect}
                        form={form}
                        type="textarea"
                      />
                      
                      <DynamicFormField
                        name="riskCategory"
                        config={fieldConfig.riskCategory}
                        form={form}
                        type="select"
                        selectOptions={riskCategoryOptions}
                      />
                    </div>
                    
                    {/* Risk Assessment Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Risk Assessment</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <DynamicFormField
                          name="probability"
                          config={fieldConfig.probability}
                          form={form}
                          type="number"
                        />
                        
                        <DynamicFormField
                          name="impact"
                          config={fieldConfig.impact}
                          form={form}
                          type="number"
                        />
                        
                        <DynamicFormField
                          name="riskRating"
                          config={fieldConfig.riskRating}
                          form={form}
                          type="number"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <DynamicFormField
                          name="riskStatus"
                          config={fieldConfig.riskStatus}
                          form={form}
                          type="select"
                          selectOptions={riskStatusOptions}
                        />
                        
                        <DynamicFormField
                          name="responseType"
                          config={fieldConfig.responseType}
                          form={form}
                          type="select"
                          selectOptions={responseTypeOptions}
                        />
                      </div>
                    </div>
                    
                    {/* Response Plan Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Response Plan</h3>
                      <DynamicFormField
                        name="mitigation"
                        config={fieldConfig.mitigation}
                        form={form}
                        type="textarea"
                      />
                      
                      <DynamicFormField
                        name="contingency"
                        config={fieldConfig.contingency}
                        form={form}
                        type="textarea"
                      />
                      
                      <div className="grid grid-cols-2 gap-6">
                        <DynamicFormField
                          name="actionBy"
                          config={fieldConfig.actionBy}
                          form={form}
                          type="text"
                        />
                      </div>
                      
                      <DynamicFormField
                        name="comment"
                        config={fieldConfig.comment}
                        form={form}
                        type="textarea"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {showCostEstimation && (
                  <TabsContent value="cost-estimation" className="p-4">
                    <CostEstimationForm 
                      watchIncludeCost={form.watch('includeCost')} 
                      showAllocationModel={fieldConfig.costAllocationModel?.visible}
                    />
                  </TabsContent>
                )}
                
                {showScheduleImpact && (
                  <TabsContent value="schedule-impact" className="p-4">
                    <ScheduleImpactForm 
                      category={selectedRiskCategory} 
                    />
                  </TabsContent>
                )}
                
                <TabsContent value="critical-dates" className="p-4">
                  <CriticalDateLinkForm 
                    projectId={projectId} 
                  />
                </TabsContent>
              </Tabs>
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
                {isSubmitting ? "Saving..." : "Save Risk"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DynamicRiskModal;