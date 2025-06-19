import { type Risk, riskLevels } from "@shared/schema";

// For unmitigated risk - uses category-based standardized approach
export const getUnmitigatedRiskCategory = (score: number): string => {
  // Calculate which category this score falls into
  if (score >= CATEGORY_WEIGHTS.Extreme - 12.5) return 'Extreme'; // Extreme (75-100)
  if (score >= CATEGORY_WEIGHTS.High - 12.5) return 'High'; // High (50-74)
  if (score >= CATEGORY_WEIGHTS.Moderate - 12.5) return 'Moderate'; // Moderate (25-49)
  return 'Low'; // Low (0-24)
};

// Legacy function for backward compatibility - uses board-approved thresholds
// Note: This should only be used for displaying the original board-approved thresholds
export const getBoardApprovedRiskCategory = (score: number): string => {
  if (score >= 80) return 'Extreme';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
};

// For unmitigated risk color - uses category-based standardized approach
export const getUnmitigatedRiskColor = (score: number): string => {
  // Calculate which category this score falls into
  if (score >= CATEGORY_WEIGHTS.Extreme - 12.5) return '#DC3545'; // Red for Extreme (75-100)
  if (score >= CATEGORY_WEIGHTS.High - 12.5) return '#FD7E14'; // Orange for High (50-74)
  if (score >= CATEGORY_WEIGHTS.Moderate - 12.5) return '#FFC107'; // Yellow for Moderate (25-49)
  return '#28A745'; // Green for Low (0-24)
};

// Legacy function for backward compatibility - uses board-approved thresholds for colors
// Note: This should only be used for displaying the original board-approved thresholds
export const getBoardApprovedRiskColor = (score: number): string => {
  if (score >= 80) return '#DC3545'; // Red for Extreme
  if (score >= 60) return '#FD7E14'; // Orange for High
  if (score >= 40) return '#FFC107'; // Yellow for Moderate
  return '#28A745'; // Green for Low
};

// For mitigated risk - uses category-based standardized approach
export const getMitigatedRiskCategory = (score: number): string => {
  // Calculate which category this score falls into
  if (score >= CATEGORY_WEIGHTS.Extreme - 12.5) return 'Extreme'; // Extreme (75-100)
  if (score >= CATEGORY_WEIGHTS.High - 12.5) return 'High'; // High (50-74)
  if (score >= CATEGORY_WEIGHTS.Moderate - 12.5) return 'Moderate'; // Moderate (25-49)
  return 'Low'; // Low (0-24)
};

// For mitigated risk color - uses category-based standardized approach
export const getMitigatedRiskColor = (score: number): string => {
  // Calculate which category this score falls into
  if (score >= CATEGORY_WEIGHTS.Extreme - 12.5) return '#DC3545'; // Red for Extreme (75-100)
  if (score >= CATEGORY_WEIGHTS.High - 12.5) return '#FD7E14'; // Orange for High (50-74)
  if (score >= CATEGORY_WEIGHTS.Moderate - 12.5) return '#FFC107'; // Yellow for Moderate (25-49)
  return '#28A745'; // Green for Low (0-24)
};

// Calculate risk rating from probability and impact
export const calculateRiskRating = (probability: number, impact: number): number => {
  return Math.round(probability * impact);
};

// Calculate residual risk (after mitigation)
export const calculateResidualRisk = (
  riskRating: number, 
  responseType: string | null, 
  riskStatus: string | null
): number => {
  // Get adjustment factors
  const responseAdjustment = getResponseAdjustment(responseType);
  const statusAdjustment = getStatusAdjustment(riskStatus);
  
  // Apply adjustments to the risk rating
  return Math.round(riskRating * responseAdjustment * statusAdjustment);
};

// Helper function to get response type adjustment factor
const getResponseAdjustment = (responseType: string | null): number => {
  if (!responseType) return 1.0;
  
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
const getStatusAdjustment = (status: string | null): number => {
  if (!status) return 1.0;
  
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

// Get risk level based on risk rating
export const getRiskLevel = (riskRating: number) => {
  return riskLevels.find(
    level => riskRating >= level.minRating && riskRating <= level.maxRating
  ) || riskLevels[3]; // Default to Low if no match
};

// Count risks by risk level
export const countRisksByLevel = (risks: Risk[]) => {
  const counts = {
    extreme: 0,
    high: 0,
    moderate: 0,
    low: 0
  };
  
  risks.forEach(risk => {
    const level = getRiskLevel(risk.riskRating).name.toLowerCase();
    counts[level as keyof typeof counts]++;
  });
  
  return counts;
};

// Count risks by level after applying mitigation adjustments
export const countMitigatedRisksByLevel = (risks: Risk[]) => {
  const counts = {
    extreme: 0,
    high: 0,
    moderate: 0,
    low: 0
  };
  
  risks.forEach(risk => {
    const riskRating = risk.riskRating || 
      (risk.probability && risk.impact ? risk.probability * risk.impact * 100 : 0);
    
    const mitigatedRating = calculateResidualRisk(
      riskRating,
      risk.responseType,
      risk.riskStatus
    );
    
    const level = getRiskLevel(mitigatedRating).name.toLowerCase();
    counts[level as keyof typeof counts]++;
  });
  
  return counts;
};

// Standard category weights for normalized risk assessment (percentage-based)
export const CATEGORY_WEIGHTS = {
  Low: 12.5,       // Median of 0-25%
  Moderate: 37.5,  // Median of 26-50%
  High: 62.5,      // Median of 51-75%
  Extreme: 87.5    // Median of 76-100%
};

// Calculate overall risk score using category-based weighted assessment
export const calculateRiskScore = (risks: Risk[]): number => {
  if (risks.length === 0) return 0;
  
  // Helper function to get response type adjustment factor
  const getResponseAdjustment = (responseType: string | null): number => {
    if (!responseType) return 1.0;
    
    switch (responseType.toLowerCase()) {
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
  const getStatusAdjustment = (status: string | null): number => {
    if (!status) return 1.0;
    
    switch (status.toLowerCase()) {
      case 'monitoring': return 0.8;
      case 'in progress': return 0.6;
      case 'closed': return 0.0;
      case 'eventuated': return 0.0;
      case 'active':
      default:
        return 1.0;
    }
  };
  
  // Initialize category counts for weighted average calculation
  let totalWeight = 0;
  let weightedSum = 0;
  
  // Process each risk
  risks.forEach(risk => {
    // Calculate response and status adjustment factors for this risk
    const responseAdjustment = getResponseAdjustment(risk.responseType);
    const statusAdjustment = getStatusAdjustment(risk.riskStatus);
    
    // Skip risks that are effectively zero due to adjustments
    if (responseAdjustment * statusAdjustment === 0) return;
    
    // Determine the category of this risk using board-approved thresholds
    const adjustedRiskRating = risk.riskRating * responseAdjustment * statusAdjustment;
    const category = getBoardApprovedRiskCategory(adjustedRiskRating);
    
    // Get the standard weight for this category
    const categoryWeight = CATEGORY_WEIGHTS[category as keyof typeof CATEGORY_WEIGHTS];
    
    // Add to the weighted sum
    weightedSum += categoryWeight;
    totalWeight++;
  });
  
  // Calculate the weighted average (0-100 scale)
  let overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  
  // Implementation of the executive override rules using category-based assessment
  const extremeActiveRisks = risks.filter(risk => {
    // Apply adjustments
    const responseAdjustment = getResponseAdjustment(risk.responseType);
    const statusAdjustment = getStatusAdjustment(risk.riskStatus);
    const adjustedRating = risk.riskRating * responseAdjustment * statusAdjustment;
    
    // Check if it's an extreme risk by board-approved standards and is active
    return getBoardApprovedRiskCategory(adjustedRating) === 'Extreme' && 
           (risk.riskStatus === 'Active' || !risk.riskStatus);
  });
  
  const highActiveRisks = risks.filter(risk => {
    // Apply adjustments
    const responseAdjustment = getResponseAdjustment(risk.responseType);
    const statusAdjustment = getStatusAdjustment(risk.riskStatus);
    const adjustedRating = risk.riskRating * responseAdjustment * statusAdjustment;
    
    // Check if it's a high risk by board-approved standards and is active
    return getBoardApprovedRiskCategory(adjustedRating) === 'High' && 
           (risk.riskStatus === 'Active' || !risk.riskStatus);
  });
  
  // Apply executive override rules
  if (extremeActiveRisks.length > 0) {
    // Any extreme risk automatically elevates project to Extreme status
    overallScore = Math.max(overallScore, CATEGORY_WEIGHTS.Extreme);
  } else if (highActiveRisks.length >= 2) {
    // Two or more high risks elevate project to High status
    overallScore = Math.max(overallScore, CATEGORY_WEIGHTS.High);
  }
  
  // Ensure score doesn't exceed 100
  overallScore = Math.min(overallScore, 100);
  
  return overallScore;
};

// Calculate unmitigated risk score - raw score without any adjustments
export const calculateUnmitigatedRiskScore = (risks: Risk[]): number => {
  if (risks.length === 0) return 0;
  
  // Calculate average of raw risk ratings
  const unmitigatedScore = Math.round(
    risks.reduce((sum, risk) => {
      // Use the direct riskRating field which is already the impact * probability calculation
      return sum + risk.riskRating;
    }, 0) / risks.length
  );
  
  // Ensure score doesn't exceed 100
  return Math.min(unmitigatedScore, 100);
};

export const getRiskStatusBadgeColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-blue-100 text-blue-800';
    case 'closed':
      return 'bg-green-100 text-green-800';
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getLevelColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'extreme':
      return 'text-[#DC3545] bg-[#DC3545]/10';
    case 'high':
      return 'text-[#FD7E14] bg-[#FD7E14]/10';
    case 'medium':
      return 'text-[#FFC107] bg-[#FFC107]/10';
    case 'low':
      return 'text-[#28A745] bg-[#28A745]/10';
    default:
      return 'text-gray-500 bg-gray-100';
  }
};

export const getRiskBorderColor = (riskRating: number): string => {
  const level = getRiskLevel(riskRating).name.toLowerCase();
  
  switch (level) {
    case 'extreme':
      return 'border-l-[#DC3545]';
    case 'high':
      return 'border-l-[#FD7E14]';
    case 'medium':
      return 'border-l-[#FFC107]';
    case 'low':
      return 'border-l-[#28A745]';
    default:
      return 'border-l-gray-300';
  }
};

export const getRatingBadgeColor = (riskRating: number): string => {
  const level = getRiskLevel(riskRating).name.toLowerCase();
  
  switch (level) {
    case 'extreme':
      return 'bg-[#DC3545] text-white';
    case 'high':
      return 'bg-[#FD7E14] text-white';
    case 'medium':
      return 'bg-[#FFC107] text-white';
    case 'low':
      return 'bg-[#28A745] text-white';
    default:
      return 'bg-gray-300 text-gray-700';
  }
};

// Get risk status color based on score for the circular indicator (using category-based approach)
export const getRiskStatusColor = (score: number): string => {
  // Calculate which category this score falls into
  if (score >= CATEGORY_WEIGHTS.Extreme - 12.5) return 'bg-red-600'; // Extreme (75-100)
  if (score >= CATEGORY_WEIGHTS.High - 12.5) return 'bg-orange-400'; // High (50-74)
  if (score >= CATEGORY_WEIGHTS.Moderate - 12.5) return 'bg-yellow-300'; // Moderate (25-49)
  return 'bg-green-400'; // Low (0-24)
};

// Check if we should use white text (for red background)
export const isRedRisk = (score: number): boolean => {
  return score >= CATEGORY_WEIGHTS.Extreme - 12.5; // Extreme (75-100)
};

// Get risk category text based on score (using category-based approach)
export const getRiskCategory = (score: number): string => {
  // Calculate which category this score falls into
  if (score >= CATEGORY_WEIGHTS.Extreme - 12.5) return 'Extreme'; // Extreme (75-100)
  if (score >= CATEGORY_WEIGHTS.High - 12.5) return 'High'; // High (50-74)
  if (score >= CATEGORY_WEIGHTS.Moderate - 12.5) return 'Moderate'; // Moderate (25-49)
  return 'Low'; // Low (0-24)
};
