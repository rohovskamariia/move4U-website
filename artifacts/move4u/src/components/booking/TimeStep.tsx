import { useState } from "react";
import { Minus, Plus, Clock } from "lucide-react";
import BookingPolicyModal from "@/components/BookingPolicyModal";

interface TimeStepProps {
  hours: number;
  onHoursChange: (h: number) => void;
}

// Time selection — plus/minus buttons, 30-minute steps, minimum 2 hours.
// Minimum-booking note lives here (the only place it's relevant).
export default function TimeStep({ hours, onHoursChange }: TimeStepProps) {
  const MIN = 2;
  const STEP = 0.5;
  const [showPolicy, setShowPolicy] = useState(false);

  const format = (h: number) => {
    const whole = Math.floor(h);
    const half = h % 1 !== 0;
    return `${whole}${half ? ".5" : ""}h`;
  };

  const dec = () => {
    if (hours > MIN) onHoursChange(Math.max(MIN, hours - STEP));
  };
  const inc = () => onHoursChange(hours + STEP);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        Estimated booking time
      </h3>
      <p className="text-gray-500 text-sm mb-6">
        How long do you think the job will take?
      </p>

      {/* Premium stepper */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={dec}
            disabled={hours <= MIN}
            className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-700 shadow-sm hover:border-purple-500 hover:text-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Decrease time"
            data-testid="time-dec"
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="text-center flex-1">
            <span
              className="text-5xl font-bold text-purple-700 tracking-tight tabular-nums"
              data-testid="time-display"
            >
              {format(hours)}
            </span>
            <p className="text-xs text-gray-500 mt-1">30-minute steps</p>
          </div>

          <button
            onClick={inc}
            className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-700 shadow-sm hover:border-purple-500 hover:text-purple-700 active:scale-95 transition-all"
            aria-label="Increase time"
            data-testid="time-inc"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Minimum-booking notice — clickable link to the booking policy. */}
      <button
        type="button"
        onClick={() => setShowPolicy(true)}
        className="w-full flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm font-semibold text-purple-700 hover:bg-purple-100 hover:border-purple-200 transition-colors text-left"
        data-testid="time-min-booking-link"
      >
        <Clock className="w-4 h-4 shrink-0" />
        <span className="underline underline-offset-2 decoration-purple-300">
          Minimum booking: 2 hours
        </span>
      </button>

      {showPolicy && <BookingPolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
