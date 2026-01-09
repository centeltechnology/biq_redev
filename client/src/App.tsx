import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/protected-route";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import HelpPage from "@/pages/help";
import FAQPage from "@/pages/faq";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import LeadsPage from "@/pages/leads";
import LeadDetailPage from "@/pages/lead-detail";
import QuotesPage from "@/pages/quotes";
import QuoteBuilderPage from "@/pages/quote-builder";
import CustomersPage from "@/pages/customers";
import SettingsPage from "@/pages/settings";
import PricingPage from "@/pages/pricing";
import CalculatorPage from "@/pages/calculator";
import CalendarPage from "@/pages/calendar";
import AdminPage from "@/pages/admin";
import QuoteViewPage from "@/pages/quote-view";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/leads">
        <ProtectedRoute><LeadsPage /></ProtectedRoute>
      </Route>
      <Route path="/leads/:id">
        {(params) => <ProtectedRoute><LeadDetailPage /></ProtectedRoute>}
      </Route>
      <Route path="/leads/:id/quote">
        {(params) => <ProtectedRoute><QuoteBuilderPage /></ProtectedRoute>}
      </Route>
      <Route path="/quotes">
        <ProtectedRoute><QuotesPage /></ProtectedRoute>
      </Route>
      <Route path="/quotes/new">
        <ProtectedRoute><QuoteBuilderPage /></ProtectedRoute>
      </Route>
      <Route path="/quotes/:id">
        {(params) => <ProtectedRoute><QuoteBuilderPage /></ProtectedRoute>}
      </Route>
      <Route path="/customers">
        <ProtectedRoute><CustomersPage /></ProtectedRoute>
      </Route>
      <Route path="/calendar">
        <ProtectedRoute><CalendarPage /></ProtectedRoute>
      </Route>
      <Route path="/pricing">
        <ProtectedRoute><PricingPage /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><AdminPage /></ProtectedRoute>
      </Route>
      <Route path="/c/:slug" component={CalculatorPage} />
      <Route path="/q/:id" component={QuoteViewPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
