/**
 * Risk calculation service
 * Provides utilities for calculating risk ratings and other risk metrics
 */

/**
 * Calculate risk rating based on probability and impact
 * @param probability The probability or likelihood of the risk (1-5)
 * @param impact The impact of the risk (1-5)
 * @returns The calculated risk rating
 */
export function calculateRiskRating(probability: number | null | undefined, impact: number | null | undefined): number {
  // Default values if null or undefined
  const prob = probability || 3;
  const imp = impact || 3;
  
  // Simple multiplication (1-25 scale)
  return prob * imp;
}

/**
 * Get risk severity based on risk rating
 * @param riskRating The calculated risk rating
 * @returns The risk severity level (low, medium, high, critical)
 */
export function getRiskSeverity(riskRating: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskRating <= 4) {
    return 'low';
  } else if (riskRating <= 9) {
    return 'medium';
  } else if (riskRating <= 16) {
    return 'high';
  } else {
    return 'critical';
  }
}

/**
 * Calculate exposure value based on risk rating and cost impact
 * @param riskRating The calculated risk rating
 * @param costImpact The cost impact value
 * @returns The exposure value
 */
export function calculateExposure(riskRating: number, costImpact: number): number {
  const probabilityFactor = riskRating / 25; // Convert to 0-1 scale
  return probabilityFactor * costImpact;
}