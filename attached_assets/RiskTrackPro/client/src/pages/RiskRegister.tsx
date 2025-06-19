import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet } from "lucide-react";
import TabNavigation from "@/components/TabNavigation";
import ProjectInfo from "@/components/ProjectInfo";
import RiskDashboard from "@/components/RiskDashboard";
import RiskFilter from "@/components/RiskFilter";
import RiskTable from "@/components/RiskTable";
import AddRiskModal from "@/components/AddRiskModal";
import EditRiskModal from "@/components/EditRiskModal";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import AddIssueModal from "@/components/AddIssueModal";
import CreateRegisterModal, { RegisterFormData } from "@/components/CreateRegisterModal";
import DynamicRiskModal from "@/components/DynamicRiskModal";
import FixedScrollbar from "@/components/FixedScrollbar";
import { useRisks } from "@/hooks/useRisks";
import { useIssues } from "@/hooks/useIssues"; 
import { useToast } from "@/hooks/use-toast";
import { type InsertRisk, type Risk, type InsertIssue, type Issue } from "@shared/schema";
import { RegisterType, DepartmentType } from "@/config/fieldVisibility";

const RiskRegister = () => {
  const { toast } = useToast();
  const projectId = 1; // Default to the first project
  
  const { 
    risks, 
    isLoading, 
    createRisk, 
    updateRisk, 
    deleteRisk, 
    convertRiskToIssue,
    isCreating, 
    isUpdating, 
    isDeleting,
    isConverting
  } = useRisks(projectId);
  
  // Get issues for the project
  const {
    issues: issuesData,
    createIssue,
    isCreating: isCreatingIssue
  } = useIssues(projectId);
  
  // Cast issues to the correct type
  const issues = (issuesData || []) as Issue[];
  
  // Local state
  const [filteredRisks, setFilteredRisks] = useState<Risk[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateRegisterModal, setShowCreateRegisterModal] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [deletingRisk, setDeletingRisk] = useState<Risk | null>(null);
  const [convertingRisk, setConvertingRisk] = useState<Risk | null>(null);
  const [selectedRegisterType, setSelectedRegisterType] = useState<RegisterType>('default');
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType>('default');
  const [showDynamicRiskModal, setShowDynamicRiskModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Initialize filtered risks when risks data changes
  useEffect(() => {
    if (risks && risks.length > 0) {
      // Default filter to show only open risks
      const openRisks = risks.filter(risk => risk.riskStatus === "Open");
      setFilteredRisks(openRisks.length > 0 ? openRisks : risks);
    } else {
      setFilteredRisks([]);
    }
  }, [risks]);
  
  // Handlers
  const handleAddRisk = () => {
    // Use the dynamic modal instead of the old modal
    setShowDynamicRiskModal(true);
  };
  
  const handleEditRisk = (risk: Risk) => {
    // Set the initial data for the dynamic modal
    setEditingRisk(risk);
    
    // Set register type and department based on the risk
    setSelectedRegisterType(risk.registerType as RegisterType || 'default');
    setSelectedDepartment(risk.department as DepartmentType || 'default');
    
    // Open the dynamic modal instead
    setShowDynamicRiskModal(true);
  };
  
  const handleDeleteRisk = (risk: Risk) => {
    setDeletingRisk(risk);
  };
  
  const handleSaveNewRisk = (data: any) => {
    createRisk(data as InsertRisk, {
      onSuccess: () => {
        setShowAddModal(false);
      },
      onError: (error) => {
        toast({
          title: "Error creating risk",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const handleUpdateRisk = (id: number, data: Partial<InsertRisk>) => {
    // Check if status is being changed to "Eventuated"
    if (data.riskStatus === "Eventuated") {
      // Find the risk being updated
      const riskToConvert = risks.find(risk => risk.id === id);
      if (riskToConvert) {
        // Close the edit modal first
        setEditingRisk(null);
        
        // Then convert the risk to an issue
        convertRiskToIssue(riskToConvert, {
          onError: (error) => {
            toast({
              title: "Error converting risk to issue",
              description: error.message,
              variant: "destructive",
            });
          }
        });
      }
    } else {
      // Normal update for other status changes
      updateRisk({ id, data }, {
        onSuccess: () => {
          setEditingRisk(null);
        },
        onError: (error) => {
          toast({
            title: "Error updating risk",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (deletingRisk) {
      deleteRisk(deletingRisk.id, {
        onSuccess: () => {
          setDeletingRisk(null);
        },
        onError: (error) => {
          toast({
            title: "Error deleting risk",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };
  
  // Handle risk to issue conversion
  const handleConvertToIssue = (risk: Risk) => {
    if (risk.issueId) {
      toast({
        title: "Already converted",
        description: `Risk ${risk.riskId} is already linked to an issue.`,
        variant: "default",
      });
      return;
    }
    
    // Set the risk to convert and show the modal instead of automatic conversion
    setConvertingRisk(risk);
  };
  
  // Handle saving the new issue from a risk
  const handleSaveConvertedIssue = (data: InsertIssue) => {
    if (!convertingRisk) return;
    
    // First create the issue with the data from the form
    createIssue(data, {
      onSuccess: (newIssue) => {
        // Then update the risk with a reference to the new issue
        updateRisk({
          id: convertingRisk.id,
          data: {
            issueId: newIssue.uniqueId,
            riskStatus: 'Eventuated' // Update the risk status to show it has eventuated
          }
        }, {
          onSuccess: () => {
            setConvertingRisk(null);
            toast({
              title: "Risk converted to issue",
              description: "The risk has been converted to an issue successfully.",
            });
          }
        });
      },
      onError: (error) => {
        toast({
          title: "Error creating issue from risk",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  // Handle showing the create register modal
  const handleShowCreateRegister = () => {
    setShowCreateRegisterModal(true);
  };
  
  // Handle creating a new register
  const handleCreateRegister = (data: RegisterFormData) => {
    // Here you would typically save the register data to your backend
    // For now, we'll just set the selected register type and department
    setSelectedRegisterType(data.registerType as RegisterType);
    setSelectedDepartment(data.department as DepartmentType);
    
    // Close the create register modal
    setShowCreateRegisterModal(false);
    
    // Show a success toast
    toast({
      title: "Register Created",
      description: `${data.registerName} register has been created successfully.`,
    });
    
    // Show the add risk modal with the new register type and department
    setShowDynamicRiskModal(true);
  };
  
  // Handle adding a risk using the dynamic form
  const handleAddRiskDynamic = (data: any) => {
    createRisk({
      ...data,
      projectId,
      registerType: selectedRegisterType,
      department: selectedDepartment
    } as InsertRisk, {
      onSuccess: () => {
        setShowDynamicRiskModal(false);
        toast({
          title: "Risk Added",
          description: "Risk has been added to the register successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error creating risk",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (filtered: Risk[]) => {
    setFilteredRisks(filtered);
  };
  
  // Handle search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setFilteredRisks(risks);
    } else {
      const filtered = risks.filter((risk) => {
        const searchVal = value.toLowerCase();
        return (
          risk.riskId?.toLowerCase().includes(searchVal) ||
          risk.riskEvent?.toLowerCase().includes(searchVal) ||
          risk.riskEffect?.toLowerCase().includes(searchVal) ||
          risk.riskCause?.toLowerCase().includes(searchVal) ||
          risk.ownedBy?.toLowerCase().includes(searchVal) ||
          risk.raisedBy?.toLowerCase().includes(searchVal) ||
          risk.riskCategory?.toLowerCase().includes(searchVal) ||
          risk.riskStatus?.toLowerCase().includes(searchVal)
        );
      });
      setFilteredRisks(filtered);
    }
  };

  return (
    <>
      <ProjectInfo projectId={projectId} />
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {/* Dashboard */}
        <RiskDashboard projectId={projectId} />
        
        {/* Risk Register Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold">Risk Register</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle filters"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={showFilters ? "text-blue-600 mr-1" : "text-gray-500 mr-1"}
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span className={showFilters ? "text-sm text-blue-600 font-medium" : "text-sm text-gray-500"}>
                {showFilters ? "Hide Filters" : "Show Filters"}
              </span>
            </button>
            
            <div className="relative w-64">
              <Input
                type="text"
                placeholder="Search risks..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-300"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleShowCreateRegister}
              className="bg-[#0066CC] hover:bg-[#0D47A1] text-white flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              Create New Register
            </Button>
            
            <Link href={`/projects/${projectId}/schedule`}>
              <Button 
                variant="outline"
                className="flex items-center"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Project Schedule
              </Button>
            </Link>
            
            <Button 
              onClick={handleAddRisk}
              className="bg-[#0066CC] hover:bg-[#0D47A1] text-white flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add New Risk
            </Button>
          </div>
        </div>
        
        {/* Filters - Collapsible */}
        {showFilters && (
          <RiskFilter 
            risks={risks} 
            onFilterChange={handleFilterChange}
            onCreateRegister={handleShowCreateRegister}
          />
        )}
        
        {/* Risk Table */}
        <div id="risk-table-container">
          <RiskTable 
            risks={filteredRisks}
            isLoading={isLoading}
            onEdit={handleEditRisk}
            onDelete={handleDeleteRisk}
            onConvertToIssue={handleConvertToIssue}
          />
        </div>
        
        {/* Fixed scrollbar that always stays visible */}
        <FixedScrollbar 
          targetSelector="#risk-table-container .overflow-x-auto" 
          className="md:mx-4"
        />
      </div>
      
      {/* Modals */}
      <AddRiskModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNewRisk}
        isSubmitting={isCreating}
        projectId={projectId}
        risks={risks}
      />
      
      <EditRiskModal
        open={!!editingRisk}
        onClose={() => setEditingRisk(null)}
        onSave={handleUpdateRisk}
        isSubmitting={isUpdating}
        risk={editingRisk}
      />
      
      <DeleteConfirmDialog
        open={!!deletingRisk}
        onClose={() => setDeletingRisk(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Risk"
        description={`Are you sure you want to delete risk ${deletingRisk?.riskId}? This action cannot be undone.`}
      />
      
      {/* Create Register Modal */}
      <CreateRegisterModal
        open={showCreateRegisterModal}
        onClose={() => setShowCreateRegisterModal(false)}
        onSave={handleCreateRegister}
        isSubmitting={isCreating}
      />
      
      {/* Dynamic Risk Modal */}
      <DynamicRiskModal
        open={showDynamicRiskModal}
        onClose={() => {
          setShowDynamicRiskModal(false);
          setEditingRisk(null);
        }}
        onSave={editingRisk ? 
          (data) => handleUpdateRisk(editingRisk.id, data) : 
          handleAddRiskDynamic
        }
        isSubmitting={editingRisk ? isUpdating : isCreating}
        projectId={projectId}
        risks={risks}
        initialData={editingRisk || undefined}
        initialRegisterType={selectedRegisterType}
        initialDepartment={selectedDepartment}
        modalTitle={editingRisk ? `Edit Risk: ${editingRisk.riskId}` : "Add Risk to Register"}
      />
      
      {/* Issue conversion modal */}
      <AddIssueModal
        open={convertingRisk !== null}
        onClose={() => setConvertingRisk(null)}
        onSave={handleSaveConvertedIssue}
        isSubmitting={isCreatingIssue}
        projectId={projectId}
        issues={issues}
        fromRisk={convertingRisk || undefined}
      />
    </>
  );
};

export default RiskRegister;
