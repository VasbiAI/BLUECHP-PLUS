import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';

interface PertEstimationProps {
  optimisticEstimate: string;
  setOptimisticEstimate: (value: string) => void;
  mostLikelyEstimate: string;
  setMostLikelyEstimate: (value: string) => void;
  pessimisticEstimate: string;
  setPessimisticEstimate: (value: string) => void;
  pertResult: number;
  pertVariance: number;
  standardDeviation: number;
  isValid: boolean;
}

const PertEstimationForm: React.FC<PertEstimationProps> = ({
  optimisticEstimate,
  setOptimisticEstimate,
  mostLikelyEstimate,
  setMostLikelyEstimate,
  pessimisticEstimate,
  setPessimisticEstimate,
  pertResult,
  pertVariance,
  standardDeviation,
  isValid
}) => {
  // Helpers for displaying formatted values
  const formatNumber = (value: number) => {
    return isNaN(value) ? '—' : value.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="optimistic">Optimistic (O)</Label>
          <Input
            id="optimistic"
            type="number"
            value={optimisticEstimate}
            onChange={(e) => setOptimisticEstimate(e.target.value)}
            placeholder="Best case"
          />
          <p className="text-sm text-gray-500 mt-1">
            The best-case estimate (minimal issues)
          </p>
        </div>

        <div>
          <Label htmlFor="mostLikely">Most Likely (M)</Label>
          <Input
            id="mostLikely"
            type="number"
            value={mostLikelyEstimate}
            onChange={(e) => setMostLikelyEstimate(e.target.value)}
            placeholder="Expected case"
          />
          <p className="text-sm text-gray-500 mt-1">
            The most probable estimate (realistic)
          </p>
        </div>

        <div>
          <Label htmlFor="pessimistic">Pessimistic (P)</Label>
          <Input
            id="pessimistic"
            type="number"
            value={pessimisticEstimate}
            onChange={(e) => setPessimisticEstimate(e.target.value)}
            placeholder="Worst case"
          />
          <p className="text-sm text-gray-500 mt-1">
            The worst-case estimate (if issues arise)
          </p>
        </div>
      </div>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">PERT Estimate</h3>
              <p className="text-2xl font-bold mt-2">{isValid ? formatNumber(pertResult) : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">
                (O + 4M + P) ÷ 6
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Variance</h3>
              <p className="text-2xl font-bold mt-2">{isValid ? formatNumber(pertVariance) : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">
                ((P - O) ÷ 6)²
              </p>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">Standard Deviation</h3>
              <p className="text-2xl font-bold mt-2">{isValid ? formatNumber(standardDeviation) : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">
                (P - O) ÷ 6
              </p>
            </div>
          </div>

          <div className="mt-4 text-sm">
            <h4 className="font-medium text-gray-700">About PERT Estimation</h4>
            <p className="text-gray-600 mt-1">
              PERT (Program Evaluation and Review Technique) uses weighted averages to calculate a more realistic 
              estimate by considering the best, worst, and most likely scenarios. This approach helps account for
              uncertainty and provides statistical insights into potential schedule or cost variations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PertEstimationForm;