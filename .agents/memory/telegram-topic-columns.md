---
name: Telegram Topic Message IDs
description: Column layout for Telegram message IDs and topic routing rules across all forum topics.
---

## Column layout (Google Sheets)

| Column | Field name (BookingRecord) | Purpose |
|--------|---------------------------|---------|
| V  | `telegramMessageId`                | Main topic — original new-booking message; edited on payment field changes |
| AT | `telegramPaymentsMessageId`        | Payments topic — send-or-edit on every payment field change |
| AY | `telegramNewBookingsMessageId`     | New Bookings topic — stored once when booking is created |
| AZ | `telegramBookingUpdatesMessageId`  | Booking Updates topic — stored on each "Save & Notify Driver" (latest wins) |
| BA | `telegramCompletedJobsMessageId`   | Completed Jobs topic — stored once when booking first reaches Completed |

Sheet read range: `A:BA` (53 columns). ensureColumnCount uses 53.

## Topic routing triggers

- **New booking created** → Main (V) + New Bookings topic (AY)
- **Payment field change, silent save** → edit Main (V) + send/edit Payments topic (AT)
- **Save & Notify Driver** → Booking Updates topic (AZ) [new message each time] + Completed Jobs (BA) if Completed and not already sent
- **bookingStatus → Completed, silent save** → Completed Jobs (BA) once if not already sent

## Env vars required

```
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TELEGRAM_TOPIC_MAIN_ID            (numeric thread ID or omit for general chat)
TELEGRAM_TOPIC_NEW_BOOKINGS_ID
TELEGRAM_TOPIC_BOOKING_UPDATES_ID
TELEGRAM_TOPIC_PAYMENTS_ID
TELEGRAM_TOPIC_COMPLETED_JOBS_ID
```

## Admin utility endpoints (all require X-Admin-Key header)

- `GET  /api/admin/telegram/topics`           — calls Telegram getForumTopics, returns topic list + currently configured IDs
- `POST /api/admin/telegram/test-topics`      — sends labelled test message to each configured topic
- `GET  /api/admin/telegram/backfill-preview` — dry-run: shows which bookings would be sent to which topics
- `POST /api/admin/telegram/backfill-execute` — idempotent backfill; skips bookings that already have a stored ID per topic

**Why:** The backfill is idempotent (checks stored ID before sending), so re-running is safe.
