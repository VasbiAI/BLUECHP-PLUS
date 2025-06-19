// Function to calculate adjusted risk rating and priority
function calculateAdjustedRating(risk) {
  // Base risk score (probability * impact)
  const baseScore = risk.probability * risk.impact;
  
  // Response Type adjustments
  let responseTypeMultiplier = 1.0; // Default (Accept: 100%)
  
  switch(risk.responseType.trim().toLowerCase()) {
    case 'avoid':
      responseTypeMultiplier = 0.0; // Avoid: 0%
      break;
    case 'transfer':
      responseTypeMultiplier = 0.35; // Transfer: 30-40% (using middle value)
      break;
    case 'mitigate':
      responseTypeMultiplier = 0.6; // Mitigate: 50-70% (using middle value)
      break;
    case 'accept':
    default:
      responseTypeMultiplier = 1.0; // Accept: 100%
      break;
  }
  
  // Status adjustments
  let statusMultiplier = 1.0; // Default (Active: 100%)
  
  switch(risk.riskStatus.trim().toLowerCase()) {
    case 'active':
    case 'open':
      statusMultiplier = 1.0; // Active/Open: 100%
      break;
    case 'monitoring':
      statusMultiplier = 0.8; // Monitoring: 80%
      break;
    case 'in progress':
      statusMultiplier = 0.6; // In Progress: 60%
      break;
    case 'closed':
      statusMultiplier = 0.0; // Closed: 0%
      break;
    default:
      statusMultiplier = 1.0;
      break;
  }
  
  // Calculate adjusted score
  const adjustedScore = baseScore * responseTypeMultiplier * statusMultiplier;
  
  // Determine priority rank based on adjusted score range
  let priorityRank;
  
  if (adjustedScore >= 64) {
    priorityRank = 1; // Extreme risk (highest priority)
  } else if (adjustedScore >= 36) {
    priorityRank = 5; // High risk
  } else if (adjustedScore >= 16) {
    priorityRank = 10; // Moderate risk
  } else {
    priorityRank = 20; // Low risk
  }
  
  // For risks with same adjusted score, we can use the original priority as a tiebreaker
  // but adjusted to fall within the new priority tiers
  
  return {
    adjustedScore,
    priorityRank
  };
}

// Example usage:
// const result = calculateAdjustedRating({
//   probability: 0.8, 
//   impact: 80, 
//   responseType: 'Accept', 
//   riskStatus: 'Open'
// });
// console.log(result); // { adjustedScore: 64, priorityRank: 1 }