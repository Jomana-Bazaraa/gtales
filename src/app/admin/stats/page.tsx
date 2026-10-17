import { redirect } from "next/navigation";

/** Stats moved into the Dashboard (LAUNCH-PLAN §1b). */
export default function AdminStats() {
  redirect("/admin/dashboard");
}
