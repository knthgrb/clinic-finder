"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/app/loading";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingClientComponent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState<"clinic" | "patient">("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClinicForm, setShowClinicForm] = useState(false);
  const [clinicProfile, setClinicProfile] = useState({
    name: "",
    address: "",
    phone: "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    description: "",
    specializations: [] as string[],
    isAvailable: true,
    availabilityNote: "",
    openingHours: "",
  });
  const [newSpecialization, setNewSpecialization] = useState("");

  // Convex
  const createUser = useMutation(api.users.createUser);
  const createInitialClinicProfile = useMutation(
    api.clinics.createInitialClinicProfile
  );
  const checkNameUnique = useQuery(
    api.clinics.isClinicNameUnique,
    role === "clinic" ? { name: clinicProfile.name } : "skip"
  );

  const handleRoleSelection = () => {
    if (role === "clinic") {
      setShowClinicForm(true);
    } else {
      handleOnboarding();
    }
  };

  const addSpecialization = () => {
    if (
      newSpecialization.trim() &&
      !clinicProfile.specializations.includes(newSpecialization.trim())
    ) {
      setClinicProfile((prev) => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()],
      }));
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (index: number) => {
    setClinicProfile((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setClinicProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setClinicProfile((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleOnboarding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);

    try {
      // For clinic role, check if the name is unique before creating anything
      if (role === "clinic") {
        // Check if name is unique
        if (checkNameUnique === false) {
          toast({
            variant: "destructive",
            title: "Registration failed",
            description:
              "Clinic name already exists. Please choose a different name.",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Update Clerk metadata
      await user?.update({
        unsafeMetadata: {
          role,
          status: role === "clinic" ? "pending" : "approved",
        },
      });

      // Create user in Convex
      await createUser({
        email: user?.primaryEmailAddress?.emailAddress || "",
        role,
        status: role === "clinic" ? "pending" : "approved",
      });

      // If clinic role, create clinic profile
      if (role === "clinic") {
        try {
          await createInitialClinicProfile({
            name: clinicProfile.name,
            address: clinicProfile.address,
            phone: clinicProfile.phone,
            email: clinicProfile.email,
            description: clinicProfile.description,
            specializations: clinicProfile.specializations,
            isAvailable: clinicProfile.isAvailable,
            availabilityNote: clinicProfile.availabilityNote,
            openingHours: clinicProfile.openingHours,
          });
        } catch (error: any) {
          console.error("Failed to create clinic profile:", error);
          // This shouldn't happen because we already checked name uniqueness
          toast({
            variant: "destructive",
            title: "Registration failed",
            description: error.message || "Failed to create clinic profile",
          });
          setIsSubmitting(false);
          return; // Stop execution to prevent redirection
        }
      }

      // Redirect based on role
      router.push(
        role === "clinic"
          ? "/pending-approval"
          : role === "patient"
            ? "/patient-dashboard"
            : role === "admin"
              ? "/admin-dashboard"
              : "/signin"
      );
    } catch (error: any) {
      console.error("Error during onboarding:", error);
      toast({
        variant: "destructive",
        title: "Registration error",
        description: error.message || "An error occurred during registration",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return <Loading />;

  if (showClinicForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Clinic Registration</h1>
          <p className="mb-4 text-gray-600">
            Please provide your clinic information to complete registration
          </p>

          <form onSubmit={handleOnboarding} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={clinicProfile.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={clinicProfile.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={clinicProfile.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={clinicProfile.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={clinicProfile.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                name="openingHours"
                value={clinicProfile.openingHours}
                onChange={handleChange}
                placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-2pm"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specializations
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {clinicProfile.specializations.map((spec, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  placeholder="Add specialization"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md"
                />
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={clinicProfile.isAvailable}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isAvailable"
                className="ml-2 block text-sm text-gray-900"
              >
                Clinic is currently available for appointments
              </label>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setShowClinicForm(false)}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Complete Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Select Your Role</h1>
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="patient"
              name="role"
              value="patient"
              checked={role === "patient"}
              onChange={(e) => setRole(e.target.value as "patient" | "clinic")}
              className="h-4 w-4"
            />
            <label htmlFor="patient">I am a Patient</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="clinic"
              name="role"
              value="clinic"
              checked={role === "clinic"}
              onChange={(e) => setRole(e.target.value as "patient" | "clinic")}
              className="h-4 w-4"
            />
            <label htmlFor="clinic">I am a Clinic</label>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRoleSelection}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
