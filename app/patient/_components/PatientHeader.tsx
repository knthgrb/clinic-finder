"use client";

import React from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";

interface PatientHeaderProps {
  toggleMobileMenu: () => void;
}

export default function PatientHeader({
  toggleMobileMenu,
}: PatientHeaderProps) {
  const { user } = useUser();

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
          <h1 className="text-xl font-bold truncate">
            {user?.firstName
              ? `${user.firstName} ${user.lastName || ""}`
              : "Patient Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <SignOutButton signOutOptions={{ redirectUrl: "/" }} />
        </div>
      </div>
    </header>
  );
}
