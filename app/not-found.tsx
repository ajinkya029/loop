import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-500">404</p>
        <p className="text-gray-600 mt-2">This page doesn't exist.</p>
        <Link href="/dashboard" className="btn-primary inline-flex mt-4">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
