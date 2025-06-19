import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { CalendarIcon, Link, Link2Off } from 'lucide-react';
import { CriticalDate } from '@shared/schema';

interface CriticalDateLinkFormProps {
  projectId: number;
}

const CriticalDateLinkForm: React.FC<CriticalDateLinkFormProps> = ({ projectId }) => {
  const form = useFormContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [open, setOpen] = useState(false);
  
  // Convert string date to Date object for the picker
  useEffect(() => {
    const dueDateString = form.watch('dueDate');
    if (dueDateString) {
      try {
        const parts = dueDateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // JS months are 0-based
          const year = parseInt(parts[2]);
          setSelectedDate(new Date(year, month, day));
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
  }, [form.watch('dueDate')]);
  
  // Fetch critical dates
  const { data: criticalDates, isLoading } = useQuery<CriticalDate[]>({
    queryKey: ['/api/critical-dates'],
  });
  
  const linkedCriticalDate = React.useMemo(() => {
    const criticalDateId = form.watch('criticalDateId');
    return criticalDates?.find(date => date.id === criticalDateId);
  }, [criticalDates, form.watch('criticalDateId')]);
  
  // Filter dates by search text
  const filteredDates = React.useMemo(() => {
    if (!criticalDates) return [];
    if (!searchText) return criticalDates;
    
    const lowerSearch = searchText.toLowerCase();
    return criticalDates.filter(date => 
      date.title.toLowerCase().includes(lowerSearch) || 
      (date.projectName && date.projectName.toLowerCase().includes(lowerSearch))
    );
  }, [criticalDates, searchText]);
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      form.setValue('dueDate', formattedDate);
    } else {
      form.setValue('dueDate', '');
    }
  };
  
  const handleLinkCriticalDate = (criticalDate: CriticalDate) => {
    form.setValue('criticalDateId', criticalDate.id);
    form.setValue('dueDate', criticalDate.dueDate);
    setOpen(false);
  };
  
  const handleUnlinkCriticalDate = () => {
    form.setValue('criticalDateId', undefined);
  };
  
  return (
    <div className="space-y-6">
      {linkedCriticalDate ? (
        <div className="border rounded-md p-4 bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium">Linked to Critical Date:</h4>
              <p className="text-base font-semibold mt-1">{linkedCriticalDate.title}</p>
              <p className="text-sm text-muted-foreground mt-1">Due: {linkedCriticalDate.dueDate}</p>
              {linkedCriticalDate.projectName && (
                <p className="text-sm text-muted-foreground">Project: {linkedCriticalDate.projectName}</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleUnlinkCriticalDate}
              title="Unlink from critical date"
            >
              <Link2Off className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span className="flex items-center">
                  <Link className="h-4 w-4 mr-2" /> 
                  Link to Critical Date
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Link to Critical Date</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Search critical dates..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="mb-4"
                />
                
                {isLoading ? (
                  <div className="text-center py-4">Loading critical dates...</div>
                ) : filteredDates.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {filteredDates.map((date) => (
                      <div 
                        key={date.id}
                        className="border rounded-md p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => handleLinkCriticalDate(date)}
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium">{date.title}</h3>
                          <span className="text-sm text-blue-600">{date.dueDate}</span>
                        </div>
                        {date.projectName && (
                          <p className="text-sm text-muted-foreground mt-1">Project: {date.projectName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No critical dates found matching your search.
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value && "text-muted-foreground"
                        }`}
                      >
                        <span className="flex items-center justify-between w-full">
                          {field.value ? field.value : <span>Pick a date</span>}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </span>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
      
      <FormDescription className="px-2 text-xs">
        Link this item to a critical date from the register to ensure proper deadline tracking and notification.
        You can also set a standalone due date without linking to the critical dates register.
      </FormDescription>
    </div>
  );
};

export default CriticalDateLinkForm;