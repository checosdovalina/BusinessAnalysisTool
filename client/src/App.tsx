import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import EvaluationList from "@/pages/evaluation-list";
import EvaluationForm from "@/pages/evaluation-form";
import Reports from "@/pages/reports";
import SimulatorSessions from "@/pages/simulator-sessions";
import SimulatorRun from "@/pages/simulator-run";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={Dashboard} />
      <Route path="/evaluations" component={EvaluationList} />
      <Route path="/evaluations/:id" component={EvaluationForm} />
      <Route path="/reports" component={Reports} />
      <Route path="/simulator" component={SimulatorSessions} />
      <Route path="/simulator/run/:id" component={SimulatorRun} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
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
}

export default App;
