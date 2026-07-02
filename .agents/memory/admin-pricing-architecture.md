---
name: Admin Booking Editor — Pricing Architecture
description: How structured pricing (stairs, CCZ, M25, extra time) is stored, serialised, and recovered in the admin booking editor.
---

## Rule
Structured pricing charges are stored inside the `adminExtraCharges` JSON column (column AS) using reserved `type` keys. Manual freeform charges use any other type string.

## Structured type keys (must never be renamed)
| type                | source field         | amount formula  | notes format      |
|---------------------|----------------------|-----------------|-------------------|
| `Stairs - pickup`   | `pickupFloors`       | floors × £10    | `"N floor(s)"`    |
| `Stairs - drop-off` | `dropoffFloors`      | floors × £10    | `"N floor(s)"`    |
| `Congestion charge` | `congestionEntries`  | entries × £18   | `"N entr(y/ies)"` |
| `Outside M25`       | `outsideM25Miles`    | miles × £1      | `"N miles"`       |
| `Extra time`        | `extraTimeMinutes`   | rate × min/60   | `"+N min"`        |

## Why
No new sheet column needed. On load, `initEditForm` parses the JSON and populates structured UI fields. On save, `serializeAdminCharges(form)` rebuilds the full charges array (structured + manual) and writes it back.

## How to apply
- Always use `serializeAdminCharges(form)` in `saveChanges`, `saveAndNotify`, `confirmBooking`.
- `form.adminExtraCharges` contains ONLY manual/freeform charges.
- `computeAdminPricing(form)` gives the live breakdown — uses `getHourlyRate` + pricing constants.
- Telegram message parser reads the same structured types from adminExtraCharges JSON.

## Editable core fields (added this session)
`service` (col B), `vanSize` (col G), `helpOption` (col H), `timeWindow` → `preferredTime` (col X).
Added to `buildAdminWriteRanges` in sheets.ts and to the allowed list in admin.ts PUT route.
