export interface BookingPayload {
  service: string;
  name: string;
  phone: string;
  pickup: string;
  dropoff: string;
  vanSize: string;
  helpOption: string;
  estimatedPrice: string;
  estimatedTime: string;
  date: string;
  timeWindow: string;
  notes: string;
}

export async function submitBooking(payload: BookingPayload): Promise<void> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to submit booking");
  }
}
