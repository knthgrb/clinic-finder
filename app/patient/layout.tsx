"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";
import PatientSidebar from "./_components/PatientSidebar";
import PatientHeader from "./_components/PatientHeader";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <PatientSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <PatientHeader toggleMobileMenu={toggleMobileMenu} />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="rounded-lg bg-white h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
