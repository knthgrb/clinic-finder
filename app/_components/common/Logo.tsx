import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center">
      <svg
        className="h-8 w-8 text-primary mr-2"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
      </svg>
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent tracking-tight">
        Clinic Finder
      </h1>
    </div>
  );
}
