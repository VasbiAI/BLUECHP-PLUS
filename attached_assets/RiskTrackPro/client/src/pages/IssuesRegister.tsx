import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TabNavigation from "@/components/TabNavigation";
import ProjectInfo from "@/components/ProjectInfo";
import IssueTable from "@/components/IssueTable";
import AddIssueModal from "@/components/AddIssueModal";
import EditIssueModal from "@/components/EditIssueModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { useIssues } from "@/hooks/useIssues";
import { useToast } from "@/hooks/use-toast";
import type { InsertIssue, Issue } from "@shared/schema";

const IssuesRegister = () => {
  const { toast } = useToast();
  const projectId = 1; // Default to the first project
  
  const { 
    issues = [], 
    isLoading, 
    createIssue, 
    updateIssue, 
    deleteIssue, 
    isCreating, 
    isUpdating, 
    isDeleting 
  } = useIssues(projectId) as {
    issues: Issue[];
    isLoading: boolean;
    createIssue: (issue: InsertIssue, options?: any) => void;
    updateIssue: (params: { id: number; data: Partial<InsertIssue> }, options?: any) => void;
    deleteIssue: (id: number, options?: any) => void;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
  };
  
  // Local state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  
  // Handlers
  const handleAddIssue = () => {
    setShowAddModal(true);
  };
  
  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
  };
  
  const handleDeleteIssue = (issue: Issue) => {
    setDeletingIssue(issue);
  };
  
  const handleSaveNewIssue = (data: InsertIssue) => {
    createIssue(data, {
      onSuccess: () => {
        setShowAddModal(false);
        toast({
          title: "Success",
          description: "Issue created successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error creating issue",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const handleUpdateIssue = (id: number, data: Partial<InsertIssue>) => {
    updateIssue({ id, data }, {
      onSuccess: () => {
        setEditingIssue(null);
        toast({
          title: "Success",
          description: "Issue updated successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error updating issue",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const handleConfirmDelete = () => {
    if (deletingIssue) {
      deleteIssue(deletingIssue.id, {
        onSuccess: () => {
          setDeletingIssue(null);
          toast({
            title: "Success",
            description: "Issue deleted successfully",
          });
        },
        onError: (error) => {
          toast({
            title: "Error deleting issue",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  return (
    <>
      <ProjectInfo projectId={projectId} />
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Issues Register Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-3 md:space-y-0">
          <h2 className="text-xl font-semibold">Issues Register</h2>
          
          <Button 
            onClick={handleAddIssue}
            className="bg-[#0066CC] hover:bg-[#0D47A1] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Issue
          </Button>
        </div>
        
        {/* Issue status summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { status: 'Open', color: 'bg-red-100 text-red-800 border-red-200' },
            { status: 'In Progress', color: 'bg-amber-100 text-amber-800 border-amber-200' },
            { status: 'Closed', color: 'bg-green-100 text-green-800 border-green-200' },
            { status: 'All Issues', color: 'bg-blue-100 text-blue-800 border-blue-200' }
          ].map((item) => {
            const count = item.status === 'All Issues' 
              ? issues.length 
              : issues.filter(issue => issue.status === item.status).length;
            
            return (
              <div 
                key={item.status} 
                className={`${item.color} rounded-lg border p-4 flex flex-col justify-between`}
              >
                <h3 className="font-medium">{item.status}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Issue Table */}
        <IssueTable 
          issues={issues}
          isLoading={isLoading}
          onEdit={handleEditIssue}
          onDelete={handleDeleteIssue}
        />
      </div>
      
      {/* Modals */}
      <AddIssueModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNewIssue}
        isSubmitting={isCreating}
        projectId={projectId}
        issues={issues}
      />
      
      <EditIssueModal
        open={!!editingIssue}
        onClose={() => setEditingIssue(null)}
        onSave={handleUpdateIssue}
        isSubmitting={isUpdating}
        issue={editingIssue}
      />
      
      <DeleteConfirmDialog
        open={!!deletingIssue}
        onClose={() => setDeletingIssue(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Issue"
        description={`Are you sure you want to delete issue ${deletingIssue?.uniqueId}? This action cannot be undone.`}
      />
    </>
  );
};

export default IssuesRegister;