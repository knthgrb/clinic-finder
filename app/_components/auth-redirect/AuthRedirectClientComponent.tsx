"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AuthRedirectClientComponent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const createUser = useMutation(api.users.createUser);
  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { userId: user.id } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || convexUser === undefined) return;

    const checkUserAndRedirect = async () => {
      if (!user) {
        router.push("/signin");
        return;
      }

      const role = user.unsafeMetadata.role as string | undefined;

      if (!role) {
        // First time user, redirect to onboarding
        router.push("/onboarding");
        return;
      }

      // If user doesn't exist in Convex, create them
      if (!convexUser && user.primaryEmailAddress?.emailAddress) {
        try {
          const newUser = await createUser({
            email: user.primaryEmailAddress.emailAddress,
            role: role as "admin" | "clinic" | "patient",
            status: role === "clinic" ? "pending" : "approved",
          });

          // Wait a moment for the mutation to be reflected in the database
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Refresh to get the new user data
          window.location.reload();
          return;
        } catch (error) {
          console.error("Error creating user:", error);
          return;
        }
      }

      // Handle clinic status redirects
      if (role === "clinic") {
        if (!convexUser?.status || convexUser.status === "pending") {
          router.push("/pending-approval");
          return;
        }
        if (convexUser.status === "rejected") {
          router.push("/registration-rejected");
          return;
        }
        if (convexUser.status === "approved") {
          router.push("/clinic-dashboard");
          return;
        }
      }

      // Redirect based on role for non-clinic users
      switch (role) {
        case "admin":
          router.push("/admin-dashboard");
          break;
        case "patient":
          router.push("/patient-dashboard");
          break;
        default:
          router.push("/onboarding");
      }
    };

    checkUserAndRedirect();
  }, [isLoaded, user, router, convexUser, createUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
