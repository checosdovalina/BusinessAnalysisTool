import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import EvaluationList from "@/pages/evaluation-list";
import EvaluationForm from "@/pages/evaluation-form";
import EvaluationTopics from "@/pages/evaluation-topics";
import Reports from "@/pages/reports";
import SimulatorSessions from "@/pages/simulator-sessions";
import SimulatorRun from "@/pages/simulator-run";
import Operators from "@/pages/operators";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/auth">
        {user ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      <Route path="/" component={(props) => <ProtectedRoute component={Dashboard} {...props} />} />
      <Route path="/evaluations" component={(props) => <ProtectedRoute component={EvaluationList} {...props} />} />
      <Route path="/evaluations/:id" component={(props) => <ProtectedRoute component={EvaluationForm} {...props} />} />
      <Route path="/evaluation-topics" component={(props) => <ProtectedRoute component={EvaluationTopics} {...props} />} />
      <Route path="/reports" component={(props) => <ProtectedRoute component={Reports} {...props} />} />
      <Route path="/simulator" component={(props) => <ProtectedRoute component={SimulatorSessions} {...props} />} />
      <Route path="/simulator/run/:id" component={(props) => <ProtectedRoute component={SimulatorRun} {...props} />} />
      <Route path="/operators" component={(props) => <ProtectedRoute component={Operators} {...props} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
