import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Risk } from "@shared/riskTrackProSchema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get risk severity level based on the risk rating
export function getRiskSeverity(rating: number): 'low' | 'medium' | 'high' | 'critical' {
  if (rating >= 15) return 'critical';
  if (rating >= 10) return 'high';
  if (rating >= 4) return 'medium';
  return 'low';
}

// Get background color class based on risk severity
export function getRiskSeverityColorClass(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100';
  }
}

// Export data to CSV
export function exportToCSV<T>(data: T[], fileName: string): void {
  if (!data || data.length === 0) return;

  // Get headers from the first item
  const headers = Object.keys(data[0]);

  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(item => 
      headers.map(header => {
        const value = item[header as keyof T];
        // Handle strings with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ];

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Special export for Risk data
export function exportRisksToCSV(risks: Risk[], fileName: string): void {
  if (!risks || risks.length === 0) return;

  // Create a simplified view of risks for export
  const exportableRisks = risks.map(risk => ({
    'Risk ID': risk.riskId,
    'Date Created': risk.dateCreated,
    'Risk Category': risk.riskCategory,
    'Risk Cause': risk.riskCause,
    'Risk Event': risk.riskEvent,
    'Risk Effect': risk.riskEffect,
    'Likelihood': risk.probability,
    'Impact': risk.impact,
    'Risk Rating': risk.riskRating,
    'Mitigation': risk.mitigationStrategy,
    'Owner': risk.responseOwner,
    'Status': risk.riskStatus,
    'Due Date': risk.responseTimeframe,
  }));

  // Get headers
  const headers = Object.keys(exportableRisks[0]);

  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...exportableRisks.map(item => 
      headers.map(header => {
        const value = item[header as keyof typeof item];
        // Handle strings with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ];

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}