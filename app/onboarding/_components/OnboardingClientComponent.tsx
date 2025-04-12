"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/app/loading";

export default function OnboardingClientComponent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<"clinic" | "patient">("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convex
  const createUser = useMutation(api.users.createUser);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);

    try {
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
    } catch (error) {
      console.error("Error updating user metadata:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return <Loading />;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Select Your Role</h1>
        <form onSubmit={handleOnboarding}>
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="patient"
                name="role"
                value="patient"
                checked={role === "patient"}
                onChange={(e) =>
                  setRole(e.target.value as "patient" | "clinic")
                }
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
                onChange={(e) =>
                  setRole(e.target.value as "patient" | "clinic")
                }
                className="h-4 w-4"
              />
              <label htmlFor="clinic">I am a Clinic</label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
