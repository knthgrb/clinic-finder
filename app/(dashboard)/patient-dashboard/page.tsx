import { SignOutButton } from "@clerk/nextjs";
import React from "react";

export default function PatientDashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-6">Patient Dashboard</h1>
        <SignOutButton signOutOptions={{ redirectUrl: "/signin" }} />
      </div>
    </div>
  );
}
