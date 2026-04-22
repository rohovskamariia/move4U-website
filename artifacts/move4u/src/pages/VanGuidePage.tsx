import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import BackToHome from "@/components/BackToHome";
import smallVan from "@assets/IMG_3410_1776508670556.webp";
import mediumVan from "@assets/IMG_3409_1776508670556.webp";
import largeVan from "@assets/IMG_3408_1776508670556.webp";

interface VanInfo {
  name: string;
  description: string;
  specs: { label: string; value: string }[];
  image: string;
  scale: number;
}

const VANS: VanInfo[] = [
  {
    name: "Small Van",
    description:
      "Suitable for one person's luggage and easy to park. Can fit up to 10 packed suitcases.",
    specs: [
      { label: "Length", value: "1.7m / 5.58ft" },
      { label: "Width", value: "1.49m / 4.89ft" },
      { label: "Height", value: "1.2m / 3.94ft" },
      { label: "Payload", value: "600–800kg" },
      { label: "Seats (including driver)", value: "2" },
    ],
    image: smallVan,
    scale: 0.6,
  },
  {
    name: "Medium Van",
    description:
      "Suitable for transporting two people's belongings. Offers a large load area without being much bigger than a family car.",
    specs: [
      { label: "Length", value: "2.4m / 7.87ft" },
      { label: "Width", value: "1.7m / 5.58ft" },
      { label: "Height", value: "1.4m / 4.59ft" },
      { label: "Payload", value: "800–1200kg" },
      { label: "Seats (including driver)", value: "3" },
    ],
    image: mediumVan,
    scale: 0.78,
  },
  {
    name: "Large Van",
    description:
      "Suitable for 1–2 bedroom flat removals or business-to-business deliveries. Offers a large internal load space with easy loading and unloading.",
    specs: [
      { label: "Length", value: "3.4m / 11.15ft" },
      { label: "Width", value: "1.7m / 5.58ft" },
      { label: "Height", value: "1.8m / 6.20ft" },
      { label: "Payload", value: "1200–1500kg" },
      { label: "Seats (including driver)", value: "3" },
    ],
    image: largeVan,
    scale: 1,
  },
];

export default function VanGuidePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <BackToHome className="mb-4 sm:mb-6" />

        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Van Size Guide</h1>
          <p className="text-gray-600 text-[13.5px] sm:text-sm leading-relaxed">
            Use this guide to choose the right van for your move. Not sure?
            Pick the closest match — our team will confirm the best fit before your booking.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-6">
          {VANS.map((van) => (
            <div
              key={van.name}
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm"
              data-testid={`van-card-${van.name.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="bg-white border-b border-gray-100 aspect-[16/6] sm:aspect-[12/5] flex items-end justify-center px-4 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4">
                <img
                  src={van.image}
                  alt={van.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: `${van.scale * 100}%` }}
                  className="max-h-full object-contain"
                />
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-3 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900">{van.name}</h2>
                  <Link
                    href={`/book/house-move`}
                    className="text-[13px] sm:text-sm font-semibold text-purple-700 hover:text-purple-900 underline underline-offset-2"
                  >
                    Book now
                  </Link>
                </div>
                <p className="text-gray-600 text-[13px] sm:text-sm leading-relaxed mb-3 sm:mb-4">{van.description}</p>

                <h3 className="text-[13px] sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">Load space specifications</h3>
                <ul className="space-y-1 sm:space-y-1.5 text-[13px] sm:text-sm text-gray-700">
                  {van.specs.map((s) => (
                    <li key={s.label} className="flex justify-between border-b border-gray-50 pb-1 sm:pb-1.5 last:border-0">
                      <span className="text-gray-500">{s.label}</span>
                      <span className="font-medium">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-10 bg-purple-50 border border-purple-100 rounded-2xl p-4 sm:p-5 text-center">
          <p className="text-sm text-gray-700 mb-3">
            Still unsure which van size you need? Our team is happy to help.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book/house-move"
              className="btn-purple text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              Start House Moving Booking
            </Link>
            <Link
              href="/#contact"
              className="text-sm font-semibold text-purple-700 border border-purple-200 px-5 py-2.5 rounded-full hover:bg-white transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
