import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import TabNavigation from "@/components/TabNavigation";
import ProjectInfo from "@/components/ProjectInfo";
import CalendarView from "@/components/CalendarView";
import CriticalDateForm from "@/components/CriticalDateForm";
import CriticalDateImporter from "@/components/CriticalDateImporter";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, isBefore, isToday } from "date-fns";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  CalendarDays, 
  List,
  FileUp,
  FileDown,
  MoreHorizontal
} from "lucide-react";
import { exportCriticalDatesToCSV } from "@/lib/utils/csvExport";
import { type CriticalDate as CriticalDateType } from "@shared/schema";

// Use the imported type
type CriticalDate = CriticalDateType;

const CriticalDates = () => {
  const projectId = 1; // Default to first project
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [formOpen, setFormOpen] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<Partial<CriticalDate> | undefined>(undefined);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState({ id: projectId, name: "43 - 45 Beerwah Parade, BEERWAH" }); // Default project
  
  const { data: criticalDates, isLoading } = useQuery<CriticalDate[]>({
    queryKey: ['/api/critical-dates'],
    queryFn: async () => {
      const res = await fetch('/api/critical-dates');
      if (!res.ok) {
        throw new Error('Failed to fetch critical dates');
      }
      return res.json();
    }
  });
  
  // Filter critical dates based on search term
  const filteredDates = criticalDates?.filter(date => 
    date.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (date.criticalIssue && date.criticalIssue.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (date.entity && date.entity.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (date.department && date.department.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];
  
  // Format date string to display format
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    // Handle different date formats
    const parts = dateString.includes('/') 
      ? dateString.split('/') 
      : dateString.split('-');
    
    if (parts.length !== 3) return dateString;
    
    // Assume DD/MM/YYYY format from the data
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]);
    
    try {
      return format(new Date(year, month, day), 'dd MMM yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Parse date string to Date object (for calendar selection)
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    try {
      // Handle different date formats
      const parts = dateString.includes('/') 
        ? dateString.split('/') 
        : dateString.split('-');
      
      if (parts.length !== 3) return null;
      
      // Assume DD/MM/YYYY format from the data
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
      const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10);
      
      return new Date(year, month, day);
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  };
  
  // Check if date is in the past
  const isDatePast = (dateString: string) => {
    if (!dateString) return false;
    
    const parts = dateString.includes('/') 
      ? dateString.split('/') 
      : dateString.split('-');
    
    if (parts.length !== 3) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]);
    
    try {
      const date = new Date(year, month, day);
      return isBefore(date, new Date()) && !isToday(date);
    } catch (e) {
      return false;
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string, dueDate: string) => {
    if (isDatePast(dueDate) && status.toLowerCase() === "open") return "bg-red-100 text-red-800";
    if (status.toLowerCase() === "open") return "bg-blue-100 text-blue-800";
    if (status.toLowerCase() === "in progress") return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingDate(undefined);
    toast({
      title: "Success",
      description: "Critical date saved successfully.",
    });
  };
  
  // Handle edit click
  const handleEditClick = (date: CriticalDate) => {
    setEditingDate(date);
    setFormOpen(true);
  };
  
  // Handle calendar date selection
  const handleCalendarDateSelect = (date: Date) => {
    const formattedDate = format(date, 'dd/MM/yyyy');
    setEditingDate({
      ...{} as CriticalDate,
      title: "",
      status: "Open",
      dueDate: formattedDate,
    });
    setFormOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (dateToDelete) {
      try {
        const res = await fetch(`/api/critical-dates/${dateToDelete}`, {
          method: 'DELETE',
        });
        
        if (!res.ok) {
          throw new Error('Failed to delete critical date');
        }
        
        // Invalidate query to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/critical-dates'] });
        
        toast({
          title: "Success",
          description: "Critical date deleted successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete critical date.",
          variant: "destructive",
        });
      }
      
      setDeleteConfirmOpen(false);
      setDateToDelete(null);
    }
  };

  return (
    <>
      <ProjectInfo projectId={projectId} />
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Critical Dates</CardTitle>
                  <CardDescription>
                    Track and manage important dates, deadlines, and reminders for your project.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={viewMode === "list" ? "bg-muted" : ""}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="mr-2 h-4 w-4" />
                    List View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={viewMode === "calendar" ? "bg-muted" : ""}
                    onClick={() => setViewMode("calendar")}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Calendar View
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-2 mb-6 justify-between">
                <div className="relative max-w-md">
                  <Input
                    type="text"
                    placeholder="Search critical dates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
                
                <div className="flex gap-2">
                  {/* Import/Export Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Critical Dates</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setImporterOpen(true)}
                        className="cursor-pointer"
                      >
                        <FileUp className="mr-2 h-4 w-4" />
                        Import Dates
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (criticalDates && criticalDates.length > 0) {
                            exportCriticalDatesToCSV(criticalDates, selectedProject.name);
                            toast({
                              title: "Export Successful",
                              description: `${criticalDates.length} critical dates exported to CSV.`,
                            });
                          } else {
                            toast({
                              title: "Nothing to Export",
                              description: "There are no critical dates to export.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Export to CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Add New Date Button */}
                  <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-[#0066CC] hover:bg-[#0D47A1] text-white"
                        onClick={() => setEditingDate(undefined)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Date
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingDate ? 'Edit Critical Date' : 'Add New Critical Date'}
                        </DialogTitle>
                        <DialogDescription>
                          Enter the details for this critical date. Required fields are marked with an asterisk.
                        </DialogDescription>
                      </DialogHeader>
                      <CriticalDateForm 
                        initialData={editingDate}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setFormOpen(false)}
                        isEdit={!!editingDate}
                      />
                    </DialogContent>
                  </Dialog>
                  
                  {/* Import Dialog */}
                  <Dialog open={importerOpen} onOpenChange={setImporterOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Import Critical Dates</DialogTitle>
                        <DialogDescription>
                          Upload a CSV or Excel file to import critical dates for this project.
                        </DialogDescription>
                      </DialogHeader>
                      <CriticalDateImporter 
                        projectId={selectedProject.id}
                        projectName={selectedProject.name}
                        onSuccess={() => {
                          setImporterOpen(false);
                          queryClient.invalidateQueries({ queryKey: ['/api/critical-dates'] });
                        }}
                        onCancel={() => setImporterOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Deletion</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this critical date? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setDeleteConfirmOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                      >
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Tabs defaultValue={viewMode} value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "calendar")}>
                <TabsContent value="list" className="mt-0">
                  <div className="border rounded-md">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Critical Issue</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Reminder Days</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            Array(5).fill(0).map((_, index) => (
                              <TableRow key={index}>
                                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                              </TableRow>
                            ))
                          ) : filteredDates.length > 0 ? (
                            filteredDates.map((date) => (
                              <TableRow key={date.id}>
                                <TableCell className="font-medium">{date.title}</TableCell>
                                <TableCell>{date.criticalIssue || "-"}</TableCell>
                                <TableCell>{date.entity || "-"}</TableCell>
                                <TableCell>{formatDate(date.dueDate)}</TableCell>
                                <TableCell>
                                  {date.reminder1Days && (
                                    <span className="mr-1">{date.reminder1Days}d,</span>
                                  )}
                                  {date.reminder2Days && (
                                    <span className="mr-1">{date.reminder2Days}d,</span>
                                  )}
                                  {date.reminder3Days && (
                                    <span className="mr-1">{date.reminder3Days}d</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(date.status, date.dueDate)}>
                                    {isDatePast(date.dueDate) && date.status.toLowerCase() === "open" ? "Overdue" : date.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-[#0066CC] hover:text-[#0D47A1] transition-colors h-8 w-8 p-0"
                                      onClick={() => handleEditClick(date)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 transition-colors h-8 w-8 p-0"
                                      onClick={() => {
                                        setDateToDelete(date.id);
                                        setDeleteConfirmOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                No critical dates found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="calendar" className="mt-0">
                  <div className="border rounded-md p-4 bg-white">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[500px]">
                        <div className="text-center">
                          <Skeleton className="h-[400px] w-full mb-2" />
                          <Skeleton className="h-4 w-[200px] mx-auto" />
                        </div>
                      </div>
                    ) : (
                      <CalendarView 
                        criticalDates={filteredDates} 
                        onSelectDate={handleCalendarDateSelect}
                        onEditDate={handleEditClick}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CriticalDates;
