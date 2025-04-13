"use client";

import React, { useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/app/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentManagement from "@/app/_components/clinic/AppointmentManagement";
import QueueManagement from "@/app/_components/clinic/QueueManagement";
import ClinicProfile from "@/app/_components/clinic/ClinicProfile";
import DoctorManagement from "@/app/_components/clinic/DoctorManagement";
import MessagingCenter from "@/app/_components/clinic/MessagingCenter";

export default function ClinicDashboardClientComponent() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("appointments");
  const clinicProfile = useQuery(api.clinics.getClinicProfile, {
    clinicId: user?.id || "",
  });
  const unreadCount = useQuery(api.messages.getUnreadMessageCount);

  if (!user) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clinic Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">
              {clinicProfile?.isAvailable ? (
                <span className="text-green-600">Available</span>
              ) : (
                <span className="text-red-600">Unavailable</span>
              )}
            </span>
          </div>
          <SignOutButton signOutOptions={{ redirectUrl: "/signin" }} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
          <TabsTrigger value="profile">Clinic Profile</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="messages" className="relative">
            Messages
            {unreadCount ? (
              unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              ) : null
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="border rounded-lg p-6">
          <AppointmentManagement />
        </TabsContent>

        <TabsContent value="queue" className="border rounded-lg p-6">
          <QueueManagement />
        </TabsContent>

        <TabsContent value="profile" className="border rounded-lg p-6">
          <ClinicProfile />
        </TabsContent>

        <TabsContent value="doctors" className="border rounded-lg p-6">
          <DoctorManagement />
        </TabsContent>

        <TabsContent value="messages" className="border rounded-lg p-6">
          <MessagingCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
