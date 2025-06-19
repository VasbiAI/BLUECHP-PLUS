import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CostEstimationFormProps {
  watchIncludeCost: boolean;
  showAllocationModel?: boolean;
}

const CostEstimationForm: React.FC<CostEstimationFormProps> = ({ 
  watchIncludeCost,
  showAllocationModel = true 
}) => {
  const form = useFormContext();
  
  // PERT formula: (O + 4M + P) / 6
  const calculateExpectedCost = () => {
    const optimistic = form.watch('optimisticCost') || 0;
    const mostLikely = form.watch('mostLikelyCost') || 0;
    const pessimistic = form.watch('pessimisticCost') || 0;
    
    const expectedCost = (optimistic + (4 * mostLikely) + pessimistic) / 6;
    form.setValue('expectedCost', Math.round(expectedCost * 100) / 100);
    
    // Calculate EMV (Expected Monetary Value)
    const probability = form.watch('probability') || 0;
    // EMV = Expected Cost × Probability
    const emv = expectedCost * probability;
    form.setValue('emv', Math.round(emv * 100) / 100);
    
    // Set recommended budget value based on allocation model
    const allocationModel = form.watch('costAllocationModel');
    
    if (allocationModel === 'internal') {
      // For internal risks, budget at the Pessimistic value
      form.setValue('recommendedBudget', pessimistic);
    } else if (allocationModel === 'fixedCap') {
      // For fixed cap contract, budget at the contractually agreed cap
      const contractCap = form.watch('contractCap') || pessimistic;
      form.setValue('recommendedBudget', contractCap);
    } else if (allocationModel === 'shared') {
      // For shared model, calculate based on provisional sum approach
      // Use expected cost plus some contingency up to a negotiated cap
      const provisionalAmount = Math.min(
        expectedCost * 1.1, // 10% contingency on expected cost
        pessimistic // Not exceeding pessimistic value
      );
      form.setValue('recommendedBudget', Math.round(provisionalAmount * 100) / 100);
    } else {
      // Default to pessimistic if no allocation model selected
      form.setValue('recommendedBudget', pessimistic);
    }
  };
  
  // When cost inputs or allocation model change, recalculate
  useEffect(() => {
    if (watchIncludeCost) {
      calculateExpectedCost();
    }
  }, [
    form.watch('optimisticCost'), 
    form.watch('mostLikelyCost'), 
    form.watch('pessimisticCost'),
    form.watch('probability'),
    form.watch('costAllocationModel'),
    form.watch('contractCap'),
    watchIncludeCost
  ]);
  
  if (!watchIncludeCost) {
    return (
      <FormField
        control={form.control}
        name="includeCost"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Include Cost Estimation</FormLabel>
              <div className="text-sm text-muted-foreground">
                Enable to add cost estimation with PERT method calculation
              </div>
            </div>
            <FormControl>
              <div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            </FormControl>
          </FormItem>
        )}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="includeCost"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-6">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Cost Estimation Enabled</FormLabel>
              <div className="text-sm text-muted-foreground">
                Disable to hide cost estimation fields
              </div>
            </div>
            <FormControl>
              <div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            </FormControl>
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="optimisticCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Optimistic Cost (O)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Best case cost"
                  {...field}
                  onChange={(e) => {
                    field.onChange(parseFloat(e.target.value) || 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mostLikelyCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Most Likely Cost (M)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Most likely cost"
                  {...field}
                  onChange={(e) => {
                    field.onChange(parseFloat(e.target.value) || 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="pessimisticCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pessimistic Cost (P)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Worst case cost"
                  {...field}
                  onChange={(e) => {
                    field.onChange(parseFloat(e.target.value) || 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FormLabel>Expected Cost (PERT)</FormLabel>
                <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </div>
              <Input 
                type="number" 
                value={form.watch('expectedCost') || 0} 
                disabled 
              />
              <div className="text-xs text-muted-foreground">
                Formula: (O + 4M + P) / 6
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FormLabel>Expected Monetary Value (EMV)</FormLabel>
                <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </div>
              <Input 
                type="number" 
                value={form.watch('emv') || 0} 
                disabled 
              />
              <div className="text-xs text-muted-foreground">
                EMV = Expected Cost × Probability (as decimal)
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FormLabel>Recommended Budget Allowance</FormLabel>
              <Badge variant="outline" className="ml-2 font-normal">
                {form.watch('costAllocationModel') === 'internal' 
                  ? 'Pessimistic Value' 
                  : form.watch('costAllocationModel') === 'fixedCap'
                    ? 'Contract Cap'
                    : form.watch('costAllocationModel') === 'shared'
                      ? 'Provisional Sum'
                      : 'Select Allocation Model'}
              </Badge>
              <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </div>
            <Input 
              type="number" 
              value={form.watch('recommendedBudget') || 0} 
              disabled 
            />
            <div className="text-xs text-muted-foreground">
              Based on selected cost allocation model
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showAllocationModel && (
        <>
          <Separator className="my-4" />
          
          <FormField
            control={form.control}
            name="costAllocationModel"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Cost Allocation Model</FormLabel>
                  <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </div>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost allocation model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="internal">Accepted Internally</SelectItem>
                    <SelectItem value="fixedCap">Contract Fixed Cap</SelectItem>
                    <SelectItem value="shared">Shared Model (Provisional Sum)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch('costAllocationModel') === 'fixedCap' && (
            <FormField
              control={form.control}
              name="contractCap"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Contract Cap Amount</FormLabel>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter maximum contractual amount"
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {form.watch('costAllocationModel') === 'shared' && (
            <>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="lowCapRate"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Low Cap Rate</FormLabel>
                        <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Minimum threshold"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="highCapRate"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>High Cap Rate</FormLabel>
                        <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Maximum threshold"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="contractDetails"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Provisional Sum Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter contract details for the provisional sum arrangement. Include details of risk sharing percentages (e.g., '50% of savings shared if below Low Cap')."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      The shared model works with three thresholds: 
                      1. PC Rate: The expected cost (PERT calculation)
                      2. Low Cap: Below this, cost savings are shared
                      3. High Cap: Above this, excess costs are borne by contractor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CostEstimationForm;