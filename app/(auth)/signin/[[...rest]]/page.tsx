"use client";

import { SignIn } from "@clerk/nextjs";
import React from "react";
import Logo from "@/components/common/Logo";

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="mb-8">
          <Logo />
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-primary-foreground",
              rootBox: "mx-auto",
              card: "bg-white p-8 rounded-lg shadow-md",
            },
          }}
          signUpUrl="/signup"
          afterSignInUrl="/"
        />
      </div>
    </div>
  );
}
