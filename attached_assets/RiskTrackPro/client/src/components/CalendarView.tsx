import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, addDays, isBefore } from 'date-fns';
import { parseDate, formatDate, hasDateOccurred, getDaysRemaining } from '@/lib/utils/dateUtils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight, Calendar as CalendarIcon, CheckCircle, AlertCircle, CalendarClock } from 'lucide-react';

// Setup react-big-calendar localizer
import { enUS } from 'date-fns/locale';
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  criticalDates: any[];
  onSelectDate?: (date: Date) => void;
  onEditDate?: (date: any) => void;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: any; // Original critical date data
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  criticalDates, 
  onSelectDate,
  onEditDate
}) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // We're using the parseDate utility function from dateUtils.ts
  
  // Convert critical dates to calendar events
  const events: CalendarEvent[] = criticalDates
    .map(date => {
      const dueDate = parseDate(date.dueDate);
      if (!dueDate) return null;
      
      // Create event
      return {
        id: date.id,
        title: date.title,
        start: dueDate,
        end: dueDate,
        allDay: true,
        resource: date,
      };
    })
    .filter(Boolean) as CalendarEvent[];
  
  // Handle event click
  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };
  
  // Format date to display format
  const formatDisplayDate = (dateString: string): string => {
    const date = parseDate(dateString);
    if (!date) return dateString;
    return format(date, 'dd MMM yyyy');
  };
  
  // Check if date is overdue
  const isOverdue = (dateString: string): boolean => {
    return hasDateOccurred(dateString) && getDaysRemaining(dateString) < 0;
  };
  
  // Calendar event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const isDatePast = isOverdue(event.resource.dueDate);
    const status = event.resource.status.toLowerCase();
    
    let style: React.CSSProperties = {
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0',
      display: 'block',
    };
    
    // Style based on status and due date
    if (status === 'closed') {
      style.backgroundColor = '#28a745';
    } else if (isDatePast) {
      style.backgroundColor = '#dc3545';
    } else if (status === 'in progress') {
      style.backgroundColor = '#fd7e14';
    } else {
      style.backgroundColor = '#0066CC';
    }
    
    return {
      style,
    };
  };

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={handleEventSelect}
        onSelectSlot={(slotInfo: { start: Date }) => onSelectDate && onSelectDate(slotInfo.start)}
        selectable
        popup
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
      />
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Critical Date Details
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">Due Date:</span>
                </div>
                <Badge className={
                  isOverdue(selectedEvent.resource.dueDate)
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }>
                  {formatDisplayDate(selectedEvent.resource.dueDate)}
                  {isOverdue(selectedEvent.resource.dueDate) ? (
                    <span className="ml-1">(Overdue by {Math.abs(getDaysRemaining(selectedEvent.resource.dueDate))} days)</span>
                  ) : (
                    <span className="ml-1">({getDaysRemaining(selectedEvent.resource.dueDate)} days remaining)</span>
                  )}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className={
                    selectedEvent.resource.status.toLowerCase() === "open"
                      ? "bg-blue-100 text-blue-800"
                      : selectedEvent.resource.status.toLowerCase() === "closed"
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }>
                    {selectedEvent.resource.status}
                  </Badge>
                </div>
                {selectedEvent.resource.entity && (
                  <span className="text-sm text-gray-500">
                    {selectedEvent.resource.entity}
                  </span>
                )}
              </div>
              
              {selectedEvent.resource.criticalIssue && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Critical Issue:</h4>
                      <p className="text-sm text-amber-700">{selectedEvent.resource.criticalIssue}</p>
                      {selectedEvent.resource.criticalIssueDescription && (
                        <p className="text-xs text-amber-600 mt-1">
                          {selectedEvent.resource.criticalIssueDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedEvent.resource.agreementType && (
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Agreement Type:</span>
                    <span className="text-sm">{selectedEvent.resource.agreementType}</span>
                  </div>
                  
                  {selectedEvent.resource.agreementReference && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Reference:</span>
                      <span className="text-sm">{selectedEvent.resource.agreementReference}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reminder information when available */}
              {(selectedEvent.resource.reminder1Days || 
                selectedEvent.resource.reminder2Days || 
                selectedEvent.resource.reminder3Days || 
                selectedEvent.resource.reminder4Days) && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start">
                    <CalendarClock className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Reminders:</h4>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {selectedEvent.resource.reminder1Days > 0 && (
                          <div className="text-xs text-blue-700">
                            <span className="font-medium">1st:</span> {selectedEvent.resource.reminder1Days} days before
                          </div>
                        )}
                        {selectedEvent.resource.reminder2Days > 0 && (
                          <div className="text-xs text-blue-700">
                            <span className="font-medium">2nd:</span> {selectedEvent.resource.reminder2Days} days before
                          </div>
                        )}
                        {selectedEvent.resource.reminder3Days > 0 && (
                          <div className="text-xs text-blue-700">
                            <span className="font-medium">3rd:</span> {selectedEvent.resource.reminder3Days} days before
                          </div>
                        )}
                        {selectedEvent.resource.reminder4Days > 0 && (
                          <div className="text-xs text-blue-700">
                            <span className="font-medium">4th:</span> {selectedEvent.resource.reminder4Days} days before
                          </div>
                        )}
                        {selectedEvent.resource.postTriggerDateReminderDays > 0 && (
                          <div className="text-xs text-blue-700">
                            <span className="font-medium">Post:</span> {selectedEvent.resource.postTriggerDateReminderDays} days after
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-4 space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    if (onEditDate) onEditDate(selectedEvent.resource);
                    setDialogOpen(false);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View & Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView;