import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Risk, type InsertRisk } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export const useRisks = (projectId?: number) => {
  const { toast } = useToast();
  
  const queryKey = projectId 
    ? ['/api/risks', { projectId }] 
    : ['/api/risks'];
  
  const risksQuery = useQuery<Risk[]>({
    queryKey,
    queryFn: async ({ queryKey }) => {
      const url = projectId 
        ? `/api/risks?projectId=${projectId}` 
        : '/api/risks';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to fetch risks');
      }
      return res.json();
    }
  });
  
  const createRiskMutation = useMutation({
    mutationFn: async (risk: InsertRisk) => {
      const res = await apiRequest('POST', '/api/risks', risk);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risks'] });
      toast({
        title: "Risk created",
        description: "The risk has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create risk",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRisk> }) => {
      const res = await apiRequest('PATCH', `/api/risks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risks'] });
      toast({
        title: "Risk updated",
        description: "The risk has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update risk",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteRiskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/risks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risks'] });
      toast({
        title: "Risk deleted",
        description: "The risk has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete risk",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Convert risk to issue
  const convertRiskToIssueMutation = useMutation({
    mutationFn: async (risk: Risk) => {
      // First create an issue from the risk
      const issuePayload = {
        priorityRank: risk.priorityRank,
        uniqueId: `I-${risk.riskId.replace('R -', '').trim()}`, // Convert R-123 to I-123
        riskId: risk.riskId, // Reference to the original risk
        issueDate: new Date().toISOString().split('T')[0], // Today's date
        raisedBy: risk.raisedBy,
        ownedBy: risk.ownedBy,
        issueEvent: risk.riskEvent,
        issueEffect: risk.riskEffect,
        resolution: "", // Empty to start with
        category: risk.riskCategory,
        impact: risk.impact, // Keep as number
        status: "Open",
        assignedTo: risk.ownedBy,
        closedDate: null, // No closed date yet
        comments: `Converted from risk ${risk.riskId}. Original risk cause: ${risk.riskCause}`,
        projectId: risk.projectId
      };
      
      // Create the issue
      const issueRes = await apiRequest('POST', '/api/issues', issuePayload);
      const newIssue = await issueRes.json();
      
      // Then update the risk with the reference to the issue
      const riskUpdateRes = await apiRequest('PATCH', `/api/risks/${risk.id}`, {
        issueId: newIssue.uniqueId,
        riskStatus: 'Eventuated' // Update the risk status to show it has eventuated
      });
      
      return {
        issue: newIssue,
        updatedRisk: await riskUpdateRes.json()
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      toast({
        title: "Risk converted to issue",
        description: "The risk has been converted to an issue successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to convert risk to issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    risks: risksQuery.data || [],
    isLoading: risksQuery.isLoading,
    isError: risksQuery.isError,
    error: risksQuery.error,
    createRisk: createRiskMutation.mutate,
    updateRisk: updateRiskMutation.mutate,
    deleteRisk: deleteRiskMutation.mutate,
    convertRiskToIssue: convertRiskToIssueMutation.mutate,
    isCreating: createRiskMutation.isPending,
    isUpdating: updateRiskMutation.isPending,
    isDeleting: deleteRiskMutation.isPending,
    isConverting: convertRiskToIssueMutation.isPending
  };
};
