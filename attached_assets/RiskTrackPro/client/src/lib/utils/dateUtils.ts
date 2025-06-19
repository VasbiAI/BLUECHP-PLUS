import { addDays, eachDayOfInterval, isWeekend, parse, format } from 'date-fns';

/**
 * Converts a string date in DD/MM/YYYY format to a Date object
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    return parse(dateString, 'dd/MM/yyyy', new Date());
  } catch (err) {
    console.error('Failed to parse date:', err);
    return null;
  }
}

/**
 * Formats a Date object to DD/MM/YYYY string
 */
export function formatDate(date: Date | null): string {
  if (!date) return '';
  
  try {
    return format(date, 'dd/MM/yyyy');
  } catch (err) {
    console.error('Failed to format date:', err);
    return '';
  }
}

/**
 * Calculates a date that is X business days before the given date
 * Business days are Monday-Friday, excludes weekends
 */
export function getDateBeforeBusinessDays(date: Date, days: number): Date {
  if (days <= 0) return date;
  
  let currentDate = date;
  let businessDaysCount = 0;
  
  while (businessDaysCount < days) {
    currentDate = addDays(currentDate, -1);
    if (!isWeekend(currentDate)) {
      businessDaysCount++;
    }
  }
  
  return currentDate;
}

/**
 * Calculates a date that is X business days after the given date
 * Business days are Monday-Friday, excludes weekends
 */
export function getDateAfterBusinessDays(date: Date, days: number): Date {
  if (days <= 0) return date;
  
  let currentDate = date;
  let businessDaysCount = 0;
  
  while (businessDaysCount < days) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate)) {
      businessDaysCount++;
    }
  }
  
  return currentDate;
}

/**
 * Calculates a date that is X calendar days before the given date
 */
export function getDateBeforeCalendarDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * Calculates a date that is X calendar days after the given date
 */
export function getDateAfterCalendarDays(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Counts the number of business days between two dates
 */
export function countBusinessDaysBetween(startDate: Date, endDate: Date): number {
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  return allDays.filter(day => !isWeekend(day)).length;
}

/**
 * Calculates reminder dates based on due date and reminder settings
 * Returns an array of reminder dates
 */
export function calculateReminderDates(
  dueDate: string, 
  useBusinessDays: boolean,
  reminderDays: number[]
): { date: Date; daysRemaining: number }[] {
  const parsedDueDate = parseDate(dueDate);
  if (!parsedDueDate) return [];
  
  return reminderDays
    .filter(days => days > 0)
    .map(days => {
      const reminderDate = useBusinessDays
        ? getDateBeforeBusinessDays(parsedDueDate, days)
        : getDateBeforeCalendarDays(parsedDueDate, days);
      
      return {
        date: reminderDate,
        daysRemaining: days
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Generate next occurrence date based on frequency
 * @param currentDate The current date to calculate from
 * @param frequency The frequency pattern (Weekly, Monthly, Quarterly, Yearly)
 */
export function getNextOccurrenceDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case 'Weekly':
      return addDays(currentDate, 7);
    case 'Monthly':
      const newMonth = new Date(currentDate);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    case 'Quarterly':
      const newQuarter = new Date(currentDate);
      newQuarter.setMonth(newQuarter.getMonth() + 3);
      return newQuarter;
    case 'Yearly':
      const newYear = new Date(currentDate);
      newYear.setFullYear(newYear.getFullYear() + 1);
      return newYear;
    default:
      return currentDate;
  }
}

/**
 * Checks if a date has occurred
 * @param dateStr Date string in DD/MM/YYYY format
 */
export function hasDateOccurred(dateStr: string): boolean {
  const date = parseDate(dateStr);
  if (!date) return false;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return date <= now;
}

/**
 * Gets the days remaining until a date
 * @param dateStr Date string in DD/MM/YYYY format
 */
export function getDaysRemaining(dateStr: string): number {
  const date = parseDate(dateStr);
  if (!date) return 0;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  // If date has passed, return negative days
  if (date < now) {
    const diffTime = now.getTime() - date.getTime();
    return -Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}