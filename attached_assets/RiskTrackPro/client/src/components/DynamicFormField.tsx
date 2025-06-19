import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { FieldVisibilityConfig } from '@/config/fieldVisibility';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DynamicFormFieldProps {
  name: string;
  config: FieldVisibilityConfig;
  form: ReturnType<typeof useForm>;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'select';
  selectOptions?: { value: string; label: string }[];
}

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  name,
  config,
  form,
  type = 'text',
  selectOptions
}) => {
  // If this field should not be visible, don't render anything
  if (!config.visible) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{config.label}</FormLabel>
          <FormControl>
            <div>
            {type === 'textarea' && (
              <Textarea
                {...field}
                placeholder={`Enter ${config.label.toLowerCase()}`}
                value={field.value || ''}
              />
            )}
            
            {type === 'number' && (
              <Input
                {...field}
                type="number"
                placeholder={`Enter ${config.label.toLowerCase()}`}
                value={field.value || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? '' : Number(value));
                }}
              />
            )}
            
            {type === 'date' && (
              <Input
                {...field}
                type="date"
                value={field.value || ''}
              />
            )}
            
            {type === 'select' && selectOptions && (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || (selectOptions[0]?.value || "")}
                value={field.value || (selectOptions[0]?.value || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${config.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value || "placeholder_value"}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {type === 'text' && (
              <Input
                {...field}
                placeholder={`Enter ${config.label.toLowerCase()}`}
                value={field.value || ''}
              />
            )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DynamicFormField;