import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, FileSpreadsheet, AlertCircle, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { insertCriticalDateSchema, type InsertCriticalDate } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

interface CriticalDateImporterProps {
  projectId: number;
  projectName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const CriticalDateImporter: React.FC<CriticalDateImporterProps> = ({
  projectId,
  projectName,
  onSuccess,
  onCancel
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  // Parse Excel/CSV file
  const parseFile = async (file: File) => {
    try {
      const data = await readFileAsArrayBuffer(file);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      // Transform data to match our schema
      const transformedData = transformData(jsonData);
      
      // Validate data
      const { validItems, validationErrors } = validateData(transformedData);
      
      setPreview(validItems);
      setErrors(validationErrors);
      
      if (validationErrors.length > 0) {
        toast({
          title: 'Validation Errors',
          description: `Found ${validationErrors.length} errors in the imported data. Please fix them before importing.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse file. Please make sure it\'s a valid Excel or CSV file.',
        variant: 'destructive',
      });
    }
  };

  // Read file as ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  // Transform raw data to match our schema
  const transformData = (data: any[]): Partial<InsertCriticalDate>[] => {
    return data.map(item => {
      // Map spreadsheet columns to our schema (handling different possible column names)
      return {
        title: item['Title'] || item['Name'] || item['Description'] || '',
        status: item['Status'] || 'Open',
        dueDate: item['Due Date'] || item['DueDate'] || item['Date'] || '',
        entity: item['Entity'] || item['Organization'] || '',
        department: item['Department'] || '',
        state: item['State'] || '',
        contractValue: item['Contract Value'] || item['Value'] || '',
        criticalIssue: item['Critical Issue'] || '',
        criticalIssueDescription: item['Critical Issue Description'] || '',
        projectName: item['Project Name'] || projectName,
        projectAddress: item['Project Address'] || '',
        agreementType: item['Agreement Type'] || '',
        agreementDate: item['Agreement Date'] || '',
        agreementReference: item['Agreement Reference'] || '',
        reminderType: item['Reminder Type'] || '',
        reminderScheduling: item['Reminder Scheduling'] || 'One Off Event',
        occurrenceFrequency: item['Occurrence Frequency'] || '',
        occurrenceStartDate: item['Occurrence Start Date'] || '',
        reminder1Days: item['Reminder 1 (Days)'] ? Number(item['Reminder 1 (Days)']) : undefined,
        reminder2Days: item['Reminder 2 (Days)'] ? Number(item['Reminder 2 (Days)']) : undefined,
        reminder3Days: item['Reminder 3 (Days)'] ? Number(item['Reminder 3 (Days)']) : undefined,
        reminder4Days: item['Reminder 4 (Days)'] ? Number(item['Reminder 4 (Days)']) : undefined,
        postTriggerDateReminderDays: item['Post Trigger Reminder (Days)'] ? Number(item['Post Trigger Reminder (Days)']) : undefined,
        emails: item['Notification Recipients'] ? item['Notification Recipients'].split(',').map((e: string) => e.trim()) : []
      };
    });
  };

  // Validate data against our schema
  const validateData = (data: Partial<InsertCriticalDate>[]) => {
    const validationErrors: ValidationError[] = [];
    const validItems: Partial<InsertCriticalDate>[] = [];

    data.forEach((item, index) => {
      // Check required fields
      if (!item.title) {
        validationErrors.push({
          row: index + 1,
          field: 'title',
          message: 'Title is required'
        });
      }

      if (!item.dueDate) {
        validationErrors.push({
          row: index + 1,
          field: 'dueDate',
          message: 'Due Date is required'
        });
      } else {
        // Check date format (DD/MM/YYYY)
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        if (!dateRegex.test(item.dueDate)) {
          validationErrors.push({
            row: index + 1,
            field: 'dueDate',
            message: 'Due Date must be in DD/MM/YYYY format'
          });
        }
      }

      // Check if reminder days are valid numbers
      const reminderFields = [
        'reminder1Days', 'reminder2Days', 'reminder3Days', 'reminder4Days', 'postTriggerDateReminderDays'
      ];

      reminderFields.forEach(field => {
        if (item[field as keyof InsertCriticalDate] !== undefined && 
            isNaN(Number(item[field as keyof InsertCriticalDate]))) {
          validationErrors.push({
            row: index + 1,
            field,
            message: `${field} must be a valid number`
          });
        }
      });

      // If no errors for this item, add to valid items
      if (!validationErrors.some(error => error.row === index + 1)) {
        validItems.push(item);
      }
    });

    return { validItems, validationErrors };
  };

  // Submit valid items
  const handleSubmit = async () => {
    if (preview.length === 0) {
      toast({
        title: 'No Data',
        description: 'No valid data to import',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      let importedCount = 0;

      // Import critical dates one by one
      for (const item of preview) {
        await apiRequest('/api/critical-dates', 'POST', item);
        importedCount++;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/critical-dates'] });

      setSuccess(true);
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${importedCount} critical dates`,
        variant: 'default',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error importing critical dates:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import critical dates. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Import Critical Dates</CardTitle>
        <CardDescription>
          Upload an Excel or CSV file to import critical dates.
          The file should contain columns for Title, Due Date, and other critical date properties.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!success ? (
          <>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm text-gray-600">
                    <p className="pl-1">
                      {file ? file.name : 'Drag and drop file here, or click to select file'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Excel (.xlsx) or CSV (.csv) files accepted
                  </p>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <div className="max-h-40 overflow-y-auto mt-2 text-sm">
                    {errors.map((error, index) => (
                      <div key={index} className="py-1">
                        <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {preview.length > 0 && (
              <div className="rounded-md border">
                <div className="py-3 px-4 bg-muted/50">
                  <h3 className="text-sm font-medium">Preview ({preview.length} items)</h3>
                </div>
                <div className="p-0">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-medium text-left">Title</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium text-left">Due Date</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium text-left">Status</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium text-left">Entity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">{item.title}</td>
                            <td className="px-4 py-2">{item.dueDate}</td>
                            <td className="px-4 py-2">{item.status}</td>
                            <td className="px-4 py-2">{item.entity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Import Complete</AlertTitle>
            <AlertDescription className="text-green-700">
              Successfully imported {preview.length} critical dates.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {!success ? (
          <Button
            onClick={handleSubmit}
            disabled={isUploading || preview.length === 0 || errors.length > 0}
          >
            {isUploading ? 'Importing...' : 'Import Critical Dates'}
          </Button>
        ) : (
          <Button onClick={onSuccess}>
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CriticalDateImporter;