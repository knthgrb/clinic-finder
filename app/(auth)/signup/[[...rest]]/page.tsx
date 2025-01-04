"use client";

import { SignUp } from "@clerk/nextjs";
import React from "react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white p-8 rounded-lg shadow-md",
          },
        }}
        signInUrl="/signin"
        afterSignUpUrl="/auth-redirect"
      />
    </div>
  );
}
