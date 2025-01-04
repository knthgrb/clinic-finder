import React from "react";
import { SignOutButton } from "@clerk/nextjs";

export default function ClinicDashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-6">Clinic Dashboard</h1>
        <SignOutButton signOutOptions={{ redirectUrl: "/signin" }} />
      </div>
    </div>
  );
}
