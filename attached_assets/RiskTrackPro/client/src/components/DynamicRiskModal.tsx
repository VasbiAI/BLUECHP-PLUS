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
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
  { value: "In Progress", label: "In Progress" },
  { value: "Eventuated", label: "Eventuated (Convert to Issue)" }
];

// Response type options
const responseTypeOptions = [
  { value: "Accept", label: "Accept" },
  { value: "Transfer", label: "Transfer" },
  { value: "Mitigate", label: "Mitigate" },
  { value: "Avoid", label: "Avoid" }
];

// Risk category options
const riskCategoryOptions = [
  { value: "Construction", label: "Construction" },
  { value: "Site", label: "Site" },
  { value: "Budget", label: "Budget" },
  { value: "Design Construction and Commissioning", label: "Design Construction and Commissioning" },
  { value: "Finance", label: "Finance" },
  { value: "Other", label: "Other" },
  { value: "Changes in Law or Policy", label: "Changes in Law or Policy" }
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
  modalTitle = 'Add Risk to Register'
}: DynamicRiskModalProps) => {
  const [registerType, setRegisterType] = useState<RegisterType>(initialRegisterType);
  const [department, setDepartment] = useState<DepartmentType>(initialDepartment);
  const [fieldConfig, setFieldConfig] = useState(getFieldConfig(registerType, department));
  const [dynamicSchema, setDynamicSchema] = useState(createDynamicSchema(fieldConfig));
  const [selectedRiskCategory, setSelectedRiskCategory] = useState('');

  // Determine if we show cost estimation forms based on field config
  const showCostEstimation = fieldConfig.includeCost?.visible || false;
  
  // Determine if we show schedule impact forms based on field configuration
  const showScheduleImpact = fieldConfig.delayDuration?.visible || 
                            fieldConfig.dayType?.visible || 
                            fieldConfig.optimisticDuration?.visible || 
                            fieldConfig.mostLikelyDuration?.visible || 
                            fieldConfig.pessimisticDuration?.visible || false;

  // Create dynamic form
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      riskId: initialData?.riskId || generateRiskId(),
      openDate: initialData?.openDate || new Date().toLocaleDateString(),
      raisedBy: initialData?.raisedBy || 'BlueCHP',
      ownedBy: initialData?.ownedBy || 'BlueCHP',
      responseOwner: initialData?.responseOwner || 'same_as_owner',
      riskCause: initialData?.riskCause || '',
      riskEvent: initialData?.riskEvent || '',
      riskEffect: initialData?.riskEffect || '',
      riskCategory: initialData?.riskCategory || 'Construction',
      probability: initialData?.probability || 0.5,
      impact: initialData?.impact || 50,
      riskRating: initialData?.riskRating || 25,
      riskStatus: initialData?.riskStatus || 'Open',
      statusChangeDate: initialData?.statusChangeDate || new Date().toLocaleDateString(),
      responseType: initialData?.responseType || 'Accept',
      mitigation: initialData?.mitigation || '',
      prevention: initialData?.prevention || '',
      includeCost: initialData?.includeCost || false,
      dueDate: initialData?.dueDate || '',
      comment: initialData?.comment || '',
      projectId,
      registerType,
      department
    },
  });

  // Watch for risk category changes to determine schedule impact visibility
  const watchedRiskCategory = form.watch('riskCategory');
  useEffect(() => {
    setSelectedRiskCategory(watchedRiskCategory);
  }, [watchedRiskCategory]);

  // Watch for probability and impact changes to calculate risk rating
  const probability = form.watch('probability');
  const impact = form.watch('impact');
  const riskStatus = form.watch('riskStatus');
  
  useEffect(() => {
    const rating = Math.round(probability * impact);
    form.setValue('riskRating', rating);
  }, [probability, impact, form]);
  
  // Update status change date when risk status changes
  useEffect(() => {
    // Only update if initialData exists (editing mode) and status has changed
    if (initialData && initialData.riskStatus !== riskStatus) {
      form.setValue('statusChangeDate', new Date().toLocaleDateString());
    }
  }, [riskStatus, initialData, form]);

  // Handle register type change
  const handleRegisterTypeChange = (type: RegisterType) => {
    setRegisterType(type);
    const newConfig = getFieldConfig(type, department);
    setFieldConfig(newConfig);
    const newSchema = createDynamicSchema(newConfig);
    setDynamicSchema(newSchema);
    form.setValue('registerType', type);
  };

  // Handle department change
  const handleDepartmentChange = (dept: DepartmentType) => {
    setDepartment(dept);
    const newConfig = getFieldConfig(registerType, dept);
    setFieldConfig(newConfig);
    const newSchema = createDynamicSchema(newConfig);
    setDynamicSchema(newSchema);
    form.setValue('department', dept);
  };

  // Generate risk ID
  function generateRiskId() {
    const existingIds = risks.map(risk => risk.riskId)
      .filter(id => id.startsWith('R -'))
      .map(id => {
        const match = id.match(/R - (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `R - ${maxId + 1}`;
  }

  // Handle form submission
  const onSubmit = (data: z.infer<typeof dynamicSchema>) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <TabsTrigger value="cost-estimation" disabled={!showCostEstimation}>Cost Estimation</TabsTrigger>
                  <TabsTrigger value="schedule-impact">Schedule Impact</TabsTrigger>
                  <TabsTrigger value="critical-dates">Critical Dates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="risk-details" className="p-4">
                  <div className="space-y-8 py-2">
                    {/* Basic Details Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Column */}
                        <div className="space-y-4">
                          {fieldConfig.riskId.visible && (
                            <DynamicFormField 
                              name="riskId"
                              config={fieldConfig.riskId}
                              form={form}
                            />
                          )}
                          
                          {fieldConfig.openDate.visible && (
                            <DynamicFormField 
                              name="openDate"
                              config={fieldConfig.openDate}
                              form={form}
                            />
                          )}
                          
                          {fieldConfig.raisedBy.visible && (
                            <DynamicFormField 
                              name="raisedBy"
                              config={fieldConfig.raisedBy}
                              form={form}
                            />
                          )}
                          
                          {fieldConfig.ownedBy.visible && (
                            <DynamicFormField 
                              name="ownedBy"
                              config={fieldConfig.ownedBy}
                              form={form}
                              type="select"
                              selectOptions={[
                                { value: "BlueCHP", label: "BlueCHP" },
                                { value: "Developer", label: "Developer" }
                              ]}
                            />
                          )}
                          
                          {fieldConfig.responseOwner.visible && (
                            <DynamicFormField 
                              name="responseOwner"
                              config={fieldConfig.responseOwner}
                              form={form}
                              type="select"
                              selectOptions={[
                                { value: "same_as_owner", label: "Same as Owner" },
                                { value: "BlueCHP", label: "BlueCHP" },
                                { value: "Developer", label: "Developer" },
                                { value: "Contractor", label: "Contractor" },
                                { value: "Consultant", label: "Consultant" }
                              ]}
                            />
                          )}
                        </div>
                        
                        {/* Second Column */}
                        <div className="space-y-4">
                          {fieldConfig.riskCategory.visible && (
                            <DynamicFormField 
                              name="riskCategory"
                              config={fieldConfig.riskCategory}
                              form={form}
                              type="select"
                              selectOptions={riskCategoryOptions}
                            />
                          )}
                          
                          {fieldConfig.probability.visible && (
                            <DynamicFormField 
                              name="probability"
                              config={fieldConfig.probability}
                              form={form}
                              type="number"
                            />
                          )}
                          
                          {fieldConfig.impact.visible && (
                            <DynamicFormField 
                              name="impact"
                              config={fieldConfig.impact}
                              form={form}
                              type="number"
                            />
                          )}
                          
                          {fieldConfig.riskRating.visible && (
                            <DynamicFormField 
                              name="riskRating"
                              config={fieldConfig.riskRating}
                              form={form}
                              type="number"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Risk Description Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Risk Description</h3>
                      <div className="space-y-4">
                        {fieldConfig.riskCause.visible && (
                          <DynamicFormField 
                            name="riskCause"
                            config={fieldConfig.riskCause}
                            form={form}
                          />
                        )}
                        
                        {fieldConfig.riskEvent.visible && (
                          <DynamicFormField 
                            name="riskEvent"
                            config={fieldConfig.riskEvent}
                            form={form}
                          />
                        )}
                        
                        {fieldConfig.riskEffect.visible && (
                          <DynamicFormField 
                            name="riskEffect"
                            config={fieldConfig.riskEffect}
                            form={form}
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Response Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Response</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First column - Risk response fields */}
                        <div className="space-y-4">
                          {fieldConfig.responseType.visible && (
                            <DynamicFormField 
                              name="responseType"
                              config={fieldConfig.responseType}
                              form={form}
                              type="select"
                              selectOptions={responseTypeOptions}
                            />
                          )}
                          
                          {fieldConfig.riskStatus.visible && (
                            <DynamicFormField 
                              name="riskStatus"
                              config={fieldConfig.riskStatus}
                              form={form}
                              type="select"
                              selectOptions={riskStatusOptions}
                            />
                          )}
                          
                          {fieldConfig.statusChangeDate?.visible && (
                            <DynamicFormField 
                              name="statusChangeDate"
                              config={fieldConfig.statusChangeDate}
                              form={form}
                              type="date"
                            />
                          )}
                        </div>
                        
                        {/* Second column - Mitigation and prevention fields */}
                        <div className="space-y-4">
                          {fieldConfig.mitigation?.visible && (
                            <DynamicFormField 
                              name="mitigation"
                              config={fieldConfig.mitigation}
                              form={form}
                            />
                          )}
                          
                          {fieldConfig.prevention?.visible && (
                            <DynamicFormField 
                              name="prevention"
                              config={fieldConfig.prevention}
                              form={form}
                            />
                          )}
                          
                          {fieldConfig.dueDate?.visible && (
                            <DynamicFormField 
                              name="dueDate"
                              config={fieldConfig.dueDate}
                              form={form}
                              type="date"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="cost-estimation" className="p-4">
                  {showCostEstimation ? (
                    <CostEstimationForm 
                      watchIncludeCost={form.watch('includeCost')} 
                      showAllocationModel={fieldConfig.costAllocationModel?.visible}
                    />
                  ) : (
                    <div className="text-center py-6 text-neutral-400">
                      Cost estimation is not available for this risk type
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="schedule-impact" className="p-4">
                  {/* Always show the schedule impact form but with a warning if needed */}
                  <ScheduleImpactForm 
                    category={selectedRiskCategory} 
                  />
                </TabsContent>
                
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
                {isSubmitting ? "Saving..." : (initialData ? "Update Risk" : "Add Risk")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DynamicRiskModal;