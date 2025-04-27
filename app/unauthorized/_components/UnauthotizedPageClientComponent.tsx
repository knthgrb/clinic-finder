"use client";

import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function UnauthorizedClientComponent() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page. This area requires
            different permissions than your current account has.
          </p>
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
                  Unauthorized Access
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Your current role doesn't grant you access to this resource.
                    Please return to the homepage or dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col space-y-4">
          <Button onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
          <SignOutButton signOutOptions={{ redirectUrl: "/signin" }}>
            <Button variant="outline" className="w-full">
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
