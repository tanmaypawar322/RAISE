import React from 'react';
import Link from 'next/link';
import { appUrl } from '../lib/app-url';
import { ArrowLeft, Shield } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white font-black text-3xl flex items-center justify-center mb-6 shadow-md">
        R
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
        Page Not Found (404)
      </h1>
      <p className="text-sm text-gray-600 max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/en"
          className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
        <a
          href={appUrl('/sign-in', 'en')}
          className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition"
        >
          Open Citizen App
        </a>
      </div>
    </div>
  );
}
