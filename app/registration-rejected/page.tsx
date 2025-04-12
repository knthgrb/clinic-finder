"use client";

import { SignOutButton } from "@clerk/nextjs";
import React from "react";

export default function RegistrationRejectedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Registration Rejected
          </h2>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              We regret to inform you that your clinic registration has been
              rejected.
            </p>
            <p className="text-sm text-gray-600">
              If you believe this is a mistake or would like to appeal this
              decision, please contact our support team.
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Email:{" "}
              <a
                href="mailto:djyknn@gmail.com"
                className="text-blue-600 hover:underline"
              >
                support@clinicfinder.com
              </a>
            </p>
          </div>
        </div>
        <div className="mt-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  What happens next?
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You can sign out and create a new application</li>
                    <li>Contact support for more information</li>
                    <li>Appeal the decision with additional documentation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <SignOutButton signOutOptions={{ redirectUrl: "/signin" }} />
        </div>
      </div>
    </div>
  );
}
