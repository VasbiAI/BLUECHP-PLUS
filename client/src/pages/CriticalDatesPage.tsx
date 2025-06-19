import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, Calendar, List } from "lucide-react";
import { CriticalDate } from "@shared/riskTrackProSchema";
import TabNavigation from "@/components/risk-track-pro/TabNavigation";
import ProjectInfo from "@/components/risk-track-pro/ProjectInfo";
import CriticalDateForm from "@/components/risk-track-pro/CriticalDateForm";
import DeleteConfirmDialog from "@/components/risk-track-pro/DeleteConfirmDialog";
import { exportToCSV } from "@/lib/utils";

const CriticalDatesPage: React.FC = () => {
  const params = useParams();
  const projectId = params?.projectId;
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<CriticalDate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const {
    data: criticalDates,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["criticalDates", projectId],
    queryFn: async () => {
      const response = await axios.get<CriticalDate[]>(`/api/critical-dates/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  const handleAddDate = () => {
    setSelectedDate(null);
    setIsAddDateModalOpen(true);
  };

  const handleEditDate = (date: CriticalDate) => {
    setSelectedDate(date);
    setIsAddDateModalOpen(true);
  };

  const handleDeleteDate = (date: CriticalDate) => {
    setSelectedDate(date);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDate) return;

    try {
      await axios.delete(`/api/critical-dates/${selectedDate.id}`);
      refetch();
      setIsDeleteDialogOpen(false);
      setSelectedDate(null);
    } catch (error) {
      console.error("Failed to delete critical date:", error);
    }
  };

  const handleExportCSV = () => {
    if (!criticalDates) return;
    exportToCSV(criticalDates, `critical-dates-${projectId}`);
  };

  const renderCalendarView = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-[500px] w-full" />
        </div>
      );
    }

    return (
      <div className="p-4 min-h-[500px]">
        <h3 className="text-lg font-medium mb-4">Calendar view is under development</h3>
        <p>The calendar view will display all critical dates in a monthly calendar format.</p>
      </div>
    );
  };

  const renderListView = () => {
    if (isLoading) {
      return (
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 border">Title</th>
              <th className="text-left p-3 border">Due Date</th>
              <th className="text-left p-3 border">Priority</th>
              <th className="text-left p-3 border">Status</th>
              <th className="text-left p-3 border">Assigned To</th>
              <th className="text-left p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {criticalDates && criticalDates.length > 0 ? (
              criticalDates.map((date) => (
                <tr key={date.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 border">{date.title}</td>
                  <td className="p-3 border">{date.dueDate}</td>
                  <td className="p-3 border">{date.priority}</td>
                  <td className="p-3 border">{date.status}</td>
                  <td className="p-3 border">{date.assignedTo || "Unassigned"}</td>
                  <td className="p-3 border">
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditDate(date)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDate(date)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-3 text-center">
                  No critical dates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ProjectInfo projectId={projectId} />

      <TabNavigation 
        projectId={projectId || ''} 
        activeTab="critical-dates" 
      />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Critical Dates</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode("calendar")}>
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddDate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Date
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          {viewMode === "calendar" ? renderCalendarView() : renderListView()}
        </CardContent>
      </Card>

      {isAddDateModalOpen && (
        <CriticalDateForm
          projectId={projectId || ''}
          open={isAddDateModalOpen}
          onOpenChange={setIsAddDateModalOpen}
          initialData={selectedDate}
          onClose={() => {
            setIsAddDateModalOpen(false);
            setSelectedDate(null);
            refetch();
          }}
        />
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Critical Date"
        description="Are you sure you want to delete this critical date? This action cannot be undone."
      />
    </div>
  );
};

export default CriticalDatesPage;