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
import { usePageMeta } from "@/lib/usePageMeta";

// Services that use the standard booking flow
const STANDARD_SERVICES = ["house-move", "commercial-move", "single-item", "small-move"];

function getServiceLabel(id: string): string {
  return SERVICES.find((s) => s.id === id)?.title || "Booking";
}

/** Defensive cap on prefill values to avoid pathological URL inputs. */
const PREFILL_MAX_LEN = 250;

/**
 * Read `?pickup=` and `?dropoff=` from the current URL so external entry
 * points (e.g. the /house-moving quick-quote card) can hand off addresses
 * straight into the booking flow without the user retyping them.
 *
 * Captured ONCE on mount — these are seed values, not a live binding.
 * The booking form remains the single source of truth from then on.
 */
function readAddressPrefill(): { pickup: string; dropoff: string } {
  if (typeof window === "undefined") return { pickup: "", dropoff: "" };
  try {
    const params = new URLSearchParams(window.location.search);
    const pickup = (params.get("pickup") ?? "").trim().slice(0, PREFILL_MAX_LEN);
    const dropoff = (params.get("dropoff") ?? "").trim().slice(0, PREFILL_MAX_LEN);
    return { pickup, dropoff };
  } catch {
    return { pickup: "", dropoff: "" };
  }
}

/**
 * Remove the prefill query params from the URL once we've consumed them so
 * a refresh / share doesn't re-seed stale addresses. Preserves any other
 * query params and keeps the same path (no navigation).
 */
function stripPrefillQueryParams(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.has("pickup")) {
      url.searchParams.delete("pickup");
      changed = true;
    }
    if (url.searchParams.has("dropoff")) {
      url.searchParams.delete("dropoff");
      changed = true;
    }
    if (changed) {
      const qs = url.searchParams.toString();
      const newUrl = `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`;
      window.history.replaceState(window.history.state, "", newUrl);
    }
  } catch {
    /* no-op — URL hygiene is best-effort */
  }
}

export default function BookingPage() {
  usePageMeta({
    title: "Book a Removal — London Moving Service | Move4U",
    description:
      "Book your London removal online with Move4U: house moves, single items, commercial moves, waste removal and international moving. Quick, transparent, fully insured.",
    path: "/book",
  });
  const params = useParams<{ service?: string }>();
  const [location] = useLocation();
  const [selectedService, setSelectedService] = useState<string | null>(params?.service || null);

  // Capture any address prefill from the URL ONCE so the booking form
  // can seed itself. Stable across re-renders — once the user is in the
  // form, the form owns the state. The prefill is also cleared whenever
  // the user goes back to the service selector (see `resetService`) so
  // starting a new flow never re-seeds stale addresses.
  const [addressPrefill, setAddressPrefill] = useState(() =>
    readAddressPrefill(),
  );

  // Strip the prefill query params from the URL on mount so a refresh
  // or share link doesn't re-seed the form with stale addresses.
  useEffect(() => {
    stripPrefillQueryParams();
  }, []);

  // If URL has a service param, set it
  useEffect(() => {
    if (params?.service) {
      setSelectedService(params.service);
    }
  }, [params?.service]);

  const resetService = () => {
    // Returning to the service picker means the user is starting over —
    // clear the one-time prefill so the next flow opens with empty fields.
    setAddressPrefill({ pickup: "", dropoff: "" });
    setSelectedService(null);
  };

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
          initialPickup={addressPrefill.pickup}
          initialDropoff={addressPrefill.dropoff}
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
