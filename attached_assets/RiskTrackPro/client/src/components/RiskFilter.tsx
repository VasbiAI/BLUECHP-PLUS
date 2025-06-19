import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Risk } from "@shared/schema";
import { DepartmentType, RegisterType } from "@/config/fieldVisibility";

interface RiskFilterProps {
  risks: Risk[];
  onFilterChange: (filteredRisks: Risk[]) => void;
  onCreateRegister?: () => void;
}

const RiskFilter = ({ risks, onFilterChange, onCreateRegister }: RiskFilterProps) => {
  const [category, setCategory] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [owner, setOwner] = useState<string>("all");
  const [status, setStatus] = useState<string>("Open");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [registerType, setRegisterType] = useState<string>("all");
  const [department, setDepartment] = useState<string>("all");
  
  // Extract unique values for filters
  const categories = [...new Set(risks.map(risk => risk.riskCategory))];
  const owners = [...new Set(risks.map(risk => risk.ownedBy))];
  const statuses = [...new Set(risks.map(risk => risk.riskStatus))];
  // Extract register types and departments (handling undefined values)
  const registerTypes = [...new Set(risks.map(risk => risk.registerType || 'default'))];
  const departments = [...new Set(risks.map(risk => risk.department || 'default'))];
  
  // Apply filters
  useEffect(() => {
    // Apply all active filters
    let filteredResults = risks;
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredResults = filteredResults.filter(risk => 
        risk.riskId.toLowerCase().includes(search) ||
        risk.riskCause.toLowerCase().includes(search) ||
        risk.riskEvent.toLowerCase().includes(search) ||
        risk.riskEffect.toLowerCase().includes(search) ||
        risk.riskCategory.toLowerCase().includes(search)
      );
    }
    
    if (category && category !== "all") {
      filteredResults = filteredResults.filter(risk => risk.riskCategory === category);
    }
    
    if (level && level !== "all") {
      filteredResults = filteredResults.filter(risk => {
        const rating = risk.riskRating;
        switch (level) {
          case "Extreme": return rating >= 80 && rating <= 100;
          case "High": return rating >= 60 && rating < 80;
          case "Medium": return rating >= 40 && rating < 60;
          case "Low": return rating < 40;
          default: return true;
        }
      });
    }
    
    if (owner && owner !== "all") {
      filteredResults = filteredResults.filter(risk => risk.ownedBy === owner);
    }
    
    if (status && status !== "all") {
      filteredResults = filteredResults.filter(risk => risk.riskStatus === status);
    }
    
    // Apply register type filter
    if (registerType && registerType !== "all") {
      filteredResults = filteredResults.filter(risk => risk.registerType === registerType);
    }
    
    // Apply department filter
    if (department && department !== "all") {
      filteredResults = filteredResults.filter(risk => risk.department === department);
    }
    
    onFilterChange(filteredResults);
  }, [category, level, owner, status, registerType, department, searchTerm, risks]);
  
  const clearFilters = () => {
    setCategory("all");
    setLevel("all");
    setOwner("all");
    setStatus("Open"); // Default to Open
    setRegisterType("all");
    setDepartment("all");
    setSearchTerm("");
  };
  
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Register Type Filter */}
        <div>
          <Label htmlFor="registerType" className="text-sm font-medium text-neutral-400 mb-1">Register Type</Label>
          <Select value={registerType} onValueChange={setRegisterType}>
            <SelectTrigger id="registerType" className="w-full">
              <SelectValue placeholder="All Register Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Register Types</SelectItem>
              {registerTypes.map(type => (
                <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Department Filter */}
        <div>
          <Label htmlFor="department" className="text-sm font-medium text-neutral-400 mb-1">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department" className="w-full">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept.charAt(0).toUpperCase() + dept.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filter by Risk Category */}
        <div>
          <Label htmlFor="category" className="text-sm font-medium text-neutral-400 mb-1">Risk Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter by Risk Level */}
        <div>
          <Label htmlFor="level" className="text-sm font-medium text-neutral-400 mb-1">Risk Level</Label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger id="level" className="w-full">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Extreme">Extreme</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter by Owned By */}
        <div>
          <Label htmlFor="owner" className="text-sm font-medium text-neutral-400 mb-1">Owned By</Label>
          <Select value={owner} onValueChange={setOwner}>
            <SelectTrigger id="owner" className="w-full">
              <SelectValue placeholder="All Owners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {owners.map(own => (
                <SelectItem key={own} value={own}>{own}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Filter by Status */}
        <div>
          <Label htmlFor="status" className="text-sm font-medium text-neutral-400 mb-1">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(stat => (
                <SelectItem key={stat} value={stat}>{stat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mt-4 border-t border-neutral-200 pt-4 flex justify-between items-center">
        <div className="text-sm text-neutral-300">
          <span className="font-medium">{risks.length}</span> risks found
        </div>
        
        <Button 
          variant="ghost" 
          onClick={clearFilters}
          className="text-neutral-300 hover:text-neutral-400 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default RiskFilter;
