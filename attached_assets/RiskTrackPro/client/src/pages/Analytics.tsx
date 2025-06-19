import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TabNavigation from "@/components/TabNavigation";
import ProjectInfo from "@/components/ProjectInfo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { countRisksByLevel, getRiskLevel } from "@/lib/utils/riskCalculations";

const Analytics = () => {
  const projectId = 1; // Default to first project
  const [timeframe, setTimeframe] = useState("all");
  
  const { data: risks, isLoading } = useQuery({
    queryKey: ['/api/risks', { projectId }],
    queryFn: async () => {
      const res = await fetch(`/api/risks?projectId=${projectId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch risks');
      }
      return res.json();
    }
  });
  
  // Prepare data for category chart
  const getCategoryData = () => {
    if (!risks) return [];
    
    const categoryCount: Record<string, number> = {};
    risks.forEach(risk => {
      categoryCount[risk.riskCategory] = (categoryCount[risk.riskCategory] || 0) + 1;
    });
    
    return Object.entries(categoryCount).map(([category, count]) => ({
      name: category,
      value: count
    }));
  };
  
  // Prepare data for risk level chart
  const getRiskLevelData = () => {
    if (!risks) return [];
    
    const counts = countRisksByLevel(risks);
    return [
      { name: "Extreme", value: counts.extreme, color: "#DC3545" },
      { name: "High", value: counts.high, color: "#FD7E14" },
      { name: "Medium", value: counts.medium, color: "#FFC107" },
      { name: "Low", value: counts.low, color: "#28A745" }
    ];
  };
  
  // Prepare data for risk status chart
  const getRiskStatusData = () => {
    if (!risks) return [];
    
    const statusCount: Record<string, number> = {};
    risks.forEach(risk => {
      statusCount[risk.riskStatus] = (statusCount[risk.riskStatus] || 0) + 1;
    });
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === "Open" ? "#0066CC" : status === "Closed" ? "#28A745" : "#FFC107"
    }));
  };
  
  // Prepare data for risk response type chart
  const getResponseTypeData = () => {
    if (!risks) return [];
    
    const responseCount: Record<string, number> = {};
    risks.forEach(risk => {
      responseCount[risk.responseType] = (responseCount[risk.responseType] || 0) + 1;
    });
    
    return Object.entries(responseCount).map(([response, count]) => ({
      name: response,
      value: count
    }));
  };
  
  // Prepare data for risk priority distribution
  const getPriorityData = () => {
    if (!risks) return [];
    
    // Group by priority ranges
    const priorityRanges = {
      "1-5": 0,
      "6-10": 0,
      "11-20": 0,
      "21-30": 0,
      "31+": 0
    };
    
    risks.forEach(risk => {
      const priority = risk.priorityRank;
      if (priority <= 5) priorityRanges["1-5"]++;
      else if (priority <= 10) priorityRanges["6-10"]++;
      else if (priority <= 20) priorityRanges["11-20"]++;
      else if (priority <= 30) priorityRanges["21-30"]++;
      else priorityRanges["31+"]++;
    });
    
    return Object.entries(priorityRanges).map(([range, count]) => ({
      name: range,
      value: count
    }));
  };
  
  // Get risk rating distribution
  const getRiskRatingData = () => {
    if (!risks) return [];
    
    const risksByLevel = {
      "0-20": 0,
      "21-39": 0,
      "40-59": 0,
      "60-79": 0,
      "80-100": 0
    };
    
    risks.forEach(risk => {
      const rating = risk.riskRating;
      if (rating <= 20) risksByLevel["0-20"]++;
      else if (rating <= 39) risksByLevel["21-39"]++;
      else if (rating <= 59) risksByLevel["40-59"]++;
      else if (rating <= 79) risksByLevel["60-79"]++;
      else risksByLevel["80-100"]++;
    });
    
    return Object.entries(risksByLevel).map(([range, count]) => ({
      name: range,
      value: count
    }));
  };
  
  // Prepare data for owned by chart
  const getOwnedByData = () => {
    if (!risks) return [];
    
    const ownerCount: Record<string, number> = {};
    risks.forEach(risk => {
      ownerCount[risk.ownedBy] = (ownerCount[risk.ownedBy] || 0) + 1;
    });
    
    return Object.entries(ownerCount).map(([owner, count]) => ({
      name: owner,
      value: count
    }));
  };

  const categoryData = getCategoryData();
  const riskLevelData = getRiskLevelData();
  const riskStatusData = getRiskStatusData();
  const responseTypeData = getResponseTypeData();
  const priorityData = getPriorityData();
  const riskRatingData = getRiskRatingData();
  const ownedByData = getOwnedByData();

  return (
    <>
      <ProjectInfo projectId={projectId} />
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Risk Analytics</h2>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-500">Timeframe:</span>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Risk by Category Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Risks by Category</CardTitle>
              <CardDescription>Distribution of risks across categories</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0066CC" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Risk Level Distribution Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Risk Level Distribution</CardTitle>
              <CardDescription>Breakdown by risk severity</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskLevelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {riskLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Risk Status Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Risk Status</CardTitle>
              <CardDescription>Open vs closed risks</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {riskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Response Type Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Response Type Distribution</CardTitle>
              <CardDescription>How risks are being addressed</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={responseTypeData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2196F3" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Priority Distribution Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Priority Distribution</CardTitle>
              <CardDescription>Risks by priority ranges</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6C757D" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Risk Rating Distribution Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Risk Rating Distribution</CardTitle>
              <CardDescription>Risks by rating ranges</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskRatingData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#9C27B0" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="text-sm text-neutral-400 text-center mt-8">
          Additional analytics features coming soon.
        </div>
      </div>
    </>
  );
};

export default Analytics;
