import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

// Pages
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminSchedules from "@/pages/admin/schedules";
import AdminSwapRequests from "@/pages/admin/swap-requests";
import AdminNotifications from "@/pages/admin/notifications";
import AdminProfile from "@/pages/admin/profile";

// Physio Pages
import PhysioDashboard from "@/pages/physio/dashboard";
import PhysioSchedule from "@/pages/physio/schedule";
import PhysioSwapRequests from "@/pages/physio/swap-requests";
import PhysioNotifications from "@/pages/physio/notifications";
import PhysioProfile from "@/pages/physio/profile";
import PhysioSettings from "@/pages/physio/settings";

function Router() {
  const { isAuthenticated, isLoading, isAdmin, isPhysiotherapist } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-physio-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Login} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      {/* Admin Routes */}
      {isAdmin && (
        <>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/schedules" component={AdminSchedules} />
          <Route path="/admin/swap-requests" component={AdminSwapRequests} />
          <Route path="/admin/notifications" component={AdminNotifications} />
          <Route path="/admin/profile" component={AdminProfile} />
          <Route path="/" component={AdminDashboard} />
        </>
      )}

      {/* Physiotherapist Routes */}
      {isPhysiotherapist && (
        <>
          <Route path="/physio" component={PhysioDashboard} />
          <Route path="/physio/schedule" component={PhysioSchedule} />
          <Route path="/physio/swap-requests" component={PhysioSwapRequests} />
          <Route path="/physio/notifications" component={PhysioNotifications} />
          <Route path="/physio/profile" component={PhysioProfile} />
          <Route path="/physio/settings" component={PhysioSettings} />
          <Route path="/" component={PhysioDashboard} />
        </>
      )}

      {/* Fallback */}
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
