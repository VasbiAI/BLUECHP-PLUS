export default function Frontend() {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Frontend</h2>
      <p className="text-gray-700 mb-6">
        The frontend is built with React, TypeScript, and Vite for fast development and optimized production builds.
      </p>
      
      <section id="react-setup" className="mb-12">
        <h3 className="text-xl font-semibold mb-4">React Setup</h3>
        <p className="text-gray-700 mb-6">
          Our React setup uses modern JavaScript features and TypeScript for type safety. The application is built with Vite for lightning-fast development and optimized production builds.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">Application Entry Point</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// client/src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/ui/theme-provider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="ui-theme">
    <App />
  </ThemeProvider>
);`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">Main App Component</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// client/src/App.tsx
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import ProjectStructure from "./pages/ProjectStructure";
import Configuration from "./pages/Configuration";
import Frontend from "./pages/Frontend";
import Backend from "./pages/Backend";
import Database from "./pages/Database";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/project-structure" component={ProjectStructure} />
        <Route path="/configuration" component={Configuration} />
        <Route path="/frontend" component={Frontend} />
        <Route path="/backend" component={Backend} />
        <Route path="/database" component={Database} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}`}
            </pre>
          </div>
        </div>
      </section>
      
      <section id="routing" className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Routing</h3>
        <p className="text-gray-700 mb-6">
          The React application uses Wouter for client-side routing with a clean, declarative approach.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">Router Example</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// Example router implementation
import { Switch, Route } from "wouter";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/profile/:id" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}`}
            </pre>
          </div>
        </div>
      </section>
      
      <section id="tailwind" className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Tailwind CSS</h3>
        <p className="text-gray-700 mb-6">
          The frontend uses Tailwind CSS for utility-first styling, making it easy to create responsive and consistent UIs.
        </p>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h4 className="text-lg font-medium mb-4">CSS Import in Main</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`/* client/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 20 14.3% 4.1%;
  --muted: 60 4.8% 95.9%;
  --muted-foreground: 25 5.3% 44.7%;
  --popover: 0 0% 100%;
  --popover-foreground: 20 14.3% 4.1%;
  --card: 0 0% 100%;
  --card-foreground: 20 14.3% 4.1%;
  --border: 20 5.9% 90%;
  --input: 20 5.9% 90%;
  --primary: 207 90% 54%;
  --primary-foreground: 211 100% 99%;
  /* ...other variables */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ...dark theme variables */
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply font-sans antialiased bg-background text-foreground;
  }
}`}
            </pre>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h4 className="text-lg font-medium mb-4">UI Component Example</h4>
          <div className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-4 overflow-x-auto font-mono text-sm">
            <pre>
{`// Example of a UI component using Tailwind
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExampleCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Example Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          This is an example of a UI component using Tailwind CSS styling.
        </p>
        <Button className="bg-primary text-white hover:bg-primary/90">
          Click Me
        </Button>
      </CardContent>
    </Card>
  );
}`}
            </pre>
          </div>
        </div>
      </section>
    </>
  );
}
