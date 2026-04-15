import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface FinalDetailsStepProps {
  onSubmit: (data: {
    date: string;
    timeWindow: string;
    name: string;
    phone: string;
  }) => void;
}

// Final step — preferred date, time window, name, phone
export default function FinalDetailsStep({ onSubmit }: FinalDetailsStepProps) {
  const [date, setDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !timeWindow || !name || !phone) return;
    setSubmitted(true);
    onSubmit({ date, timeWindow, name, phone });
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-100 text-green-700 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Enquiry Submitted!</h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
          We will call or text you to confirm your booking and final price. Thank you for choosing Move4U.
        </p>
      </div>
    );
  }

  const timeWindows = ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–8pm)"];

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Final details</h3>
      <p className="text-gray-500 text-sm mb-5">
        We will call or text you to confirm your booking and final price.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preferred date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="final-date"
          />
        </div>

        {/* Time window */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred time</label>
          <div className="flex flex-col gap-2">
            {timeWindows.map((tw) => (
              <button
                key={tw}
                type="button"
                onClick={() => setTimeWindow(tw)}
                className={`text-left px-4 py-2.5 text-sm rounded-xl border-2 transition-colors ${
                  timeWindow === tw
                    ? "border-purple-700 bg-purple-50 text-purple-700 font-medium"
                    : "border-gray-100 text-gray-700 hover:border-purple-300"
                }`}
                data-testid={`time-window-${tw.toLowerCase().replace(/\s/g, "-")}`}
              >
                {tw}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="final-name"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            data-testid="final-phone"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors text-sm mt-2"
          data-testid="submit-booking"
        >
          Submit Enquiry
        </button>
      </form>
    </div>
  );
}
