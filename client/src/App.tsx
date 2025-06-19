
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import Layout from "./components/Layout";

// Pages
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDashboard from "./pages/ProjectDashboard";
import NewProject from "./pages/NewProject";
import Database from "./pages/Database";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";
import ManualLibrary from "./pages/ManualLibrary";
import ManualEditor from "./pages/ManualEditor";
import DocumentLibrary from "./pages/DocumentLibrary";
import ProjectStructure from "./pages/ProjectStructure";
import DiagramEditor from "./pages/DiagramEditor";
import Configuration from "./pages/Configuration";
import Frontend from "./pages/Frontend";
import Backend from "./pages/Backend";
import Admin from "./pages/Admin";
import UniPhiTest from "./pages/UniPhiTest";
import UniPhiApiTester from "./pages/UniPhiApiTester";
import UniPhiApiExplorer from "./pages/UniPhiApiExplorer";
import CalendarOverview from "./pages/CalendarOverview";

// Risk Track Pro Pages
import RiskRegister from "./pages/RiskRegister"; 
import IssuesRegisterPage from "./pages/IssuesRegisterPage";
import CriticalDatesPage from "./pages/CriticalDatesPage";
import RatingLegendPage from "./pages/RatingLegendPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/projects" component={Projects} />
          <Route path="/projects/new" component={NewProject} />
          <Route path="/projects/:id" component={ProjectDashboard} />
          <Route path="/projects/:id/structure" component={ProjectStructure} />
          <Route path="/projects/:id/calendar" component={CalendarOverview} />
          <Route path="/projects/:id/critical-dates" component={CriticalDatesPage} />
          
          {/* Risk Track Pro routes */}
          <Route path="/projects/:projectId/risks" component={RiskRegister} />
          <Route path="/projects/:projectId/issues" component={IssuesRegisterPage} />
          <Route path="/projects/:projectId/critical-dates" component={CriticalDatesPage} />
          <Route path="/projects/:projectId/rating-legend" component={RatingLegendPage} />
          
          <Route path="/manuals" component={ManualLibrary} />
          <Route path="/manuals/:id" component={ManualEditor} />
          <Route path="/documents" component={DocumentLibrary} />
          <Route path="/diagrams" component={DiagramEditor} />
          <Route path="/database" component={Database} />
          <Route path="/config" component={Configuration} />
          <Route path="/frontend" component={Frontend} />
          <Route path="/backend" component={Backend} />
          <Route path="/admin" component={Admin} />
          <Route path="/uniphi" component={UniPhiTest} />
          <Route path="/uniphi/api" component={UniPhiApiTester} />
          <Route path="/uniphi/explorer" component={UniPhiApiExplorer} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
