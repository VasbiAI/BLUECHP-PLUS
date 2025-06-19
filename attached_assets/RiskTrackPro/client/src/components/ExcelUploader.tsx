import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileSpreadsheet, Upload, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExcelUploaderProps {
  projectId: number;
  onUploadComplete: (result: {
    uploadId: number;
    taskCount: number;
    completedCount: number;
  }) => void;
  username?: string;
}

export default function ExcelUploader({
  projectId,
  onUploadComplete,
  username = "Anonymous"
}: ExcelUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file type (Excel or XML)
    const validFileTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/xml',
      'text/xml'
    ];
    
    if (!validFileTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls') && 
        !selectedFile.name.endsWith('.xml')) {
      setError('Please select a valid Excel or XML file');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId.toString());
      formData.append('uploadedBy', username);
      
      const response = await fetch(`/api/projects/${projectId}/upload-schedule`, {
        method: 'POST',
        body: formData,
        headers: {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      setUploadProgress(100);
      
      const result = await response.json();
      
      toast({
        title: "Schedule uploaded successfully",
        description: `Imported ${result.taskCount} tasks from the schedule`
      });
      
      onUploadComplete({
        uploadId: result.id,
        taskCount: result.taskCount || 0,
        completedCount: result.completedTaskCount || 0
      });
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading the file. Please try again."
      });
    } finally {
      setIsUploading(false);
      setFile(null);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Schedule
        </CardTitle>
        <CardDescription>
          Import tasks from MS Project schedule (.xlsx or .xml format)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="schedule-file">Project Schedule File</Label>
          <Input
            id="schedule-file"
            type="file"
            accept=".xlsx,.xls,.xml"
            onChange={handleFileChange}
            disabled={isUploading}
            className="h-9"
          />
          {file && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
        
        {uploadProgress > 0 && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-xs text-center text-muted-foreground">
              {uploadProgress < 100 ? 'Uploading and processing...' : 'Upload complete!'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Schedule
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}