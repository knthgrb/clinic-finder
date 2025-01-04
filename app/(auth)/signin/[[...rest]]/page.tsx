"use client";

import { SignIn } from "@clerk/nextjs";
import React from "react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white p-8 rounded-lg shadow-md",
          },
        }}
        signUpUrl="/signup"
        afterSignInUrl="/auth-redirect"
      />
    </div>
  );
}
