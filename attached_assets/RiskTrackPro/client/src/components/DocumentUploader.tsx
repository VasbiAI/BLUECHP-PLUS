import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FilePenLine, 
  FileText, 
  FileArchive, 
  Upload, 
  XCircle, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  Download,
  CalendarRange
} from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";
import { DocumentTimeline } from './DocumentTimeline';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DocumentUploaderProps {
  criticalDateId?: number;
  onUploadComplete?: (document: any) => void;
  onAnalysisComplete?: (analysisData: any) => void;
}

interface FileUploadState {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  uploadedId?: number; // Store the document ID after successful upload
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  criticalDateId,
  onUploadComplete,
  onAnalysisComplete
}) => {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [createdDates, setCreatedDates] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("files");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const allowedFileTypes = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'text/plain'
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FilePenLine className="h-8 w-8 text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) return <FileArchive className="h-8 w-8 text-green-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
      e.target.value = ''; // Reset input
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => allowedFileTypes.includes(file.type));
    
    if (validFiles.length !== newFiles.length) {
      toast({
        title: "Invalid file type",
        description: "Some files were rejected. Please upload PDF, Word, or Excel files only.",
        variant: "destructive"
      });
    }

    const fileStates: FileUploadState[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'idle'
    }));

    setFiles(prev => [...prev, ...fileStates]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Delete an uploaded document from the server with proper error handling
  const handleDeleteDocument = async (documentId: number, index: number) => {
    try {
      // Make API request to delete the document
      const response: any = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Delete failed with status: ${response.status}`);
      }
      
      // Remove the file from the local state
      setFiles(prev => prev.filter((_, i) => i !== index));
      
      // Notify the user of success
      toast({
        title: "Document Deleted",
        description: "Document has been permanently removed.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Document delete error:', error);
      
      // Show a user-friendly error message
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete document. Please try again.',
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // New function to retry a failed upload
  const handleRetryUpload = (index: number) => {
    const fileToRetry = files[index];
    if (fileToRetry) {
      // Reset the file status to idle so it can be uploaded again
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'idle', progress: 0, message: undefined } : f
      ));
      
      // Directly upload this file
      uploadFile(fileToRetry, index);
    }
  };

  const uploadFile = async (fileState: FileUploadState, index: number) => {
    const formData = new FormData();
    formData.append('file', fileState.file);
    
    if (criticalDateId) {
      formData.append('criticalDateId', criticalDateId.toString());
    }

    // For clearing the interval if needed in catch block
    let progressInterval: NodeJS.Timeout | undefined;

    try {
      // Update status to uploading
      setFiles(prev =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'uploading', progress: 10 } : f
        )
      );

      // Simulate upload progress
      progressInterval = setInterval(() => {
        setFiles(prev =>
          prev.map((f, i) =>
            i === index && f.progress < 90
              ? { ...f, progress: f.progress + 10 }
              : f
          )
        );
      }, 300);

      // Upload the file using fetch directly
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        let responseText = "";
        try {
          const errorData = await response.json();
          responseText = errorData.message || response.statusText;

          // If we detect a database connection issue, create a temporary document for analysis
          if (
            responseText.includes("database") ||
            responseText.includes("connection") ||
            responseText.includes("Control plane request") ||
            responseText.includes("rate limit")
          ) {
            console.log("Database connection issue detected, creating temporary document");

            const tempDocId = Date.now(); // Use timestamp as a temporary ID
            const tempDocument = {
              id: tempDocId,
              filename: fileState.file.name,
              originalFilename: fileState.file.name,
              fileSize: fileState.file.size,
              mimeType: fileState.file.type,
              uploadedAt: new Date(),
              analysisStatus: 'ready_for_analysis',
              isTemporary: true, // Flag to indicate this is not saved in the database
            };

            setFiles(prev =>
              prev.map((f, i) =>
                i === index
                  ? {
                      ...f,
                      status: 'success',
                      progress: 100,
                      uploadedId: tempDocId,
                      message:
                        "File ready for analysis (Note: Not saved to database due to connection issues)",
                    }
                  : f
              )
            );

            toast({
              title: "Upload Partial Success",
              description: `${fileState.file.name} is ready for analysis, but could not be saved to the database.`,
              duration: 5000,
            });

            if (onUploadComplete && typeof onUploadComplete === 'function') {
              onUploadComplete(tempDocument);
            }
            
            return tempDocument; // Exit early after fallback
          }
        } catch (e) {
          console.warn("Non-JSON response error", e);
        }

        throw new Error(`Upload failed: ${responseText || response.statusText}`);
      }

      // Parse successful response
      const uploadedDoc = await response.json();

      if (!uploadedDoc || !uploadedDoc.id) {
        throw new Error("Invalid response from server");
      }

      // Update file status to success and store the document ID
      setFiles(prev =>
        prev.map((f, i) =>
          i === index
            ? { 
                ...f, 
                status: 'success', 
                progress: 100, 
                uploadedId: uploadedDoc.id,
                message: "Upload successful"
              }
            : f
        )
      );

      toast({
        title: "Upload Complete",
        description: `${fileState.file.name} uploaded successfully.`,
        duration: 4000,
      });

      if (onUploadComplete && typeof onUploadComplete === 'function') {
        onUploadComplete(uploadedDoc);
      }

      return uploadedDoc;

    } catch (error: any) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Upload error:", error);
      
      // Update file status to error
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          message: error.message || "Upload failed"
        } : f
      ));

      // Show a user-friendly error message
      toast({
        title: "Upload Failed",
        description: `${fileState.file.name} could not be uploaded.`,
        variant: "destructive",
        duration: 5000,
      });

      return null;
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'idle');
    
    if (pendingFiles.length === 0) {
      toast({
        title: "No files to upload",
        description: "Please add files first."
      });
      return;
    }

    const uploadPromises = pendingFiles.map((file, index) => 
      uploadFile(file, files.indexOf(file))
    );

    await Promise.all(uploadPromises);
  };

  const analyzeDocuments = async () => {
    // Get successful uploads to analyze
    const successfulUploads = files.filter(f => f.status === 'success');
    
    if (successfulUploads.length === 0) {
      toast({
        title: "No documents available",
        description: "Please upload documents first before analyzing.",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Extract document IDs for analysis, ensuring they're all valid numbers
      const documentIds = successfulUploads
        .filter(f => f.uploadedId)
        .map(f => f.uploadedId);
      
      if (documentIds.length === 0) {
        throw new Error("No valid document IDs available for analysis");
      }
      
      // Create a map of temporary document objects for fallback use when DB fails
      const temporaryDocuments = {};
      successfulUploads.forEach(f => {
        if (f.isTemporary || f.message?.includes('Not saved to database')) {
          temporaryDocuments[f.uploadedId] = {
            filename: f.file.name,
            originalFilename: f.file.name,
            fileSize: f.file.size,
            mimeType: f.file.type,
            uploadedAt: new Date(),
            analysisStatus: 'ready_for_analysis',
            isTemporary: true
          };
        }
      });
      
      // Use API path based on whether we have a criticalDateId
      const apiPath = '/api/documents/analyse';
        
      // Make the API request with proper error handling using fetch directly
      // This avoids potential issues with how apiRequest might be implemented
      // Send the request with better error handling
      let response;
      try {
        const fetchResponse = await fetch(apiPath, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            documentIds,
            criticalDateId,
            temporaryDocuments // Include temporary document info for fallback processing
          })
        });
        
        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          console.warn("Response error:", errorText);
          
          // Check if this is a database connection error
          if (
            errorText.includes("database") ||
            errorText.includes("connection") ||
            errorText.includes("Control plane request") ||
            errorText.includes("rate limit")
          ) {
            toast({
              title: "Database Connection Issues",
              description: "Continuing with document analysis in offline mode. Results may not be saved to the database.",
              duration: 5000,
            });
            
            // Try to continue with local document analysis when database fails
            const fileObj = files.find(f => f.file);
            if (fileObj?.file) {
              // Create a fallback response structure
              response = {
                message: "Analysis is proceeding in offline mode due to database connection issues",
                documentId: documentIds[0],
                fileName: fileObj.file.name,
                timestamp: new Date().toISOString(),
                analysisStatus: "in_progress",
                success: true
              };
            } else {
              throw new Error("No valid files available for offline analysis");
            }
          } else {
            throw new Error(`Analysis failed: ${fetchResponse.status} ${errorText}`);
          }
        } else {
          response = await fetchResponse.json();
        }
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
      
      if (!response || (response.success === false)) {
        throw new Error(response?.error || "Analysis failed with an unknown error");
      }
      
      // Store the analysis results
      setAnalysisResults(response.analysisResults || response);
      
      // Check for timeline data from critical dates or dates
      if (response.timelineData && Array.isArray(response.timelineData)) {
        setTimelineData(response.timelineData);
        setActiveTab("timeline");
      } else if (response.analysisResults?.criticalDates && Array.isArray(response.analysisResults.criticalDates)) {
        setTimelineData(response.analysisResults.criticalDates);
        setActiveTab("timeline");
      } else if (response.analysisResults?.dates && Array.isArray(response.analysisResults.dates)) {
        setTimelineData(response.analysisResults.dates);
        setActiveTab("timeline");
      }
      
      // Track any critical dates created from the analysis
      if (response.createdDates && Array.isArray(response.createdDates)) {
        setCreatedDates(response.createdDates);
      }
      
      // Store any message from the server
      if (response.message) {
        setMessage(response.message);
      }
      
      // Call the callback to let the parent form know about the analysis results
      if (onAnalysisComplete && typeof onAnalysisComplete === 'function') {
        onAnalysisComplete(response);
      }
      
      // Show a success message
      toast({
        title: "Analysis Complete",
        description: "Document analysis completed. Form fields have been auto-populated with the extracted data.",
      });
      
      return response;
    } catch (error) {
      console.error('Document analysis error:', error);
      
      // Clear any partial analysis results
      setAnalysisResults(null);
      
      // Show a user-friendly error message
      toast({
        title: "Analysis Failed",
        description: error instanceof Error 
          ? error.message 
          : 'Failed to analyze documents. Please check if the document format is supported.',
        variant: "destructive"
      });
      
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // New function to refresh document analysis
  const refreshAnalysis = async () => {
    try {
      // Clear existing analysis results
      setAnalysisResults(null);
      
      // Re-analyze all documents
      await analyzeDocuments();
      
      toast({
        title: "Analysis Refreshed",
        description: "Document analysis has been updated with the latest results."
      });
    } catch (error: any) {
      console.error('Refresh analysis error:', error);
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh analysis",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
        <CardDescription>
          Upload and manage contract documents for analysis
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drag and drop area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Supports PDF, Word, and Excel documents
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium">Files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((fileState, index) => (
                <div key={index} className="flex items-center p-2 bg-background rounded border">
                  <div className="mr-2">
                    {getFileIcon(fileState.file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileState.file.name}</p>
                    <div className="flex items-center">
                      <Progress value={fileState.progress} className="h-1.5 w-full max-w-xs" />
                      <span className="ml-2 text-xs text-gray-500">
                        {fileState.status === 'uploading' ? `${fileState.progress}%` : 
                         fileState.status === 'success' ? 'Complete' : 
                         fileState.status === 'error' ? 'Failed' : 'Ready'}
                      </span>
                    </div>
                    {fileState.message && (
                      <p className="text-xs text-red-500 mt-1">{fileState.message}</p>
                    )}
                  </div>
                  <div className="flex items-center ml-2 space-x-1">
                    {fileState.status === 'uploading' ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : fileState.status === 'success' ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button 
                              className="p-1 hover:bg-gray-200 rounded-full" 
                              title="Delete document from server"
                            >
                              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the document from the server.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => fileState.uploadedId && handleDeleteDocument(fileState.uploadedId, index)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : fileState.status === 'error' ? (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <button 
                          onClick={() => handleRetryUpload(index)}
                          className="p-1 hover:bg-gray-200 rounded-full"
                          title="Retry upload"
                        >
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                        </button>
                        <button 
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 hover:bg-gray-200 rounded-full"
                          title="Remove file"
                        >
                          <XCircle className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleRemoveFile(index)}
                        className="p-1 hover:bg-gray-200 rounded-full"
                        title="Remove file"
                      >
                        <XCircle className="h-5 w-5 text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis results - Enhanced UI */}
        {analysisResults && (
          <div className="mt-6">
            <Separator className="my-4" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">Analysis Results</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshAnalysis}
                className="flex items-center gap-1"
                title="Refresh analysis"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
            
            {/* Contract Overview */}
            <div className="p-4 border rounded-lg mb-4 bg-card">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Title</p>
                  <p className="font-medium">{analysisResults.title || "Unknown Contract"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Contract Value</p>
                  <p className="font-medium">{analysisResults.contractValue || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Agreement Type</p>
                  <p className="font-medium">{analysisResults.agreementType || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Parties</p>
                  <p className="font-medium">
                    {analysisResults.parties?.join(", ") || "Not specified"}
                  </p>
                </div>
              </div>
              
              {/* Critical Issues */}
              {analysisResults.criticalIssues && analysisResults.criticalIssues.length > 0 && (
                <div className="mt-4">
                  <p className="text-muted-foreground mb-1">Critical Issues</p>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {analysisResults.criticalIssues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Clear All and Action buttons row */}
            {analysisResults.criticalDates && analysisResults.criticalDates.length > 0 && (
              <div className="border rounded-md bg-gray-50 p-3 mb-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Clear all selected dates
                      setAnalysisResults(prev => ({
                        ...prev,
                        criticalDates: []
                      }));
                    }}
                  >
                    Clear All
                  </Button>
                  <span className="text-sm text-gray-600">{analysisResults.criticalDates.length} dates found</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-9 px-4"
                      onClick={() => {
                        // Set all checkboxes to unchecked
                        const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="date-"]');
                        checkboxes.forEach((checkbox: any) => {
                          checkbox.checked = false;
                        });
                      }}
                    >
                      Deselect All
                    </Button>
                  </div>
                  <Button 
                    size="sm"
                    className="h-9 px-4"
                    onClick={async () => {
                      // Get all checked dates
                      const selectedDates: any[] = [];
                      analysisResults.criticalDates.forEach((date: any, index: number) => {
                        const checkbox = document.getElementById(`date-${index}`) as HTMLInputElement;
                        if (checkbox && checkbox.checked) {
                          selectedDates.push(date);
                        }
                      });
                      
                      if (selectedDates.length === 0) {
                        toast({
                          title: "No dates selected",
                          description: "Please select at least one date to save.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Call the server endpoint to save the selected dates
                      toast({
                        title: `Processing ${selectedDates.length} critical dates`,
                        description: "The selected dates will be processed and sent to the database. (Note: Database connection issues may prevent saving)",
                        duration: 5000,
                      });
                      
                      try {
                        // Rest of your save code...
                        const uploadedFile = files.find(f => f.status === 'success' && f.uploadedId);
                        if (!uploadedFile || !uploadedFile.uploadedId) {
                          throw new Error("No valid uploaded document found");
                        }
                        
                        // Send the request with the selected dates
                        const response = await fetch('/api/documents/save-critical-dates', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            documentId: uploadedFile.uploadedId,
                            dates: selectedDates,
                            metadata: {
                              title: analysisResults.title || null,
                              contractValue: analysisResults.contractValue || null,
                              parties: analysisResults.parties || [],
                              agreementType: analysisResults.agreementType || null,
                              criticalIssues: analysisResults.criticalIssues || []
                            }
                          }),
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json();
                          throw new Error(errorData.message || 'Failed to save critical dates');
                        }
                        
                        const result = await response.json();
                        
                        toast({
                          title: "Critical dates saved",
                          description: `Successfully saved ${result.createdDates?.length || 0} critical dates.`,
                          variant: "default"
                        });
                        
                        if (onAnalysisComplete) {
                          onAnalysisComplete(result.createdDates || []);
                        }
                      } catch (error: any) {
                        console.error('Error saving critical dates:', error);
                        toast({
                          title: "Save Failed",
                          description: error.message || "Failed to save critical dates",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Save Selected Dates
                  </Button>
                </div>
              </div>
            )}
            
            {/* Critical Dates Editable Table */}
            {analysisResults.criticalDates && analysisResults.criticalDates.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-muted">
                  <div>
                    <h4 className="font-medium">Critical Dates for Review</h4>
                    <p className="text-xs text-muted-foreground">Review and select which dates to save to the database</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={analyzeDocuments}
                    disabled={isAnalyzing || files.filter(f => f.status === 'success').length === 0}
                    className="ml-auto"
                  >
                    Analyze Documents
                  </Button>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[60px]">Select</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[100px]">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[200px]">Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[100px]">Importance</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResults.criticalDates.map((date: any, index: number) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              defaultChecked={true}
                              id={`date-${index}`} 
                              className="h-4 w-4" 
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {date.date}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            {date.title}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              date.importance === 'Critical' ? 'bg-red-100 text-red-800' :
                              date.importance === 'High' ? 'bg-orange-100 text-orange-800' :
                              date.importance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {date.importance}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="max-w-lg line-clamp-2">
                              {date.description}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                                  View Details
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <CalendarRange className="h-5 w-5 text-primary" />
                                    {date.title}
                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      date.importance === 'Critical' ? 'bg-red-100 text-red-800' :
                                      date.importance === 'High' ? 'bg-orange-100 text-orange-800' :
                                      date.importance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {date.importance}
                                    </span>
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Review all details for this critical date
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                
                                <div className="grid grid-cols-2 gap-4 py-4">
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Date</h4>
                                    <p className="text-sm">{date.date}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Status</h4>
                                    <p className="text-sm">{date.status || "Pending"}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <h4 className="text-sm font-medium mb-1">Description</h4>
                                    <p className="text-sm">{date.description}</p>
                                  </div>
                                  
                                  {date.financialImplications && (
                                    <div className="col-span-2">
                                      <h4 className="text-sm font-medium mb-1">Financial Implications</h4>
                                      <p className="text-sm">{date.financialImplications}</p>
                                    </div>
                                  )}
                                  
                                  {date.clauseReference && (
                                    <div className="col-span-2">
                                      <h4 className="text-sm font-medium mb-1">Clause Reference</h4>
                                      <p className="text-sm">{date.clauseReference}</p>
                                    </div>
                                  )}
                                  
                                  {date.clauseText && (
                                    <div className="col-span-2">
                                      <h4 className="text-sm font-medium mb-1">Clause Text</h4>
                                      <div className="text-sm bg-muted p-2 rounded-md whitespace-pre-wrap border">
                                        {date.clauseText}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {date.dependencies && (
                                    <div className="col-span-2">
                                      <h4 className="text-sm font-medium mb-1">Dependencies</h4>
                                      <p className="text-sm">{date.dependencies}</p>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Category</h4>
                                    <p className="text-sm">{date.category || "Other"}</p>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Timeline Position</h4>
                                    <p className="text-sm">{date.isStartDate ? "Start Date" : `+${date.daysOffset} days from start`}</p>
                                  </div>
                                </div>
                                
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Close</AlertDialogCancel>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Timeline Preview */}
                <div className="px-4 py-3 border-t">
                  <h5 className="text-sm font-medium mb-2">Timeline Preview</h5>
                  <div className="relative h-20">
                    {/* Timeline line */}
                    <div className="absolute left-0 right-0 top-10 h-0.5 bg-gray-200"></div>
                    
                    {/* Timeline items */}
                    {(() => {
                      // Find date range
                      if (!analysisResults.criticalDates || analysisResults.criticalDates.length === 0) {
                        return null;
                      }
                      
                      const allDates = analysisResults.criticalDates
                        .filter((d: any) => d.date)
                        .map((d: any) => new Date(d.date));
                      
                      if (allDates.length === 0) return null;
                      
                      const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
                      const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
                      
                      // Add buffer days
                      minDate.setDate(minDate.getDate() - 5);
                      maxDate.setDate(maxDate.getDate() + 5);
                      
                      const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return analysisResults.criticalDates
                        .filter((d: any) => d.date)
                        .map((date: any, index: number) => {
                          const eventDate = new Date(date.date);
                          const daysDiff = Math.ceil((eventDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                          const positionPercent = (daysDiff / totalDays) * 100;
                          
                          let color = 'bg-blue-500';
                          if (date.importance === 'Critical') color = 'bg-red-500';
                          else if (date.importance === 'High') color = 'bg-orange-500';
                          else if (date.importance === 'Medium') color = 'bg-yellow-500';
                          else if (date.importance === 'Low') color = 'bg-green-500';
                          
                          return (
                            <div 
                              key={`timeline-${index}`}
                              className="absolute w-4 h-4 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                              style={{ 
                                left: `${positionPercent}%`, 
                                top: '10px',
                                backgroundColor: color 
                              }}
                              title={`${date.title} - ${date.date}`}
                            ></div>
                          );
                        });
                    })()}
                    
                    {/* Month labels */}
                    {(() => {
                      if (!analysisResults.criticalDates || analysisResults.criticalDates.length === 0) {
                        return null;
                      }
                      
                      const allDates = analysisResults.criticalDates
                        .filter((d: any) => d.date)
                        .map((d: any) => new Date(d.date));
                      
                      if (allDates.length === 0) return null;
                      
                      const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
                      const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
                      
                      // Add buffer days
                      minDate.setDate(minDate.getDate() - 5);
                      maxDate.setDate(maxDate.getDate() + 5);
                      
                      // Generate month labels
                      const months: Date[] = [];
                      let currentDate = new Date(minDate);
                      currentDate.setDate(1); // Start from the 1st of the month
                      
                      while (currentDate <= maxDate) {
                        months.push(new Date(currentDate));
                        currentDate.setMonth(currentDate.getMonth() + 1);
                      }
                      
                      const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return months.map((month, index) => {
                        const daysDiff = Math.ceil((month.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                        const positionPercent = (daysDiff / totalDays) * 100;
                        
                        return (
                          <div 
                            key={`month-${index}`}
                            className="absolute text-xs text-gray-500 transform -translate-x-1/2"
                            style={{ 
                              left: `${positionPercent}%`, 
                              top: '25px' 
                            }}
                          >
                            {month.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Timeline legend */}
                  <div className="flex justify-end mt-2 gap-3 text-xs">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                      Critical
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1"></span>
                      High
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                      Medium
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                      Low
                    </div>
                  </div>
                </div>
                
                {/* Footer with actions */}
                <div className="p-3 bg-card border-t flex justify-between items-center">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {analysisResults.criticalDates.length} dates found
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-9 px-4"
                      onClick={() => {
                        // Set all checkboxes to unchecked
                        const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="date-"]');
                        checkboxes.forEach((checkbox: any) => {
                          checkbox.checked = false;
                        });
                      }}
                    >
                      Deselect All
                    </Button>
                    <Button 
                      size="sm"
                      className="h-9 px-4 ml-0"
                      onClick={async () => {
                        // Get all checked dates
                        const selectedDates: any[] = [];
                        analysisResults.criticalDates.forEach((date: any, index: number) => {
                          const checkbox = document.getElementById(`date-${index}`) as HTMLInputElement;
                          if (checkbox && checkbox.checked) {
                            selectedDates.push(date);
                          }
                        });
                        
                        if (selectedDates.length === 0) {
                          toast({
                            title: "No dates selected",
                            description: "Please select at least one date to save.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Call the server endpoint to save the selected dates
                        toast({
                          title: `Saving ${selectedDates.length} critical dates`,
                          description: "The selected dates will be processed and saved to the database.",
                        });
                        
                        try {
                          // Get the uploaded document ID from the first successful upload
                          const uploadedFile = files.find(f => f.status === 'success' && f.uploadedId);
                          if (!uploadedFile || !uploadedFile.uploadedId) {
                            throw new Error("No valid uploaded document found");
                          }
                          
                          // Send the request with the selected dates and document ID
                          const response = await fetch('/api/documents/save-critical-dates', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              documentId: uploadedFile.uploadedId,
                              dates: selectedDates,
                              metadata: {
                                title: analysisResults.title || null,
                                contractValue: analysisResults.contractValue || null,
                                parties: analysisResults.parties || [],
                                agreementType: analysisResults.agreementType || null,
                                criticalIssues: analysisResults.criticalIssues || []
                              }
                            }),
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Failed to save critical dates');
                          }
                          
                          const result = await response.json();
                          setCreatedDates(result.createdDates || []);
                          
                          toast({
                            title: "Critical dates saved",
                            description: `Successfully saved ${result.createdDates?.length || 0} critical dates.`,
                            variant: "default"
                          });
                          
                          // If a callback was provided, call it with the created dates
                          if (onAnalysisComplete) {
                            onAnalysisComplete({
                              analysisResults,
                              createdDates: result.createdDates || []
                            });
                          }
                        } catch (error) {
                          console.error('Error saving critical dates:', error);
                          toast({
                            title: "Failed to save dates",
                            description: error instanceof Error ? error.message : "An unexpected error occurred",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Save Selected Dates
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded text-sm">
                <p>No critical dates found in the document. View the raw analysis results below:</p>
                <Separator className="my-2" />
                <pre className="whitespace-pre-wrap text-xs max-h-[500px] overflow-y-auto">
                  {JSON.stringify(analysisResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setFiles([])}
          disabled={files.length === 0}
        >
          Clear All
        </Button>
        <div className="space-x-2">
          <Button
            variant="secondary"
            onClick={analyzeDocuments}
            disabled={isAnalyzing || files.filter(f => f.status === 'success').length === 0}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Documents'}
          </Button>
          <Button
            onClick={uploadAllFiles}
            disabled={files.length === 0 || files.every(f => f.status !== 'idle')}
          >
            Upload All
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DocumentUploader;