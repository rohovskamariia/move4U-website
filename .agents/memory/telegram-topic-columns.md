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

## Topic routing triggers — every admin save runs ALL applicable steps

Every `PUT /api/admin/bookings/:ref` runs these steps in order (regardless of which fields changed):

- **Step A (always)**: silently edit the main Telegram message (column V). If no ID is stored (older booking), send a fresh message to Main and store the returned ID permanently — this auto-recovers old bookings on their first edit.
- **Step B (payment fields changed)**: also send/edit the Payments topic (AT).
- **Step C (Notify Driver checked)**: also send a new message to Booking Updates topic (AZ).
- **Step D (status → Completed, first time)**: also send once to Completed Jobs (BA).

New booking created → Main (V) + New Bookings topic (AY).

**Bug that was fixed:** Previously only PAYMENT_ONLY_FIELDS triggered Main edits; all other field changes (booking status, addresses, notes, date/time, etc.) without notify=true produced zero Telegram activity. Also older bookings with no stored telegramMessageId were silently skipped with no recovery.

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
