import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import minLoad from "@assets/IMG_3398_1776508670556.jpeg";
import quarterLoad from "@assets/IMG_3399_1776508670556.jpeg";
import thirdLoad from "@assets/IMG_3400_1776508670556.jpeg";
import halfLoad from "@assets/IMG_3401_1776508670556.jpeg";
import threeQuarterLoad from "@assets/IMG_3402_1776508670556.jpeg";
import fullLoad from "@assets/IMG_3403_1776508670556.jpeg";

interface LoadInfo {
  title: string;
  description: string;
  image: string;
}

const LOADS: LoadInfo[] = [
  {
    title: "Minimum Load",
    description: "Ideal for small clear-outs or a few items. Up to approx. 8 bin bags.",
    image: minLoad,
  },
  {
    title: "1/4 Load",
    description: "Suitable for light waste or small furniture. Around 20 bin bags.",
    image: quarterLoad,
  },
  {
    title: "1/3 Load",
    description: "Good for medium clear-outs. Around 30 bin bags.",
    image: thirdLoad,
  },
  {
    title: "1/2 Load",
    description: "Suitable for larger waste or furniture. Around 40 bin bags.",
    image: halfLoad,
  },
  {
    title: "3/4 Load",
    description: "For heavy loads and larger jobs. Around 60 bin bags.",
    image: threeQuarterLoad,
  },
  {
    title: "Full Load",
    description: "Full van load for major clearances or bulky waste.",
    image: fullLoad,
  },
  {
    title: "Extra Large Load",
    description: "For very large jobs. Multiple loads available on request.",
    image: fullLoad,
  },
];

export default function WasteGuidePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/"
          className="text-sm text-purple-700 hover:underline mb-6 inline-block"
          data-testid="back-home-waste-guide"
        >
          &larr; Back to home
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Waste Removal Size Guide
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Use this guide to estimate your load size before booking. Not sure?
            Pick the closest match — our team will confirm pricing before the job starts.
          </p>
        </div>

        {/* Per-load breakdown with uniform image frames */}
        <div className="space-y-4 mb-10">
          {LOADS.map((load, i) => (
            <div
              key={load.title}
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm"
              data-testid={`waste-load-card-${i}`}
            >
              {/* Uniform image frame — same canvas, identical padding, vans baseline-aligned */}
              <div className="bg-white border-b border-gray-100 aspect-[12/5] flex items-end justify-center px-6 pt-6 pb-4">
                <img
                  src={load.image}
                  alt={`${load.title} visual`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 text-purple-700 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                      {load.title}
                    </h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {load.description}
                    </p>
                  </div>
                </div>
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
