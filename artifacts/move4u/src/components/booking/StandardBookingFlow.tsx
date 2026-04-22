import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { HELP_PRICING, VAN_SIZES } from "@/data/constants";
import {
  getFloorChargeFromValue,
  getFloorLabelFromValue,
} from "./StairsAccessSection";
import { submitBooking, uploadPhotos } from "@/lib/api";
import AddressStep from "./AddressStep";
import ExtraStopsSection, { type ExtraStop } from "./ExtraStopsSection";
import VanStep from "./VanStep";
import HelpStep from "./HelpStep";
import TimeStep from "./TimeStep";
import NotesStep from "./NotesStep";
import SummaryStep from "./SummaryStep";
import FinalDetailsStep from "./FinalDetailsStep";

interface StandardBookingFlowProps {
  serviceLabel: string;
  serviceId: string;
  onBack: () => void;
}

type Step = "pickup" | "dropoff" | "van" | "help" | "time" | "notes" | "summary" | "final";

const STEP_LABELS: Record<Step, string> = {
  pickup: "Pickup",
  dropoff: "Drop-off",
  van: "Van size",
  help: "Help option",
  time: "Time",
  notes: "Notes",
  summary: "Summary",
  final: "Confirm",
};

const STEPS: Step[] = ["pickup", "dropoff", "van", "help", "time", "notes", "summary", "final"];

const getFloorCharge = getFloorChargeFromValue;

// Standard booking flow — used for House Move, Commercial Move, Single Item, Small Move
// Edit steps and flow logic here
export default function StandardBookingFlow({ serviceLabel, serviceId, onBack }: StandardBookingFlowProps) {
  const [step, setStep] = useState<Step>("pickup");

  // Scroll to top whenever the step changes so each step starts at the top
  // of the page (instead of jumping to the bottom of the previous step).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Pickup state
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLift, setPickupLift] = useState("");
  const [pickupFloor, setPickupFloor] = useState("none");

  // Drop-off state
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLift, setDropoffLift] = useState("");
  const [dropoffFloor, setDropoffFloor] = useState("none");

  // Extra stops between pickup and drop-off — dynamic, unlimited.
  // Each stop has its OWN address + stairs/lift/floor answers, exactly like
  // pickup and drop-off. Floor surcharges from extra stops add to the total.
  const [extraStops, setExtraStops] = useState<ExtraStop[]>([]);

  // Van, help, time
  const [vanSize, setVanSize] = useState("medium");
  const [helpOption, setHelpOption] = useState("driver-help");
  const [hours, setHours] = useState(2);

  // Notes and photos
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const currentIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  };

  const goPrev = () => {
    if (currentIndex === 0) {
      onBack();
      return;
    }
    const prev = STEPS[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const showPhotos = ["house-move", "waste-removal", "single-item", "small-move"].includes(serviceId);

  const pickupCharge = getFloorCharge(pickupFloor);
  const dropoffCharge = getFloorCharge(dropoffFloor);
  // Sum any per-stop stair surcharges so the running total stays accurate.
  const extraStopsCharge = extraStops.reduce(
    (sum, s) => sum + (s.address.trim() ? getFloorCharge(s.floorValue) : 0),
    0,
  );

  const canProceed = () => {
    if (step === "pickup") return !!pickupAddress && !!pickupLift;
    if (step === "dropoff") {
      // Drop-off proceeds only when drop-off itself is complete AND every
      // additional stop the user added has its address + stairs answered.
      const stopsValid = extraStops.every(
        (s) => !!s.address.trim() && !!s.liftValue,
      );
      return !!dropoffAddress && !!dropoffLift && stopsValid;
    }
    if (step === "van") return !!vanSize;
    if (step === "help") return !!helpOption;
    return true;
  };

  // Surface exactly what is missing so the user is never silently blocked.
  const getMissingHint = (): string | null => {
    if (step === "pickup") {
      if (!pickupAddress) return "Please enter the pickup address";
      if (!pickupLift) return "Please select if there are stairs";
      return null;
    }
    if (step === "dropoff") {
      if (!dropoffAddress) return "Please enter the drop-off address";
      if (!dropoffLift) return "Please select if there are stairs";
      const badStop = extraStops.findIndex(
        (s) => !s.address.trim() || !s.liftValue,
      );
      if (badStop !== -1) {
        const s = extraStops[badStop];
        if (!s.address.trim())
          return `Please enter the address for stop ${badStop + 1}`;
        return `Please select if there are stairs for stop ${badStop + 1}`;
      }
      return null;
    }
    if (step === "van") return vanSize ? null : "Please choose a van size";
    if (step === "help")
      return helpOption ? null : "Please choose how much help you need";
    return null;
  };

  const renderStep = () => {
    switch (step) {
      case "pickup":
        return (
          <AddressStep
            key="pickup-step"
            label="Pickup address"
            addressValue={pickupAddress}
            onAddressChange={setPickupAddress}
            liftValue={pickupLift}
            onLiftChange={setPickupLift}
            floorValue={pickupFloor}
            onFloorChange={setPickupFloor}
          />
        );
      case "dropoff":
        return (
          <div className="space-y-5">
            <AddressStep
              key="dropoff-step"
              label="Drop-off address"
              addressValue={dropoffAddress}
              onAddressChange={setDropoffAddress}
              liftValue={dropoffLift}
              onLiftChange={setDropoffLift}
              floorValue={dropoffFloor}
              onFloorChange={setDropoffFloor}
            />
            <ExtraStopsSection stops={extraStops} setStops={setExtraStops} />
          </div>
        );
      case "van":
        return <VanStep selected={vanSize} onSelect={setVanSize} />;
      case "help":
        return <HelpStep vanSize={vanSize} selected={helpOption} onSelect={setHelpOption} />;
      case "time":
        return <TimeStep hours={hours} onHoursChange={setHours} />;
      case "notes":
        return <NotesStep value={notes} onChange={setNotes} photos={photos} onPhotosChange={setPhotos} showPhotos={showPhotos} />;
      case "summary":
        return (
          <SummaryStep
            service={serviceLabel}
            pickup={pickupAddress}
            pickupFloor={pickupFloor}
            dropoff={dropoffAddress}
            dropoffFloor={dropoffFloor}
            extraStops={extraStops}
            vanSize={vanSize}
            helpOption={helpOption}
            hours={hours}
            notes={notes}
            onContinue={() => setStep("final")}
          />
        );
      case "final":
        return (
          <FinalDetailsStep
            onSubmit={async ({ date, timeWindow, name, phone, email, contactMethod }) => {
              const pricing = HELP_PRICING[vanSize] || HELP_PRICING.medium;
              let hourlyRate = pricing.noHelp;
              if (helpOption === "driver-help") hourlyRate = pricing.driverHelp;
              if (helpOption === "driver-plus-helper") hourlyRate = pricing.driverPlusHelper;
              const pickupCharge = getFloorCharge(pickupFloor);
              const dropoffCharge = getFloorCharge(dropoffFloor);
              const stopsCharge = extraStops.reduce(
                (sum, s) =>
                  sum + (s.address.trim() ? getFloorCharge(s.floorValue) : 0),
                0,
              );
              const totalPrice =
                hourlyRate * hours + pickupCharge + dropoffCharge + stopsCharge;
              const vanLabel = VAN_SIZES.find((v) => v.id === vanSize)?.name ?? vanSize;
              const helpLabels: Record<string, string> = {
                "no-help": "No help needed",
                "driver-help": "Driver help",
                "driver-plus-helper": "Driver + helper",
              };
              const peopleCounts: Record<string, string> = {
                "no-help": "1 (driver only)",
                "driver-help": "2 (driver + you carry)",
                "driver-plus-helper": "3 (driver + 1 helper)",
              };
              const formatFloorDetail = (key: string, charge: number) => {
                const label = getFloorLabelFromValue(key);
                if (!label || label === "—") return "";
                return charge > 0 ? `${label} (+£${charge})` : label;
              };
              const wholeHours = Math.floor(hours);
              const halfHour = hours % 1 !== 0;
              const estimatedTime = `${wholeHours}${halfHour ? ".5" : ""}h`;
              // Upload photos first, then submit the booking with their serving URLs
              const photoUrls = await uploadPhotos(photos);
              // Build pre-formatted, fully-described stop strings the API can
              // pass straight through to Telegram and to the Sheets notes
              // column without needing any schema change. Each line carries:
              //   "<address> — <floor label>(+£charge)"
              const cleanStops = extraStops.filter((s) => s.address.trim());
              const stopFloorCharges = cleanStops.map((s) =>
                getFloorCharge(s.floorValue),
              );
              const formattedStops = cleanStops.map((s, i) => {
                const label = getFloorLabelFromValue(s.floorValue);
                const charge = stopFloorCharges[i];
                const accessParts: string[] = [];
                if (label && label !== "—") accessParts.push(label);
                if (charge > 0) accessParts.push(`+£${charge}`);
                return accessParts.length
                  ? `${s.address.trim()} — ${accessParts.join(" ")}`
                  : s.address.trim();
              });
              const extraAddressFormatted = formattedStops
                .map((s, i) => `${i + 1}. ${s}`)
                .join(" | ");
              return await submitBooking({
                service: serviceLabel,
                name,
                phone,
                email,
                contactMethod,
                pickup: pickupAddress,
                pickupDetails: formatFloorDetail(pickupFloor, pickupCharge),
                dropoff: dropoffAddress,
                dropoffDetails: formatFloorDetail(dropoffFloor, dropoffCharge),
                extraAddress: extraAddressFormatted,
                extraStops: formattedStops,
                vanSize: vanLabel,
                helpOption: helpLabels[helpOption] ?? helpOption,
                peopleCount: peopleCounts[helpOption] ?? "",
                estimatedPrice: `£${totalPrice.toFixed(0)}`,
                estimatedTime,
                date,
                timeWindow,
                wasteAddons: "",
                uploadedFiles: photoUrls.join(", "),
                notes,
              });
            }}
          />
        );
    }
  };

  return (
    <div>
      {/* Back button + service label */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={goPrev}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Go back"
          data-testid="booking-back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-gray-900">{serviceLabel}</h2>
          <p className="text-xs text-gray-400">
            Step {currentIndex + 1} of {STEPS.length} — {STEP_LABELS[step]}
          </p>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= currentIndex ? "bg-[#3D1289]/60" : "bg-gray-100"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div>{renderStep()}</div>

      {/* Next button — only show for steps before summary (summary has its own button) */}
      {step !== "summary" && step !== "final" && (
        <>
          {!canProceed() && getMissingHint() && (
            <div
              className="mt-5 flex items-start gap-2 rounded-xl border border-[#3D1289]/20 bg-[#3D1289]/5 px-3.5 py-2.5"
              data-testid="booking-missing-hint"
              role="status"
              aria-live="polite"
            >
              <span
                className="mt-[2px] flex h-4 w-4 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: "#3D1289" }}
                aria-hidden="true"
              >
                !
              </span>
              <p className="text-[13px] font-medium text-[#1F0648] leading-snug">
                {getMissingHint()}
              </p>
            </div>
          )}
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="btn-purple mt-4 w-full py-2.5 sm:py-3.5 font-semibold rounded-xl text-sm"
            data-testid="booking-next"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}
