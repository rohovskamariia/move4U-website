export interface BookingPayload {
  service: string;
  name: string;
  phone: string;
  email?: string;
  contactMethod: string;
  pickup: string;
  pickupDetails: string;
  dropoff: string;
  dropoffDetails: string;
  extraAddress: string;
  extraStops?: string[];
  vanSize: string;
  helpOption: string;
  peopleCount: string;
  estimatedPrice: string;
  estimatedTime: string;
  date: string;
  timeWindow: string;
  wasteAddons: string;
  uploadedFiles: string; // comma-separated serving URLs for uploaded photos
  notes: string;
}

export interface BookingResult {
  bookingReference: string;
}

// Upload a single photo to object storage.
// Returns the serving URL path e.g. "/api/storage/objects/uploads/uuid"
async function uploadPhoto(file: File): Promise<string> {
  // Step 1: request a presigned URL from the server
  const metaRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name:        file.name,
      size:        file.size,
      contentType: file.type || "image/jpeg",
    }),
  });
  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Failed to request upload URL");
  }
  const { uploadURL, objectPath } = (await metaRes.json()) as {
    uploadURL: string;
    objectPath: string;
  };

  // Step 2: upload the file directly to GCS via the presigned PUT URL
  const uploadRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error(`Upload failed with status ${uploadRes.status}`);
  }

  // objectPath is like "/objects/uploads/uuid"
  // Serving URL is /api/storage + objectPath
  return `/api/storage${objectPath}`;
}

// Upload multiple photos concurrently.
// Returns an array of serving URLs. Failures are logged but don't block the booking.
export async function uploadPhotos(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const results = await Promise.allSettled(files.map(uploadPhoto));
  const urls: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      urls.push(r.value);
    } else {
      console.warn("Photo upload failed:", r.reason);
    }
  }
  return urls;
}

export async function submitBooking(payload: BookingPayload): Promise<BookingResult> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Failed to submit booking");
  }
  const data = (await res.json()) as { success: boolean; bookingReference: string };
  return { bookingReference: data.bookingReference };
}
