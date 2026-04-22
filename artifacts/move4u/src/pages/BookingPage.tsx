import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToHome from "@/components/BackToHome";
import ServiceSelector from "@/components/booking/ServiceSelector";
import StandardBookingFlow from "@/components/booking/StandardBookingFlow";
import WasteRemovalFlow from "@/components/booking/WasteRemovalFlow";
import InternationalFlow from "@/components/booking/InternationalFlow";
import SomethingElseFlow from "@/components/booking/SomethingElseFlow";
import { SERVICES } from "@/data/constants";

// Services that use the standard booking flow
const STANDARD_SERVICES = ["house-move", "commercial-move", "single-item", "small-move"];

function getServiceLabel(id: string): string {
  return SERVICES.find((s) => s.id === id)?.title || "Booking";
}

export default function BookingPage() {
  const params = useParams<{ service?: string }>();
  const [location] = useLocation();
  const [selectedService, setSelectedService] = useState<string | null>(params?.service || null);

  // If URL has a service param, set it
  useEffect(() => {
    if (params?.service) {
      setSelectedService(params.service);
    }
  }, [params?.service]);

  const resetService = () => setSelectedService(null);

  const renderFlow = () => {
    if (!selectedService) {
      return <ServiceSelector onSelect={setSelectedService} />;
    }

    if (STANDARD_SERVICES.includes(selectedService)) {
      return (
        <StandardBookingFlow
          serviceId={selectedService}
          serviceLabel={getServiceLabel(selectedService)}
          onBack={resetService}
        />
      );
    }

    if (selectedService === "waste-removal") {
      return <WasteRemovalFlow onBack={resetService} />;
    }

    if (selectedService === "international") {
      return <InternationalFlow onBack={resetService} />;
    }

    if (selectedService === "something-else") {
      return <SomethingElseFlow onBack={resetService} />;
    }

    // Fallback
    return <ServiceSelector onSelect={setSelectedService} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-10">
        <BackToHome className="mb-4" />
        {/* Page header */}
        {!selectedService && (
          <div className="text-center mb-8">
            <div className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
              Book or enquire
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              What would you like to do?
            </h1>
            <p className="text-gray-500 text-sm">
              Select the service that best matches your request
            </p>
          </div>
        )}

        {/* Booking form card */}
        <div className="booking-mobile bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-7">
          {renderFlow()}
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-gray-400 mt-5">
          Not sure what to choose?{" "}
          <a href="tel:+447888355523" className="text-purple-700 underline underline-offset-1">
            Give us a call
          </a>{" "}
          and we'll help.
        </p>
      </div>

      <Footer />
    </div>
  );
}
