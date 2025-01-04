"use client";

import { SignOutButton } from "@clerk/nextjs";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Registration Pending
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your clinic registration is currently under review. We will notify
            you once it has been approved.
          </p>
        </div>
        <div className="mt-8">
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Pending Approval
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Our admin team will review your registration shortly. You
                    will be notified via email once a decision has been made.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <SignOutButton signOutOptions={{ redirectUrl: "/signin" }}>
            Sign Out
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
