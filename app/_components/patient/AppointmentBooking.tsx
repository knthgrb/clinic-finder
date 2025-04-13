"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import Loading from "@/app/loading";
import { useSearchParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";

type AppointmentType = {
  _id: Id<"appointments">;
  patientId: string;
  clinicId: string;
  doctorId?: string;
  status: "pending" | "approved" | "declined" | "completed" | "canceled";
  date: number;
  reason?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

type ClinicProfile = {
  _id: string;
  clinicId: string;
  name: string;
  specializations: string[];
  isAvailable: boolean;
};

type Doctor = {
  _id: string;
  name: string;
  specializations: string[];
};

export default function AppointmentBooking() {
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const preselectedClinicId = searchParams.get("clinicId");

  const patientAppointments = useQuery(api.appointments.getPatientAppointments);
  const allClinics = useQuery(api.clinics.getAllApprovedClinics);
  const bookAppointment = useMutation(api.appointments.bookAppointment);
  const cancelAppointment = useMutation(api.appointments.cancelAppointment);

  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(
    preselectedClinicId
  );
  const doctorsData = useQuery(
    api.clinics.getDoctors,
    selectedClinicId ? { clinicId: selectedClinicId } : "skip"
  );
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [appointmentReason, setAppointmentReason] = useState<string>("");
  const [showForm, setShowForm] = useState<boolean>(!!preselectedClinicId);

  // Update doctors when doctorsData changes
  useEffect(() => {
    if (doctorsData) {
      setDoctors(doctorsData);
    } else {
      setDoctors([]);
    }
  }, [doctorsData]);

  // Reset selected doctor when clinic changes
  useEffect(() => {
    if (!selectedClinicId) {
      setSelectedDoctorId(null);
    }
  }, [selectedClinicId]);

  // Preselect clinic from query params
  useEffect(() => {
    if (preselectedClinicId) {
      setSelectedClinicId(preselectedClinicId);
      setShowForm(true);
    }
  }, [preselectedClinicId]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClinicId || !appointmentDate) {
      toast({
        variant: "destructive",
        title: "Please fill all required fields",
      });
      return;
    }

    try {
      await bookAppointment({
        clinicId: selectedClinicId,
        doctorId: selectedDoctorId || undefined,
        date: new Date(appointmentDate).getTime(),
        reason: appointmentReason || undefined,
      });
      toast({
        variant: "default",
        title: "Appointment booked successfully!",
      });

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        variant: "destructive",
        title: "Appointment booking failed",
        description: "Failed to book appointment. Please try again.",
      });
    }
  };

  const handleCancelAppointment = async (appointmentId: Id<"appointments">) => {
    try {
      await cancelAppointment({ appointmentId });
      toast({
        variant: "default",
        title: "Appointment canceled successfully",
      });
    } catch (error) {
      console.error("Error canceling appointment:", error);
      toast({
        variant: "destructive",
        title: "Failed to cancel appointment",
      });
    }
  };

  const resetForm = () => {
    setSelectedClinicId(null);
    setSelectedDoctorId(null);
    setAppointmentDate("");
    setAppointmentReason("");
  };

  if (!user || patientAppointments === undefined || allClinics === undefined) {
    return <Loading />;
  }

  const getClinicName = (clinicId: string) => {
    const clinic = allClinics.find(
      (c: ClinicProfile) => c.clinicId === clinicId
    );
    return clinic ? clinic.name : "Unknown Clinic";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">My Appointments</h2>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) resetForm();
          }}
        >
          {showForm ? "Cancel" : "Book New Appointment"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Book New Appointment</h3>
          <form onSubmit={handleBookAppointment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic *
              </label>
              <select
                value={selectedClinicId || ""}
                onChange={(e) => setSelectedClinicId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a clinic</option>
                {allClinics.map((clinic: ClinicProfile) => (
                  <option
                    key={clinic.clinicId}
                    value={clinic.clinicId}
                    disabled={!clinic.isAvailable}
                  >
                    {clinic.name} {!clinic.isAvailable && "(Unavailable)"}
                  </option>
                ))}
              </select>
            </div>

            {doctors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor (Optional)
                </label>
                <select
                  value={selectedDoctorId || ""}
                  onChange={(e) => setSelectedDoctorId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Any available doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} ({doctor.specializations.join(", ")})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date and Time *
              </label>
              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit
              </label>
              <textarea
                value={appointmentReason}
                onChange={(e) => setAppointmentReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div>
              <Button type="submit" className="w-full md:w-auto">
                Book Appointment
              </Button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-4">Upcoming Appointments</h3>
        {patientAppointments && patientAppointments.length > 0 ? (
          <div className="space-y-4">
            {patientAppointments
              .filter(
                (app: AppointmentType) =>
                  ["pending", "approved"].includes(app.status) &&
                  new Date(app.date).getTime() > Date.now()
              )
              .sort((a: AppointmentType, b: AppointmentType) => a.date - b.date)
              .map((appointment: AppointmentType) => (
                <div key={appointment._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {getClinicName(appointment.clinicId)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(appointment.date)}
                      </p>
                      {appointment.reason && (
                        <p className="text-sm mt-2">{appointment.reason}</p>
                      )}
                      {appointment.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Notes:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.status)}`}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>

                      {appointment.status !== "canceled" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleCancelAppointment(appointment._id)
                          }
                          className="mt-2"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No upcoming appointments
          </p>
        )}

        <h3 className="text-lg font-medium mb-4 mt-8">Past Appointments</h3>
        {patientAppointments && patientAppointments.length > 0 ? (
          <div className="space-y-4">
            {patientAppointments
              .filter(
                (app: AppointmentType) =>
                  app.status === "completed" ||
                  app.status === "declined" ||
                  app.status === "canceled" ||
                  new Date(app.date).getTime() <= Date.now()
              )
              .sort((a: AppointmentType, b: AppointmentType) => b.date - a.date)
              .map((appointment: AppointmentType) => (
                <div key={appointment._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {getClinicName(appointment.clinicId)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(appointment.date)}
                      </p>
                      {appointment.reason && (
                        <p className="text-sm mt-2">{appointment.reason}</p>
                      )}
                      {appointment.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Notes:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(appointment.status)}`}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No past appointments</p>
        )}
      </div>
    </div>
  );
}
