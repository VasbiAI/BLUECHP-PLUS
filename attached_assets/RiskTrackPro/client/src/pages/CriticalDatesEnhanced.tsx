import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { format, parseISO, isAfter } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { CriticalDate } from '@shared/schema';
import EnhancedCriticalDateForm from '@/components/EnhancedCriticalDateForm';
import ExternalAccessManager from '@/components/ExternalAccessManager';
import CriticalDateGanttView from '@/components/CriticalDateGanttView';
import { EnhancedDocumentUploader } from '@/components/EnhancedDocumentUploader';
import { apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Calendar,
  Download,
  ExternalLink,
  Filter,
  Link,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Trash2,
} from 'lucide-react';

const CriticalDatesEnhanced: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const parsedProjectId = projectId ? parseInt(projectId) : undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExternalAccessManager, setShowExternalAccessManager] = useState(false);
  const [selectedCriticalDate, setSelectedCriticalDate] = useState<CriticalDate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDateIds, setSelectedDateIds] = useState<number[]>([]);
  
  // Fetch critical dates
  const { data: criticalDates, isLoading } = useQuery<CriticalDate[]>({
    queryKey: ['/api/critical-dates', parsedProjectId],
    queryFn: async () => {
      const url = parsedProjectId ? `/api/critical-dates?projectId=${parsedProjectId}` : '/api/critical-dates';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch critical dates');
      return response.json();
    }
  });

  // Fetch project details if needed
  const { data: project } = useQuery({
    queryKey: ['/api/projects', parsedProjectId],
    queryFn: async () => {
      if (!parsedProjectId) return null;
      const response = await fetch(`/api/projects/${parsedProjectId}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      return response.json();
    },
    enabled: !!parsedProjectId
  });
  
  // Filter critical dates based on search term
  const filteredDates = criticalDates?.filter(date => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      date.title.toLowerCase().includes(searchLower) ||
      (date.criticalIssue && date.criticalIssue.toLowerCase().includes(searchLower)) ||
      (date.agreementType && date.agreementType.toLowerCase().includes(searchLower)) ||
      (date.department && date.department.toLowerCase().includes(searchLower))
    );
  }) || [];
  
  // Handle adding a new critical date
  const handleAddCriticalDate = () => {
    setSelectedCriticalDate(null);
    setShowAddForm(true);
  };
  
  // Handle editing a critical date
  const handleEditCriticalDate = (date: CriticalDate) => {
    setSelectedCriticalDate(date);
    setShowAddForm(true);
  };
  
  // Handle deleting a critical date
  const handleConfirmDelete = async () => {
    if (!selectedCriticalDate) return;
    
    try {
      // Use fetch directly instead of apiRequest for better control
      const response = await fetch(`/api/critical-dates/${selectedCriticalDate.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Delete failed with status: ${response.status}`);
      }
      
      // Invalidate the cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/critical-dates'] });
      
      toast({
        title: 'Critical date deleted',
        description: 'The critical date has been deleted successfully.',
      });
      
      setShowDeleteDialog(false);
      setSelectedCriticalDate(null);
    } catch (error) {
      console.error('Error deleting critical date:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete critical date. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle toggling selection of dates
  const toggleDateSelection = (dateId: number) => {
    if (selectedDateIds.includes(dateId)) {
      setSelectedDateIds(selectedDateIds.filter(id => id !== dateId));
    } else {
      setSelectedDateIds([...selectedDateIds, dateId]);
    }
  };
  
  // Handle managing external access
  const handleManageExternalAccess = () => {
    setShowExternalAccessManager(true);
  };
  
  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Check if date is overdue
  const isOverdue = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isAfter(new Date(), date) && date.getTime() > 0;
    } catch (e) {
      return false;
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Critical Dates</h1>
          <p className="text-muted-foreground">
            {parsedProjectId && project 
              ? `${project.name} - Critical Dates` 
              : 'Manage and track all critical dates across projects'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search critical dates..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}>
            {viewMode === 'list' ? <Calendar className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
            {viewMode === 'list' ? 'Timeline View' : 'List View'}
          </Button>
          
          <Button onClick={handleAddCriticalDate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Critical Date
          </Button>
          
          {selectedDateIds.length > 0 && (
            <Button variant="outline" onClick={handleManageExternalAccess}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Selected ({selectedDateIds.length})
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading critical dates...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredDates.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-64">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No critical dates found</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {searchTerm 
                  ? `No critical dates match your search for "${searchTerm}"`
                  : "You haven't added any critical dates yet. Add your first critical date to start tracking important deadlines."}
              </p>
              <Button onClick={handleAddCriticalDate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Critical Date
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'list' ? (
            <Card>
              <CardContent className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Agreement Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDates.map((date) => (
                      <TableRow key={date.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={selectedDateIds.includes(date.id)}
                            onChange={() => toggleDateSelection(date.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{date.title}</TableCell>
                        <TableCell>
                          {isOverdue(date.dueDate) ? (
                            <div className="flex items-center">
                              <Badge variant="destructive" className="mr-2">Overdue</Badge>
                              {formatDateDisplay(date.dueDate)}
                            </div>
                          ) : (
                            formatDateDisplay(date.dueDate)
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            date.status === 'Open' ? 'default' :
                            date.status === 'Completed' ? 'secondary' :
                            date.status === 'In Progress' ? 'outline' : 'default'
                          }>
                            {date.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{date.department || 'N/A'}</TableCell>
                        <TableCell>{date.agreementType || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditCriticalDate(date)}>
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCriticalDate(date);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                Delete date
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedDateIds([date.id]);
                                handleManageExternalAccess();
                              }}>
                                Share externally
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <CriticalDateGanttView 
              projectId={parsedProjectId}
              criticalDates={filteredDates}
            />
          )}
        </>
      )}
      
      {/* Critical Date Form Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCriticalDate ? 'Edit Critical Date' : 'Add New Critical Date'}</DialogTitle>
            <DialogDescription>
              {selectedCriticalDate 
                ? `Update details for: ${selectedCriticalDate.title}` 
                : 'Fill in the details to create a new critical date for tracking.'}
            </DialogDescription>
          </DialogHeader>
          
          <EnhancedCriticalDateForm
            initialData={selectedCriticalDate || undefined}
            isEdit={!!selectedCriticalDate}
            onSuccess={() => {
              setShowAddForm(false);
              queryClient.invalidateQueries({ queryKey: ['/api/critical-dates'] });
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Critical Date</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this critical date? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCriticalDate && (
            <div className="border rounded-md p-4 bg-muted/50 my-4">
              <p className="font-medium">{selectedCriticalDate.title}</p>
              <p className="text-sm text-muted-foreground">Due: {formatDateDisplay(selectedCriticalDate.dueDate)}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* External Access Manager Dialog */}
      <Dialog open={showExternalAccessManager} onOpenChange={setShowExternalAccessManager}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>External Access Management</DialogTitle>
            <DialogDescription>
              Securely share critical dates with external parties like insurers and lawyers.
            </DialogDescription>
          </DialogHeader>
          
          <ExternalAccessManager
            projectId={parsedProjectId}
            criticalDateIds={selectedDateIds}
            onSuccess={() => setShowExternalAccessManager(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CriticalDatesEnhanced;