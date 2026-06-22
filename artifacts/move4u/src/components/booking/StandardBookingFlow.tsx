import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import {
  EXTRA_STOP_CHARGE,
  CONGESTION_CHARGE,
  OUTSIDE_M25_RATE,
  VAN_SIZES,
} from "@/data/constants";
import BookingSuccess from "./BookingSuccess";
import {
  getFloorChargeWithWorkers,
  getFloorLabelFromValue,
  getWorkerCount,
} from "./StairsAccessSection";
import {
  computeBaseServiceCharge,
  computeSingleItemHelperCharge,
  isSingleItem,
  SINGLE_ITEM_HELPER_FEE,
} from "@/lib/pricing";
import { isLikelyInCongestionZone } from "@/lib/congestionZone";
import { outsideM25MilesForRoute } from "@/lib/m25";
import { submitBooking, uploadPhotos } from "@/lib/api";
import AddressStep from "./AddressStep";
import { isAddressAcceptable, isUKAddressMissingFullPostcode } from "@/lib/postcode";
import ExtraStopsSection, { type ExtraStop } from "./ExtraStopsSection";
import VanStep from "./VanStep";
import HelpStep from "./HelpStep";
import SingleItemDetailsStep from "./SingleItemDetailsStep";
import TimeStep from "./TimeStep";
import NotesStep from "./NotesStep";
import SummaryStep from "./SummaryStep";
import FinalDetailsStep from "./FinalDetailsStep";

interface StandardBookingFlowProps {
  serviceLabel: string;
  serviceId: string;
  onBack: () => void;
  /**
   * Optional one-time seed values for the pickup / drop-off addresses.
   * Used so external entry points (e.g. the /house-moving quick-quote
   * card) can hand off addresses into the booking flow without the user
   * having to retype them. After mount the form owns the state — these
   * are NOT a live binding.
   */
  initialPickup?: string;
  initialDropoff?: string;
}

type Step =
  | "pickup"
  | "dropoff"
  | "van"
  | "help"
  | "describe"
  | "time"
  | "notes"
  | "summary"
  | "final";

const STEP_LABELS: Record<Step, string> = {
  pickup: "Pickup",
  dropoff: "Drop-off",
  van: "Van size",
  help: "Help option",
  describe: "Item details",
  time: "Time",
  notes: "Notes",
  summary: "Summary",
  final: "Confirm",
};

// The standard step order for full removal services. Single Item Delivery
// uses a simplified flow (see SINGLE_ITEM_STEPS) which skips the van and
// help selections in favour of a single "describe your item" step.
const FULL_STEPS: Step[] = [
  "pickup",
  "dropoff",
  "van",
  "help",
  "time",
  "notes",
  "summary",
  "final",
];
const SINGLE_ITEM_STEPS: Step[] = [
  "pickup",
  "dropoff",
  "describe",
  "time",
  "notes",
  "summary",
  "final",
];


// Standard booking flow — used for House Move, Commercial Move, Single Item, Small Move
// Edit steps and flow logic here
export default function StandardBookingFlow({
  serviceLabel,
  serviceId,
  onBack,
  initialPickup,
  initialDropoff,
}: StandardBookingFlowProps) {
  const [step, setStep] = useState<Step>("pickup");
  // Once set, the flow is LOCKED. The form, back arrow, progress bar and
  // step header are all hidden — only the success view is shown. The user
  // can't navigate back into the form via the browser back button either
  // (see the popstate effect below).
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Scroll to top whenever the step changes so each step starts at the top
  // of the page (instead of jumping to the bottom of the previous step).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Once the booking is submitted, scroll to top and intercept the browser
  // back button so it sends the user home instead of re-opening the form.
  useEffect(() => {
    if (!submittedRef) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    // Push a sentinel state — when the user hits "back", popstate fires
    // and we redirect to "/" instead of letting the browser navigate to a
    // previous form step.
    window.history.pushState({ bookingSubmitted: true }, "");
    const onPopState = () => {
      setLocation("/");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [submittedRef, setLocation]);

  // Pickup state — seeded once from props (e.g. quick-quote handoff).
  const [pickupAddress, setPickupAddress] = useState(initialPickup ?? "");
  const [pickupLift, setPickupLift] = useState("");
  const [pickupFloor, setPickupFloor] = useState("none");

  // Drop-off state — seeded once from props (e.g. quick-quote handoff).
  const [dropoffAddress, setDropoffAddress] = useState(initialDropoff ?? "");
  const [dropoffLift, setDropoffLift] = useState("");
  const [dropoffFloor, setDropoffFloor] = useState("none");

  // Extra stops between pickup and drop-off — dynamic, unlimited.
  // Each stop has its OWN address + stairs/lift/floor answers, exactly like
  // pickup and drop-off. Floor surcharges from extra stops add to the total.
  const [extraStops, setExtraStops] = useState<ExtraStop[]>([]);

  // Van, help, time
  const [vanSize, setVanSize] = useState("medium");
  const [helpOption, setHelpOption] = useState("driver-help");
  // Single Item Delivery uses a 1-hour minimum (£60 covers the first hour);
  // every other service uses the standard 2-hour minimum.
  const singleItem = isSingleItem(serviceId);
  const [hours, setHours] = useState(singleItem ? 1 : 2);

  // Notes and photos
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  // Single Item Delivery — required item description (drives admin review
  // for bulky/heavy items and is shown in the summary + booking notes).
  const [itemDescription, setItemDescription] = useState("");

  // Single Item Delivery — help with loading. Defaults to driver-only
  // (included in the £60 base). Choosing the extra helper adds a flat
  // +£30 to the estimated total. Only used by the single-item flow.
  const [singleItemHelper, setSingleItemHelper] = useState("driver-only");

  // Step list adapts to the service: single-item gets a simplified flow
  // (no van/help selection — just "describe what you're moving").
  const STEPS = singleItem ? SINGLE_ITEM_STEPS : FULL_STEPS;
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

  // Worker count for stair multiplier — only known after the help step.
  // Before that, helpOption is "" so getWorkerCount defaults to 1 (correct
  // for the live price preview during the address steps).
  const workerCountLive = isSingleItem(serviceId)
    ? singleItemHelper === "driver-plus-helper" ? 2 : 1
    : getWorkerCount(helpOption);
  const pickupCharge = getFloorChargeWithWorkers(pickupFloor, workerCountLive);
  const dropoffCharge = getFloorChargeWithWorkers(dropoffFloor, workerCountLive);
  // Sum any per-stop stair surcharges so the running total stays accurate.
  const extraStopsCharge = extraStops.reduce(
    (sum, s) =>
      sum + (s.address.trim() ? getFloorChargeWithWorkers(s.floorValue, workerCountLive) : 0),
    0,
  );

  const canProceed = () => {
    if (step === "pickup")
      return isAddressAcceptable(pickupAddress) && !!pickupLift;
    if (step === "dropoff") {
      // Drop-off proceeds only when drop-off itself is complete AND every
      // additional stop the user added has its address + stairs answered.
      const stopsValid = extraStops.every(
        (s) => isAddressAcceptable(s.address) && !!s.liftValue,
      );
      return isAddressAcceptable(dropoffAddress) && !!dropoffLift && stopsValid;
    }
    if (step === "van") return !!vanSize;
    if (step === "help") return !!helpOption;
    if (step === "describe") return itemDescription.trim().length >= 3;
    return true;
  };

  // Surface exactly what is missing so the user is never silently blocked.
  const getMissingHint = (): string | null => {
    if (step === "pickup") {
      if (!pickupAddress) return "Please enter the pickup address";
      if (isUKAddressMissingFullPostcode(pickupAddress))
        return "Please enter the full pickup postcode (e.g. N22 8HE)";
      if (!pickupLift) return "Please select if there are stairs";
      return null;
    }
    if (step === "dropoff") {
      if (!dropoffAddress) return "Please enter the drop-off address";
      if (isUKAddressMissingFullPostcode(dropoffAddress))
        return "Please enter the full drop-off postcode (e.g. N22 8HE)";
      if (!dropoffLift) return "Please select if there are stairs";
      const badStop = extraStops.findIndex(
        (s) =>
          !s.address.trim() ||
          isUKAddressMissingFullPostcode(s.address) ||
          !s.liftValue,
      );
      if (badStop !== -1) {
        const s = extraStops[badStop];
        if (!s.address.trim())
          return `Please enter the address for stop ${badStop + 1}`;
        if (isUKAddressMissingFullPostcode(s.address))
          return `Please enter the full postcode for stop ${badStop + 1}`;
        return `Please select if there are stairs for stop ${badStop + 1}`;
      }
      return null;
    }
    if (step === "van") return vanSize ? null : "Please choose a van size";
    if (step === "help")
      return helpOption ? null : "Please choose how much help you need";
    if (step === "describe")
      return itemDescription.trim().length >= 3
        ? null
        : "Please describe the item you'd like us to move";
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
          <div className="space-y-3 sm:space-y-5">
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
      case "describe":
        return (
          <SingleItemDetailsStep
            description={itemDescription}
            onDescriptionChange={setItemDescription}
            helperOption={singleItemHelper}
            onHelperChange={setSingleItemHelper}
          />
        );
      case "time":
        return (
          <TimeStep
            hours={hours}
            onHoursChange={setHours}
            minHours={singleItem ? 1 : 2}
            minLabel={
              singleItem
                ? "Minimum charge: £60 (covers up to 1 hour)"
                : undefined
            }
          />
        );
      case "notes":
        return <NotesStep value={notes} onChange={setNotes} photos={photos} onPhotosChange={setPhotos} showPhotos={showPhotos} />;
      case "summary":
        return (
          <SummaryStep
            service={serviceLabel}
            serviceId={serviceId}
            pickup={pickupAddress}
            pickupFloor={pickupFloor}
            dropoff={dropoffAddress}
            dropoffFloor={dropoffFloor}
            extraStops={extraStops}
            vanSize={vanSize}
            helpOption={helpOption}
            hours={hours}
            notes={notes}
            itemDescription={itemDescription}
            singleItemHelper={singleItemHelper}
            onContinue={() => setStep("final")}
          />
        );
      case "final":
        return (
          <FinalDetailsStep
            onSubmitted={(ref) => setSubmittedRef(ref)}
            onSubmit={async ({ date, timeWindow, name, phone, email, contactMethod }) => {
              const baseCharge = computeBaseServiceCharge(
                serviceId,
                vanSize,
                helpOption,
                hours,
              );
              const workerCount = isSingleItem(serviceId)
                ? singleItemHelper === "driver-plus-helper" ? 2 : 1
                : getWorkerCount(helpOption);
              const pickupCharge = getFloorChargeWithWorkers(pickupFloor, workerCount);
              const dropoffCharge = getFloorChargeWithWorkers(dropoffFloor, workerCount);
              const cleanStopsForPrice = extraStops.filter((s) => s.address.trim());
              const stopsCharge = cleanStopsForPrice.reduce(
                (sum, s) => sum + getFloorChargeWithWorkers(s.floorValue, workerCount),
                0,
              );
              const extraStopFee =
                cleanStopsForPrice.length * EXTRA_STOP_CHARGE;
              const cczAddresses = [
                pickupAddress,
                dropoffAddress,
                ...cleanStopsForPrice.map((s) => s.address),
              ];
              // CCZ daily charge is one flat fee — add it ONCE if any
              // address on the route enters the zone, never multiplied by
              // the number of in-zone addresses.
              const congestionCharge = isLikelyInCongestionZone(cczAddresses)
                ? CONGESTION_CHARGE
                : 0;
              const outsideMiles = outsideM25MilesForRoute(cczAddresses);
              const outsideCharge = outsideMiles * OUTSIDE_M25_RATE;
              const singleItemHelperCharge = computeSingleItemHelperCharge(
                serviceId,
                singleItemHelper,
              );
              const totalPrice =
                baseCharge +
                pickupCharge +
                dropoffCharge +
                stopsCharge +
                extraStopFee +
                congestionCharge +
                outsideCharge +
                singleItemHelperCharge;
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
                getFloorChargeWithWorkers(s.floorValue, workerCount),
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
              // Append surcharge breakdown to notes so the admin / Telegram
              // message clearly shows what made up the total.
              // For Single Item Delivery, surface the customer's item
              // description first so the team sees it immediately. Flag
              // anything that sounds bulky / heavy / fragile so admin
              // can review before confirming the booking.
              const desc = itemDescription.trim();
              const bulkyKeywords = /\b(sofa|couch|wardrobe|piano|fridge|freezer|washer|dryer|mattress|king[- ]?size|bed frame|treadmill|safe|gym|pool table|heavy|fragile|glass|marble|chandelier|antique)\b/i;
              const itemNote = isSingleItem(serviceId) && desc
                ? `Item: ${desc}${bulkyKeywords.test(desc) ? " [REVIEW: bulky/heavy/fragile — confirm van + helper]" : ""}`
                : null;
              // Surface the customer's loading-help choice in the notes
              // so admin/Telegram see exactly what was selected, even
              // before reading the helpOption column.
              const singleItemHelpNote = isSingleItem(serviceId)
                ? singleItemHelper === "driver-plus-helper"
                  ? `Help: Driver + 1 extra helper (+£${SINGLE_ITEM_HELPER_FEE})`
                  : `Help: Driver only (included)`
                : null;
              const surchargeNotes = [
                itemNote,
                singleItemHelpNote,
                extraStopFee > 0
                  ? `Additional stops: ${cleanStopsForPrice.length} × £${EXTRA_STOP_CHARGE} = +£${extraStopFee}`
                  : null,
                congestionCharge > 0
                  ? `Congestion Charge: +£${congestionCharge} (route enters Central London zone)`
                  : null,
                outsideCharge > 0
                  ? `Outside-M25 estimate: ~${outsideMiles} mi × £${OUTSIDE_M25_RATE} = +£${outsideCharge}`
                  : null,
                isSingleItem(serviceId)
                  ? `Single Item pricing: £60 base (1h) + £30/30 min after`
                  : null,
              ]
                .filter(Boolean)
                .join(" | ");
              const fullNotes = [notes, surchargeNotes]
                .filter(Boolean)
                .join(" || ");
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
                // Single Item bookings don't ask the customer to pick a
                // van or help level — the team decides from the item
                // description (and any [REVIEW] flag) before confirming.
                // Send neutral values so ops never reads the silent
                // defaults as customer-confirmed selections.
                vanSize: isSingleItem(serviceId) ? "To be confirmed" : vanLabel,
                // For Single Item bookings the helpOption column now
                // reflects the customer's loading-help choice so the
                // admin panel can show "Driver only" or "Driver + helper
                // +£30" at a glance, instead of the old generic
                // "To be confirmed after review" placeholder.
                helpOption: isSingleItem(serviceId)
                  ? singleItemHelper === "driver-plus-helper"
                    ? `Driver + helper +£${SINGLE_ITEM_HELPER_FEE}`
                    : "Driver only"
                  : (helpLabels[helpOption] ?? helpOption),
                peopleCount: isSingleItem(serviceId)
                  ? singleItemHelper === "driver-plus-helper"
                    ? "2 (driver + helper)"
                    : "1 (driver only)"
                  : (peopleCounts[helpOption] ?? ""),
                estimatedPrice: `£${totalPrice.toFixed(0)}`,
                estimatedTime,
                date,
                timeWindow,
                wasteAddons: "",
                uploadedFiles: photoUrls.join(", "),
                notes: fullNotes,
              });
            }}
          />
        );
    }
  };

  // -----------------------------------------------------------------
  // Locked success view — replaces the entire form once submitted.
  // No back button, no progress bar, no form fields. Browser back
  // is intercepted in the popstate effect above.
  // -----------------------------------------------------------------
  if (submittedRef) {
    return (
      <BookingSuccess
        bookingRef={submittedRef}
        // Hand control back to the parent (BookingPage) which clears
        // the selected service and renders ServiceSelector. When the
        // user picks a service again, StandardBookingFlow remounts
        // with completely fresh state — no pre-filled fields.
        onCreateNew={onBack}
      />
    );
  }

  return (
    <div>
      {/* Back button + service label */}
      <div className="flex items-center gap-3 mb-3 sm:mb-6">
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
          <p className="text-[11px] sm:text-xs text-gray-400">
            Step {currentIndex + 1} of {STEPS.length} — {STEP_LABELS[step]}
          </p>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="flex gap-1 mb-3 sm:mb-6">
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
