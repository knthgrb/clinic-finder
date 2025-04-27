import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PatientPage() {
  const user = await currentUser();
  const role = user?.unsafeMetadata.role as "admin" | "clinic" | "patient";
  if (role !== "patient") {
    return redirect("/unauthorized");
  }
  redirect("/patient/search-for-clinics");
}
