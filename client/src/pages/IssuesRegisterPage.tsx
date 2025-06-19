import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Filter } from "lucide-react";
import { Issue } from "@shared/riskTrackProSchema";
import IssueTable from "@/components/risk-track-pro/IssueTable";
import AddIssueModal from "@/components/risk-track-pro/AddIssueModal";
import DeleteConfirmDialog from "@/components/risk-track-pro/DeleteConfirmDialog";
import TabNavigation from "@/components/risk-track-pro/TabNavigation";
import ProjectInfo from "@/components/risk-track-pro/ProjectInfo";
import { exportToCSV } from "@/lib/utils";

const IssuesRegisterPage: React.FC = () => {
  const [location] = useLocation();
  const projectId = location.split('/')[2];
  const [isAddIssueModalOpen, setIsAddIssueModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: issues,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["issues", projectId],
    queryFn: async () => {
      const response = await axios.get<Issue[]>(`/api/issues/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  const handleAddIssue = () => {
    setIsAddIssueModalOpen(true);
  };

  const handleEditIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsAddIssueModalOpen(true);
  };

  const handleDeleteIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedIssue) return;

    try {
      await axios.delete(`/api/issues/${selectedIssue.id}`);
      refetch();
      setIsDeleteDialogOpen(false);
      setSelectedIssue(null);
    } catch (error) {
      console.error("Failed to delete issue:", error);
    }
  };

  const handleExportCSV = () => {
    if (!issues) return;
    exportToCSV(issues, `issues-register-${projectId}`);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ProjectInfo projectId={projectId} />

      <TabNavigation 
        projectId={projectId || ''} 
        activeTab="issues" 
      />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Issues Register</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddIssue}>
            <Plus className="h-4 w-4 mr-2" />
            Add Issue
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <IssueTable
              issues={issues || []}
              isLoading={isLoading}
              onEdit={handleEditIssue}
              onDelete={handleDeleteIssue}
            />
          )}
        </CardContent>
      </Card>

      {isAddIssueModalOpen && (
        <AddIssueModal
          projectId={projectId || ''}
          open={isAddIssueModalOpen}
          onOpenChange={setIsAddIssueModalOpen}
          initialData={selectedIssue}
          onClose={() => {
            setIsAddIssueModalOpen(false);
            setSelectedIssue(null);
            refetch();
          }}
        />
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Issue"
        description="Are you sure you want to delete this issue? This action cannot be undone."
      />
    </div>
  );
};

export default IssuesRegisterPage;