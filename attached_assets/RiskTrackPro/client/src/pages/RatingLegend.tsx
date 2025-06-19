import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import TabNavigation from "@/components/TabNavigation";
import ProjectInfo from "@/components/ProjectInfo";
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Risk, Issue } from '@shared/schema';
import { 
  calculateRiskScore, 
  getUnmitigatedRiskCategory,
  getUnmitigatedRiskColor,
  getMitigatedRiskCategory,
  getMitigatedRiskColor
} from '@/lib/utils/riskCalculations';
import { riskLevels } from '@shared/schema';
import { 
  GridComponent, 
  ColumnsDirective, 
  ColumnDirective, 
  Inject, 
  Resize, 
  Sort,
  ContextMenu, 
  Filter, 
  Page, 
  Search, 
  Toolbar, 
  Selection
} from '@syncfusion/ej2-react-grids';
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-react-grids/styles/material.css';

interface ImpactLevel {
  id: number;
  level: string;
  description: string;
  financialImpact: string;
  reputationImpact: string;
  color: string;
}

interface ProbabilityLevel {
  id: number;
  level: string;
  description: string;
  probability: string;
  color: string;
}

interface RiskRating {
  impact: number;
  probability: number;
  rating: string;
  description: string;
  color: string;
}

// Interface for risk score statistics
interface RiskScoreStat {
  score: number;
  count: number;
  percentage: string;
  weightedValue: number;
  adjustedValue: number;
  responseAdjustment: number;
  statusAdjustment: number;
  color: string;
}

// Interface for the overall project risk status
interface ProjectRiskStatus {
  score: number;
  category: string;
  color: string;
  description: string;
}

const RatingLegendPage = () => {
  // For unmitigated risk - uses standard thresholds
  const getUnmitigatedRiskCategory = (score: number): string => {
    if (score >= 80) return 'Extreme';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  // For unmitigated risk color
  const getUnmitigatedRiskColor = (score: number): string => {
    if (score >= 80) return '#DC3545'; // Red for Extreme
    if (score >= 60) return '#FD7E14'; // Orange for High
    if (score >= 40) return '#FFC107'; // Yellow for Medium
    return '#28A745'; // Green for Low
  };
  
  // For mitigated risk - uses PMBOK threshold alignment
  const getMitigatedRiskCategory = (score: number): string => {
    if (score >= 64) return 'Extreme';
    if (score >= 36) return 'High';
    if (score >= 16) return 'Moderate';
    return 'Low';
  };
  
  // For mitigated risk color
  const getMitigatedRiskColor = (score: number): string => {
    if (score >= 64) return '#DC3545'; // Red for Extreme
    if (score >= 36) return '#FD7E14'; // Orange for High
    if (score >= 16) return '#FFC107'; // Yellow for Moderate
    return '#28A745'; // Green for Low
  };
  const projectId = 1; // Default to the first project
  const [riskStats, setRiskStats] = useState<RiskScoreStat[]>([]);
  const [totalRisks, setTotalRisks] = useState(0);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [risksAtSelectedScore, setRisksAtSelectedScore] = useState<Risk[]>([]);
  const [issuesAtSelectedScore, setIssuesAtSelectedScore] = useState<Issue[]>([]);
  const [projectRiskStatus, setProjectRiskStatus] = useState<ProjectRiskStatus>({
    score: 0,
    category: 'Low',
    color: 'bg-green-400',
    description: 'No significant risks identified'
  });
  
  const [unmitigatedRiskStatus, setUnmitigatedRiskStatus] = useState<ProjectRiskStatus>({
    score: 0,
    category: 'Low',
    color: 'bg-green-400',
    description: 'No significant risks identified'
  });
  
  // Fetch risks for the current project
  const { data: risks, isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ['/api/risks'],
  });
  
  // Fetch issues for the current project
  const { data: issues, isLoading: issuesLoading } = useQuery<Issue[]>({
    queryKey: ['/api/issues'],
  });
  
  useEffect(() => {
    if (risks && issues) {
      // Filter by current project
      const projectRisks = risks.filter(risk => risk.projectId === projectId);
      const projectIssues = issues.filter(issue => issue.projectId === projectId);
      
      // Calculate risk stats
      calculateRiskStats(projectRisks, projectIssues);
    }
  }, [risks, issues, projectId]);
  
  // Handle click on risk score row
  const handleScoreRowClick = (score: number) => {
    setSelectedScore(score);
    
    if (risks && issues) {
      // Filter risks at this score level
      const projectRisks = risks.filter(risk => risk.projectId === projectId);
      const filteredRisks = projectRisks.filter(risk => risk.riskRating === score);
      setRisksAtSelectedScore(filteredRisks);
      
      // Filter issues at this score level
      const projectIssues = issues.filter(issue => issue.projectId === projectId);
      const filteredIssues = projectIssues.filter(issue => issue.impact === score);
      setIssuesAtSelectedScore(filteredIssues);
    }
  };
  
  // Calculate risk statistics based on risk scores
  const calculateRiskStats = (projectRisks: Risk[], projectIssues: Issue[]) => {
    // Define the risk score categories we want to track
    const scoreCategories = [
      { score: 100, color: 'bg-red-600' },
      { score: 80, color: 'bg-red-600' },
      { score: 64, color: 'bg-red-600' },
      { score: 60, color: 'bg-orange-400' },
      { score: 48, color: 'bg-orange-400' },
      { score: 36, color: 'bg-orange-400' },
      { score: 40, color: 'bg-yellow-300' },
      { score: 32, color: 'bg-yellow-300' },
      { score: 24, color: 'bg-yellow-300' },
      { score: 20, color: 'bg-yellow-300' },
      { score: 16, color: 'bg-yellow-300' },
      { score: 12, color: 'bg-green-400' },
      { score: 8, color: 'bg-green-400' },
      { score: 4, color: 'bg-green-400' }
    ];
    
    // Count risks and issues at each score level
    const stats: RiskScoreStat[] = [];
    let total = 0;
    
    // Helper function to get response type adjustment factor
    const getResponseAdjustment = (responseType: string): number => {
      switch (responseType?.toLowerCase()) {
        case 'avoid': return 0.0;
        case 'transfer': return 0.35; // Average of 30-40%
        case 'mitigate': return 0.6; // Average of 50-70% 
        case 'share': return 0.6;
        case 'exploit': return -0.3;
        case 'accept':
        default: 
          return 1.0;
      }
    };
    
    // Helper function to get status adjustment factor
    const getStatusAdjustment = (status: string): number => {
      switch (status?.toLowerCase()) {
        case 'monitoring': return 0.8;
        case 'in progress': return 0.6;
        case 'closed': return 0.0;
        case 'eventuated': return 0.0;
        case 'active':
        default:
          return 1.0;
      }
    };
    
    // Always display all 14 risk scores, regardless of if they have risks
    scoreCategories.forEach(category => {
      // Get risks at this score level
      const risksAtScore = projectRisks.filter(risk => risk.riskRating === category.score);
      const risksCount = risksAtScore.length;
      
      // Get issues at this score level
      const issuesAtScore = projectIssues.filter(issue => issue.impact === category.score);
      const issuesCount = issuesAtScore.length;
      
      const count = risksCount + issuesCount;
      total += count;
      
      // Calculate response type and status adjustments
      let responseAdjFactor = 1.0;
      let statusAdjFactor = 1.0;
      
      if (risksCount > 0) {
        // Calculate average response adjustment
        const totalResponseAdj = risksAtScore.reduce((sum, risk) => 
          sum + getResponseAdjustment(risk.responseType || 'Accept'), 0);
        responseAdjFactor = risksCount > 0 ? totalResponseAdj / risksCount : 1.0;
        
        // Calculate average status adjustment
        const totalStatusAdj = risksAtScore.reduce((sum, risk) => 
          sum + getStatusAdjustment(risk.riskStatus || 'Active'), 0);
        statusAdjFactor = risksCount > 0 ? totalStatusAdj / risksCount : 1.0;
      }
      
      // Calculate raw weighted value
      const rawWeightedValue = parseFloat(((count / Math.max(total, 1)) * (category.score / 100)).toFixed(5));
      
      // Apply adjustments to get final value
      const adjustedValue = parseFloat((rawWeightedValue * responseAdjFactor * statusAdjFactor).toFixed(5));
      
      // Always include every category from the risk matrix
      stats.push({
        score: category.score,
        count,
        percentage: `${Math.round((category.score / 100) * 100)}%`, // Calculate percentage based on score
        weightedValue: rawWeightedValue,
        responseAdjustment: responseAdjFactor,
        statusAdjustment: statusAdjFactor,
        adjustedValue: adjustedValue,
        color: category.color
      });
    });
    
    // Calculate both unmitigated and mitigated risk scores
    
    // For unmitigated score - calculate the raw impact * probability for all risks
    // NOTE: Rating Legend uses board-approved thresholds (80/60/40) which differ from 
    // operational PMBOK thresholds (64/36/16) used in dashboard charts
    let unmitigatedScore = 0;
    if (projectRisks.length > 0) {
      // Calculate average of impact * probability for all risks (on a 0-100 scale)
      unmitigatedScore = Math.round(
        projectRisks.reduce((sum, risk) => {
          // Use the direct riskRating field which is already the impact * probability calculation
          // This avoids double-counting or scaling issues
          return sum + risk.riskRating;
        }, 0) / projectRisks.length
      );
      
      // Ensure unmitigated score doesn't exceed 100
      unmitigatedScore = Math.min(unmitigatedScore, 100);
    }
    
    // Get category from the score using our standardized category approach
    const unmitigatedCategory = getUnmitigatedRiskCategory(unmitigatedScore);
    let unmitigatedColor = '';
    let unmitigatedDescription = '';
    
    // Get color from our standardized category approach
    const unmitigatedHexColor = getUnmitigatedRiskColor(unmitigatedScore);
    unmitigatedColor = 'bg-' + unmitigatedHexColor.substring(1); // Convert hex to Tailwind bg class
    
    // Set description based on category
    if (unmitigatedCategory === 'Extreme') {
      unmitigatedDescription = 'Project has extreme risks requiring immediate high-priority management attention.';
    } else if (unmitigatedCategory === 'High') {
      unmitigatedDescription = 'Project has high risks that need priority management attention.';
    } else if (unmitigatedCategory === 'Moderate') {
      unmitigatedDescription = 'Project has moderate risks that require regular monitoring and management.';
    } else {
      unmitigatedDescription = 'Project has low risks that require routine management review.';
    }
    
    // Set the unmitigated risk status state
    setUnmitigatedRiskStatus({
      score: unmitigatedScore,
      category: unmitigatedCategory,
      color: unmitigatedColor,
      description: unmitigatedDescription
    });
    
    // For mitigated score - use our shared risk calculation function that includes response/status adjustments
    // This now uses our normalized category-based approach
    const mitigatedScore = calculateRiskScore(projectRisks);
    
    // Get the category using our category-based approach
    const mitigatedCategory = getMitigatedRiskCategory(mitigatedScore);
    let mitigatedColor = '';
    let mitigatedDescription = '';
    
    // Get color for the mitigated score
    const mitigatedHexColor = getMitigatedRiskColor(mitigatedScore);
    mitigatedColor = 'bg-' + mitigatedHexColor.substring(1); // Convert hex to Tailwind bg class
    
    // Set mitigated description based on category
    if (mitigatedCategory === 'Extreme') {
      mitigatedDescription = 'Project has significant extreme risks requiring immediate high-priority management attention.';
    } else if (mitigatedCategory === 'High') {
      mitigatedDescription = 'Project has high risks that need priority management attention.';
    } else if (mitigatedCategory === 'Moderate') {
      mitigatedDescription = 'Project has moderate risks that require regular monitoring and management.';
    } else {
      mitigatedDescription = 'Project has low risks that require routine management review.';
    }
    
    // Set the mitigated risk status state
    setProjectRiskStatus({
      score: mitigatedScore,
      category: mitigatedCategory,
      color: mitigatedColor,
      description: mitigatedDescription
    });
    
    // Make sure all values are fully initialized before updating state
    const initializedStats = stats.map(stat => ({
      ...stat, 
      weightedValue: stat.weightedValue || 0,
      responseAdjustment: stat.responseAdjustment || 1.0,
      statusAdjustment: stat.statusAdjustment || 1.0,
      adjustedValue: stat.adjustedValue || 0
    }));
    
    setRiskStats(initializedStats);
    setTotalRisks(total);
  };

  // Impact Levels Data
  const impactLevels: ImpactLevel[] = [
    { 
      id: 1, 
      level: "Very Limited", 
      description: "Very limited impact on project or organization", 
      financialImpact: "Impact Score = 20", 
      reputationImpact: "Minimal localized concern",
      color: "#8BC34A" // Light Green
    },
    { 
      id: 2, 
      level: "Limited", 
      description: "Limited impact on operations", 
      financialImpact: "Impact Score = 40", 
      reputationImpact: "Short-term local concern",
      color: "#CDDC39" // Lime
    },
    { 
      id: 3, 
      level: "Moderate", 
      description: "Moderate impact requiring management attention", 
      financialImpact: "Impact Score = 60", 
      reputationImpact: "Notable stakeholder concern",
      color: "#FFC107" // Amber
    },
    { 
      id: 4, 
      level: "Major", 
      description: "Major impact on operations or objectives", 
      financialImpact: "Impact Score = 80", 
      reputationImpact: "Significant stakeholder concern",
      color: "#FF9800" // Orange
    },
    { 
      id: 5, 
      level: "Severe", 
      description: "Severe impact threatening organizational viability", 
      financialImpact: "Impact Score = 100", 
      reputationImpact: "Widespread stakeholder concern",
      color: "#F44336" // Red
    }
  ];

  // Probability Levels Data
  const probabilityLevels: ProbabilityLevel[] = [
    { 
      id: 1, 
      level: "Rare", 
      description: "Very unlikely to occur", 
      probability: "0.20",
      color: "#E8F5E9" // Light Green 50
    },
    { 
      id: 2, 
      level: "Unlikely", 
      description: "Not likely to occur", 
      probability: "0.40",
      color: "#C8E6C9" // Light Green 100
    },
    { 
      id: 3, 
      level: "Possible", 
      description: "May occur at some point", 
      probability: "0.60",
      color: "#A5D6A7" // Light Green 200
    },
    { 
      id: 4, 
      level: "Likely", 
      description: "Likely to occur", 
      probability: "0.80",
      color: "#81C784" // Light Green 300
    },
    { 
      id: 5, 
      level: "Almost Certain", 
      description: "Expected to occur in most circumstances", 
      probability: "1.00",
      color: "#66BB6A" // Light Green 400
    }
  ];

  // Risk Matrix Data
  const riskMatrix: RiskRating[] = [
    // Impact 1 - Very Limited (20)
    { impact: 1, probability: 1, rating: "Low", description: "4", color: "#8BC34A" },  // 20 * 0.2 = 4
    { impact: 1, probability: 2, rating: "Low", description: "8", color: "#8BC34A" },  // 20 * 0.4 = 8
    { impact: 1, probability: 3, rating: "Low", description: "12", color: "#8BC34A" }, // 20 * 0.6 = 12
    { impact: 1, probability: 4, rating: "Low", description: "16", color: "#8BC34A" }, // 20 * 0.8 = 16
    { impact: 1, probability: 5, rating: "Low", description: "20", color: "#8BC34A" }, // 20 * 1.0 = 20
    
    // Impact 2 - Limited (40)
    { impact: 2, probability: 1, rating: "Low", description: "8", color: "#8BC34A" },  // 40 * 0.2 = 8
    { impact: 2, probability: 2, rating: "Low", description: "16", color: "#8BC34A" }, // 40 * 0.4 = 16
    { impact: 2, probability: 3, rating: "Low", description: "24", color: "#8BC34A" }, // 40 * 0.6 = 24
    { impact: 2, probability: 4, rating: "Low", description: "32", color: "#8BC34A" }, // 40 * 0.8 = 32
    { impact: 2, probability: 5, rating: "Medium", description: "40", color: "#FFEB3B" }, // 40 * 1.0 = 40
    
    // Impact 3 - Moderate (60)
    { impact: 3, probability: 1, rating: "Low", description: "12", color: "#8BC34A" }, // 60 * 0.2 = 12
    { impact: 3, probability: 2, rating: "Low", description: "24", color: "#8BC34A" }, // 60 * 0.4 = 24
    { impact: 3, probability: 3, rating: "Medium", description: "36", color: "#FFEB3B" }, // 60 * 0.6 = 36
    { impact: 3, probability: 4, rating: "Medium", description: "48", color: "#FFEB3B" }, // 60 * 0.8 = 48
    { impact: 3, probability: 5, rating: "High", description: "60", color: "#FFC107" }, // 60 * 1.0 = 60
    
    // Impact 4 - Major (80)
    { impact: 4, probability: 1, rating: "Low", description: "16", color: "#8BC34A" }, // 80 * 0.2 = 16
    { impact: 4, probability: 2, rating: "Medium", description: "32", color: "#FFEB3B" }, // 80 * 0.4 = 32
    { impact: 4, probability: 3, rating: "Medium", description: "48", color: "#FFEB3B" }, // 80 * 0.6 = 48
    { impact: 4, probability: 4, rating: "High", description: "64", color: "#FFC107" }, // 80 * 0.8 = 64
    { impact: 4, probability: 5, rating: "Extreme", description: "80", color: "#F44336" }, // 80 * 1.0 = 80
    
    // Impact 5 - Severe (100)
    { impact: 5, probability: 1, rating: "Low", description: "20", color: "#8BC34A" }, // 100 * 0.2 = 20
    { impact: 5, probability: 2, rating: "Medium", description: "40", color: "#FFEB3B" }, // 100 * 0.4 = 40
    { impact: 5, probability: 3, rating: "High", description: "60", color: "#FFC107" }, // 100 * 0.6 = 60
    { impact: 5, probability: 4, rating: "Extreme", description: "80", color: "#F44336" }, // 100 * 0.8 = 80
    { impact: 5, probability: 5, rating: "Extreme", description: "100", color: "#F44336" } // 100 * 1.0 = 100
  ];

  // Cell background color template for Risk Matrix
  const cellTemplate = (props: any) => {
    return <div className="p-2 text-center font-semibold" style={{ backgroundColor: props.color, height: '100%' }}>{props.description}</div>;
  };

  const rowTemplate = (props: any) => {
    return <div className="p-2" style={{ backgroundColor: props.color, color: getTextColor(props.color) }}>{props.level}</div>;
  };

  const getTextColor = (backgroundColor: string) => {
    // Logic to determine whether to use light or dark text based on background color
    // Simple version: Red (#F44336) and dark orange get white text, others get black
    if (backgroundColor === '#F44336' || backgroundColor === '#E53935' || backgroundColor === '#C62828' || backgroundColor === '#FFA726') {
      return 'white';
    }
    return 'black';
  };

  return (
    <>
      <ProjectInfo projectId={projectId} />
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-semibold mb-6">Risk Rating Reference</h2>

        {/* Mitigated Project Risk Status Summary */}
        <Card className="shadow-lg mb-6 border-t-4" style={{ borderTopColor: projectRiskStatus.color.includes('bg-') ? projectRiskStatus.color.replace('bg-', '#') : '#10b981' }}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center justify-center">
                <div 
                  className={`${projectRiskStatus.color} text-center p-6 rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-lg mb-2 text-white`}
                  style={{ backgroundColor: projectRiskStatus.color.replace('bg-', '#').includes('#') ? projectRiskStatus.color.replace('bg-', '#') : '#DC3545' }}
                >
                  <div className="text-3xl font-bold">{projectRiskStatus.score}</div>
                  <div className="text-sm font-medium">{projectRiskStatus.category}</div>
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Based on {totalRisks} active risks
                </p>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-2">Mitigated Project Risk Status</h3>
                <p className="text-gray-700 mb-3">
                  This project currently has an overall risk status of: <span className={`font-bold ${projectRiskStatus.color === 'bg-red-600' ? 'text-red-600' : projectRiskStatus.color === 'bg-orange-400' ? 'text-orange-500' : projectRiskStatus.color === 'bg-yellow-300' ? 'text-yellow-600' : 'text-green-600'}`}>{projectRiskStatus.category}</span>
                </p>
                <p className="text-gray-600 mb-4">
                  {projectRiskStatus.description}
                </p>
                <div className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-md">
                  <strong>Calculation Method:</strong> The overall risk score is calculated using a PMBOK-compliant weighted assessment 
                  that accounts for both risk severity and response effectiveness. The formula applies:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Response Type adjustments (Avoid: 0%, Transfer: 30-40%, Mitigate: 50-70%, Accept: 100%)</li>
                    <li>Status adjustments (Active: 100%, Monitoring: 80%, In Progress: 60%, Closed: 0%)</li>
                    <li>Executive overrides for critical high-level risks that require immediate attention</li>
                  </ul>
                  <p className="mt-1">The final score (1-100) aligns with risk categories: Extreme (64-100), High (36-60), Moderate (16-32), Low (4-12).</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Unmitigated Project Risk Status Summary */}
        <Card className="shadow-lg mb-6 border-t-4" style={{ borderTopColor: unmitigatedRiskStatus.color.replace('bg-', '#') }}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center justify-center">
                <div 
                  className={`${unmitigatedRiskStatus.color} text-center p-6 rounded-full w-32 h-32 flex flex-col items-center justify-center shadow-lg mb-2 text-white`}
                  style={{ backgroundColor: unmitigatedRiskStatus.color.replace('bg-', '#').includes('#') ? unmitigatedRiskStatus.color.replace('bg-', '#') : '#DC3545' }}
                >
                  <div className="text-3xl font-bold">{unmitigatedRiskStatus.score}</div>
                  <div className="text-sm font-medium">{unmitigatedRiskStatus.category}</div>
                </div>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Based on {totalRisks} active risks
                </p>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold mb-2">Unmitigated Project Risk Status</h3>
                <p className="text-gray-700 mb-3">
                  This project currently has an unmitigated risk status of: <span 
                    className={`font-bold ${
                      unmitigatedRiskStatus.color === 'bg-red-600' ? 'text-red-600' : 
                      unmitigatedRiskStatus.color === 'bg-orange-400' ? 'text-orange-500' :
                      unmitigatedRiskStatus.color === 'bg-yellow-300' ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}
                  >
                    {unmitigatedRiskStatus.category}
                  </span>
                </p>
                <p className="text-gray-600 mb-4">
                  Project has {unmitigatedRiskStatus.category.toLowerCase()} risks that need priority management attention.
                </p>
                <div className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-md">
                  <strong>Calculation Method:</strong> The unmitigated risk score represents the raw risk level before applying any response or status adjustments:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Based solely on probability × impact calculations</li>
                    <li>Does not include risk response mitigation effects</li>
                    <li>Represents the inherent project risk before treatment strategies</li>
                  </ul>
                  <p className="mt-1">The final score (1-100) aligns with risk categories: Extreme (80-100), High (60-79), Moderate (40-59), Low (0-39).</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 mb-6">
          {/* Risk Status Score Table */}
          <Card className="shadow-lg mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Risk Status Score</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="p-2 text-center font-bold bg-gray-100 border border-gray-800">Score</th>
                      <th className="p-2 text-center font-bold bg-gray-100 border border-gray-800">Count</th>
                      <th className="p-2 text-center font-bold bg-gray-100 border border-gray-800">Percentage</th>
                      <th className="p-2 text-center font-bold bg-gray-100 border border-gray-800">Raw Value</th>
                      <th className="p-2 text-center font-bold bg-gray-100 border border-gray-800">Response Adj.</th>
                      <th className="p-2 text-center font-bold bg-gray-100 border border-gray-800">Status Adj.</th>
                      <th className="p-2 text-center font-bold bg-gray-100 border border-gray-800">Final Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskStats.map((stat, index) => (
                      <tr 
                        key={index} 
                        className={`cursor-pointer hover:bg-gray-50 ${selectedScore === stat.score ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                        onClick={() => handleScoreRowClick(stat.score)}
                      >
                        <td className={`p-2 text-center font-bold ${stat.color} ${stat.color === 'bg-red-600' ? 'text-white' : ''} border border-gray-800 w-1/14`}>
                          {stat.score}
                        </td>
                        <td className="p-2 text-center font-bold border border-gray-800 w-1/14">
                          {stat.count}
                        </td>
                        <td className="p-2 text-center font-bold border border-gray-800 w-1/14">
                          {stat.percentage}
                        </td>
                        <td className="p-2 text-center font-bold border border-gray-800 w-1/14">
                          {stat.weightedValue.toFixed(5) || 0}
                        </td>
                        <td className="p-2 text-center font-bold border border-gray-800 w-1/14">
                          {stat.responseAdjustment.toFixed(2)}
                        </td>
                        <td className="p-2 text-center font-bold border border-gray-800 w-1/14">
                          {stat.statusAdjustment.toFixed(2)}
                        </td>
                        <td className="p-2 text-center font-bold border border-gray-800 w-1/14">
                          {stat.adjustedValue.toFixed(5) || 0}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="p-2 text-center font-bold border border-gray-800">Total</td>
                      <td className="p-2 text-center font-bold border border-gray-800">{totalRisks}</td>
                      <td className="p-2 text-center font-bold border border-gray-800"></td>
                      <td className="p-2 text-center font-bold border border-gray-800">
                        {riskStats.reduce((sum, stat) => sum + (stat.weightedValue || 0), 0).toFixed(5)}
                      </td>
                      <td className="p-2 text-center font-bold border border-gray-800">-</td>
                      <td className="p-2 text-center font-bold border border-gray-800">-</td>
                      <td className="p-2 text-center font-bold border border-gray-800">
                        {riskStats.reduce((sum, stat) => sum + (stat.adjustedValue || 0), 0).toFixed(5)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>This table shows the distribution of risks and issues by risk score level with adjustments based on response types and risk status:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li><strong>Raw Value:</strong> Initial weighted value based on score and count (unmitigated risk)</li>
                  <li><strong>Response Adj:</strong> Adjustment factor based on risk response types (Avoid: 0%, Transfer: 30-40%, Mitigate: 50-70%, Accept: 100%, etc.)</li>
                  <li><strong>Status Adj:</strong> Adjustment factor based on risk status (Active: 100%, Monitoring: 80%, In Progress: 60%, Closed/Eventuated: 0%)</li>
                  <li><strong>Final Value:</strong> The mitigated risk contribution after applying all adjustment factors</li>
                </ul>
                <p className="mt-2"><strong>Click on any row to view the specific risks and issues at that score level.</strong></p>
              </div>
              
              {/* Display selected risks and issues */}
              {selectedScore && (
                <div className="mt-6 p-4 border rounded-md bg-gray-50">
                  <h4 className="text-lg font-medium mb-2">Risks and Issues with Score: {selectedScore}</h4>
                  
                  {/* Risks list */}
                  <div className="mb-4">
                    <h5 className="font-semibold mb-2">Risks ({risksAtSelectedScore.length})</h5>
                    {risksAtSelectedScore.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {risksAtSelectedScore.map((risk) => (
                          <li key={risk.id} className="text-sm">
                            <span className="font-medium">{risk.riskId}:</span> {risk.riskEvent}
                            <div className="text-xs text-gray-600 ml-5">
                              Owned by: {risk.ownedBy} | Category: {risk.riskCategory} | Status: {risk.riskStatus}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No risks found at this score level.</p>
                    )}
                  </div>
                  
                  {/* Issues list */}
                  <div>
                    <h5 className="font-semibold mb-2">Issues ({issuesAtSelectedScore.length})</h5>
                    {issuesAtSelectedScore.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {issuesAtSelectedScore.map((issue) => (
                          <li key={issue.id} className="text-sm">
                            <span className="font-medium">{issue.id}:</span> {issue.issueEvent}
                            <div className="text-xs text-gray-600 ml-5">
                              Owned by: {issue.ownedBy} | Category: {issue.category} | Status: {issue.status}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No issues found at this score level.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        
          {/* Risk Treatment Response Table */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Risk Treatment Response</h3>
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800" colSpan={2}>Risk rating</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Risk Treatment / Response</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Extreme Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-red-600 text-white border border-gray-800 w-1/6">
                      Extreme
                    </td>
                    <td className="p-4 text-center font-bold bg-red-600 text-white border border-gray-800 w-1/6">
                      64, 80, 100
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800 w-1/6">
                      Avoid
                    </td>
                    <td className="p-4 border border-gray-800 w-3/6">
                      Unacceptable. Major disruption certain; different approach required; high priority management attention required.
                    </td>
                  </tr>
                  
                  {/* High Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-orange-400 border border-gray-800 w-1/6">
                      High
                    </td>
                    <td className="p-4 text-center font-bold bg-orange-400 border border-gray-800 w-1/6">
                      36, 48, 60
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800 w-1/6">
                      Avoid, Mitigate / Control, Transfer, Share, Exploit
                    </td>
                    <td className="p-4 border border-gray-800 w-3/6">
                      Unacceptable. Major disruption likely; different approach required; priority management attention required.
                    </td>
                  </tr>
                  
                  {/* Moderate Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800 w-1/6">
                      Moderate
                    </td>
                    <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800 w-1/6">
                      16, 20, 24, 32, 40
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800 w-1/6">
                      Mitigate, Accept, Exploit
                    </td>
                    <td className="p-4 border border-gray-800 w-3/6">
                      Some disruption; different approach may be required; additional management attention may be needed.
                    </td>
                  </tr>
                  
                  {/* Low Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-green-400 border border-gray-800 w-1/6">
                      Low
                    </td>
                    <td className="p-4 text-center font-bold bg-green-400 border border-gray-800 w-1/6">
                      4, 8, 12
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800 w-1/6">
                      Accept
                    </td>
                    <td className="p-4 border border-gray-800 w-3/6">
                      Minimum impact; minimum oversight needed to ensure risk remains low.
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Risk Matrix Table */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Risk Matrix</h3>
            <div className="flex mb-4">
              <div className="flex items-center mr-4">
                <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#8BC34A' }}></div>
                <span>Low (4, 8, 12)</span>
              </div>
              <div className="flex items-center mr-4">
                <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#FFEB3B' }}></div>
                <span>Moderate (16, 20, 24, 32, 40)</span>
              </div>
              <div className="flex items-center mr-4">
                <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#FFC107' }}></div>
                <span>High (36, 48, 60)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#F44336' }}></div>
                <span>Extreme (64, 80, 100)</span>
              </div>
            </div>

            <table className="w-full border-collapse border border-gray-800">
              {/* Header row with Impact title */}
              <thead>
                <tr>
                  <th className="p-2 text-center font-bold bg-black text-white border border-gray-800"></th>
                  <th className="p-2 text-center font-bold bg-black text-white border border-gray-800" colSpan={5}>Impact</th>
                </tr>
                <tr>
                  <th className="p-2 text-center font-bold bg-black text-white border border-gray-800">
                    <span className="inline-block" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Risk</span>
                  </th>
                  <th className="p-2 text-center font-bold bg-white border border-gray-800">Very Limited Impact = 20</th>
                  <th className="p-2 text-center font-bold bg-white border border-gray-800">Limited = 40</th>
                  <th className="p-2 text-center font-bold bg-white border border-gray-800">Moderate = 60</th>
                  <th className="p-2 text-center font-bold bg-white border border-gray-800">Major = 80</th>
                  <th className="p-2 text-center font-bold bg-white border border-gray-800">Severe = 100</th>
                </tr>
              </thead>
              <tbody>
                {/* Almost Certain row */}
                <tr>
                  <td className="p-2 font-bold bg-white border border-gray-800">Almost Certain = 1.00</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">20</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">40</td>
                  <td className="p-4 text-center font-bold bg-orange-400 border border-gray-800">60</td>
                  <td className="p-4 text-center font-bold bg-red-600 text-white border border-gray-800">80</td>
                  <td className="p-4 text-center font-bold bg-red-600 text-white border border-gray-800">100</td>
                </tr>
                
                {/* Likely row */}
                <tr>
                  <td className="p-2 font-bold bg-white border border-gray-800">Likely = 0.80</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">16</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">32</td>
                  <td className="p-4 text-center font-bold bg-orange-400 border border-gray-800">48</td>
                  <td className="p-4 text-center font-bold bg-red-600 text-white border border-gray-800">64</td>
                  <td className="p-4 text-center font-bold bg-red-600 text-white border border-gray-800">80</td>
                </tr>
                
                {/* Possible row */}
                <tr>
                  <td className="p-2 font-bold bg-white border border-gray-800">Possible = 0.60</td>
                  <td className="p-4 text-center font-bold bg-green-400 border border-gray-800">12</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">24</td>
                  <td className="p-4 text-center font-bold bg-orange-400 border border-gray-800">36</td>
                  <td className="p-4 text-center font-bold bg-orange-400 border border-gray-800">48</td>
                  <td className="p-4 text-center font-bold bg-orange-400 border border-gray-800">60</td>
                </tr>
                
                {/* Unlikely row */}
                <tr>
                  <td className="p-2 font-bold bg-white border border-gray-800">Unlikely = 0.40</td>
                  <td className="p-4 text-center font-bold bg-green-400 border border-gray-800">8</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">16</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">24</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">32</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">40</td>
                </tr>
                
                {/* Rare row */}
                <tr>
                  <td className="p-2 font-bold bg-white border border-gray-800">Rare = 0.20</td>
                  <td className="p-4 text-center font-bold bg-green-400 border border-gray-800">4</td>
                  <td className="p-4 text-center font-bold bg-green-400 border border-gray-800">8</td>
                  <td className="p-4 text-center font-bold bg-green-400 border border-gray-800">12</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">16</td>
                  <td className="p-4 text-center font-bold bg-yellow-300 border border-gray-800">20</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Understanding Risk Ratings</h3>
          <div className="space-y-4">
            <p>
              The risk rating matrix provides a visual representation of risk severity based on the
              combination of probability and impact scores. The rating is calculated by multiplying the impact value (20-100) 
              by the probability factor (0.20-1.00) to generate a risk score.
            </p>
            <p>
              <strong>Low Risk (Green, 4-12):</strong> Minimal threat to project objectives. These risks generally 
              require monitoring but limited active management.
            </p>
            <p>
              <strong>Moderate Risk (Yellow, 16-40):</strong> Moderate threat that may affect project outcomes. 
              These risks should be actively managed with defined mitigation strategies.
            </p>
            <p>
              <strong>High Risk (Orange, 36-60):</strong> Significant threat requiring careful management and 
              detailed response plans. Regular review and updates are essential.
            </p>
            <p>
              <strong>Extreme Risk (Red, 64-100):</strong> Severe threats that can fundamentally compromise 
              project success. These require immediate attention, detailed response planning, and 
              ongoing executive oversight.
            </p>
          </div>
          
          {/* Risk Response Weighting Table */}
          <Card className="shadow-lg mb-6 mt-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Risk Response Weighting</h3>
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Response Type</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Weight Factor</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Description</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">When to Use</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Avoid Response Row */}
                  <tr>
                    <td className="p-4 text-center font-bold border border-gray-800 w-1/6">
                      Avoid
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800 w-1/6">
                      0%
                    </td>
                    <td className="p-4 border border-gray-800 w-2/6">
                      The threat has been eliminated by changing project approach or scope.
                    </td>
                    <td className="p-4 border border-gray-800 w-2/6">
                      For high and extreme risks that can be eliminated by changing the project approach.
                    </td>
                  </tr>
                  
                  {/* Transfer Response Row */}
                  <tr>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      Transfer
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      30-40%
                    </td>
                    <td className="p-4 border border-gray-800">
                      Risk has been shifted to third party through insurance, warranties, or contracts.
                    </td>
                    <td className="p-4 border border-gray-800">
                      When financial impact can be covered but some operational or reputational risk remains.
                    </td>
                  </tr>
                  
                  {/* Mitigate Response Row */}
                  <tr>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      Mitigate
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      50-70%
                    </td>
                    <td className="p-4 border border-gray-800">
                      Actions taken to reduce probability and/or impact of the risk.
                    </td>
                    <td className="p-4 border border-gray-800">
                      For most risks where complete elimination is not possible but impacts can be reduced.
                    </td>
                  </tr>
                  
                  {/* Accept Response Row */}
                  <tr>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      Accept
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      100%
                    </td>
                    <td className="p-4 border border-gray-800">
                      The risk is acknowledged but no specific action is taken.
                    </td>
                    <td className="p-4 border border-gray-800">
                      Appropriate only for low risks or when cost of mitigation exceeds potential impact.
                    </td>
                  </tr>
                  
                  {/* Share Response Row */}
                  <tr>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      Share
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      60%
                    </td>
                    <td className="p-4 border border-gray-800">
                      Risk is allocated among multiple parties to reduce individual exposure.
                    </td>
                    <td className="p-4 border border-gray-800">
                      When multiple stakeholders can each manage portions of a complex risk.
                    </td>
                  </tr>
                  
                  {/* Exploit Response Row */}
                  <tr>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      Exploit
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      -30%
                    </td>
                    <td className="p-4 border border-gray-800">
                      Actions taken to ensure the opportunity is realized, potentially offsetting negative risks.
                    </td>
                    <td className="p-4 border border-gray-800">
                      For positive risks (opportunities) that can reduce overall project risk.
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 text-sm text-gray-600">
                <p>This table shows how different risk response types can modify the weight of a risk in the overall assessment. 
                The weight factor indicates how much of the original risk score contributes to the project risk calculation.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Risk Status Adjustment Table */}
          <Card className="shadow-lg mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Risk Status Adjustment</h3>
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Risk Status</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Weight Factor</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Description</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Impact on Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Active Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-red-100 border border-gray-800 w-1/6">
                      Active
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800 w-1/6">
                      100%
                    </td>
                    <td className="p-4 border border-gray-800 w-2/6">
                      Current risk that requires attention and management.
                    </td>
                    <td className="p-4 border border-gray-800 w-2/6">
                      Fully contributes to the project risk score. High and extreme active risks might trigger executive override.
                    </td>
                  </tr>
                  
                  {/* Monitoring Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-yellow-100 border border-gray-800">
                      Monitoring
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      80%
                    </td>
                    <td className="p-4 border border-gray-800">
                      Risk is being actively tracked but has not materialized.
                    </td>
                    <td className="p-4 border border-gray-800">
                      Slightly reduced contribution to project risk score, acknowledging awareness but ongoing concern.
                    </td>
                  </tr>
                  
                  {/* In Progress Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-blue-100 border border-gray-800">
                      In Progress
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      60%
                    </td>
                    <td className="p-4 border border-gray-800">
                      Mitigation actions are currently being implemented.
                    </td>
                    <td className="p-4 border border-gray-800">
                      Moderately contributes to the risk score, reflecting that actions are underway to address the risk.
                    </td>
                  </tr>
                  
                  {/* Closed Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-green-100 border border-gray-800">
                      Closed
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      0%
                    </td>
                    <td className="p-4 border border-gray-800">
                      The risk has been resolved or is no longer relevant.
                    </td>
                    <td className="p-4 border border-gray-800">
                      Does not contribute to the project risk score.
                    </td>
                  </tr>
                  
                  {/* Eventuated Risk Row */}
                  <tr>
                    <td className="p-4 text-center font-bold bg-purple-100 border border-gray-800">
                      Eventuated
                    </td>
                    <td className="p-4 text-center font-bold border border-gray-800">
                      0%
                    </td>
                    <td className="p-4 border border-gray-800">
                      The risk has occurred and converted to an issue.
                    </td>
                    <td className="p-4 border border-gray-800">
                      No longer contributes as a risk but is tracked in the issue register instead.
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 text-sm text-gray-600">
                <p>This table shows how the status of a risk affects its weight in the risk assessment calculation. 
                The weight factor modifies how much the risk contributes to the overall project risk score.</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Executive Override Table */}
          <Card className="shadow-lg mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Executive Override Rules</h3>
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Override Rule</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Condition</th>
                    <th className="p-3 text-center font-bold bg-gray-100 border border-gray-800">Effect on Project Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {/* High Level Risks Rule */}
                  <tr>
                    <td className="p-4 font-bold border border-gray-800 w-1/4">
                      High Level Risk Detection
                    </td>
                    <td className="p-4 border border-gray-800 w-1/3">
                      If any extreme risk (score 64-100) exists in the register with status "Active"
                    </td>
                    <td className="p-4 border border-gray-800 w-5/12">
                      Project risk level automatically elevated to "Extreme" regardless of weighted average
                    </td>
                  </tr>
                  
                  {/* Multiple High Risks */}
                  <tr>
                    <td className="p-4 font-bold border border-gray-800">
                      Multiple High Risk Warning
                    </td>
                    <td className="p-4 border border-gray-800">
                      If two or more high risks (score 36-60) exist in the register with status "Active"
                    </td>
                    <td className="p-4 border border-gray-800">
                      Project risk level automatically elevated to "High" regardless of weighted average
                    </td>
                  </tr>
                  
                  {/* Risk Response Type Exceptions */}
                  <tr>
                    <td className="p-4 font-bold border border-gray-800">
                      Risk Response Exceptions
                    </td>
                    <td className="p-4 border border-gray-800">
                      If high or extreme risks have response types of "Transfer" or "Mitigate" with evidence
                    </td>
                    <td className="p-4 border border-gray-800">
                      Executive override can be disabled if proper documentation of mitigation/transfer is provided
                    </td>
                  </tr>
                  
                  {/* Critical Category Risks */}
                  <tr>
                    <td className="p-4 font-bold border border-gray-800">
                      Critical Category Escalation
                    </td>
                    <td className="p-4 border border-gray-800">
                      Any active risk in specific critical categories (e.g., "Safety", "Regulatory", "Financial Viability")
                    </td>
                    <td className="p-4 border border-gray-800">
                      Specific notification to executive team required; may elevate project risk level by one category
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 text-sm text-gray-600">
                <p>Executive override rules ensure critical risks get appropriate management attention regardless of mathematical score averaging. 
                These rules help prevent high-level risks from being "diluted" in the overall calculation.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RatingLegendPage;