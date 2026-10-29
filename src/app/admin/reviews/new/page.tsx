import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { ReviewForm } from "@/components/reviews/ReviewForm";

/** Admin adds a review by hand (source = admin), e.g. one a parent sent on WhatsApp with permission. */
export default async function AdminNewReview() {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  return (
    <div className="max-w-xl flex flex-col gap-4">
      <Link href="/admin/reviews" className="text-sm font-bold text-sky">← Reviews</Link>
      <h1 className="text-2xl font-bold">Add a review</h1>
      <p className="m-0 text-ink-soft text-sm">Only add a review the parent sent you and agreed to share. Keep their written agreement (e.g. the WhatsApp message).</p>
      <ReviewForm mode="admin" />
    </div>
  );
}
