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
- **`artifacts/move4u/src/data/constants.ts`** — VAN_SIZES and HELP_PRICING

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

## Key Commands

- `pnpm --filter @workspace/move4u run dev` — run website locally
- `pnpm --filter @workspace/move4u run build` — build for production
