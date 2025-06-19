
import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { useToast } from '../../hooks/use-toast';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Check, 
  Filter, 
  Download,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface Risk {
  id: string;
  projectId: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskRating: number;
  mitigationStrategy?: string;
  owner?: string;
  status: 'active' | 'mitigated' | 'accepted';
  dateIdentified: string;
  dateUpdated: string;
  costImpact?: number;
  scheduleImpact?: number;
  comments?: string;
}

interface RiskTableProps {
  risks: Risk[];
  onRefresh?: () => void;
  isLoading?: boolean;
  onEdit?: (risk: Risk) => void;
  onDelete?: (risk: Risk) => void;
  onConvertToIssue?: (risk: Risk) => void;
  onDeleteRisk?: (risk: any) => void;
  projectId?: number | string;
}

const RiskTable: React.FC<RiskTableProps> = ({ 
  risks, 
  onRefresh,
  onEdit,
  onDelete,
  onConvertToIssue,
  onDeleteRisk,
  projectId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [riskToDelete, setRiskToDelete] = useState<Risk | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete risk mutation
  const deleteRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      const response = await fetch(`/api/risks/${riskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete risk');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast({
        title: 'Success',
        description: 'Risk has been deleted from the register',
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete risk: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Handle risk deletion
  const handleDeleteRisk = (risk: Risk) => {
    setRiskToDelete(risk);
    setIsDeleteDialogOpen(true);
  };

  // Confirm risk deletion
  const confirmDeleteRisk = () => {
    if (riskToDelete) {
      deleteRiskMutation.mutate(riskToDelete.id);
    }
  };

  // Filter risks based on search term
  const filteredRisks = risks ? risks.filter(risk => 
    risk.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (risk.owner && risk.owner.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  // Export to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = ['ID', 'Description', 'Category', 'Likelihood', 'Impact', 'Risk Rating', 'Mitigation', 'Owner', 'Status', 'Date Identified', 'Date Updated'];
    const csvContent = [
      headers.join(','),
      ...filteredRisks.map(risk => [
        risk.id,
        `"${risk.description.replace(/"/g, '""')}"`,
        risk.category,
        risk.likelihood,
        risk.impact,
        risk.riskRating,
        `"${(risk.mitigationStrategy || '').replace(/"/g, '""')}"`,
        risk.owner || '',
        risk.status,
        risk.dateIdentified,
        risk.dateUpdated
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `risk_register_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'mitigated': return 'bg-green-500';
      case 'accepted': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Get risk rating color
  const getRiskRatingColor = (rating: number) => {
    if (rating >= 15) return 'bg-red-600 text-white';
    if (rating >= 10) return 'bg-orange-500 text-white';
    if (rating >= 4) return 'bg-yellow-500';
    return 'bg-green-500 text-white';
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search risks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRisks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  {searchTerm ? 'No risks found matching your search' : 'No risks in register'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRisks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell className="font-medium">
                    {risk.description}
                    {risk.mitigationStrategy && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-semibold">Mitigation:</span> {risk.mitigationStrategy}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{risk.category}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${getRiskRatingColor(risk.riskRating)}`}>
                      {risk.riskRating}
                    </Badge>
                  </TableCell>
                  <TableCell>{risk.owner || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(risk.status)} text-white`}>
                      {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatDate(risk.dateUpdated)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Check className="mr-2 h-4 w-4" />
                          Mark as Mitigated
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteRisk(risk)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {isDeleteDialogOpen && riskToDelete && (
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDeleteRisk}
          title="Delete Risk"
          description="Are you sure you want to delete this risk? This action cannot be undone."
          itemToDelete={riskToDelete.description}
        />
      )}
    </div>
  );
};

export default RiskTable;
