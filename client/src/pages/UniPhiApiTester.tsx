import { useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const UNIPHI_ENDPOINTS = [
  "AccountLogin", "APInvoice", "ARInvoice", 
  "Budget", "BudgetSnapshot", "BudgetVersion", 
  "CalculatedColumn", "CalculatedColumnSnapshot", 
  "Cashflow", "CashflowSnapshot", "ChartOfAccounts", 
  "Classification", "ClassificationProjectRate", 
  "ClassificationRate", "Contract", "ContractClaimAdjustment", 
  "ContractDeliverable", "ContractDeliverableCashflow", 
  "ContractDeliverableComment", "ContractDeliverableCommentAttachment", 
  "ContractDeliverableCustomField", "ContractDeliverableResourcePlan", 
  "ContractDisbursement", "ContractDisbursementCashflow", 
  "ContractEarnedValue", "ContractEffortSnapshot", 
  "ContractEOT", "ContractMaterial", "ContractPhaseSnapshot", 
  "ContractSnapshotVersion", "ContractStageGate", 
  "ContractStageGateMilestone", "ContractStatus", 
  "ContractualBillableTime", "ContractVariation", 
  "ContractVariationCashflow", "ContractVariationComment", 
  "ContractVariationCommentAttachment", "ContractVariationCustomField", 
  "ContractVariationIssues", "ContractVariationResourcePlan", 
  "ContractVariationStatus", "Currency", "CurrencyRate", 
  "Document", "EmploymentType", "Expense", 
  "ExpenseImport", "ExpenseInvoice", "ExternalTransaction", 
  "File", "FileAnnotation", "FinancialDay", 
  "FinancialPeriod", "FinancialYear", "ForecastToComplete", 
  "GuidedWorkflow", "Issue", "IssueComment", 
  "LifecyclePhase", "Location", "Log", 
  "Metric", "MetricSnapshot", "Milestone", 
  "MilestoneHistory", "Organisation", "PenaltyRate", 
  "PeriodicProjectCustomField", "Person", "PersonCalendar", 
  "PersonLog", "PersonProject", "PersonProjectRate", 
  "PersonRate", "PersonRole", "PersonRoleLog", 
  "ProgressClaim", "Project", "ProjectLifecycle", 
  "ProjectStatus", "ProjectType", "RateMultiplier", 
  "Region", "ResourcePlan", "ResourcePlanSnapshot", 
  "ResourcePlanVersion", "Risk", "RiskHistory", 
  "RoleLog", "Sector", "ServiceLine", 
  "Site", "Timesheet", "TimesheetAudit", 
  "TimesheetForecast", "TimesheetImport", "TPI", 
  "TPILocation", "TPITime"
];

interface ApiResult {
  status: number;
  data: any;
  error?: string;
}

const UniPhiApiTester = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("ProjectShow");
  const [endpointId, setEndpointId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const url = endpointId 
        ? `/api/uniphi/test/${selectedEndpoint}/${endpointId}`
        : `/api/uniphi/test/${selectedEndpoint}`;
      
      const response = await axios.get(url);
      
      setResult({
        status: response.status,
        data: response.data
      });
    } catch (error: any) {
      console.error('Error testing UniPhi endpoint:', error);
      setResult({
        status: error.response?.status || 500,
        data: error.response?.data || {},
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>UniPhi API Endpoint Tester</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium leading-none mb-2 block">
                  Select Endpoint
                </label>
                <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIPHI_ENDPOINTS.map((endpoint) => (
                      <SelectItem key={endpoint} value={endpoint}>
                        {endpoint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium leading-none mb-2 block">
                  ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter ID for specific record"
                  value={endpointId}
                  onChange={(e) => setEndpointId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <Button onClick={handleTest} disabled={loading}>
                {loading ? "Loading..." : "Test Endpoint"}
              </Button>
            </div>

            {result && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Response Status: {result.status}
                  </h3>
                  {result.error && (
                    <div className="bg-red-50 p-4 mb-4 rounded-md text-red-800">
                      Error: {result.error}
                    </div>
                  )}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniPhiApiTester;