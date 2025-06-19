import React, { useState } from 'react';
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

export function DocumentTimeline({ timelineData, documentTitle }: DocumentTimelineProps) {
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);

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
  const totalDays = differenceInDays(lastDate, firstDate) + 14; // Add some padding
  
  // Generate a list of months to display as labels
  const months = [];
  let currentDate = firstDate;
  while (currentDate <= lastDate) {
    const monthYear = format(currentDate, 'MMM yyyy');
    if (!months.includes(monthYear)) {
      months.push(monthYear);
    }
    currentDate = addDays(currentDate, 15); // Check every 15 days for a new month
  }

  const getItemPosition = (date: string) => {
    const itemDate = new Date(date);
    const daysDiff = differenceInDays(itemDate, firstDate);
    const position = (daysDiff / totalDays) * 100;
    return `${Math.max(0, Math.min(98, position))}%`; // Ensure it stays within bounds
  };

  const getImportanceColor = (importance?: string) => {
    // Darker, more vibrant colors to ensure visibility
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

  const handleItemClick = (item: TimelineItem) => {
    setSelectedTimelineItem(item);
    setShowDialog(true);
  };

  return (
    <div className="space-y-4">
      {documentTitle && (
        <div className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-medium">{documentTitle}</h3>
        </div>
      )}
      
      <Card>
        <CardContent className="p-4">
          {/* Timeline header with month markers */}
          <div className="relative h-8 mb-4 border-b border-gray-200">
            {months.map((month, index) => {
              // Approximate position based on the month in relation to the timeline
              const monthDate = parseISO(month.split(' ').join(' 1, '));
              const position = getItemPosition(monthDate.toISOString());
              
              return (
                <div 
                  key={index}
                  className="absolute transform -translate-x-1/2 text-xs text-gray-500"
                  style={{ left: position }}
                >
                  {month}
                  <div className="h-2 w-px bg-gray-300 mx-auto mt-1"></div>
                </div>
              );
            })}
          </div>
          
          {/* Main timeline */}
          <div className="relative h-24 border-b border-gray-200">
            {/* The timeline line */}
            <div className="absolute top-1/2 w-full h-0.5 bg-gray-300"></div>
            
            {/* Timeline items */}
            {sortedData.map((item, index) => {
              const position = getItemPosition(item.date);
              const isAbove = index % 2 === 0; // Alternate above/below
              
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`absolute w-7 h-7 rounded-full shadow-md ${getImportanceColor(item.importance)} hover:ring-2 hover:ring-offset-2 hover:ring-blue-400 transform -translate-x-1/2 ${
                          isAbove ? '-translate-y-1/2 top-1/3' : '-translate-y-1/2 top-2/3'
                        }`}
                        style={{ left: position, zIndex: 10 }}
                        onClick={() => handleItemClick(item)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                        {item.importance && (
                          <Badge className={getImportanceColor(item.importance)} variant="outline">
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
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <div>Start: {format(firstDate, 'MMM d, yyyy')}</div>
            <div>End: {format(lastDate, 'MMM d, yyyy')}</div>
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Critical</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span>High</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span>Low</span>
        </div>
      </div>
      
      {/* Detailed view dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTimelineItem?.title || 'Date Details'}</DialogTitle>
            <DialogDescription>
              {format(new Date(selectedTimelineItem?.date || new Date()), 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedTimelineItem?.importance && (
              <div className="flex items-center">
                <span className="font-medium w-40">Importance:</span>
                <Badge className={getImportanceColor(selectedTimelineItem.importance)}>
                  {selectedTimelineItem.importance}
                </Badge>
              </div>
            )}
            
            {selectedTimelineItem?.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="mt-1 text-sm">{selectedTimelineItem.description}</p>
              </div>
            )}
            
            {selectedTimelineItem?.clauseReference && (
              <div>
                <span className="font-medium">Clause Reference:</span>
                <p className="mt-1 text-sm">{selectedTimelineItem.clauseReference}</p>
              </div>
            )}
            
            {selectedTimelineItem?.clauseText && (
              <div>
                <span className="font-medium">Contract Clause:</span>
                <Card className="mt-1 p-3 bg-gray-50 text-sm border border-gray-200">
                  <p className="italic">{selectedTimelineItem.clauseText}</p>
                </Card>
              </div>
            )}
            
            {selectedTimelineItem?.dependencies && (
              <div>
                <span className="font-medium">Dependencies:</span>
                <p className="mt-1 text-sm">{selectedTimelineItem.dependencies}</p>
              </div>
            )}
            
            {selectedTimelineItem?.financialImplications && (
              <div>
                <span className="font-medium">Financial Implications:</span>
                <p className="mt-1 text-sm">{selectedTimelineItem.financialImplications}</p>
              </div>
            )}
            
            {selectedTimelineItem?.status && (
              <div className="flex items-center">
                <span className="font-medium w-40">Status:</span>
                <Badge variant="outline">{selectedTimelineItem.status}</Badge>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}