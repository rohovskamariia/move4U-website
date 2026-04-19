import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/pages/HomePage";
import BookingPage from "@/pages/BookingPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import BookingPolicyPage from "@/pages/BookingPolicyPage";
import CancellationPolicyPage from "@/pages/CancellationPolicyPage";
import PricingGuidePage from "@/pages/PricingGuidePage";
import VanGuidePage from "@/pages/VanGuidePage";
import WasteGuidePage from "@/pages/WasteGuidePage";
import SecureBookingPage from "@/pages/SecureBookingPage";
import AdminBookingsPage from "@/pages/AdminBookingsPage";
import PayRedirectPage from "@/pages/PayRedirectPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import NotFound from "@/pages/not-found";
import WhatsAppButton from "@/components/WhatsAppButton";

const queryClient = new QueryClient();

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/book" component={BookingPage} />
        <Route path="/book/:service" component={BookingPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/booking-policy" component={BookingPolicyPage} />
        <Route path="/cancellation-policy" component={CancellationPolicyPage} />
        <Route path="/pricing" component={PricingGuidePage} />
        <Route path="/pricing-guide" component={PricingGuidePage} />
        <Route path="/van-guide" component={VanGuidePage} />
        <Route path="/waste-guide" component={WasteGuidePage} />
        <Route path="/secure-booking" component={SecureBookingPage} />
        <Route path="/admin/bookings" component={AdminBookingsPage} />
        <Route path="/pay/:ref" component={PayRedirectPage} />
        <Route path="/payment-success" component={PaymentSuccessPage} />
        <Route component={NotFound} />
      </Switch>
      <WhatsAppButton />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
