import { useRisks } from "@/hooks/useRisks";
import { 
  countRisksByLevel, 
  countMitigatedRisksByLevel,
  calculateRiskScore,
  calculateUnmitigatedRiskScore,
  getLevelColor,
  getRiskStatusColor,
  getRiskCategory,
  isRedRisk,
  calculateResidualRisk,
  getMitigatedRiskCategory,
  getMitigatedRiskColor,
  getUnmitigatedRiskCategory,
  getUnmitigatedRiskColor
} from "@/lib/utils/riskCalculations";
import { type Risk, riskLevels } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";

interface RiskDashboardProps {
  projectId: number;
}

const RiskDashboard = ({ projectId }: RiskDashboardProps) => {
  const { risks, isLoading, isError } = useRisks(projectId);
  
  if (isLoading) {
    return (
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Risk Dashboard</h2>
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-3">
          <div className="flex flex-wrap items-center">
            <div className="mr-4 mb-2">
              <Skeleton className="h-5 w-24 mb-1" />
              <div className="flex items-center">
                <Skeleton className="h-8 w-12 mr-2" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center space-x-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center mb-2">
                  <div className="mr-2">
                    <Skeleton className="h-14 w-14 rounded-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-14 mb-1" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Risk Dashboard</h2>
        <div className="bg-white border border-red-200 rounded-lg shadow-sm p-3 text-red-500 text-sm">
          Error loading risk dashboard data
        </div>
      </div>
    );
  }
  
  // Calculate risk scores and counts
  const counts = countRisksByLevel(risks);
  const mitigatedCounts = countMitigatedRisksByLevel(risks);
  
  // Use our shared risk calculation functions
  const mitigatedScore = calculateRiskScore(risks);
  const unmitigatedScore = calculateUnmitigatedRiskScore(risks);
  
  // Get categories based on scores
  const mitigatedCategory = getMitigatedRiskCategory(mitigatedScore);
  const unmitigatedCategory = getUnmitigatedRiskCategory(unmitigatedScore);
  
  // Get colors for styling
  const mitigatedColor = getMitigatedRiskColor(mitigatedScore);
  const unmitigatedColor = getUnmitigatedRiskColor(unmitigatedScore);
  
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Risk Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mitigated Risk Card */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-3">
          <div className="flex items-center mb-2">
            <Link href="/rating-legend" className="text-md font-medium hover:text-blue-600 flex items-center">
              <span>Mitigated Risk Status</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="ml-1"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 text-blue-400 cursor-help"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </TooltipTrigger>
                <TooltipContent className="w-80 p-4">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Mitigated Risk Score:</p>
                    <p className="text-xs">This score shows risk levels after applying response type and status adjustments.</p>
                    <p className="text-xs mt-1">Risk categories use a standardized scale: Extreme (≥75), High (50-74), Moderate (25-49), Low (0-24).</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mitigated Status Score */}
            <div 
              className="text-white rounded-md shadow p-2 flex-shrink-0"
              style={{ 
                width: '70px', 
                backgroundColor: mitigatedColor
              }}
            >
              <div className="text-xs">Status<br/>Score</div>
              <div className="text-2xl font-bold">{mitigatedScore}</div>
              <div className="text-xs font-medium">{mitigatedCategory}</div>
            </div>
            
            {/* Risk Distribution */}
            <div className="flex gap-2 flex-grow justify-evenly">
              {/* Extreme Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#DC3545' }}
                >
                  <span className="font-bold text-lg">{mitigatedCounts.extreme}</span>
                </div>
                <div className="text-xxs text-center">Extreme<br/>≥75</div>
              </div>
              
              {/* High Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#FD7E14' }}
                >
                  <span className="font-bold text-lg">{mitigatedCounts.high}</span>
                </div>
                <div className="text-xxs text-center">High<br/>36-63</div>
              </div>
              
              {/* Medium Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#FFC107', color: '#000' }}
                >
                  <span className="font-bold text-lg">{mitigatedCounts.moderate}</span>
                </div>
                <div className="text-xxs text-center">Moderate<br/>16-35</div>
              </div>
              
              {/* Low Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#28A745' }}
                >
                  <span className="font-bold text-lg">{mitigatedCounts.low}</span>
                </div>
                <div className="text-xxs text-center">Low<br/>0-15</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Unmitigated Risk Card */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-3">
          <div className="flex items-center mb-2">
            <Link href="/rating-legend" className="text-md font-medium hover:text-blue-600 flex items-center">
              <span>Unmitigated Risk Status</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="ml-1"
              >
                <path d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 text-blue-400 cursor-help"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </TooltipTrigger>
                <TooltipContent className="w-80 p-4">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Unmitigated Risk Score:</p>
                    <p className="text-xs">This score represents the raw risk level without any adjustments.</p>
                    <p className="text-xs mt-1">Risk categories use a standardized scale: Extreme (≥75), High (50-74), Moderate (25-49), Low (0-24).</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Unmitigated Status Score */}
            <div 
              className="text-white rounded-md shadow p-2 flex-shrink-0"
              style={{ 
                width: '70px', 
                backgroundColor: unmitigatedColor
              }}
            >
              <div className="text-xs">Status<br/>Score</div>
              <div className="text-2xl font-bold">{unmitigatedScore}</div>
              <div className="text-xs font-medium">{unmitigatedCategory}</div>
            </div>
            
            {/* Risk Distribution */}
            <div className="flex gap-2 flex-grow justify-evenly">
              {/* Extreme Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#DC3545' }}
                >
                  <span className="font-bold text-lg">{counts.extreme}</span>
                </div>
                <div className="text-xxs text-center">Extreme<br/>≥75</div>
              </div>
              
              {/* High Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#FD7E14' }}
                >
                  <span className="font-bold text-lg">{counts.high}</span>
                </div>
                <div className="text-xxs text-center">High<br/>36-63</div>
              </div>
              
              {/* Medium Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#FFC107', color: '#000' }}
                >
                  <span className="font-bold text-lg">{counts.moderate}</span>
                </div>
                <div className="text-xxs text-center">Moderate<br/>16-35</div>
              </div>
              
              {/* Low Risks */}
              <div className="flex flex-col items-center">
                <div 
                  className="text-white rounded-full w-10 h-10 flex items-center justify-center shadow mb-1"
                  style={{ backgroundColor: '#28A745' }}
                >
                  <span className="font-bold text-lg">{counts.low}</span>
                </div>
                <div className="text-xxs text-center">Low<br/>0-39</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskDashboard;
