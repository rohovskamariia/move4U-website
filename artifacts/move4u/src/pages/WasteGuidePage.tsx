import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import BackToHome from "@/components/BackToHome";
import { WASTE_LOADS } from "@/data/constants";
import minLoad from "@assets/IMG_3575_1776610167208.jpeg";
import quarterLoad from "@assets/IMG_3576_1776610167208.jpeg";
import thirdLoad from "@assets/IMG_3577_1776610167208.jpeg";
import halfLoad from "@assets/IMG_3578_1776610167208.jpeg";
import threeQuarterLoad from "@assets/IMG_3579_1776610167209.jpeg";
import fullLoad from "@assets/IMG_3580_1776610167209.jpeg";
import xlLoad from "@assets/IMG_3580_1776610167209.jpeg";

const LOAD_IMAGES: Record<string, string> = {
  minimum: minLoad,
  quarter: quarterLoad,
  third: thirdLoad,
  half: halfLoad,
  three_quarter: threeQuarterLoad,
  full: fullLoad,
  extra_large: xlLoad,
};

export default function WasteGuidePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <BackToHome className="mb-6" />

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Waste Removal Size Guide
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Use this guide to estimate your load size before booking. Not sure?
            Pick the closest match — our team will confirm pricing before the job starts.
          </p>
        </div>

        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Prices</p>

        <div className="space-y-4 mb-10">
          {WASTE_LOADS.map((load) => (
            <div
              key={load.id}
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm"
              data-testid={`waste-load-card-${load.id}`}
            >
              <div className="bg-white border-b border-gray-100 aspect-[12/5] flex items-end justify-center px-6 pt-6 pb-4">
                <img
                  src={LOAD_IMAGES[load.id]}
                  alt={`${load.label} visual`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {load.label}
                  </h2>
                  <span className="text-purple-700 font-bold">{load.displayPrice}</span>
                </div>

                <ul className="space-y-1.5 text-sm text-gray-700">
                  {load.labour && (
                    <li className="flex gap-2">
                      <span className="text-gray-400">•</span>
                      <span>
                        <span className="text-gray-500">Labour:</span>{" "}
                        <span className="font-medium">{load.labour}</span>
                      </span>
                    </li>
                  )}
                  {load.cubicYards && (
                    <li className="flex gap-2">
                      <span className="text-gray-400">•</span>
                      <span>
                        <span className="text-gray-500">Cubic yards:</span>{" "}
                        <span className="font-medium">{load.cubicYards}</span>
                      </span>
                    </li>
                  )}
                  {load.maxWeight && (
                    <li className="flex gap-2">
                      <span className="text-gray-400">•</span>
                      <span>
                        <span className="text-gray-500">Max weight:</span>{" "}
                        <span className="font-medium">{load.maxWeight}</span>
                      </span>
                    </li>
                  )}
                  {load.equivalent && (
                    <li className="flex gap-2">
                      <span className="text-gray-400">•</span>
                      <span>
                        <span className="text-gray-500">Equivalent to:</span>{" "}
                        <span className="font-medium">{load.equivalent}</span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-700 mb-3">
            Ready to book your waste collection?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book/waste-removal"
              className="text-sm font-semibold text-white bg-purple-700 px-5 py-2.5 rounded-full hover:bg-purple-800 transition-colors"
            >
              Start Waste Removal Booking
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
