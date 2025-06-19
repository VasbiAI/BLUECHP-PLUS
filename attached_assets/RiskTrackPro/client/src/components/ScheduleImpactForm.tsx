import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScheduleImpactFormProps {
  category: string;
}

const ScheduleImpactForm: React.FC<ScheduleImpactFormProps> = ({ category }) => {
  const form = useFormContext();
  
  // Show a warning if not construction category, but don't block access
  const isConstructionCategory = category === 'Construction';
  
  // PERT formula: (O + 4M + P) / 6
  const calculateExpectedDuration = () => {
    const optimistic = form.watch('optimisticDuration') || 0;
    const mostLikely = form.watch('mostLikelyDuration') || 0;
    const pessimistic = form.watch('pessimisticDuration') || 0;
    
    const expectedDuration = (optimistic + (4 * mostLikely) + pessimistic) / 6;
    form.setValue('expectedDuration', Math.round(expectedDuration * 10) / 10);
    
    // Calculate calendar days if business days provided and vice versa
    const dayType = form.watch('dayType') || 'calendar';
    if (dayType === 'calendar') {
      // Convert to business days (rough approximation: calendar * 5/7)
      const businessDays = Math.round((expectedDuration * 5/7) * 10) / 10;
      form.setValue('calculatedBusinessDays', businessDays);
    } else {
      // Convert to calendar days (rough approximation: business * 7/5)
      const calendarDays = Math.round((expectedDuration * 7/5) * 10) / 10;
      form.setValue('calculatedCalendarDays', calendarDays);
    }
    
    // Calculate probability-adjusted duration (similar to EMV for cost)
    // Using the probability from the parent form
    const probabilityAdjustedDuration = expectedDuration * probability;
    form.setValue('probabilityAdjustedDuration', Math.round(probabilityAdjustedDuration * 10) / 10);
    
    // Update the delayDuration field to match our PERT estimate
    form.setValue('delayDuration', Math.round(expectedDuration));
  };
  
  // Use the risk probability from the form
  // Ensure we link with the probability field from the parent form
  const probability = form.watch('probability') || 0;
  
  // When duration inputs change, recalculate
  useEffect(() => {
    calculateExpectedDuration();
  }, [
    form.watch('optimisticDuration'), 
    form.watch('mostLikelyDuration'), 
    form.watch('pessimisticDuration'),
    form.watch('dayType'),
    probability,
  ]);
  
  return (
    <div className="space-y-6">
      {!isConstructionCategory && (
        <Card className="bg-amber-50 border-amber-200 mb-4">
          <CardContent className="pt-6">
            <p className="text-amber-800 font-medium">Non-Construction Risk</p>
            <p className="text-sm text-amber-700 mt-1">
              Schedule impact is primarily designed for Construction risks, but you can use it for other risk types as well.
            </p>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="pert" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="pert">PERT Schedule Estimation</TabsTrigger>
          <TabsTrigger value="delay-details">Delay Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pert" className="pt-4 space-y-6">
          <FormField
            control={form.control}
            name="dayType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || 'calendar'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="calendar">Calendar Days</SelectItem>
                    <SelectItem value="business">Business Days</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose whether to estimate in calendar days (including weekends) or business days
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="optimisticDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optimistic Duration (O)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Best case duration"
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
              name="mostLikelyDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Most Likely Duration (M)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Most likely duration"
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
              name="pessimisticDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pessimistic Duration (P)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Worst case duration"
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
                    <FormLabel>Expected Duration (PERT)</FormLabel>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </div>
                  <div className="flex items-center">
                    <Input 
                      type="number" 
                      value={form.watch('expectedDuration') || 0} 
                      disabled 
                    />
                    <Badge className="ml-2">
                      {form.watch('dayType') === 'calendar' ? 'Calendar Days' : 'Business Days'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Formula: (O + 4M + P) / 6
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FormLabel>
                      {form.watch('dayType') === 'calendar' ? 'Equivalent Business Days' : 'Equivalent Calendar Days'}
                    </FormLabel>
                    <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </div>
                  <Input 
                    type="number" 
                    value={form.watch('dayType') === 'calendar' 
                      ? form.watch('calculatedBusinessDays') || 0 
                      : form.watch('calculatedCalendarDays') || 0
                    } 
                    disabled 
                  />
                  <div className="text-xs text-muted-foreground">
                    {form.watch('dayType') === 'calendar' 
                      ? 'Estimated business days (excluding weekends)' 
                      : 'Estimated calendar days (including weekends)'
                    }
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FormLabel>Probability-Adjusted Duration</FormLabel>
                  <InfoCircledIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </div>
                <div className="flex items-center">
                  <Input 
                    type="number" 
                    value={form.watch('probabilityAdjustedDuration') || 0} 
                    disabled 
                  />
                  <Badge className="ml-2">
                    {form.watch('dayType') === 'calendar' ? 'Calendar Days' : 'Business Days'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Expected Duration × Probability (as decimal)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="delay-details" className="pt-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="delayDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delay Duration (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter estimated delay in days"
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be auto-populated from the PERT estimate
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="delayClassification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delay Classification</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delay type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EOT">Extension of Time without cost</SelectItem>
                      <SelectItem value="EOT_COST">Extension of Time with cost</SelectItem>
                      <SelectItem value="SUSPENSION">Suspension of works</SelectItem>
                      <SelectItem value="TERMINATION">Potential termination</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="criticalPathImpact"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Critical Path Impact</FormLabel>
                    <FormDescription>
                      Will this delay affect the critical path?
                    </FormDescription>
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
            
            <FormField
              control={form.control}
              name="floatConsumption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Float Consumption (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Float to be consumed"
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    How many days of float will be consumed by this delay
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {form.watch('delayClassification') === 'EOT_COST' && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <p className="text-amber-800 font-medium">Cost Impact Warning</p>
                <p className="text-sm text-amber-700 mt-1">
                  This delay will result in additional costs. Consider enabling cost estimation
                  to calculate the financial impact.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Sync the PERT-estimated duration to the delayDuration field */}
      <div className="hidden">
        <FormField
          control={form.control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="hidden"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default ScheduleImpactForm;