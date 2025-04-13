"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Loading from "@/app/loading";
import { useState } from "react";

export default function AdminDashboardClientComponent() {
  const pendingClinics = useQuery(api.users.getPendingClinics);
  const rejectedClinics = useQuery(api.users.getRejectedClinics);
  const approvedClinics = useQuery(api.users.getApprovedClinics);
  const updateStatus = useMutation(api.users.updateClinicStatus);
  const deleteClinic = useMutation(api.users.deleteClinic);
  const { user } = useUser();

  // State for viewing clinic details
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const selectedClinicProfile = useQuery(
    api.clinics.getClinicProfile,
    selectedClinicId ? { clinicId: selectedClinicId } : "skip"
  );

  // Function to view a clinic's details
  const viewClinicDetails = (clinicId: string) => {
    setSelectedClinicId(clinicId);
  };

  // Function to close the details view
  const closeDetails = () => {
    setSelectedClinicId(null);
  };

  if (!pendingClinics || !rejectedClinics || !approvedClinics) {
    return <Loading />;
  }

  const handleStatusUpdate = async (
    userId: string,
    status: "approved" | "rejected" | "pending"
  ) => {
    try {
      await updateStatus({ userId, status });
      // Close details view if open
      if (selectedClinicId === userId) {
        closeDetails();
      }
    } catch (error) {
      console.error("Error updating clinic status:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteClinic({ userId });
      // Close details view if open
      if (selectedClinicId === userId) {
        closeDetails();
      }
    } catch (error) {
      console.error("Error deleting clinic:", error);
    }
  };

  // Clinic details modal component
  const ClinicDetailsModal = () => {
    if (!selectedClinicId || !selectedClinicProfile) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Clinic Registration Details
            </h2>
            <button
              onClick={closeDetails}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Clinic Name
                </h3>
                <p className="text-base">{selectedClinicProfile.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-base">{selectedClinicProfile.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                <p className="text-base">{selectedClinicProfile.phone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                <p className="text-base">{selectedClinicProfile.address}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Opening Hours
                </h3>
                <p className="text-base">
                  {selectedClinicProfile.openingHours || "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Available for Appointments
                </h3>
                <p className="text-base">
                  {selectedClinicProfile.isAvailable ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="text-base">
                {selectedClinicProfile.description || "No description provided"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Specializations
              </h3>
              {selectedClinicProfile.specializations &&
              selectedClinicProfile.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedClinicProfile.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-base">No specializations listed</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => handleStatusUpdate(selectedClinicId, "approved")}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve Clinic
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedClinicId, "rejected")}
                variant="destructive"
              >
                Reject Clinic
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modify the clinic card to include a View Details button
  const renderClinicCard = (
    clinic: any,
    status: "pending" | "approved" | "rejected"
  ) => (
    <div
      key={clinic.userId}
      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{clinic.email}</h3>
          <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {status === "pending"
                ? "Registered: "
                : status === "approved"
                  ? "Approved: "
                  : "Rejected: "}
              {new Date(clinic.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => viewClinicDetails(clinic.userId)}
            variant="outline"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </Button>

          {status === "pending" && (
            <>
              <Button
                onClick={() => handleStatusUpdate(clinic.userId, "approved")}
                className="bg-green-600 hover:bg-green-700"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve
              </Button>
              <Button
                onClick={() => handleStatusUpdate(clinic.userId, "rejected")}
                variant="destructive"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject
              </Button>
            </>
          )}

          {status === "approved" && (
            <Button
              onClick={() => handleStatusUpdate(clinic.userId, "rejected")}
              variant="destructive"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Remove
            </Button>
          )}

          {status === "rejected" && (
            <>
              <Button
                onClick={() => handleStatusUpdate(clinic.userId, "pending")}
                variant="outline"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Restore
              </Button>
              <Button
                onClick={() => handleDelete(clinic.userId)}
                variant="destructive"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {selectedClinicId && <ClinicDetailsModal />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage clinic registrations and approvals
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <SignOutButton signOutOptions={{ redirectUrl: "/signin" }}>
              <Button>Sign Out</Button>
            </SignOutButton>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Pending Clinic Approvals
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingClinics.length} Pending
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            {pendingClinics.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-4 text-gray-500">
                  No pending clinic approvals
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingClinics.map((clinic: any) =>
                  renderClinicCard(clinic, "pending")
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Approved Clinics
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {approvedClinics.length} Approved
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            {approvedClinics.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-4 text-gray-500">No approved clinics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedClinics.map((clinic: any) =>
                  renderClinicCard(clinic, "approved")
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Rejected Clinics
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {rejectedClinics.length} Rejected
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            {rejectedClinics.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-4 text-gray-500">No rejected clinics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rejectedClinics.map((clinic: any) =>
                  renderClinicCard(clinic, "rejected")
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
