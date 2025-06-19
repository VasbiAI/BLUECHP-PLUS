import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, addWeeks, addMonths, differenceInDays, isBefore, isAfter, max, min } from 'date-fns';
import { CriticalDate } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  ArrowDownUp,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CriticalDateDependency {
  id: number;
  predecessorId: number;
  successorId: number;
  dependencyType: string;
  lagDays: number;
  description?: string;
}

interface GanttItem {
  id: number;
  title: string;
  date: Date;
  endDate?: Date;
  status: string;
  color: string;
  group?: string;
  dependencies?: number[];
  type: 'milestone' | 'task' | 'group';
  agreementType?: string;
}

interface CriticalDateGanttViewProps {
  projectId?: number;
  criticalDates?: CriticalDate[];
  dependencies?: CriticalDateDependency[];
}

const CriticalDateGanttView: React.FC<CriticalDateGanttViewProps> = ({
  projectId,
  criticalDates: initialCriticalDates,
  dependencies: initialDependencies
}) => {
  // Set up state for gantt view
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addMonths(new Date(), 3));
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week');
  const [groupBy, setGroupBy] = useState<'status' | 'department' | 'agreementType' | 'none'>('agreementType');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');
  const [warningItems, setWarningItems] = useState<{id: number, message: string}[]>([]);
  
  // Fetch critical dates if not provided
  const { data: fetchedCriticalDates, isLoading: isLoadingDates } = useQuery<CriticalDate[]>({
    queryKey: ['/api/critical-dates', projectId],
    queryFn: async () => {
      const url = projectId ? `/api/critical-dates?projectId=${projectId}` : '/api/critical-dates';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch critical dates');
      return response.json();
    },
    enabled: !initialCriticalDates,
  });
  
  // Fetch dependencies if not provided
  const { data: fetchedDependencies, isLoading: isLoadingDependencies } = useQuery<CriticalDateDependency[]>({
    queryKey: ['/api/critical-date-dependencies', projectId],
    queryFn: async () => {
      const url = projectId ? `/api/critical-date-dependencies?projectId=${projectId}` : '/api/critical-date-dependencies';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch dependencies');
      return response.json();
    },
    enabled: !initialDependencies,
  });
  
  // Use provided data or fetched data
  const criticalDates = initialCriticalDates || fetchedCriticalDates || [];
  const dependencies = initialDependencies || fetchedDependencies || [];
  
  // Convert critical dates to gantt items
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  
  // Map status to colors
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'open':
        return '#3b82f6'; // blue-500
      case 'in progress':
        return '#f59e0b'; // amber-500
      case 'completed':
        return '#10b981'; // emerald-500
      case 'closed':
        return '#6b7280'; // gray-500
      default:
        return '#3b82f6'; // blue-500
    }
  };
  
  // Process critical dates into gantt items
  useEffect(() => {
    if (criticalDates.length === 0) return;
    
    // Map dates to gantt items
    const items: GanttItem[] = criticalDates.map(date => {
      // Parse date string to Date object
      const dueDate = new Date(date.dueDate);
      
      // Determine group based on groupBy setting
      let group: string | undefined;
      switch (groupBy) {
        case 'status':
          group = date.status;
          break;
        case 'department':
          group = date.department || 'Uncategorized';
          break;
        case 'agreementType':
          group = date.agreementType || 'Other';
          break;
        default:
          group = undefined;
      }
      
      return {
        id: date.id,
        title: date.title,
        date: dueDate,
        status: date.status,
        color: getStatusColor(date.status),
        group,
        type: 'milestone',
        agreementType: date.agreementType || 'Other'
      };
    });
    
    // Add dependency info to items
    dependencies.forEach(dep => {
      const successor = items.find(item => item.id === dep.successorId);
      if (successor) {
        if (!successor.dependencies) {
          successor.dependencies = [];
        }
        successor.dependencies.push(dep.predecessorId);
      }
    });
    
    // Check for sequence warnings
    const warnings: {id: number, message: string}[] = [];
    
    // Check each dependency
    dependencies.forEach(dep => {
      const predecessor = items.find(item => item.id === dep.predecessorId);
      const successor = items.find(item => item.id === dep.successorId);
      
      if (predecessor && successor) {
        // Check if predecessor date is after successor date
        if (isAfter(predecessor.date, successor.date)) {
          warnings.push({
            id: successor.id,
            message: `Date occurs before its predecessor (${predecessor.title})`
          });
        }
      }
    });
    
    setWarningItems(warnings);
    
    // Sort items based on sortBy setting
    const sortedItems = [...items];
    switch (sortBy) {
      case 'date':
        sortedItems.sort((a, b) => a.date.getTime() - b.date.getTime());
        break;
      case 'title':
        sortedItems.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'status':
        sortedItems.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    
    setGanttItems(sortedItems);
    
    // Update view range based on dates
    if (items.length > 0) {
      // Find earliest and latest dates
      const dates = items.map(item => item.date);
      const earliest = min(dates);
      const latest = max(dates);
      
      // Set view range with 2 weeks padding on each side
      setStartDate(addDays(earliest, -14));
      setEndDate(addDays(latest, 14));
    }
  }, [criticalDates, dependencies, groupBy, sortBy]);
  
  // Navigation functions
  const moveForward = () => {
    switch (zoomLevel) {
      case 'day':
        setStartDate(addDays(startDate, 7));
        setEndDate(addDays(endDate, 7));
        break;
      case 'week':
        setStartDate(addWeeks(startDate, 4));
        setEndDate(addWeeks(endDate, 4));
        break;
      case 'month':
        setStartDate(addMonths(startDate, 3));
        setEndDate(addMonths(endDate, 3));
        break;
    }
  };
  
  const moveBackward = () => {
    switch (zoomLevel) {
      case 'day':
        setStartDate(addDays(startDate, -7));
        setEndDate(addDays(endDate, -7));
        break;
      case 'week':
        setStartDate(addWeeks(startDate, -4));
        setEndDate(addWeeks(endDate, -4));
        break;
      case 'month':
        setStartDate(addMonths(startDate, -3));
        setEndDate(addMonths(endDate, -3));
        break;
    }
  };
  
  const zoomIn = () => {
    if (zoomLevel === 'month') setZoomLevel('week');
    else if (zoomLevel === 'week') setZoomLevel('day');
  };
  
  const zoomOut = () => {
    if (zoomLevel === 'day') setZoomLevel('week');
    else if (zoomLevel === 'week') setZoomLevel('month');
  };
  
  // Generate time units for the gantt chart
  const generateTimeUnits = () => {
    const units = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      switch (zoomLevel) {
        case 'day':
          units.push({
            date: new Date(currentDate),
            label: format(currentDate, 'dd MMM')
          });
          currentDate = addDays(currentDate, 1);
          break;
        case 'week':
          units.push({
            date: new Date(currentDate),
            label: `Week ${format(currentDate, 'w')}`
          });
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'month':
          units.push({
            date: new Date(currentDate),
            label: format(currentDate, 'MMM yyyy')
          });
          currentDate = addMonths(currentDate, 1);
          break;
      }
    }
    
    return units;
  };
  
  const timeUnits = generateTimeUnits();
  
  // Group items based on groupBy setting
  const groupedItems = React.useMemo(() => {
    if (groupBy === 'none' || !ganttItems.length) return { 'All Items': ganttItems };
    
    return ganttItems.reduce((acc: {[key: string]: GanttItem[]}, item) => {
      const group = item.group || 'Other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {});
  }, [ganttItems, groupBy]);
  
  // Calculate position for gantt item
  const calculateItemPosition = (date: Date): { left: string, width: string } => {
    const totalDuration = differenceInDays(endDate, startDate);
    const daysFromStart = differenceInDays(date, startDate);
    
    // Calculate percentage position
    const leftPos = Math.max(0, (daysFromStart / totalDuration) * 100);
    
    return {
      left: `${leftPos}%`,
      width: '10px' // For milestone
    };
  };
  
  // Draw dependency lines
  const renderDependencyLines = () => {
    return dependencies.map(dep => {
      const predecessor = ganttItems.find(item => item.id === dep.predecessorId);
      const successor = ganttItems.find(item => item.id === dep.successorId);
      
      if (!predecessor || !successor) return null;
      
      // Calculate positions
      const predPos = calculateItemPosition(predecessor.date);
      const succPos = calculateItemPosition(successor.date);
      
      // Convert from string percentages to numbers
      const predLeft = parseFloat(predPos.left);
      const succLeft = parseFloat(succPos.left);
      
      // Only draw lines for visible items
      if (predLeft < 0 || predLeft > 100 || succLeft < 0 || succLeft > 100) return null;
      
      // Simple straight line for now - could be enhanced with SVG paths
      return (
        <div 
          key={`dep-${dep.id}`} 
          className="absolute border-t border-dashed border-gray-400 pointer-events-none"
          style={{
            left: `${predLeft}%`,
            width: `${succLeft - predLeft}%`,
            top: '50%',
            zIndex: 1
          }}
        />
      );
    });
  };
  
  // Loading state
  if (isLoadingDates || isLoadingDependencies) {
    return <div className="p-8 text-center">Loading critical date timeline...</div>;
  }
  
  // No data state
  if (ganttItems.length === 0) {
    return (
      <div className="p-8 text-center border rounded-md">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">No Critical Dates Available</h3>
        <p className="text-sm text-gray-500 mb-4">
          There are no critical dates to display in the timeline view.
        </p>
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-hidden border rounded-md">
      {/* Controls */}
      <div className="p-4 bg-muted flex flex-col sm:flex-row justify-between gap-2 items-center border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={moveBackward}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={moveForward}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-sm font-medium px-2">
            {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={zoomLevel} onValueChange={(value: 'day' | 'week' | 'month') => setZoomLevel(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Zoom Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={groupBy} onValueChange={(value: 'status' | 'department' | 'agreementType' | 'none') => setGroupBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="agreementType">Agreement Type</SelectItem>
              <SelectItem value="none">No Grouping</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'status') => setSortBy(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoomLevel === 'day'}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoomLevel === 'month'}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Timeline header */}
      <div className="relative border-b">
        <div className="flex pl-[250px]">
          {timeUnits.map((unit, index) => (
            <div 
              key={index} 
              className="text-xs text-center py-2 border-l first:border-l-0"
              style={{ 
                width: `${100 / timeUnits.length}%`,
                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
              }}
            >
              {unit.label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Gantt body */}
      <div className="relative overflow-x-auto max-h-[600px]">
        {Object.entries(groupedItems).map(([groupName, items], groupIndex) => (
          <div key={`group-${groupIndex}`} className="border-b last:border-b-0">
            {groupBy !== 'none' && (
              <div className="sticky left-0 w-[250px] font-medium p-3 bg-gray-50 border-r z-10">
                {groupName}
              </div>
            )}
            
            <div>
              {items.map((item, itemIndex) => {
                const itemPosition = calculateItemPosition(item.date);
                const warning = warningItems.find(w => w.id === item.id);
                
                return (
                  <div 
                    key={`item-${item.id}`} 
                    className="flex py-2 relative hover:bg-gray-50"
                    style={{ 
                      minHeight: '40px',
                      backgroundColor: itemIndex % 2 === 0 ? 'white' : '#fcfcfc' 
                    }}
                  >
                    {/* Item label */}
                    <div 
                      className="sticky left-0 w-[250px] flex items-center pl-4 pr-2 bg-white border-r z-10"
                      style={{ backgroundColor: itemIndex % 2 === 0 ? 'white' : '#fcfcfc' }}
                    >
                      <div className="truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2">
                                {warning && (
                                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                )}
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="truncate text-sm">{item.title}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px]">
                              <div className="space-y-1 text-sm">
                                <p><strong>{item.title}</strong></p>
                                <p>Due: {format(item.date, 'PPP')}</p>
                                <p>Status: {item.status}</p>
                                {item.agreementType && (
                                  <p>Agreement: {item.agreementType}</p>
                                )}
                                {warning && (
                                  <p className="text-amber-500">{warning.message}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    {/* Timeline area */}
                    <div className="flex-1 relative">
                      {/* Date marker */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`absolute h-5 w-5 rounded-full top-1/2 -mt-2.5 -ml-2.5 z-20 border-2 ${warning ? 'border-amber-500' : 'border-white'}`}
                              style={{ 
                                left: itemPosition.left,
                                backgroundColor: item.color
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1 text-sm">
                              <p><strong>{item.title}</strong></p>
                              <p>Due: {format(item.date, 'PPP')}</p>
                              {warning && (
                                <p className="text-amber-500">{warning.message}</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Warning summary if any */}
      {warningItems.length > 0 && (
        <div className="p-3 bg-amber-50 border-t">
          <h4 className="font-medium text-sm flex items-center gap-1 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Sequence Warnings ({warningItems.length})
          </h4>
          <ul className="text-sm space-y-1 text-amber-800">
            {warningItems.map((warning, i) => {
              const item = ganttItems.find(g => g.id === warning.id);
              return (
                <li key={`warning-${i}`} className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>
                    <strong>{item?.title}</strong>: {warning.message}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CriticalDateGanttView;