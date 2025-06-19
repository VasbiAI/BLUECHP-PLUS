import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { EnhancedDocumentTimeline } from './EnhancedDocumentTimeline';
import { apiRequest } from "@/lib/queryClient";
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

interface EnhancedDocumentUploaderProps {
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

export const EnhancedDocumentUploader: React.FC<EnhancedDocumentUploaderProps> = ({ 
  criticalDateId,
  onUploadComplete,
  onAnalysisComplete
}) => {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    // Filter files by allowed types
    const validFiles = newFiles.filter(file => 
      allowedFileTypes.some(type => file.type.includes(type.split('/')[1]))
    );
    
    if (validFiles.length !== newFiles.length) {
      toast({
        title: "Some files were not added",
        description: "Only PDF, Word, and Excel documents are supported.",
        variant: "destructive",
      });
    }
    
    // Add valid files to state
    const newFileStates: FileUploadState[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'idle'
    }));
    
    setUploads(prev => [...prev, ...newFileStates]);
    
    // Start uploading the files
    newFileStates.forEach((_, index) => {
      const newIndex = uploads.length + index;
      handleUploadFile(newIndex);
    });
  };

  const handleUploadFile = async (index: number) => {
    const fileState = uploads[index];
    if (!fileState || fileState.status === 'success') return;
    
    setUploads(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading', progress: 0 } : f
    ));
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', fileState.file);
      
      // If we have a critical date ID, associate the upload with it
      if (criticalDateId) {
        formData.append('criticalDateId', criticalDateId.toString());
      }
      
      // Simulate progress updates
      let progressInterval = setInterval(() => {
        setUploads(prev => prev.map((f, i) => {
          if (i === index && f.status === 'uploading' && f.progress < 90) {
            return { ...f, progress: Math.min(f.progress + 5, 90) };
          }
          return f;
        }));
      }, 300);

      // Upload the file using fetch directly since we need to send FormData
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || !data.id) {
        throw new Error("Invalid response from server");
      }

      // Update file status to success and store the document ID
      setUploads(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'success', progress: 100, uploadedId: data.id } : f
      ));

      toast({
        title: "Upload Complete",
        description: `${fileState.file.name} uploaded successfully`,
      });

      if (onUploadComplete && typeof onUploadComplete === 'function') {
        onUploadComplete(data);
      }

      return data;

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update file status to error
      setUploads(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error', 
          progress: 0,
          message: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ));

      // Show a user-friendly error message
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });

      return null;
    }
  };

  const handleRetryUpload = (index: number) => {
    handleUploadFile(index);
  };

  const handleRemoveFile = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setUploads([]);
  };

  const handleDeleteDocument = async (documentId: number, index: number) => {
    try {
      await apiRequest(
        'DELETE',
        `/api/documents/${documentId}`
      );
      
      setUploads(prev => prev.filter((_, i) => i !== index));
      
      toast({
        title: "Document Deleted",
        description: "The document has been deleted from the server.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const analyseDocuments = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Get only successful uploads with valid document IDs
      const documentIds = uploads
        .filter(u => u.status === 'success' && u.uploadedId)
        .map(u => u.uploadedId);
      
      // Validate we have documents to analyze
      if (!documentIds.length) {
        toast({
          title: "No valid documents",
          description: "Please upload documents successfully before analyzing.",
        });
        return;
      }

      // Make the API request with better error handling
      const response = await fetch('/api/documents/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds })
      });

      // Handle HTTP errors properly
      if (!response.ok) {
        const contentType = response.headers.get("Content-Type") || "";
        const message = contentType.includes("application/json")
          ? (await response.json()).message
          : await response.text();
        throw new Error(`Server error: ${response.status} - ${message}`);
      }

      // Process the response with proper error handling
      const data = await response.json();
      
      // Extract and organize the results in a consistent way
      const results = data.analysisResults || data;
      const timeline = data.timelineData ?? results.criticalDates ?? results.dates ?? [];

      // Update state
      setAnalysisResults(results);
      setTimelineData(timeline);
      
      // Show timeline if we have data
      if (timeline.length > 0) {
        setActiveTab("timeline");
      }
      
      // Track any critical dates created from the analysis
      if (data.createdDates && Array.isArray(data.createdDates)) {
        setCreatedDates(data.createdDates);
      }
      
      // Store any message from the server
      if (data.message) {
        setMessage(data.message);
      }
      
      // Call the callback if available
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
      
      // Show a success message
      toast({
        title: "Analysis Complete",
        description: "Successfully extracted timeline information.",
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze documents",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contract Timeline Visualization</CardTitle>
        <CardDescription>
          Upload contracts to automatically generate critical date timelines
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">
              <FileText className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="timeline" disabled={timelineData.length === 0}>
              <CalendarRange className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="dates" disabled={createdDates.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              Critical Dates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="mt-4 space-y-4">
            {/* Display analysis error if any */}
            {analysisError && (
              <div className="bg-destructive/10 border border-destructive rounded-md p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h4 className="text-sm font-medium text-destructive">Analysis Error</h4>
                </div>
                <p className="text-xs mt-1 text-destructive">{analysisError}</p>
              </div>
            )}
          
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

            {/* Document Analysis Button */}
            {uploads.filter(upload => upload.status === 'success').length > 0 && (
              <div className="flex flex-col gap-2 items-center justify-center mt-4">
                <Button 
                  onClick={analyseDocuments} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                      Analysing Documents...
                    </>
                  ) : (
                    <>
                      <FilePenLine className="h-4 w-4 mr-2" />
                      Analyse Documents
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Analyse uploaded documents to extract critical dates and timeline information
                </p>
              </div>
            )}
            
            {/* File list */}
            {uploads.length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-medium">Files ({uploads.length})</h3>
                <div className="space-y-2">
                  {uploads.map((fileState, index) => (
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
                              <RefreshCw className="h-4 w-4 text-gray-500 hover:text-blue-500" />
                            </button>
                          </>
                        ) : (
                          <XCircle 
                            className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" 
                            onClick={() => handleRemoveFile(index)} 
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearAll}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs"
                  >
                    Add More
                  </Button>
                </div>
              </div>
            )}
            
            {/* Analysis Action */}
            {uploads.some(f => f.status === 'success') && (
              <div className="mt-4">
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium">Generate Timeline</h3>
                    <p className="text-xs text-muted-foreground">
                      Extract critical dates and create a visual timeline
                    </p>
                  </div>
                  
                  <Button
                    onClick={analyseDocuments}
                    disabled={isAnalyzing || !uploads.some(f => f.status === 'success')}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analysing...
                      </>
                    ) : (
                      'Generate Timeline'
                    )}
                  </Button>
                </div>
                
                {message && (
                  <div className="mt-4 p-3 rounded-md border bg-green-50 text-green-700 text-sm">
                    {message}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-4">
            {timelineData.length > 0 ? (
              <EnhancedDocumentTimeline 
                timelineData={timelineData}
                documentTitle={analysisResults?.title || "Contract Timeline"}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                <CalendarRange className="h-16 w-16 mb-4 text-gray-300" />
                <p>No timeline data available</p>
                <p className="text-sm text-gray-400">Upload and analyze a document first</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="dates" className="mt-4">
            {createdDates.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Generated Critical Dates</h3>
                <p className="text-sm text-gray-500">
                  The following critical dates were automatically extracted from your document:
                </p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {createdDates.map((date, idx) => (
                    <div key={idx} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{date.title}</h4>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          date.status?.toLowerCase().includes('critical') ? 'bg-red-100 text-red-800' : 
                          date.status?.toLowerCase().includes('high') ? 'bg-orange-100 text-orange-800' :
                          date.status?.toLowerCase().includes('medium') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {date.status || 'Active'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Due Date: {new Date(date.dueDate).toLocaleDateString()}
                      </div>
                      {date.criticalIssue === 'Yes' && (
                        <div className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span>Critical Issue</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                <FileText className="h-16 w-16 mb-4 text-gray-300" />
                <p>No critical dates created yet</p>
                <p className="text-sm text-gray-400">Generate a timeline to create dates automatically</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};