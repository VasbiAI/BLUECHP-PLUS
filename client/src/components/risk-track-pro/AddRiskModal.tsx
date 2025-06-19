import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import PertEstimationForm from './PertEstimationForm';
import { useQuery } from '@tanstack/react-query';

// Calculate risk rating 
const calculateRiskRating = (likelihood: number, impact: number): number => {
  return likelihood * impact;
};

// Calculate PERT estimates
const calculatePert = (optimistic: number, mostLikely: number, pessimistic: number): number => {
  return (optimistic + 4 * mostLikely + pessimistic) / 6;
};

const calculatePertVariance = (optimistic: number, pessimistic: number): number => {
  return Math.pow((pessimistic - optimistic) / 6, 2);
};

const calculateStandardDeviation = (optimistic: number, pessimistic: number): number => {
  return (pessimistic - optimistic) / 6;
};

interface AddRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRisk: (riskData: any) => void;
  projectId: string;
}

const AddRiskModal: React.FC<AddRiskModalProps> = ({ isOpen, onClose, onAddRisk, projectId }) => {
  // State for form fields
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [mitigationStrategy, setMitigationStrategy] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState('active');
  const [comments, setComments] = useState('');

  // Cost estimation state
  const [costImpact, setCostImpact] = useState<number | null>(null);

  // PERT estimation state
  const [optimisticEstimate, setOptimisticEstimate] = useState('');
  const [mostLikelyEstimate, setMostLikelyEstimate] = useState('');
  const [pessimisticEstimate, setPessimisticEstimate] = useState('');

  // Active tab state
  const [activeTab, setActiveTab] = useState('details');

  // Fetch risk categories
  const { data: categories } = useQuery({
    queryKey: ['riskCategories'],
    queryFn: async () => {
      const response = await fetch('/api/risk-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch risk categories');
      }
      return response.json();
    },
  });

  // Calculate risk rating
  const riskRating = calculateRiskRating(likelihood, impact);

  // Calculate PERT results
  const optimistic = parseFloat(optimisticEstimate);
  const mostLikely = parseFloat(mostLikelyEstimate);
  const pessimistic = parseFloat(pessimisticEstimate);

  const isPertValid = !isNaN(optimistic) && !isNaN(mostLikely) && !isNaN(pessimistic);
  const pertResult = isPertValid ? calculatePert(optimistic, mostLikely, pessimistic) : 0;
  const pertVariance = isPertValid ? calculatePertVariance(optimistic, pessimistic) : 0;
  const standardDeviation = isPertValid ? calculateStandardDeviation(optimistic, pessimistic) : 0;

  // Handler for form submission
  const handleSubmit = () => {
    const riskData = {
      projectId,
      description,
      category,
      likelihood,
      impact,
      riskRating,
      mitigationStrategy,
      owner,
      status,
      costImpact: isPertValid ? pertResult : costImpact,
      comments,
    };

    onAddRisk(riskData);
    resetForm();
  };

  // Reset form fields
  const resetForm = () => {
    setDescription('');
    setCategory('General');
    setLikelihood(3);
    setImpact(3);
    setMitigationStrategy('');
    setOwner('');
    setStatus('active');
    setComments('');
    setCostImpact(null);
    setOptimisticEstimate('');
    setMostLikelyEstimate('');
    setPessimisticEstimate('');
    setActiveTab('details');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Risk to Register</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Risk Details</TabsTrigger>
            <TabsTrigger value="cost">Cost Estimation</TabsTrigger>
            <TabsTrigger value="pert">PERT Estimation</TabsTrigger>
          </TabsList>

          {/* Risk Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Risk Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the risk"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories ? categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      )) : (
                        <SelectItem value="General">General</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="owner">Risk Owner</Label>
                  <Input
                    id="owner"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Person responsible"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="likelihood">Likelihood (1-5)</Label>
                  <Select 
                    value={likelihood.toString()} 
                    onValueChange={(value) => setLikelihood(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select likelihood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Rare</SelectItem>
                      <SelectItem value="2">2 - Unlikely</SelectItem>
                      <SelectItem value="3">3 - Possible</SelectItem>
                      <SelectItem value="4">4 - Likely</SelectItem>
                      <SelectItem value="5">5 - Almost Certain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="impact">Impact (1-5)</Label>
                  <Select 
                    value={impact.toString()} 
                    onValueChange={(value) => setImpact(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Insignificant</SelectItem>
                      <SelectItem value="2">2 - Minor</SelectItem>
                      <SelectItem value="3">3 - Moderate</SelectItem>
                      <SelectItem value="4">4 - Major</SelectItem>
                      <SelectItem value="5">5 - Catastrophic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="mitigationStrategy">Mitigation Strategy</Label>
                <Textarea
                  id="mitigationStrategy"
                  value={mitigationStrategy}
                  onChange={(e) => setMitigationStrategy(e.target.value)}
                  placeholder="How will this risk be mitigated?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comments">Additional Comments</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any additional information about this risk"
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>

          {/* Cost Estimation Tab */}
          <TabsContent value="cost" className="space-y-4">
            <div>
              <Label htmlFor="costImpact">Cost Impact ($)</Label>
              <Input
                id="costImpact"
                type="number"
                value={costImpact || ''}
                onChange={(e) => setCostImpact(parseFloat(e.target.value) || null)}
                placeholder="Estimated cost impact"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the estimated financial impact if this risk occurs
              </p>
            </div>
          </TabsContent>

          {/* PERT Estimation Tab */}
          <TabsContent value="pert">
            <PertEstimationForm
              optimisticEstimate={optimisticEstimate}
              setOptimisticEstimate={setOptimisticEstimate}
              mostLikelyEstimate={mostLikelyEstimate}
              setMostLikelyEstimate={setMostLikelyEstimate}
              pessimisticEstimate={pessimisticEstimate}
              setPessimisticEstimate={setPessimisticEstimate}
              pertResult={pertResult}
              pertVariance={pertVariance}
              standardDeviation={standardDeviation}
              isValid={isPertValid}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 bg-gray-50 p-4 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Risk Rating:</span>
              <span className={`ml-2 px-2 py-1 rounded-md text-white font-medium ${
                riskRating >= 15 ? 'bg-red-600' :
                riskRating >= 10 ? 'bg-orange-500' :
                riskRating >= 4 ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {riskRating}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Severity:</span>
              <span className="ml-2 text-sm">
                {riskRating >= 15 ? 'Critical' :
                 riskRating >= 10 ? 'High' :
                 riskRating >= 4 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!description.trim()}
          >
            Add Risk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRiskModal;