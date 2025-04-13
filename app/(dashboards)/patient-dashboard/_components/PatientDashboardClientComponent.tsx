"use client";

import React, { useState, useEffect } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loading from "@/app/loading";
import ClinicSearch from "@/app/_components/patient/ClinicSearch";
import AppointmentBooking from "@/app/_components/patient/AppointmentBooking";
import QueueTracking from "@/app/_components/patient/QueueTracking";
import PatientChat from "@/app/_components/patient/PatientChat";
import { useSearchParams } from "next/navigation";
import Logo from "@/app/_components/common/Logo";

export default function PatientDashboardClientComponent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "search");
  const unreadCount = useQuery(api.messages.getUnreadMessageCount);

  // Update active tab when URL parameters change
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Logo />
        <SignOutButton signOutOptions={{ redirectUrl: "/signin" }} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="search">Find Clinics</TabsTrigger>
          <TabsTrigger value="appointments">My Appointments</TabsTrigger>
          <TabsTrigger value="queue">Queue Status</TabsTrigger>
          <TabsTrigger value="messages" className="relative">
            Messages
            {unreadCount
              ? unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )
              : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="border rounded-lg p-6">
          <ClinicSearch />
        </TabsContent>

        <TabsContent value="appointments" className="border rounded-lg p-6">
          <AppointmentBooking />
        </TabsContent>

        <TabsContent value="queue" className="border rounded-lg p-6">
          <QueueTracking />
        </TabsContent>

        <TabsContent value="messages" className="border rounded-lg p-6">
          <PatientChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}
