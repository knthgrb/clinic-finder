"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/app/loading";
import ClinicSidebar from "./_components/ClinicSidebar";
import ClinicHeader from "./_components/ClinicHeader";

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const clinicProfile = useQuery(api.clinics.getClinicProfile, {
    clinicId: user?.id || "",
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user || !clinicProfile) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ClinicSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClinicHeader toggleMobileMenu={toggleMobileMenu} />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="rounded-lg bg-white h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
