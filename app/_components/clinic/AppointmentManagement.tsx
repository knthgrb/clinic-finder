"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Loading from "@/app/loading";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";

type Appointment = {
  _id: Id<"appointments">;
  patientId: string;
  clinicId: string;
  doctorId?: string;
  status: "pending" | "approved" | "declined" | "completed" | "canceled";
  date: number;
  reason?: string;
  notes?: string;
  patientName?: string;
  patientEmail?: string;
};

export default function AppointmentManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [notesInput, setNotesInput] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const pendingAppointments = useQuery(
    api.appointments.getClinicAppointmentsByStatus,
    {
      status: "pending",
    }
  );
  const approvedAppointments = useQuery(
    api.appointments.getClinicAppointmentsByStatus,
    {
      status: "approved",
    }
  );
  const declinedAppointments = useQuery(
    api.appointments.getClinicAppointmentsByStatus,
    {
      status: "declined",
    }
  );
  const completedAppointments = useQuery(
    api.appointments.getClinicAppointmentsByStatus,
    {
      status: "completed",
    }
  );
  const patientProfiles = useQuery(api.users.getPatientProfiles);

  const updateAppointment = useMutation(
    api.appointments.updateAppointmentStatus
  );

  if (
    pendingAppointments === undefined ||
    approvedAppointments === undefined ||
    declinedAppointments === undefined ||
    completedAppointments === undefined ||
    patientProfiles === undefined
  ) {
    return <Loading />;
  }

  const getPatientDetails = (patientId: string) => {
    if (!patientProfiles) return { name: "Patient", email: "" };

    // Find the patient with matching userId
    const patient = patientProfiles.find((p) => p.userId === patientId);

    return {
      name: patient?.email?.split("@")[0] || "Patient", // Use email username as name if no name field
      email: patient?.email || "",
    };
  };

  const handleNotesChange = (appointmentId: string, notes: string) => {
    setNotesInput({
      ...notesInput,
      [appointmentId]: notes,
    });
  };

  const handleStatusUpdate = async (
    appointmentId: Id<"appointments">,
    status: "approved" | "declined" | "completed" | "canceled"
  ) => {
    try {
      await updateAppointment({
        appointmentId,
        status,
        notes: notesInput[appointmentId as unknown as string],
      });

      // Clear notes input after update
      const newNotesInput = { ...notesInput };
      delete newNotesInput[appointmentId as unknown as string];
      setNotesInput(newNotesInput);

      toast({
        variant: "default",
        title: "Update successful",
        description: "Appointment status updated successfully!",
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update appointment status",
      });
    }
  };

  const renderAppointmentList = (appointments: Appointment[]) => {
    if (appointments.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No {activeTab} appointments</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {appointments.map((appointment) => {
          const { name: patientName, email: patientEmail } = getPatientDetails(
            appointment.patientId
          );
          const formattedDate = new Date(appointment.date).toLocaleString();

          return (
            <div
              key={appointment._id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{patientName}</h3>
                  <p className="text-sm text-gray-600">{patientEmail}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Date:</span> {formattedDate}
                  </p>
                  {appointment.reason && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-gray-700">
                        {appointment.reason}
                      </p>
                    </div>
                  )}
                  {appointment.notes && (
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                      <p className="text-sm font-medium">Notes:</p>
                      <p className="text-sm text-gray-700">
                        {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {activeTab === "pending" && (
                    <>
                      <Button
                        onClick={() =>
                          handleStatusUpdate(
                            appointment._id as Id<"appointments">,
                            "approved"
                          )
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() =>
                          handleStatusUpdate(
                            appointment._id as Id<"appointments">,
                            "declined"
                          )
                        }
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Decline
                      </Button>
                    </>
                  )}

                  {activeTab === "approved" && (
                    <Button
                      onClick={() =>
                        handleStatusUpdate(
                          appointment._id as Id<"appointments">,
                          "completed"
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Mark Completed
                    </Button>
                  )}

                  {(activeTab === "pending" || activeTab === "approved") && (
                    <div className="mt-2">
                      <textarea
                        placeholder="Add notes..."
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                        rows={2}
                        value={
                          notesInput[appointment._id as unknown as string] || ""
                        }
                        onChange={(e) =>
                          handleNotesChange(
                            appointment._id as unknown as string,
                            e.target.value
                          )
                        }
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Appointment Management</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingAppointments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            {approvedAppointments.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                {approvedAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedAppointments.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                {completedAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined
            {declinedAppointments.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">
                {declinedAppointments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {renderAppointmentList(pendingAppointments)}
        </TabsContent>

        <TabsContent value="approved">
          {renderAppointmentList(approvedAppointments)}
        </TabsContent>

        <TabsContent value="completed">
          {renderAppointmentList(completedAppointments)}
        </TabsContent>

        <TabsContent value="declined">
          {renderAppointmentList(declinedAppointments)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
