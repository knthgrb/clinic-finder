"use client";

import React from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Menu } from "lucide-react";

interface ClinicHeaderProps {
  toggleMobileMenu: () => void;
}

export default function ClinicHeader({ toggleMobileMenu }: ClinicHeaderProps) {
  const { user } = useUser();
  const clinicProfile = useQuery(api.clinics.getClinicProfile, {
    clinicId: user?.id || "",
  });

  return (
    <header className="bg-white border-b border-gray-200 h-14">
      <div className="px-4 md:px-6 h-full flex justify-between items-center">
        {/* Mobile menu and name */}
        <div className="flex items-center gap-2">
          <button
            className="md:hidden text-gray-600"
            onClick={toggleMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold truncate">{clinicProfile?.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">
              {clinicProfile?.isAvailable ? (
                <span className="text-green-600">Available</span>
              ) : (
                <span className="text-red-600">Unavailable</span>
              )}
            </span>
          </div>
          <SignOutButton signOutOptions={{ redirectUrl: "/" }} />
        </div>
      </div>
    </header>
  );
}
