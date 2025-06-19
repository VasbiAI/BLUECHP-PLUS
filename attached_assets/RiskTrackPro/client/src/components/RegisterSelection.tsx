import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DepartmentType, RegisterType } from '@/config/fieldVisibility';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

interface RegisterSelectionProps {
  registerType: RegisterType;
  department: DepartmentType;
  onRegisterTypeChange: (type: RegisterType) => void;
  onDepartmentChange: (dept: DepartmentType) => void;
  form: ReturnType<typeof useForm>;
}

const RegisterSelection: React.FC<RegisterSelectionProps> = ({
  registerType,
  department,
  onRegisterTypeChange,
  onDepartmentChange,
  form
}) => {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <FormField
        control={form.control}
        name="registerType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Register Type</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                onRegisterTypeChange(value as RegisterType);
              }}
              defaultValue={registerType}
              value={field.value}
            >
              <FormControl>
                <div>
                  <SelectTrigger>
                    <SelectValue placeholder="Select register type" />
                  </SelectTrigger>
                </div>
              </FormControl>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                onDepartmentChange(value as DepartmentType);
              }}
              defaultValue={department}
              value={field.value}
            >
              <FormControl>
                <div>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                </div>
              </FormControl>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
};

export default RegisterSelection;