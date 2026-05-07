// ============================================================
// MOVE4U CONSTANTS — Edit these to update the whole website
// ============================================================

// CONTACT DETAILS — Change phone numbers and email here
export const CONTACT = {
  driver: "+447888355523",
  driverDisplay: "+44 7888 355523",
  support: "+447946259714",
  supportDisplay: "+44 7946 259714",
  email: "move4u.uk@gmail.com",
  whatsapp: "447888355523",
  whatsappDefaultMessage: "Hi Move4U, I need help with my move.",
  viber: "+447888355523", // Viber uses the same phone as the driver line
  // Telegram is offered as a SECONDARY contact channel — exposed in the
  // Contact section and footer only, never in the booking form's
  // "preferred contact method" list.
  telegram: "https://t.me/move4u_uk",
  telegramHandle: "@move4u_uk",
};

// HOMEPAGE SLIDER CONTENT — Edit slide text here
// Hero background images — imported so Vite hashes / optimises them.
// To swap images, update the imports below.
import slide1Image from "@assets/ChatGPT_Image_May_7_2026_11_36_40_AM_1778150968414.webp";
// Higher-quality versions — order intentionally swapped:
// the new "couch / packing" photo is now slide 2,
// the new "stairs / furniture" photo is now slide 3.
import slide2Image from "@assets/IMG_3549_1776605362190.webp";
import slide3Image from "@assets/IMG_3548_1776605362190.webp";

export type SlideButton = {
  text: string;
  action: "book" | "quote" | "call";
  variant: "primary" | "secondary";
};

export type Slide = {
  id: number;
  subtitle?: string;
  title: string;
  text: string;
  image: string;
  /** CSS object-position value — keeps the subjects visible to the right of the text overlay */
  imagePosition?: string;
  /** Optional CSS filter applied to the image for a softer/warmer feel */
  imageFilter?: string;
  buttons: SlideButton[];
};

export const SLIDES: Slide[] = [
  {
    id: 1,
    subtitle: "FROM £35/HOUR",
    title: "Fast & Reliable Moving Services in London",
    text: "House moves, deliveries and waste removal — done quickly, safely and professionally.",
    image: slide1Image, // two Move4U movers carrying rug & boxes by the van
    imagePosition: "70% center",
    buttons: [
      { text: "Get a Quote", action: "quote", variant: "primary" },
      { text: "Book Now", action: "book", variant: "secondary" },
    ],
  },
  {
    id: 2,
    title: "Professional Team You Can Trust",
    text: "Careful handling, fast service and flexible booking times. We treat your belongings like our own.",
    image: slide3Image, // movers carrying furniture up stairs (high-res)
    // Slight upward shift keeps the worker's head fully in frame on
    // both mobile and desktop while leaving the right side of the
    // photo (the action) visible behind the headline.
    imagePosition: "55% 22%",
    buttons: [
      { text: "Get a Quote", action: "quote", variant: "primary" },
      { text: "Book Now", action: "book", variant: "secondary" },
    ],
  },
  {
    id: 3,
    title: "Ready to Book Your Move?",
    text: "Get a quick quote online or call us for instant help.",
    image: slide2Image, // couple packing boxes on couch (high-res)
    // Pulled left + lifted just enough so both heads stay fully in
    // frame and the couple sits centred behind the overlay rather
    // than disappearing off the right edge on mobile.
    imagePosition: "45% 18%",
    buttons: [
      { text: "Get a Quote", action: "quote", variant: "primary" },
      { text: "Call Us", action: "call", variant: "secondary" },
    ],
  },
];

// SERVICE DESCRIPTIONS — Edit homepage service card descriptions here
// Exactly 6 cards (2 rows of 3). Use "Moving" not "Move".
export const SERVICES = [
  {
    id: "house-move",
    title: "House Moving",
    price: "From £35/hour",
    description: "Reliable home moving service for flats, houses and full property moves across London.",
    icon: "Home",
  },
  {
    id: "waste-removal",
    title: "Waste Removal",
    price: "From £60",
    description: "Fast and affordable waste collection. Ideal for furniture, bags and general rubbish.",
    icon: "Trash2",
  },
  {
    id: "single-item",
    title: "Single Item Delivery",
    price: "From £60",
    description: "Quick delivery for furniture and individual items. Minimum £60 covers up to 1 hour.",
    icon: "Package",
  },
  {
    id: "commercial-move",
    title: "Commercial Moving",
    // Aligned with the House Moving rate (small van / no helper) so the
    // hourly rate is consistent everywhere it appears on the site.
    price: "From £35/hour",
    description: "Professional office and business relocation with flexible scheduling.",
    icon: "Building2",
  },
  {
    id: "international",
    title: "International Moving",
    price: "Custom pricing",
    description: "Moving across the UK and Europe. Contact us for a personalised quote.",
    icon: "Globe",
  },
  {
    id: "something-else",
    title: "Custom Request",
    price: "Contact us",
    description: "Have a special request? We will recommend the best solution for your job.",
    icon: "HelpCircle",
  },
];

// VAN SIZE PRICING — Edit van hourly prices here
export const VAN_SIZES = [
  {
    id: "small",
    name: "Small Van",
    basePrice: 35,
    dimensions: "2.5m x 1.6m x 1.5m",
    description: "Great for boxes, bags, and small loads. Ideal for student moves and light furniture.",
  },
  {
    id: "medium",
    name: "Medium Van",
    basePrice: 45,
    dimensions: "3.0m x 1.8m x 1.8m",
    description: "Suitable for 1-bed flat moves or larger single-item deliveries. A popular all-round choice.",
  },
  {
    id: "large",
    name: "Large Van",
    basePrice: 50,
    dimensions: "3.8m x 1.9m x 2.0m",
    description: "Best for 2–3 bed house moves or full office relocations. Maximum space and flexibility.",
  },
];

// HELP OPTION PRICING — Based on van size. Edit here to change prices.
// Format: { noHelp, driverHelp, driverPlusHelper }
export const HELP_PRICING: Record<string, { noHelp: number; driverHelp: number; driverPlusHelper: number }> = {
  small: { noHelp: 35, driverHelp: 45, driverPlusHelper: 65 },
  medium: { noHelp: 45, driverHelp: 55, driverPlusHelper: 75 },
  large: { noHelp: 50, driverHelp: 60, driverPlusHelper: 90 },
};

// ADDITIONAL CHARGES — Surcharges added on top of the hourly rate.
// Edit these values to change pricing across the site (booking
// estimate, summary card, and pricing page all read from here).
export const EXTRA_STOP_CHARGE = 5; // £ per intermediate stop
export const CONGESTION_CHARGE = 18; // £ per CCZ entry — TfL Central London zone
export const OUTSIDE_M25_RATE = 1; // £ per mile outside the M25 ring road

// SINGLE ITEM DELIVERY — fixed-formula pricing (NOT hourly van rate).
// £60 covers up to the first hour, then £30 per additional 30 minutes.
export const SINGLE_ITEM_PRICING = {
  baseCharge: 60, // £ — covers the first hour
  baseHours: 1,   // hours included in base charge
  extraHalfHourRate: 30, // £ per additional 30 min after the first hour
};

// STAIR CHARGES — Edit floor surcharge prices here
export const STAIR_CHARGES: Record<string, number> = {
  none: 0,
  ground: 0,
  first: 10,
  second: 20,
  third: 30,
  fourth: 40,
  fifth_plus: -1, // -1 = "contact us"
};

// WASTE REMOVAL LOAD PRICES — Edit waste removal pricing here
export type WasteLoad = {
  id: string;
  label: string;
  /** Numeric price used for total calculation */
  price: number;
  /** Customer-facing price string (may include ranges like "£350–400" or "£400+") */
  displayPrice: string;
  labour?: string;
  cubicYards?: string;
  maxWeight?: string;
  equivalent?: string;
};

export const WASTE_LOADS: WasteLoad[] = [
  { id: "minimum",       label: "Minimum Load",     price: 60,  displayPrice: "£60",      labour: "10 mins", cubicYards: "1.5",  maxWeight: "100–150kg", equivalent: "8 bin bags" },
  { id: "quarter",       label: "1/4 Load",         price: 120, displayPrice: "£120",     labour: "20 mins", cubicYards: "3.5",  maxWeight: "200–250kg", equivalent: "20 bin bags" },
  { id: "third",         label: "1/3 Load",         price: 150, displayPrice: "£150",     labour: "30 mins", cubicYards: "5.25", maxWeight: "250–300kg", equivalent: "30 bin bags" },
  { id: "half",          label: "1/2 Load",         price: 200, displayPrice: "£200",     labour: "40 mins", cubicYards: "7",    maxWeight: "350–500kg", equivalent: "40 bin bags" },
  { id: "three_quarter", label: "3/4 Load",         price: 250, displayPrice: "£250",     labour: "50 mins", cubicYards: "10.5", maxWeight: "500–650kg", equivalent: "60 bin bags" },
  { id: "full",          label: "Full Load",        price: 350, displayPrice: "£350–400",                                        maxWeight: "1000kg" },
  { id: "extra_large",   label: "Extra Large Load", price: 400, displayPrice: "£400+",                                           maxWeight: "up to 2000kg (on request)" },
];

// WASTE REMOVAL EXTRA ITEMS — Edit extra item prices here
export const WASTE_EXTRA_ITEMS = [
  { id: "mattress", label: "Mattress", price: 30, icon: "BedDouble" },
  { id: "fridge", label: "Fridge", price: 30, icon: "Refrigerator" },
  { id: "tyres", label: "Tyres", price: 30, icon: "Circle" },
  { id: "sofa", label: "Sofa (2–3 seat)", price: 45, icon: "Armchair" },
  { id: "armchair", label: "Armchair", price: 25, icon: "Armchair" },
  { id: "chair", label: "Office / Dining Chair", price: 15, icon: "Armchair" },
];

// REVIEWS — Edit customer reviews here
export const REVIEWS = [
  {
    id: 1,
    name: "Sarah M.",
    location: "Brixton, London",
    rating: 5,
    text: "Absolutely brilliant service. The driver was on time, careful with our furniture, and very professional. Would highly recommend Move4U to anyone moving in London.",
  },
  {
    id: 2,
    name: "James T.",
    location: "East Ham, London",
    rating: 5,
    text: "Used Move4U for a small office relocation. Smooth process from start to finish. The team was efficient and nothing was damaged. Great value for money.",
  },
  {
    id: 3,
    name: "Priya K.",
    location: "Croydon, London",
    rating: 5,
    text: "Needed a sofa delivered at short notice and they sorted it same day. Friendly driver, quick and easy. Really impressed with the service.",
  },
  {
    id: 4,
    name: "Michael B.",
    location: "Hackney, London",
    rating: 5,
    text: "Second time using Move4U and they haven't let me down. Fair pricing, reliable and no hidden charges. The WhatsApp booking was really convenient too.",
  },
  {
    id: 5,
    name: "Anna L.",
    location: "Islington, London",
    rating: 4,
    text: "Very good service overall. The van was clean, the driver was polite and took great care with our items. Will definitely use again for our next move.",
  },
];
