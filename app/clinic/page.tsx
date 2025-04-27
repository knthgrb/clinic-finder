import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ClinicPage() {
  const user = await currentUser();
  const role = user?.unsafeMetadata.role as "admin" | "clinic" | "patient";
  if (role !== "clinic") {
    return redirect("/unauthorized");
  }
  redirect("/clinic/appointments");
}
