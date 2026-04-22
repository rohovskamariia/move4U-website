import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-purple-700 mb-4">404</h1>
      <h2 className="text-xl font-bold text-gray-900 mb-3">Page not found</h2>
      <p className="text-gray-500 text-sm mb-8">
        Sorry, we couldn't find the page you were looking for.
      </p>
      <Link
        href="/"
        className="btn-purple inline-block font-semibold px-6 py-3 rounded-xl"
      >
        Back to homepage
      </Link>
    </div>
  );
}
