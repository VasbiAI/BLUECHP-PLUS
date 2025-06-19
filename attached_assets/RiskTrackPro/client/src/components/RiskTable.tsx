import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ViewLinkedTasksButton from "@/components/ViewLinkedTasksButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Risk, riskLevels } from "@shared/schema";
import { 
  calculateRiskRating, 
  calculateResidualRisk, 
  getRiskLevel 
} from "@/lib/utils/riskCalculations";

interface RiskTableProps {
  risks: Risk[];
  isLoading: boolean;
  onEdit: (risk: Risk) => void;
  onDelete: (risk: Risk) => void;
  onConvertToIssue: (risk: Risk) => void;
}

type SortField = 'priorityRank' | 'riskId' | 'openDate' | 'raisedBy' | 'ownedBy' | 'responseOwner' | 'riskCause' | 'riskEvent' | 'riskEffect' | 'riskCategory' | 'probability' | 'impact' | 'riskRating' | 'riskStatus' | 'statusChangeDate' | 'dueDate';
type SortOrder = 'asc' | 'desc';

export default function RiskTable({ risks, isLoading, onEdit, onDelete, onConvertToIssue }: RiskTableProps) {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<SortField>('priorityRank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Use a single ref for synchronized scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // Sort risks
  const sortedRisks = [...risks].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];
    
    // Handle special cases
    if (sortField === 'openDate') {
      aValue = new Date(a.openDate).getTime();
      bValue = new Date(b.openDate).getTime();
    }
    
    // Convert string values to lowercase for case-insensitive sorting
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    // Handle null or undefined values
    if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;
    
    // Compare values
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Calculate pagination
  const totalRisks = sortedRisks.length;
  const totalPages = Math.ceil(totalRisks / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRisks);
  const displayRisks = sortedRisks.slice(startIndex, endIndex);
  
  // Get risk level color from schema-based level name
  const getRiskLevelColor = (levelName: string): string => {
    const level = riskLevels.find(l => l.name.toLowerCase() === levelName.toLowerCase());
    return level?.color || "#28A745"; // Default to green if not found
  };
  
  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
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
          className="ml-1 text-neutral-300"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
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
        className="ml-1 text-blue-600"
      >
        <path d="m7 15 5 5 5-5" />
      </svg>
    ) : (
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
        className="ml-1 text-blue-600"
      >
        <path d="m7 9 5-5 5 5" />
      </svg>
    );
  };
  
  // Column definitions for consistent width
  const columns = [
    { field: 'priorityRank', label: 'Priority', width: '80px' },
    { field: 'riskId', label: 'Risk ID', width: '100px' },
    { field: 'openDate', label: 'Open Date', width: '120px' },
    { field: 'ownedBy', label: 'Owned By', width: '120px' },
    { field: 'responseOwner', label: 'Response Owner', width: '120px', tooltip: 'Person responsible for implementing the risk response strategy' },
    { field: 'riskCause', label: 'Risk Cause', width: '200px' },
    { field: 'riskEvent', label: 'Risk Event', width: '200px' },
    { field: 'riskEffect', label: 'Risk Effect', width: '200px' },
    { field: 'riskCategory', label: 'Category', width: '120px' },
    { field: 'probability', label: 'Prob (%)', width: '90px' },
    { field: 'impact', label: 'Impact (0-100)', width: '90px' },
    { field: 'riskRating', label: 'Rating', width: '100px' },
    { field: 'responseType', label: 'Response', width: '120px' },
    { field: 'mitigation', label: 'Mitigation', width: '200px' },
    { field: 'prevention', label: 'Prevention', width: '200px' },
    { field: 'riskStatus', label: 'Status', width: '120px' },
    { field: 'statusChangeDate', label: 'Status Change Date', width: '150px' },
    { field: 'dueDate', label: 'Due Date', width: '120px' },
    { field: 'residualRisk', label: 'Residual Risk', width: '150px', hasInfoIcon: true },
    { field: 'taskLinks', label: 'Task Links', width: '100px' },
    { field: 'actions', label: 'Actions', width: '120px' }
  ];
  
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm mb-6 overflow-hidden relative">
      {/* Table container with fixed headers and synchronized scrolling */}
      <div 
        ref={tableContainerRef}
        className="overflow-auto"
        style={{ 
          height: "calc(100vh - 28rem)",
          position: "relative"
        }}
      >
        <table className="w-full border-collapse">
          {/* Fixed header */}
          <thead className="bg-neutral-100 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th 
                  key={col.field}
                  className={`px-4 py-3 text-left text-sm font-medium text-neutral-500 cursor-pointer border-b border-neutral-200`}
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => col.field !== 'actions' && handleSort(col.field as SortField)}
                >
                  <div className="flex items-center">
                    <span>{col.label}</span>
                    {(col.hasInfoIcon || col.tooltip) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                              className="ml-1 text-blue-400 cursor-help"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4" />
                              <path d="M12 8h.01" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent className="w-80 p-4">
                            {col.hasInfoIcon ? (
                              <div className="space-y-2">
                                <p className="font-medium text-sm">Risk Adjustment Factors:</p>
                                <div className="text-xs space-y-1">
                                  <p className="font-medium">Response Type adjustments:</p>
                                  <p>- Avoid: 0%</p>
                                  <p>- Transfer: 30-40%</p>
                                  <p>- Mitigate: 50-70%</p>
                                  <p>- Accept: 100%</p>
                                  <p className="font-medium mt-2">Status adjustments:</p>
                                  <p>- Active: 100%</p>
                                  <p>- Monitoring: 80%</p>
                                  <p>- In Progress: 60%</p>
                                  <p>- Closed: 0%</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm">{col.tooltip}</p>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {col.field !== 'actions' && getSortIcon(col.field as SortField)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Scrollable body */}
          <tbody>
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-neutral-200">
                  <td colSpan={columns.length} className="px-4 py-3">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : displayRisks.length > 0 ? (
              // Risk rows
              displayRisks.map((risk) => {
                // Calculate risk rating
                const riskRating = risk.riskRating || 
                  (risk.probability && risk.impact ? 
                    calculateRiskRating(risk.probability, risk.impact) : 
                    0);
                
                const riskLevel = getRiskLevel(riskRating);
                
                return (
                  <tr key={risk.id} className="hover:bg-neutral-50 border-b border-neutral-200">
                    <td className="px-4 py-3 font-medium text-center" style={{ width: columns[0].width }}>
                      {risk.priorityRank}
                    </td>
                    <td className="px-4 py-3" style={{ width: columns[1].width }}>
                      <span className="font-medium">{risk.riskId}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[2].width }}>
                      {new Date(risk.openDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[3].width }}>
                      {risk.ownedBy}
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[4].width }}>
                      {risk.responseOwner || risk.ownedBy}
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[5].width }}>
                      <div className="max-w-xs truncate" title={risk.riskCause}>
                        {risk.riskCause}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[6].width }}>
                      <div className="max-w-xs truncate" title={risk.riskEvent}>
                        {risk.riskEvent}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[7].width }}>
                      <div className="max-w-xs truncate" title={risk.riskEffect}>
                        {risk.riskEffect}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[8].width }}>
                      {risk.riskCategory}
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[9].width }}>
                      {Math.round(risk.probability * 100)}%
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[10].width }}>
                      {Math.round(risk.impact * 10)}
                    </td>
                    <td className="px-4 py-3" style={{ width: columns[11].width }}>
                      <div className="flex items-center space-x-1.5">
                        {(() => {
                          const level = getRiskLevel(riskRating);
                          const color = level.color;
                          
                          return (
                            <>
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ backgroundColor: color }}
                              >
                                {Math.round(riskRating)}
                              </div>
                              <span className="text-xs font-medium" style={{ color }}>
                                {level.name === 'Moderate' ? 'Mod' : level.name}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[12].width }}>
                      {risk.responseType}
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[13].width }}>
                      <div className="max-w-xs truncate" title={risk.mitigation}>
                        {risk.mitigation}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[14].width }}>
                      <div className="max-w-xs truncate" title={risk.prevention}>
                        {risk.prevention}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ width: columns[15].width }}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${risk.riskStatus === 'Active' ? 'bg-red-600 text-white' : 
                          risk.riskStatus === 'Monitoring' ? 'bg-blue-600 text-white' : 
                          risk.riskStatus === 'In Progress' ? 'bg-yellow-500 text-white' : 
                          risk.riskStatus === 'Eventuated' ? 'bg-purple-600 text-white' :
                          'bg-green-600 text-white'}`}>
                        {risk.riskStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[16].width }}>
                      {risk.statusChangeDate ? new Date(risk.statusChangeDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-400" style={{ width: columns[17].width }}>
                      {risk.dueDate ? new Date(risk.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ width: columns[18].width }}>
                      {(() => {
                        // Calculate residual risk
                        const residualRisk = calculateResidualRisk(
                          riskRating,
                          risk.responseType,
                          risk.riskStatus
                        );
                        
                        // Get risk level for residual risk using standard level definitions
                        const level = getRiskLevel(residualRisk);
                        const color = level.color;
                        
                        return (
                          <div className="flex items-center space-x-1.5">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: `${color}BB` }} // Add transparency
                            >
                              {Math.round(residualRisk)}
                            </div>
                            <span className="text-xs font-medium" style={{ color }}>
                              {level.name === 'Moderate' ? 'Mod' : level.name}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3" style={{ width: columns[17].width }}>
                      <div className="flex items-center justify-center">
                        {risk.taskLinks && risk.taskLinks.length > 0 ? (
                          <div className="flex flex-col items-center">
                            <ViewLinkedTasksButton 
                              riskId={risk.id} 
                              linkedTaskCount={risk.taskLinks?.length || 0} 
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">No linked tasks</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ width: columns[18].width }}>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEdit(risk)}
                          className="text-[#0066CC] hover:text-[#0D47A1] transition-colors h-8 w-8 p-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(risk)}
                          className="text-neutral-300 hover:text-neutral-400 transition-colors h-8 w-8 p-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => onConvertToIssue(risk)}
                          className={`transition-colors h-8 w-8 p-0 ${
                            risk.issueId ? 'text-neutral-200 cursor-not-allowed' : 'text-purple-400 hover:text-purple-600'
                          }`}
                          disabled={!!risk.issueId}
                          title={risk.issueId ? `Already linked to issue ${risk.issueId}` : "Convert to Issue"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </Button>
                        <Link href={`/projects/${risk.projectId}/schedule`}>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-600 transition-colors h-8 w-8 p-0"
                            title="View linked tasks in Project Schedule"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                              <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
                            </svg>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="border-b border-neutral-200">
                <td colSpan={columns.length} className="px-4 py-6 text-center text-neutral-400">
                  No risks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls in sticky footer */}
      <div className="border-t border-neutral-200 bg-white sticky bottom-0 left-0 right-0 z-10">
        <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <label className="text-sm text-neutral-400 mr-2">Show</label>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(parseInt(value, 10));
              setPage(1); // Reset to first page when changing page size
            }}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-neutral-400 ml-2">entries</span>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && setPage(page - 1)}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNumber = page <= 3
                  ? i + 1
                  : page >= totalPages - 2
                    ? totalPages - 4 + i
                    : page - 2 + i;
                
                if (pageNumber <= 0 || pageNumber > totalPages) return null;
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setPage(pageNumber)}
                      isActive={page === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && setPage(page + 1)}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}