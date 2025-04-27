import React from "react";
import AdminPageClientComponent from "./_components/AdminPageClientComponent";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const user = await currentUser();
  const role = user?.unsafeMetadata.role as "admin" | "clinic" | "patient";

  if (role !== "admin") {
    return redirect("/unauthorized");
  }
  return <AdminPageClientComponent />;
}
