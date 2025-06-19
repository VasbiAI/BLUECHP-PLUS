
import React from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TabNavigation from "@/components/risk-track-pro/TabNavigation";
import ProjectInfo from "@/components/risk-track-pro/ProjectInfo";
import RatingLegend from "@/components/risk-track-pro/RatingLegend";

const RatingLegendPage: React.FC = () => {
  const params = useParams();
  const projectId = params?.projectId;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ProjectInfo projectId={projectId} />
      
      <TabNavigation 
        projectId={projectId || ''} 
        activeTab="rating-legend" 
      />
      
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Risk Rating Matrix</h1>
        <p className="text-gray-500">Understand how risks are rated in the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Rating Matrix</CardTitle>
          <CardDescription>
            This matrix shows how risk ratings are calculated based on likelihood and impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RatingLegend />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Likelihood Scale</CardTitle>
            <CardDescription>Explanation of likelihood ratings (1-5)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <div className="font-semibold">1 - Rare</div>
                <div className="text-sm text-gray-600">May occur only in exceptional circumstances (0-10%)</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-semibold">2 - Unlikely</div>
                <div className="text-sm text-gray-600">Could occur at some time (11-30%)</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-semibold">3 - Possible</div>
                <div className="text-sm text-gray-600">Might occur at some time (31-50%)</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-semibold">4 - Likely</div>
                <div className="text-sm text-gray-600">Will probably occur in most circumstances (51-70%)</div>
              </div>
              <div className="pb-2">
                <div className="font-semibold">5 - Almost Certain</div>
                <div className="text-sm text-gray-600">Expected to occur in most circumstances ({'>'}70%)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact Scale</CardTitle>
            <CardDescription>Explanation of impact ratings (1-5)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <div className="font-semibold">1 - Negligible</div>
                <div className="text-sm text-gray-600">Minimal impact, easily absorbed</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-semibold">2 - Minor</div>
                <div className="text-sm text-gray-600">Small impact, absorbed with some management effort</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-semibold">3 - Moderate</div>
                <div className="text-sm text-gray-600">Significant impact requiring substantial management</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-semibold">4 - Major</div>
                <div className="text-sm text-gray-600">Critical impact requiring extensive management</div>
              </div>
              <div className="pb-2">
                <div className="font-semibold">5 - Severe</div>
                <div className="text-sm text-gray-600">Disastrous impact threatening project viability</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Risk Severity Guidelines</CardTitle>
          <CardDescription>How to interpret different risk severity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <div className="font-semibold text-green-800">Low Risk (1-3)</div>
              <div className="text-sm text-green-700">
                Generally acceptable; monitor and review if necessary. May not require specific risk treatment.
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <div className="font-semibold text-yellow-800">Medium Risk (4-9)</div>
              <div className="text-sm text-yellow-700">
                May be acceptable but requires monitoring and management responsibility to be specified.
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded border border-orange-200">
              <div className="font-semibold text-orange-800">High Risk (10-14)</div>
              <div className="text-sm text-orange-700">
                Not normally acceptable. Requires specific management attention and active risk mitigation strategies.
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <div className="font-semibold text-red-800">Critical Risk (15-25)</div>
              <div className="text-sm text-red-700">
                Unacceptable. Immediate action required. May require project re-evaluation or high-level intervention.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RatingLegendPage;
