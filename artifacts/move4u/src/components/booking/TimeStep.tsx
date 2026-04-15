import { Minus, Plus } from "lucide-react";

interface TimeStepProps {
  hours: number;
  onHoursChange: (h: number) => void;
}

// Time selection — plus/minus buttons, 30-minute steps, minimum 2 hours
export default function TimeStep({ hours, onHoursChange }: TimeStepProps) {
  const MIN = 2;
  const STEP = 0.5;

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
      <h3 className="text-base font-semibold text-gray-900 mb-1">Estimated booking time</h3>
      <p className="text-gray-500 text-sm mb-5">How long do you think the job will take? Minimum 2 hours.</p>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={dec}
          disabled={hours <= MIN}
          className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-500 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease time"
          data-testid="time-dec"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="text-center min-w-[100px]">
          <span className="text-4xl font-bold text-purple-700" data-testid="time-display">
            {format(hours)}
          </span>
          {hours < 3 && (
            <p className="text-xs text-gray-400 mt-1">Minimum booking</p>
          )}
        </div>

        <button
          onClick={inc}
          className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-purple-500 hover:text-purple-700 transition-colors"
          aria-label="Increase time"
          data-testid="time-inc"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-5">
        Time increases in 30-minute steps. Final duration confirmed after review.
      </p>
    </div>
  );
}
