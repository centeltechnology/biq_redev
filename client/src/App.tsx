import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
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
const AdminPage = lazy(() => import("@/pages/admin"));
import AdminSupportPage from "@/pages/admin-support";
import SharePage from "@/pages/share";
import QuoteViewPage from "@/pages/quote-view";
import VerifyEmailPage from "@/pages/verify-email";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import PricingCalculatorPage from "@/pages/pricing-calculator";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import FeedbackPage from "@/pages/feedback";
import PaymentsPage from "@/pages/payments";
import ReferralsPage from "@/pages/referrals";
import ReferPage from "@/pages/refer";
import PartnersPage from "@/pages/partners";
import EmailPreferences from "@/pages/email-preferences";
import { CookieConsent } from "@/components/cookie-consent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
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
      <Route path="/pricing-calculator">
        <ProtectedRoute><PricingCalculatorPage /></ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute><PaymentsPage /></ProtectedRoute>
      </Route>
      <Route path="/referrals">
        <ProtectedRoute><ReferralsPage /></ProtectedRoute>
      </Route>
      <Route path="/refer">
        <ProtectedRoute><ReferPage /></ProtectedRoute>
      </Route>
      <Route path="/share">
        <ProtectedRoute><SharePage /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      </Route>
      <Route path="/admin/support">
        <ProtectedRoute><AdminSupportPage /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}><AdminPage /></Suspense></ProtectedRoute>
      </Route>
      <Route path="/c/:slug" component={CalculatorPage} />
      <Route path="/q/:id" component={QuoteViewPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/partners" component={PartnersPage} />
      <Route path="/email-preferences/:token" component={EmailPreferences} />
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
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
