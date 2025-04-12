"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Loading from "@/app/loading";

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
      // If no user, redirect to signin
      if (!user) {
        router.push("/signin");
        return;
      }

      // Get the user's role
      const role = user.unsafeMetadata.role as "admin" | "clinic" | "patient";

      // First time user, redirect to onboarding
      if (!role) {
        router.push("/onboarding");
        return;
      }

      // If user doesn't exist in Convex, create user record
      if (!convexUser && user.primaryEmailAddress?.emailAddress) {
        try {
          await createUser({
            email: user.primaryEmailAddress.emailAddress,
            role,
            status: role === "clinic" ? "pending" : "approved", // Make clinic pending by default --to be approved by admin acount
          });

          // Replace this window.location.reload() which causes hydration errors
          // with a state-based approach
          router.refresh(); // Use Next.js router refresh instead
          return;
        } catch (error) {
          console.error("Error creating user:", error);
          return;
        }
      }

      // Redirect based on role
      switch (role) {
        case "clinic":
          if (convexUser?.status === "pending") {
            router.push("/pending-approval");
            return;
          }
          if (convexUser?.status === "rejected") {
            router.push("/registration-rejected");
            return;
          }
          if (convexUser?.status === "approved") {
            router.push("/clinic-dashboard");
            return;
          }
          break;
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

  return <Loading />;
}
