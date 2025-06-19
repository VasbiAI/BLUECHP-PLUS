import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import RiskRegister from "@/pages/RiskRegister";
import IssuesRegister from "@/pages/IssuesRegister";
import CriticalDates from "@/pages/CriticalDates";
import CriticalDatesEnhanced from "@/pages/CriticalDatesEnhanced";
import ExternalAccess from "@/pages/ExternalAccess";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import RatingLegendPage from "@/pages/RatingLegend";
import ProjectSchedule from "@/pages/ProjectSchedule";
import TestAI from "@/pages/TestAI";
import Header from "@/components/Header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={RiskRegister} />
      <Route path="/risk-register" component={RiskRegister} />
      <Route path="/issues" component={IssuesRegister} />
      <Route path="/critical-dates" component={CriticalDatesEnhanced} />
      <Route path="/critical-dates/legacy" component={CriticalDates} />
      <Route path="/critical-dates/project/:projectId" component={CriticalDatesEnhanced} />
      <Route path="/external-access/:token" component={ExternalAccess} />
      <Route path="/rating-legend" component={RatingLegendPage} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/projects/:projectId/schedule" component={ProjectSchedule} />
      <Route path="/test-ai" component={TestAI} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen bg-neutral-100">
          <Header />
          <div className="flex-grow">
            <Router />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
