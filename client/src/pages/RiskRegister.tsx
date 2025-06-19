import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Filter } from "lucide-react";
import { Risk } from "@shared/riskTrackProSchema";
import RiskTable from "@/components/risk-track-pro/RiskTable";
import AddRiskModal from "@/components/risk-track-pro/AddRiskModal";
import DeleteConfirmDialog from "@/components/risk-track-pro/DeleteConfirmDialog";
import TabNavigation from "@/components/risk-track-pro/TabNavigation";
import ProjectInfo from "@/components/risk-track-pro/ProjectInfo";
import { exportRisksToCSV } from "@/lib/utils";

const RiskRegisterOriginal: React.FC = () => {
  const params = useParams();
  const projectId = params?.projectId;
  const [isAddRiskModalOpen, setIsAddRiskModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: risks,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      const response = await axios.get<Risk[]>(`/api/risks/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  const handleAddRisk = () => {
    setIsAddRiskModalOpen(true);
  };

  const handleEditRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsAddRiskModalOpen(true);
  };

  const handleDeleteRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRisk) return;

    try {
      await axios.delete(`/api/risks/${selectedRisk.id}`);
      refetch();
      setIsDeleteDialogOpen(false);
      setSelectedRisk(null);
    } catch (error) {
      console.error("Failed to delete risk:", error);
    }
  };

  const handleConvertToIssue = async (risk: Risk) => {
    try {
      await axios.post(`/api/risks/${risk.id}/convert-to-issue`);
      refetch();
    } catch (error) {
      console.error("Failed to convert risk to issue:", error);
    }
  };

  const handleExportCSV = () => {
    if (!risks) return;
    exportRisksToCSV(risks, `risk-register-${projectId}`);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ProjectInfo projectId={projectId} />

      <TabNavigation 
        projectId={projectId || ''} 
        activeTab="risks" 
      />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Risk Register</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddRisk}>
            <Plus className="h-4 w-4 mr-2" />
            Add Risk
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
            <RiskTable
              risks={risks || []}
              isLoading={isLoading}
              onEdit={handleEditRisk}
              onDelete={handleDeleteRisk}
              onConvertToIssue={handleConvertToIssue}
            />
          )}
        </CardContent>
      </Card>

      {isAddRiskModalOpen && (
        <AddRiskModal
          projectId={projectId || ''}
          open={isAddRiskModalOpen}
          onOpenChange={setIsAddRiskModalOpen}
          initialData={selectedRisk}
          onClose={() => {
            setIsAddRiskModalOpen(false);
            setSelectedRisk(null);
            refetch();
          }}
        />
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Risk"
        description="Are you sure you want to delete this risk? This action cannot be undone."
      />
    </div>
  );
};

function RiskRegisterComponent() {
  const [activeTab, setActiveTab] = useState<string>("risk-register");
  const [isAddRiskModalOpen, setIsAddRiskModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [riskToDelete, setRiskToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [projectId, setProjectId] = useState<number>(1); // Default project ID

  // Get project info (can be expanded later)
  const projectInfo = {
    projectName: "BlueCHP Development",
    projectId: projectId,
    client: "BlueCHP Limited",
    status: "Active",
    lastUpdated: new Date().toISOString()
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleAddRisk = () => {
    setIsAddRiskModalOpen(true);
  };

  const handleDeleteRisk = (risk: any) => {
    setRiskToDelete(risk);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRisk = async () => {
    if (!riskToDelete) return;

    setIsSubmitting(true);
    try {
      // Delete risk through API
      await fetch(`/api/risks/${riskToDelete.id}`, {
        method: 'DELETE'
      });

      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setRiskToDelete(null);

      // You may want to refresh your data here
    } catch (error) {
      console.error('Failed to delete risk:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ProjectInfo project={projectInfo} />

      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      <div className="mt-6">
        {activeTab === "risk-register" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Risk Register</h2>
              <Button onClick={handleAddRisk}>
                <Plus className="mr-2 h-4 w-4" /> Add Risk
              </Button>
            </div>
            <RiskTable 
              projectId={projectId} 
              onDeleteRisk={handleDeleteRisk}
              risks={[]} // Add empty array to avoid the undefined error
            />
          </div>
        )}
      </div>

      <AddRiskModal 
        open={isAddRiskModalOpen} 
        onClose={() => setIsAddRiskModalOpen(false)}
        onSave={(risk) => {
          console.log('Risk saved:', risk);
          setIsAddRiskModalOpen(false);
        }}
        isSubmitting={isSubmitting} 
        projectId={projectId}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteRisk}
        isSubmitting={isSubmitting}
        title="Delete Risk"
        description="Are you sure you want to delete this risk? This action cannot be undone."
      />
    </div>
  );
}

// Export the current implementation as default
export default RiskRegisterComponent;