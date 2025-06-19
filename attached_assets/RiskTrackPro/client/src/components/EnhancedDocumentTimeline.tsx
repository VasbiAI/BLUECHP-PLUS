import React, { useState, useEffect } from 'react';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, CalendarRange, FileText, Info } from 'lucide-react';

interface TimelineItem {
  date: string;
  title?: string;
  description?: string;
  importance?: 'Critical' | 'High' | 'Medium' | 'Low';
  clauseReference?: string;
  clauseText?: string;
  dependencies?: string;
  financialImplications?: string;
  status?: string;
  category?: string;
}

interface DocumentTimelineProps {
  timelineData: TimelineItem[];
  documentTitle?: string;
}

export function EnhancedDocumentTimeline({ timelineData, documentTitle }: DocumentTimelineProps) {
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // Force re-render key

  // Force a re-render after component mounts to ensure dots are properly positioned
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setRenderKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [timelineData]);

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <CalendarRange className="h-12 w-12 mb-2" />
        <p>No timeline data available</p>
      </div>
    );
  }

  // Sort timeline data by date
  const sortedData = [...timelineData].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  // Calculate timeline boundaries
  const firstDate = new Date(sortedData[0].date);
  const lastDate = new Date(sortedData[sortedData.length - 1].date);
  const totalDays = Math.max(differenceInDays(lastDate, firstDate) + 14, 30); // Add padding and ensure minimum width
  
  // Generate month labels for the timeline
  const generateMonthLabels = () => {
    const labels = [];
    let currentDate = new Date(firstDate);
    
    // Ensure firstDate is at the beginning of a month
    currentDate.setDate(1);
    
    while (currentDate <= lastDate) {
      labels.push({
        date: new Date(currentDate),
        label: format(currentDate, 'MMM yyyy')
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return labels;
  };
  
  const monthLabels = generateMonthLabels();

  const getItemPosition = (date: Date | string) => {
    const itemDate = typeof date === 'string' ? new Date(date) : date;
    const daysDiff = differenceInDays(itemDate, firstDate);
    const position = (daysDiff / totalDays) * 100;
    return `${Math.max(0, Math.min(98, position))}%`; // Ensure it stays within bounds
  };

  // Get colors for timeline dots based on importance
  const getImportanceColor = (importance?: string) => {
    switch (importance?.toLowerCase()) {
      case 'critical':
        return 'bg-red-600 border-2 border-red-700';
      case 'high':
        return 'bg-orange-600 border-2 border-orange-700'; 
      case 'medium':
        return 'bg-yellow-600 border-2 border-yellow-700';
      case 'low':
        return 'bg-blue-600 border-2 border-blue-700';
      default:
        return 'bg-gray-600 border-2 border-gray-700';
    }
  };
  
  // Get simple color for legend
  const getLegendColor = (importance: string) => {
    switch (importance.toLowerCase()) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600'; 
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const handleItemClick = (item: TimelineItem) => {
    setSelectedTimelineItem(item);
    setShowDialog(true);
  };

  return (
    <Card className="mt-4" key={renderKey}>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Timeline Preview</h3>
        
        <div className="relative mb-6">
          {/* Month labels */}
          <div className="relative h-6 mb-2">
            {monthLabels.map((month, index) => (
              <div 
                key={index}
                className="absolute transform -translate-x-1/2 text-xs text-gray-500"
                style={{ left: getItemPosition(month.date) }}
              >
                {month.label}
                <div className="h-2 w-px bg-gray-300 mx-auto mt-1"></div>
              </div>
            ))}
          </div>
          
          {/* Main timeline */}
          <div className="relative h-32 border-b border-gray-200">
            {/* The timeline line */}
            <div className="absolute top-1/2 w-full h-1 bg-gray-300 z-0"></div>
            
            {/* Timeline items */}
            {sortedData.map((item, index) => {
              const position = getItemPosition(item.date);
              
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`absolute w-8 h-8 rounded-full shadow-lg ${getImportanceColor(item.importance)} hover:ring-2 hover:ring-offset-2 hover:ring-blue-400 transform -translate-x-1/2 -translate-y-1/2 top-1/2`}
                        style={{ 
                          left: position, 
                          zIndex: 20
                        }}
                        onClick={() => handleItemClick(item)}
                        aria-label={`Timeline event: ${item.title}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium">{item.title || 'Event'}</p>
                        <p className="text-xs">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                        {item.importance && (
                          <Badge className={getLegendColor(item.importance)} variant="outline">
                            {item.importance}
                          </Badge>
                        )}
                        {item.description && (
                          <p className="text-xs mt-1 line-clamp-3">{item.description}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-600 mr-1.5"></div>
              <span className="text-xs">Critical</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-orange-600 mr-1.5"></div>
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-600 mr-1.5"></div>
              <span className="text-xs">Medium</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-600 mr-1.5"></div>
              <span className="text-xs">Low</span>
            </div>
          </div>
        </div>
        
        {/* Item details dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedTimelineItem?.title || 'Event Details'}</DialogTitle>
              <DialogDescription>
                {selectedTimelineItem?.date ? format(new Date(selectedTimelineItem.date), 'MMMM d, yyyy') : ''}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              {selectedTimelineItem?.importance && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Importance</p>
                    <Badge className={getLegendColor(selectedTimelineItem.importance)} variant="outline">
                      {selectedTimelineItem.importance}
                    </Badge>
                  </div>
                </div>
              )}
              
              {selectedTimelineItem?.description && (
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Description</p>
                    <p className="text-sm text-gray-600">{selectedTimelineItem.description}</p>
                  </div>
                </div>
              )}
              
              {selectedTimelineItem?.clauseReference && (
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Clause Reference</p>
                    <p className="text-sm text-gray-600">{selectedTimelineItem.clauseReference}</p>
                  </div>
                </div>
              )}
              
              {selectedTimelineItem?.clauseText && (
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Clause Text</p>
                    <p className="text-sm text-gray-600 max-h-32 overflow-y-auto">{selectedTimelineItem.clauseText}</p>
                  </div>
                </div>
              )}
              
              {selectedTimelineItem?.dependencies && (
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Dependencies</p>
                    <p className="text-sm text-gray-600">{selectedTimelineItem.dependencies}</p>
                  </div>
                </div>
              )}
              
              {selectedTimelineItem?.financialImplications && (
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Financial Implications</p>
                    <p className="text-sm text-gray-600">{selectedTimelineItem.financialImplications}</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}