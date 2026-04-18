import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { STAIR_CHARGES, HELP_PRICING, VAN_SIZES } from "@/data/constants";
import { submitBooking, uploadPhotos } from "@/lib/api";
import AddressStep from "./AddressStep";
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

function getFloorCharge(floorKey: string) {
  if (floorKey === "lift" || floorKey === "none" || !floorKey) return 0;
  return STAIR_CHARGES[floorKey] ?? 0;
}

// Standard booking flow — used for House Move, Commercial Move, Single Item, Small Move
// Edit steps and flow logic here
export default function StandardBookingFlow({ serviceLabel, serviceId, onBack }: StandardBookingFlowProps) {
  const [step, setStep] = useState<Step>("pickup");

  // Pickup state
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupStairs, setPickupStairs] = useState("");
  const [pickupLift, setPickupLift] = useState("");
  const [pickupFloor, setPickupFloor] = useState("none");

  // Drop-off state
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffStairs, setDropoffStairs] = useState("");
  const [dropoffLift, setDropoffLift] = useState("");
  const [dropoffFloor, setDropoffFloor] = useState("none");

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

  const canProceed = () => {
    if (step === "pickup") return !!pickupAddress;
    if (step === "dropoff") return !!dropoffAddress;
    if (step === "van") return !!vanSize;
    if (step === "help") return !!helpOption;
    return true;
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
            stairsValue={pickupStairs}
            onStairsChange={setPickupStairs}
            liftValue={pickupLift}
            onLiftChange={setPickupLift}
            floorValue={pickupFloor}
            onFloorChange={setPickupFloor}
            extraCharge={pickupCharge}
          />
        );
      case "dropoff":
        return (
          <AddressStep
            key="dropoff-step"
            label="Drop-off address"
            addressValue={dropoffAddress}
            onAddressChange={setDropoffAddress}
            stairsValue={dropoffStairs}
            onStairsChange={setDropoffStairs}
            liftValue={dropoffLift}
            onLiftChange={setDropoffLift}
            floorValue={dropoffFloor}
            onFloorChange={setDropoffFloor}
            extraCharge={dropoffCharge}
          />
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
            onSubmit={async ({ date, timeWindow, name, phone, contactMethod }) => {
              const pricing = HELP_PRICING[vanSize] || HELP_PRICING.medium;
              let hourlyRate = pricing.noHelp;
              if (helpOption === "driver-help") hourlyRate = pricing.driverHelp;
              if (helpOption === "driver-plus-helper") hourlyRate = pricing.driverPlusHelper;
              const pickupCharge = getFloorCharge(pickupFloor);
              const dropoffCharge = getFloorCharge(dropoffFloor);
              const totalPrice = hourlyRate * hours + pickupCharge + dropoffCharge;
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
              const floorLabels: Record<string, string> = {
                none: "", ground: "Ground floor",
                first: "1st floor (+£10)", second: "2nd floor (+£20)",
                third: "3rd floor (+£30)", fourth: "4th floor (+£40)",
                fifth_plus: "5+ floors", lift: "Lift available",
              };
              const wholeHours = Math.floor(hours);
              const halfHour = hours % 1 !== 0;
              const estimatedTime = `${wholeHours}${halfHour ? ".5" : ""}h`;
              // Upload photos first, then submit the booking with their serving URLs
              const photoUrls = await uploadPhotos(photos);
              return await submitBooking({
                service: serviceLabel,
                name,
                phone,
                contactMethod,
                pickup: pickupAddress,
                pickupDetails: floorLabels[pickupFloor] ?? "",
                dropoff: dropoffAddress,
                dropoffDetails: floorLabels[dropoffFloor] ?? "",
                extraAddress: "",
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
              i <= currentIndex ? "bg-purple-700" : "bg-gray-100"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div>{renderStep()}</div>

      {/* Next button — only show for steps before summary (summary has its own button) */}
      {step !== "summary" && step !== "final" && (
        <button
          onClick={goNext}
          disabled={!canProceed()}
          className="mt-6 w-full py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="booking-next"
        >
          Continue
        </button>
      )}
    </div>
  );
}
