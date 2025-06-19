import { useState } from 'react';
import { Issue } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IssueTableProps {
  issues: Issue[];
  isLoading: boolean;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
}

type SortField = 'raisedBy' | 'ownedBy' | 'issueEvent' | 'issueEffect' | 'resolution' | 'category' | 'impact' | 'status' | 'assignedTo' | 'closedDate' | 'comments';
type SortOrder = 'asc' | 'desc';

const IssueTable = ({ issues, isLoading, onEdit, onDelete }: IssueTableProps) => {
  const [sortField, setSortField] = useState<SortField>('raisedBy');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const sortIssues = (a: Issue, b: Issue) => {
    let aValue = a[sortField] as string;
    let bValue = b[sortField] as string;
    
    // Handle undefined or null values
    aValue = aValue || '';
    bValue = bValue || '';
    
    // For numeric strings, use numeric sorting
    if (!isNaN(parseInt(aValue)) && !isNaN(parseInt(bValue))) {
      return sortOrder === 'asc' 
        ? parseInt(aValue) - parseInt(bValue)
        : parseInt(bValue) - parseInt(aValue);
    }
    
    // Default string comparison
    return sortOrder === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return (
      <ArrowUpDown 
        className={`ml-2 h-4 w-4 ${sortField === field ? 'opacity-100' : 'opacity-50'}`} 
      />
    );
  };
  
  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('open') || statusLower === 'active') return 'destructive';
    if (statusLower.includes('in progress')) return 'outline';
    if (statusLower.includes('closed') || statusLower.includes('resolved')) return 'default';
    return 'secondary';
  };

  const sortedIssues = [...issues].sort(sortIssues);

  if (isLoading) {
    return <div className="text-center py-4">Loading issues...</div>;
  }

  if (issues.length === 0) {
    return <div className="text-center py-4">No issues found</div>;
  }

  return (
    <div className="rounded-md border">
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('raisedBy')} className="cursor-pointer w-[120px]">
                Raised By {getSortIcon('raisedBy')}
              </TableHead>
              <TableHead onClick={() => handleSort('ownedBy')} className="cursor-pointer w-[120px]">
                Owned By {getSortIcon('ownedBy')}
              </TableHead>
              <TableHead onClick={() => handleSort('issueEvent')} className="cursor-pointer">
                Issue Event {getSortIcon('issueEvent')}
              </TableHead>
              <TableHead onClick={() => handleSort('issueEffect')} className="cursor-pointer">
                Issue Effect {getSortIcon('issueEffect')}
              </TableHead>
              <TableHead onClick={() => handleSort('resolution')} className="cursor-pointer">
                Resolution {getSortIcon('resolution')}
              </TableHead>
              <TableHead onClick={() => handleSort('category')} className="cursor-pointer w-[120px]">
                Category {getSortIcon('category')}
              </TableHead>
              <TableHead onClick={() => handleSort('impact')} className="cursor-pointer w-[80px]">
                Impact {getSortIcon('impact')}
              </TableHead>
              <TableHead onClick={() => handleSort('status')} className="cursor-pointer w-[100px]">
                Status {getSortIcon('status')}
              </TableHead>
              <TableHead onClick={() => handleSort('assignedTo')} className="cursor-pointer w-[120px]">
                Assigned To {getSortIcon('assignedTo')}
              </TableHead>
              <TableHead onClick={() => handleSort('closedDate')} className="cursor-pointer w-[120px]">
                Closed Date {getSortIcon('closedDate')}
              </TableHead>
              <TableHead onClick={() => handleSort('comments')} className="cursor-pointer w-[120px]">
                Comment {getSortIcon('comments')}
              </TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.raisedBy}</TableCell>
                <TableCell>{issue.ownedBy}</TableCell>
                <TableCell>{issue.issueEvent}</TableCell>
                <TableCell>{issue.issueEffect}</TableCell>
                <TableCell>{issue.resolution || "-"}</TableCell>
                <TableCell>{issue.category}</TableCell>
                <TableCell>{issue.impact}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(issue.status)}>
                    {issue.status}
                  </Badge>
                </TableCell>
                <TableCell>{issue.assignedTo}</TableCell>
                <TableCell>{issue.closedDate || "-"}</TableCell>
                <TableCell>{issue.comments || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(issue)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(issue)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default IssueTable;