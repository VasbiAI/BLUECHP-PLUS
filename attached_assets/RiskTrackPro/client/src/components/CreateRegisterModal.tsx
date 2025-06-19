import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RegisterType, DepartmentType } from '@/config/fieldVisibility';

// Define the register schema
const registerSchema = z.object({
  registerName: z.string().min(3, 'Register name must be at least 3 characters'),
  registerType: z.string().min(1, 'Register type is required'),
  department: z.string().min(1, 'Department is required'),
  description: z.string().optional(),
  // The following fields are conditional based on department
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  documentId: z.string().optional(),
  documentName: z.string().optional(),
  buildingId: z.string().optional(),
  buildingName: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

interface CreateRegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: RegisterFormData) => void;
  isSubmitting: boolean;
}

const registerTypeOptions = [
  { value: 'development', label: 'Development' },
  { value: 'construction', label: 'Construction' },
  { value: 'financial', label: 'Financial' },
  { value: 'operational', label: 'Operational' },
];

const departmentOptions = [
  { value: 'development', label: 'Development' },
  { value: 'finance', label: 'Finance' },
  { value: 'construction', label: 'Construction' },
  { value: 'operations', label: 'Operations' },
];

const CreateRegisterModal = ({ 
  open, 
  onClose, 
  onSave, 
  isSubmitting 
}: CreateRegisterModalProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType>('default');
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      registerName: '',
      registerType: '',
      department: '',
      description: '',
      projectId: '',
      projectName: '',
      documentId: '',
      documentName: '',
      buildingId: '',
      buildingName: '',
    }
  });
  
  // Handle department change
  const handleDepartmentChange = (value: string) => {
    form.setValue('department', value);
    setSelectedDepartment(value as DepartmentType);
  };
  
  const onSubmit = (data: RegisterFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle>Create New Risk Register</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic register information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Register Information</h3>
              
              <FormField
                control={form.control}
                name="registerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Register Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter register name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Register Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {registerTypeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
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
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={(value) => handleDepartmentChange(value)} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter register description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Conditional fields based on department */}
            {selectedDepartment === 'development' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Project Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {selectedDepartment === 'finance' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="documentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter document ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="documentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter document name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
            {(selectedDepartment === 'operations' || selectedDepartment === 'construction') && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Building Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buildingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter building ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="buildingName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter building name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            
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
                {isSubmitting ? "Creating..." : "Create Register"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRegisterModal;