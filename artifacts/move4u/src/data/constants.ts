// ============================================================
// MOVE4U CONSTANTS — Edit these to update the whole website
// ============================================================

// CONTACT DETAILS — Change phone numbers and email here
export const CONTACT = {
  driver: "+447888355523",
  driverDisplay: "+44 7888 355523",
  support: "+447946259714",
  supportDisplay: "+44 7946 259714",
  email: "move4foru@gmail.com",
  whatsapp: "447888355523",
  whatsappDefaultMessage: "Hi Move4U, I need help with my move.",
};

// HOMEPAGE SLIDER CONTENT — Edit slide text here
// Hero background images — imported so Vite hashes / optimises them.
// To swap images, update the imports below.
import slide1Image from "@assets/9B0EA994-18D8-4A3C-AD5B-C9572BF927CE_1776368081211.png";
import slide2Image from "@assets/IMG_3293_1776368081211.jpeg";
import slide3Image from "@assets/IMG_3287_1776365847104.jpeg";

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
    title: "Fast & Reliable Removals in London",
    text: "House moves, deliveries and waste removal — done quickly, safely and professionally.",
    image: slide1Image, // two movers loading van in sunlight (landscape)
    imagePosition: "60% center",
    // Softer, warmer, more premium look — gentle blur, slight contrast pull-back, mild warmth
    imageFilter: "blur(0.6px) saturate(0.92) contrast(0.94) brightness(1.04)",
    buttons: [
      { text: "Get a Quote", action: "quote", variant: "primary" },
      { text: "Book Now", action: "book", variant: "secondary" },
    ],
  },
  {
    id: 2,
    title: "Professional Team You Can Trust",
    text: "Careful handling, fast service and flexible booking times. We treat your belongings like our own.",
    image: slide3Image, // loading van at sunset
    imagePosition: "60% 30%",
    buttons: [
      { text: "Get a Quote", action: "quote", variant: "primary" },
    ],
  },
  {
    id: 3,
    title: "Not Sure What You Need?",
    text: "Tell us your job — we'll recommend the best option and price instantly.",
    image: slide2Image, // couple packing boxes on couch (landscape)
    imagePosition: "65% 28%",
    buttons: [
      { text: "Call Us", action: "call", variant: "primary" },
      { text: "Get a Quote", action: "quote", variant: "secondary" },
    ],
  },
];

// SERVICE DESCRIPTIONS — Edit homepage service card descriptions here
export const SERVICES = [
  {
    id: "house-move",
    title: "House Move",
    description: "Reliable home moving service across London and surrounding areas.",
    icon: "Home",
  },
  {
    id: "waste-removal",
    title: "Waste Removal",
    description: "Fast and affordable waste collection and disposal.",
    icon: "Trash2",
  },
  {
    id: "commercial-move",
    title: "Commercial Move",
    description: "Business and office moving service with flexible booking.",
    icon: "Building2",
  },
  {
    id: "single-item",
    title: "Single Item Delivery",
    description: "Quick delivery for furniture, appliances, and individual items.",
    icon: "Package",
  },
  {
    id: "small-move",
    title: "Small Move",
    description: "Ideal for lighter moves, boxes and smaller jobs.",
    icon: "PackageOpen",
  },
  {
    id: "international",
    title: "International Moving",
    description: "Moving enquiries from the UK to Europe.",
    icon: "Globe",
  },
  {
    id: "something-else",
    title: "Something Else",
    description: "Need something different? Send us a custom enquiry.",
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
    basePrice: 40,
    dimensions: "3.0m x 1.8m x 1.8m",
    description: "Suitable for 1-bed flat moves or larger single-item deliveries. A popular all-round choice.",
  },
  {
    id: "large",
    name: "Large Van",
    basePrice: 45,
    dimensions: "3.8m x 1.9m x 2.0m",
    description: "Best for 2–3 bed house moves or full office relocations. Maximum space and flexibility.",
  },
];

// HELP OPTION PRICING — Based on van size. Edit here to change prices.
// Format: { noHelp, driverHelp, driverPlusHelper }
export const HELP_PRICING: Record<string, { noHelp: number; driverHelp: number; driverPlusHelper: number }> = {
  small: { noHelp: 35, driverHelp: 40, driverPlusHelper: 70 },
  medium: { noHelp: 40, driverHelp: 45, driverPlusHelper: 75 },
  large: { noHelp: 45, driverHelp: 50, driverPlusHelper: 80 },
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
export const WASTE_LOADS = [
  { id: "minimum", label: "Minimum Load", price: 60 },
  { id: "quarter", label: "1/4 Load", price: 120 },
  { id: "third", label: "1/3 Load", price: 150 },
  { id: "half", label: "1/2 Load", price: 200 },
  { id: "three_quarter", label: "3/4 Load", price: 250 },
  { id: "full", label: "Full Load", price: 350 },
  { id: "extra_large", label: "Extra Large", price: 400 },
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
