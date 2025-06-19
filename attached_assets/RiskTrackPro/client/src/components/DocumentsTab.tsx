import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from 'lucide-react';
import { DocumentUploader } from '@/components/DocumentUploader';
import { useToast } from "@/hooks/use-toast";

interface DocumentsTabProps {
  criticalDateId?: number;
  readOnlyMode?: boolean;
  onAnalysisComplete?: (analysisData: any) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
  criticalDateId, 
  readOnlyMode = false,
  onAnalysisComplete
}) => {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Contract Documents</h3>
        <Badge variant="outline" className="text-sm">
          For AI Analysis
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Upload contract documents (PDF, Word, Excel) for AI analysis. The system will extract critical dates and contract terms automatically.
      </p>
      
      {readOnlyMode ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Document upload and management is not available in read-only mode.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DocumentUploader 
          criticalDateId={criticalDateId} 
          onUploadComplete={(document) => {
            toast({
              title: "Document uploaded",
              description: "The document has been uploaded successfully.",
            });
          }}
          onAnalysisComplete={onAnalysisComplete}
        />
      )}
    </div>
  );
};

export default DocumentsTab;