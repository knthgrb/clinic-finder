"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/app/loading";
import { Id } from "@/convex/_generated/dataModel";

type ClinicProfile = {
  _id: Id<"clinicProfiles">;
  clinicId: string;
  name: string;
  isAvailable: boolean;
};

type QueueStatus = {
  _id: Id<"queueStatus">;
  clinicId: string;
  estimatedWaitTime: number;
  currentNumber: number;
  nextNumber: number;
  updatedAt: number;
};

type AppointmentWithQueue = {
  _id: Id<"appointments">;
  clinicId: string;
  status: string;
  date: number;
  queuePosition?: number;
  estimatedWaitTime?: number;
};

export default function QueueTracking() {
  const patientAppointments = useQuery(api.appointments.getPatientAppointments);
  const allClinics = useQuery(api.clinics.getAllApprovedClinics);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const queueStatus = useQuery(
    api.queue.getQueueStatus,
    selectedClinicId ? { clinicId: selectedClinicId } : "skip"
  );
  const [appointmentsWithQueue, setAppointmentsWithQueue] = useState<
    AppointmentWithQueue[]
  >([]);

  useEffect(() => {
    if (patientAppointments && allClinics && queueStatus && selectedClinicId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Process appointments to include queue position
      const processedAppointments = patientAppointments
        .filter(
          (app: any) =>
            app.status === "approved" &&
            app.clinicId === selectedClinicId &&
            new Date(app.date).toDateString() === new Date().toDateString()
        )
        .map((app: any) => {
          // Simple algorithm to estimate position:
          // Each 30min time slot gets a position number
          const appointmentDate = new Date(app.date);
          const startTime = new Date(today);
          startTime.setHours(8, 0, 0, 0); // Assuming clinic opens at 8am

          // Calculate minutes since opening
          const minutesSinceOpening =
            (appointmentDate.getTime() - startTime.getTime()) / (1000 * 60);

          // Calculate position (assuming 30min slots)
          const position = Math.floor(minutesSinceOpening / 30) + 1;

          // Calculate estimated wait time based on current queue position
          let estimatedWait = 0;
          if (queueStatus && position > queueStatus.currentNumber) {
            const positionsAhead = position - queueStatus.currentNumber;
            estimatedWait = positionsAhead * queueStatus.estimatedWaitTime;
          }

          return {
            ...app,
            queuePosition: position,
            estimatedWaitTime: estimatedWait,
          };
        });

      setAppointmentsWithQueue(processedAppointments);
    }
  }, [patientAppointments, queueStatus, selectedClinicId, allClinics]);

  if (!patientAppointments || !allClinics) {
    return <Loading />;
  }

  // Get clinics where patient has approved appointments for today
  const getClinicsWithTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!patientAppointments || !allClinics) return [];

    const clinicIds = patientAppointments
      .filter(
        (app: any) =>
          app.status === "approved" &&
          new Date(app.date) >= today &&
          new Date(app.date) < tomorrow
      )
      .map((app: any) => app.clinicId);

    return allClinics
      .filter((clinic: ClinicProfile) => clinicIds.includes(clinic.clinicId))
      .sort((a: ClinicProfile, b: ClinicProfile) =>
        a.name.localeCompare(b.name)
      );
  };

  const clinicsWithAppointments = getClinicsWithTodayAppointments();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    }

    return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Queue Status</h2>

      {clinicsWithAppointments.length > 0 ? (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Clinic
            </label>
            <select
              value={selectedClinicId || ""}
              onChange={(e) => setSelectedClinicId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a clinic</option>
              {clinicsWithAppointments.map((clinic: ClinicProfile) => (
                <option key={clinic.clinicId} value={clinic.clinicId}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClinicId && queueStatus && (
            <div className="bg-white rounded-lg p-6 border mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Current Queue Status
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Current Number</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {queueStatus.currentNumber}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Next Number</div>
                  <div className="text-3xl font-bold text-green-600">
                    {queueStatus.nextNumber}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600">
                    Estimated Wait Time
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatMinutes(queueStatus.estimatedWaitTime)}
                  </div>
                </div>
              </div>

              <div className="text-xs text-right text-gray-500">
                Last updated: {formatTime(queueStatus.updatedAt)}
              </div>
            </div>
          )}

          {selectedClinicId && appointmentsWithQueue.length > 0 ? (
            <div className="bg-white rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">
                Your Appointments Today
              </h3>

              <div className="space-y-4">
                {appointmentsWithQueue.map((app) => (
                  <div
                    key={app._id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          Appointment at {formatTime(app.date)}
                        </p>
                        {app.queuePosition && app.queuePosition > 0 && (
                          <p className="text-sm text-gray-600">
                            Queue Position:{" "}
                            <span className="font-semibold">
                              {app.queuePosition}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        {queueStatus &&
                        app.queuePosition &&
                        app.queuePosition > queueStatus.currentNumber ? (
                          <>
                            <p className="text-sm font-medium">
                              Estimated Wait:
                            </p>
                            <p className="text-lg font-bold text-purple-700">
                              {formatMinutes(app.estimatedWaitTime || 0)}
                            </p>
                          </>
                        ) : queueStatus &&
                          app.queuePosition &&
                          app.queuePosition === queueStatus.currentNumber ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            It's your turn!
                          </span>
                        ) : queueStatus &&
                          app.queuePosition &&
                          app.queuePosition < queueStatus.currentNumber ? (
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                            Appointment passed
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            Waiting for queue update
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedClinicId ? (
            <div className="text-center py-8 bg-gray-50 border rounded-lg">
              <p className="text-gray-500">
                No appointments found for today at this clinic.
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 border rounded-lg">
          <p className="text-gray-600 mb-2">
            You don't have any approved appointments for today.
          </p>
          <p className="text-gray-500 text-sm">
            Book an appointment to track your queue status.
          </p>
        </div>
      )}
    </div>
  );
}
