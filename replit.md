# Move4U – Removals Website

## Overview

A professional, clean removals website for Move4U, a self-employed removals service based in London, UK. Light background with purple accents, mobile-friendly, and built to look like a real trusted UK business.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend framework**: React + Vite (artifact: `artifacts/move4u`)
- **Routing**: Wouter
- **Styling**: Tailwind CSS v4

## Key Features

- Professional homepage with 3-slide auto-carousel
- 7 service cards with booking flows
- Complete multi-step booking form (pickup, drop-off, van, help, time, notes, summary, final details)
- Dedicated Waste Removal flow with load sizes + extra items
- International Moving enquiry form
- "Something Else" custom enquiry form
- Live price calculator in booking summary
- Stairs/lift/floor surcharge logic
- Floating WhatsApp button (always visible)
- Reviews section
- Contact section with driver + support + email
- Terms & Conditions and Privacy Policy pages
- Mobile-responsive throughout

## File Structure to Edit

### Homepage text & slider
- **`artifacts/move4u/src/data/constants.ts`** — SLIDES array for carousel text

### Service pricing (van, help options)
- **`artifacts/move4u/src/data/constants.ts`** — VAN_SIZES, HELP_PRICING, OUTSIDE_M25_RATE, SINGLE_ITEM_PRICING, CONGESTION_CHARGE
- **`artifacts/move4u/src/lib/pricing.ts`** — `computeBaseServiceCharge`, `getHourlyRate`, `isSingleItem`, `computeSingleItemBase` (single source of truth used by SummaryStep and StandardBookingFlow submit)
- **`artifacts/move4u/src/lib/m25.ts`** — postcode-area outside-M25 mileage estimate (£1/mile, 30-mile fallback for unknown non-London areas)
- **`artifacts/move4u/src/lib/congestionZone.ts`** — `countCongestionEntries` (£18 per CCZ address)

Pricing rules:
- Standard services: per-van × help-level hourly rate, 2-hour minimum.
- Single Item Delivery: flat £60 covers 1 hour, +£30 per 30 min after, 1-hour minimum, independent of van/help.
- CCZ: £18 per address inside the zone (pickup + drop-off + each extra stop counted separately).
- Outside M25: ~£1/mile (estimate, reconciled on the day).
- Stairs (no lift): £10/floor; every 4 steps = 1 floor (policy text).

### Waste removal extra item pricing
- **`artifacts/move4u/src/data/constants.ts`** — WASTE_LOADS and WASTE_EXTRA_ITEMS

### Van images
- **`artifacts/move4u/src/components/booking/VanStep.tsx`** — Van SVG icons / replace with images
- **`artifacts/move4u/src/components/VanSizeModal.tsx`** — Guide modal van icons

### Phone numbers and email
- **`artifacts/move4u/src/data/constants.ts`** — CONTACT object

### Booking flow logic
- **`artifacts/move4u/src/components/booking/StandardBookingFlow.tsx`** — main booking steps
- **`artifacts/move4u/src/components/booking/WasteRemovalFlow.tsx`** — waste booking
- **`artifacts/move4u/src/components/booking/InternationalFlow.tsx`** — international enquiry
- **`artifacts/move4u/src/components/booking/SomethingElseFlow.tsx`** — custom enquiry

### Service cards + descriptions
- **`artifacts/move4u/src/data/constants.ts`** — SERVICES array

### Reviews
- **`artifacts/move4u/src/data/constants.ts`** — REVIEWS array

### Stair/floor surcharges
- **`artifacts/move4u/src/data/constants.ts`** — STAIR_CHARGES

## Twilio SMS Integration (PENDING)
<!-- NOTE: Twilio Replit integration was dismissed. Credentials must be provided as secrets manually. -->
<!-- Required secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER -->
<!-- Once secrets are set, implement using the twilio npm package in the api-server -->

## Google Sheets Integration

Every booking submission is saved automatically to a Google Sheet:
- **Sheet**: https://docs.google.com/spreadsheets/d/1MkWV6T0aj3GD0RIF22X_yqSE-u5qWHN9nZNkwY7l8cE/edit
- **Sheet ID env var**: `GOOGLE_SHEET_ID` (shared environment) — persists the sheet across restarts
- **Integration**: Replit Google Sheets connector (`google-sheet`) via `@replit/connectors-sdk`
- **API endpoint**: `POST /api/bookings` on the API server (port 8080)
- **Columns**: Timestamp, Service, Name, Phone, Pickup Address, Drop-off Address, Van Size, Help Option, Estimated Price (£), Date, Notes
- **Flows covered**: StandardBookingFlow (house/commercial/single-item/small-move), WasteRemovalFlow, InternationalFlow, SomethingElseFlow
- **Helper file**: `artifacts/api-server/src/lib/sheets.ts`
- **Route file**: `artifacts/api-server/src/routes/bookings.ts`
- **Frontend API helper**: `artifacts/move4u/src/lib/api.ts`
- **Vite proxy**: `/api` → `http://localhost:8080` (dev only)

## Key Commands

- `pnpm --filter @workspace/move4u run dev` — run website locally
- `pnpm --filter @workspace/move4u run build` — build for production
- `pnpm --filter @workspace/api-server run dev` — run API server locally
