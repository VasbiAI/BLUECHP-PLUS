
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AddIssueModal } from "./AddIssueModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  dueDate?: string;
  resolution?: string;
  createdAt: string;
}

interface IssueTableProps {
  issues: Issue[];
  projectId?: string;
  isLoading?: boolean;
  onEdit?: (issue: Issue) => void;
  onDelete?: (issue: Issue) => void;
  onAddIssue?: (issueData: Omit<Issue, 'id'>) => void;
  onUpdateIssue?: (id: string, issueData: Partial<Issue>) => void;
  onDeleteIssue?: (id: string) => void;
}

function IssueTable({ 
  issues, 
  projectId, 
  isLoading, 
  onEdit, 
  onDelete, 
  onAddIssue, 
  onUpdateIssue, 
  onDeleteIssue 
}: IssueTableProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  
  const handleAddIssue = (issueData: any) => {
    if (onAddIssue) {
      onAddIssue(issueData);
    }
    setIsAddModalOpen(false);
  };
  
  const handleDeleteIssue = () => {
    if (selectedIssue) {
      if (onDeleteIssue) {
        onDeleteIssue(selectedIssue.id);
      } else if (onDelete) {
        onDelete(selectedIssue);
      }
      setIsDeleteDialogOpen(false);
      setSelectedIssue(null);
    }
  };
  
  const getPriorityBadge = (priority: Issue['priority']) => {
    const variants = {
      high: "destructive",
      medium: "warning",
      low: "secondary"
    };
    return <Badge variant={variants[priority] as any}>{priority}</Badge>;
  };
  
  const getStatusBadge = (status: Issue['status']) => {
    const variants = {
      'open': "secondary",
      'in-progress': "warning",
      'resolved': "success",
      'closed': "outline"
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };
  
  return (
    <>
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Issues Register</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>Add Issue</Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No issues found. Click 'Add Issue' to create one.
                </TableCell>
              </TableRow>
            ) : (
              issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.title}</TableCell>
                  <TableCell>{getPriorityBadge(issue.priority)}</TableCell>
                  <TableCell>{getStatusBadge(issue.status)}</TableCell>
                  <TableCell>{issue.assignedTo || '-'}</TableCell>
                  <TableCell>
                    {issue.dueDate ? format(parseISO(issue.dueDate), 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            if (onEdit && issue) {
                              onEdit(issue);
                            } else {
                              console.log("Edit issue", issue.id);
                            }
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            // View details here 
                            console.log("View issue details", issue.id);
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedIssue(issue);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Issue
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
      
      {isAddModalOpen && (
        <AddIssueModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddIssue}
        />
      )}
      
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteIssue}
        title="Delete Issue"
        description="Are you sure you want to delete this issue? This action cannot be undone."
      />
    </>
  );
}

export default IssueTable;
