import { z } from 'zod';

// Define the structure of field visibility configuration
export type FieldVisibilityConfig = {
  label: string;
  visible: boolean;
  required: boolean;
};

export type FormFieldsConfig = {
  [fieldName: string]: FieldVisibilityConfig;
};

// Define different register types
export type RegisterType = 'development' | 'construction' | 'financial' | 'operational' | 'default';
export type DepartmentType = 'development' | 'finance' | 'construction' | 'operations' | 'default';

// Define the main configuration structure
export type FieldVisibilityConfigs = {
  [key in RegisterType]: {
    [dept in DepartmentType]?: FormFieldsConfig;
  };
};

// Default configuration - all fields visible and required
const defaultFieldConfig: FormFieldsConfig = {
  priorityRank: { label: 'Priority Rank', visible: true, required: true },
  riskId: { label: 'Risk ID', visible: true, required: true },
  raisedBy: { label: 'Raised By', visible: true, required: true },
  ownedBy: { label: 'Owned By', visible: true, required: true },
  responseOwner: { label: 'Response Owner', visible: true, required: false },
  openDate: { label: 'Open Date', visible: true, required: true },
  riskCause: { label: 'Risk Cause', visible: true, required: true },
  riskEvent: { label: 'Risk Event', visible: true, required: true },
  riskEffect: { label: 'Risk Effect', visible: true, required: true },
  riskCategory: { label: 'Risk Category', visible: true, required: true },
  probability: { label: 'Probability', visible: true, required: true },
  impact: { label: 'Impact', visible: true, required: true },
  riskRating: { label: 'Risk Rating', visible: true, required: true },
  riskStatus: { label: 'Status', visible: true, required: true },
  statusChangeDate: { label: 'Status Change Date', visible: true, required: false },
  responseType: { label: 'Response Type', visible: true, required: true },
  mitigation: { label: 'Mitigation', visible: true, required: true },
  contingency: { label: 'Contingency', visible: true, required: true },
  actionBy: { label: 'Action By', visible: true, required: false },
  dueDate: { label: 'Due Date', visible: true, required: false },
  comment: { label: 'Comments', visible: true, required: false },
  
  // Critical Date Link
  criticalDateId: { label: 'Link to Critical Date', visible: true, required: false },
  
  // Cost estimation fields
  includeCost: { label: 'Include Cost Estimation', visible: true, required: false },
  optimisticCost: { label: 'Optimistic Cost (O)', visible: false, required: false },
  mostLikelyCost: { label: 'Most Likely Cost (M)', visible: false, required: false },
  pessimisticCost: { label: 'Pessimistic Cost (P)', visible: false, required: false },
  expectedCost: { label: 'Expected Cost', visible: false, required: false },
  emv: { label: 'Expected Monetary Value', visible: false, required: false },
  
  // Contract allocation
  costAllocationModel: { label: 'Cost Allocation Model', visible: false, required: false },
  contractDetails: { label: 'Contract Details', visible: false, required: false },
  
  // PERT schedule estimation fields
  dayType: { label: 'Day Type (Calendar/Business)', visible: false, required: false },
  optimisticDuration: { label: 'Optimistic Duration (O)', visible: false, required: false },
  mostLikelyDuration: { label: 'Most Likely Duration (M)', visible: false, required: false },
  pessimisticDuration: { label: 'Pessimistic Duration (P)', visible: false, required: false },
  expectedDuration: { label: 'Expected Duration (PERT)', visible: false, required: false },
  calculatedBusinessDays: { label: 'Equivalent Business Days', visible: false, required: false },
  calculatedCalendarDays: { label: 'Equivalent Calendar Days', visible: false, required: false },
  probabilityAdjustedDuration: { label: 'Probability-Adjusted Duration', visible: false, required: false },
  
  // Construction schedule impact
  delayDuration: { label: 'Delay Duration (days)', visible: false, required: false },
  delayClassification: { label: 'Delay Classification', visible: false, required: false },
  criticalPathImpact: { label: 'Critical Path Impact', visible: false, required: false },
  floatConsumption: { label: 'Float Consumption (days)', visible: false, required: false },
  
  // Residual risk tracking
  initialRiskRating: { label: 'Initial Risk Rating', visible: true, required: false },
  residualRiskRating: { label: 'Residual Risk Rating', visible: true, required: false },
};

// Configuration for development register
const developmentConfig: FormFieldsConfig = {
  ...defaultFieldConfig,
  // Override specific fields for development
  dueDate: { label: 'Target Resolution Date', visible: true, required: true },
  contingency: { label: 'Contingency Plan', visible: true, required: false },
  riskCategory: { label: 'Development Risk Type', visible: true, required: true },
};

// Configuration for construction register
const constructionConfig: FormFieldsConfig = {
  ...defaultFieldConfig,
  // Override specific fields for construction
  riskCategory: { label: 'Construction Risk Type', visible: true, required: true },
  actionBy: { label: 'Responsible Party', visible: true, required: true },
  dueDate: { label: 'Review Date', visible: true, required: true },
  
  // PERT schedule estimation fields visible for construction
  dayType: { label: 'Day Type (Calendar/Business)', visible: true, required: false },
  optimisticDuration: { label: 'Optimistic Duration (O)', visible: true, required: false },
  mostLikelyDuration: { label: 'Most Likely Duration (M)', visible: true, required: false },
  pessimisticDuration: { label: 'Pessimistic Duration (P)', visible: true, required: false },
  expectedDuration: { label: 'Expected Duration (PERT)', visible: true, required: false },
  calculatedBusinessDays: { label: 'Equivalent Business Days', visible: true, required: false },
  calculatedCalendarDays: { label: 'Equivalent Calendar Days', visible: true, required: false },
  probabilityAdjustedDuration: { label: 'Probability-Adjusted Duration', visible: true, required: false },
  
  // Make schedule impact fields visible for construction
  delayDuration: { label: 'Delay Duration (days)', visible: true, required: false },
  delayClassification: { label: 'Delay Classification', visible: true, required: false },
  criticalPathImpact: { label: 'Critical Path Impact', visible: true, required: false },
  floatConsumption: { label: 'Float Consumption (days)', visible: true, required: false },
  
  // Make cost fields visible
  includeCost: { label: 'Include Cost Estimation', visible: true, required: false },
  optimisticCost: { label: 'Optimistic Cost (O)', visible: true, required: false },
  mostLikelyCost: { label: 'Most Likely Cost (M)', visible: true, required: false },
  pessimisticCost: { label: 'Pessimistic Cost (P)', visible: true, required: false },
  expectedCost: { label: 'Expected Cost', visible: true, required: false },
  emv: { label: 'Expected Monetary Value', visible: true, required: false },
  
  // Contract allocation
  costAllocationModel: { label: 'Cost Allocation Model', visible: true, required: false },
  contractDetails: { label: 'Contract Details', visible: true, required: false },
};

// Configuration for financial register
const financialConfig: FormFieldsConfig = {
  ...defaultFieldConfig,
  // Override specific fields for financial
  contingency: { label: 'Financial Reserve', visible: true, required: true },
  riskCategory: { label: 'Financial Risk Type', visible: true, required: true },
  comment: { label: 'Financial Notes', visible: true, required: false },
  
  // Make cost fields visible
  includeCost: { label: 'Include Cost Estimation', visible: true, required: false },
  optimisticCost: { label: 'Optimistic Cost (O)', visible: true, required: false },
  mostLikelyCost: { label: 'Most Likely Cost (M)', visible: true, required: false },
  pessimisticCost: { label: 'Pessimistic Cost (P)', visible: true, required: false },
  expectedCost: { label: 'Expected Cost', visible: true, required: false },
  emv: { label: 'Expected Monetary Value', visible: true, required: false },
  
  // Contract allocation
  costAllocationModel: { label: 'Cost Allocation Model', visible: true, required: false },
  contractDetails: { label: 'Contract Details', visible: true, required: false },
};

// Finance department specific configurations
const financeDeptConfig: FormFieldsConfig = {
  ...defaultFieldConfig,
  // Fields that finance department would prioritize
  impact: { label: 'Financial Impact ($)', visible: true, required: true },
  riskRating: { label: 'Cost Impact Rating', visible: true, required: true },
  contingency: { label: 'Budget Contingency', visible: true, required: true },
  riskCategory: { label: 'Financial Category', visible: true, required: true },
};

// Export the full configuration map
export const fieldVisibilityConfigs: FieldVisibilityConfigs = {
  development: {
    default: developmentConfig,
    development: developmentConfig,
    finance: financeDeptConfig,
    // Add others as needed
  },
  construction: {
    default: constructionConfig,
    // Add department-specific configs
  },
  financial: {
    default: financialConfig,
    finance: financeDeptConfig,
    // Add department-specific configs
  },
  operational: {
    default: defaultFieldConfig,
    // Add department-specific configs
  },
  default: {
    default: defaultFieldConfig,
  }
};

// Helper function to get field configuration based on register type and department
export function getFieldConfig(
  registerType: RegisterType = 'default', 
  department: DepartmentType = 'default'
): FormFieldsConfig {
  // Try to get department-specific config for this register type
  const registerConfig = fieldVisibilityConfigs[registerType] || fieldVisibilityConfigs.default;
  
  // If department-specific config exists, use it; otherwise fall back to default for this register
  return registerConfig[department] || registerConfig.default || defaultFieldConfig;
}

// Create a Zod schema based on field config (for dynamic form validation)
export function createDynamicSchema(fieldConfig: FormFieldsConfig) {
  const schemaObj: Record<string, z.ZodTypeAny> = {};
  
  Object.entries(fieldConfig).forEach(([fieldName, config]) => {
    if (config.visible) {
      // Determine the field type based on the field name
      let fieldSchema: z.ZodTypeAny;
      
      // Check if field is a number type
      if (fieldName === 'impact' || 
          fieldName === 'probability' || 
          fieldName === 'riskRating' || 
          fieldName === 'priorityRank' ||
          fieldName === 'optimisticCost' ||
          fieldName === 'mostLikelyCost' ||
          fieldName === 'pessimisticCost' ||
          fieldName === 'expectedCost' ||
          fieldName === 'emv' ||
          // Schedule PERT fields
          fieldName === 'optimisticDuration' ||
          fieldName === 'mostLikelyDuration' ||
          fieldName === 'pessimisticDuration' ||
          fieldName === 'expectedDuration' ||
          fieldName === 'calculatedBusinessDays' ||
          fieldName === 'calculatedCalendarDays' ||
          fieldName === 'probabilityAdjustedDuration' ||
          // Delay fields
          fieldName === 'delayDuration' ||
          fieldName === 'floatConsumption' ||
          // Risk rating fields
          fieldName === 'initialRiskRating' ||
          fieldName === 'residualRiskRating' ||
          fieldName === 'criticalDateId') {
        fieldSchema = z.number();
      } 
      // Check if field is a boolean type
      else if (fieldName === 'includeCost' ||
          fieldName === 'criticalPathImpact') {
        fieldSchema = z.boolean();
      }
      // Default to string
      else {
        fieldSchema = z.string();
      }
      
      // Apply required constraint if needed
      if (config.required) {
        if (fieldSchema instanceof z.ZodString) {
          fieldSchema = fieldSchema.min(1, { message: `${config.label} is required` });
        } else if (fieldSchema instanceof z.ZodNumber) {
          // For numbers, check if greater than or equal to 0
          fieldSchema = fieldSchema.min(0, { message: `${config.label} is required` });
        }
        // No additional validation needed for booleans
      } else {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaObj[fieldName] = fieldSchema;
    }
  });
  
  // Always include projectId
  schemaObj.projectId = z.number();
  
  return z.object(schemaObj);
}