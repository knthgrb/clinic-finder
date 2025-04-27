import Link from "next/link";
import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center">
      <svg
        className="h-8 w-8 mr-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="url(#lifeGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient id="lifeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
      </svg>
      <Link
        href="/"
        className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent tracking-tight"
      >
        Clinic Finder
      </Link>
    </div>
  );
}
