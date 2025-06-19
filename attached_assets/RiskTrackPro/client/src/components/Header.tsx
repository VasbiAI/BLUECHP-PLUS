import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { exportRisksToCSV } from "@/lib/utils/csvExport";
import { useRisks } from "@/hooks/useRisks";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { toast } = useToast();
  const { risks } = useRisks(1); // Default to project ID 1
  
  const projectQuery = useQuery({
    queryKey: ['/api/projects/1'],
    queryFn: async () => {
      const res = await fetch('/api/projects/1');
      if (!res.ok) {
        throw new Error('Failed to fetch project');
      }
      return res.json();
    }
  });
  
  const handleExportCSV = () => {
    try {
      if (risks.length === 0) {
        toast({
          title: "No risks to export",
          description: "There are no risks available to export.",
          variant: "destructive",
        });
        return;
      }
      
      const projectName = projectQuery.data?.name || "Risk_Register";
      exportRisksToCSV(risks, projectName);
      
      toast({
        title: "Export successful",
        description: "Risk register has been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export risk register to CSV.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-3 md:mb-0">
          <Link href="/" className="flex items-center mr-4">
            <div className="text-primary font-bold text-2xl">
              <span className="text-[#0066CC]">Blue</span>
              <span className="text-[#0D47A1]">CHP</span>
            </div>
          </Link>
          <div className="hidden md:block text-sm text-neutral-400 mr-6">
            Risk Management System
          </div>
          <nav className="hidden md:flex space-x-4">
            <Link href="/risk-register" className="text-neutral-700 hover:text-[#0066CC] transition-colors">
              Risk Register
            </Link>
            <Link href="/issues" className="text-neutral-700 hover:text-[#0066CC] transition-colors">
              Issues Register
            </Link>
            <Link href="/critical-dates" className="text-neutral-700 hover:text-[#0066CC] transition-colors">
              Critical Dates
            </Link>
            <Link href="/test-ai" className="text-emerald-600 hover:text-emerald-800 transition-colors">
              Test AI
            </Link>
          </nav>
        </div>
        <div>
          <Button 
            onClick={handleExportCSV}
            className="bg-[#0066CC] hover:bg-[#0D47A1] text-white py-2 px-4 rounded-md text-sm flex items-center transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export CSV
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
