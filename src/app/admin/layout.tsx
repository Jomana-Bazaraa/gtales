import Link from "next/link";
import { cookies } from "next/headers";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { Logo } from "@/components/SiteChrome";
import { isMockDb } from "@/lib/db";
import { isMockEmail } from "@/lib/email";
import { countPending } from "@/lib/reviews";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const store = await cookies();
  const ok = isValidAdminCookie(store.get("estoria_admin")?.value);
  if (!ok) {
    // login page renders without the chrome
    return <div className="flex-1" dir="ltr">{children}</div>;
  }
  const pending = await countPending().catch(() => 0);
  return (
    <div className="flex-1 flex flex-col" dir="ltr">
      <header className="border-b border-line bg-white">
        {/* phones: the menu wraps under the logo instead of widening the page */}
        <div className="mx-auto max-w-6xl px-4 py-2 min-h-14 flex flex-wrap items-center gap-x-5 gap-y-1">
          <Logo className="!text-lg" />
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Admin</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold md:ms-auto">
            <Link href="/admin" className="hover:text-coral whitespace-nowrap">Free stories</Link>
            <Link href="/admin/series" className="hover:text-coral whitespace-nowrap">Series orders</Link>
            <Link href="/admin/reviews" className="hover:text-coral">Reviews{pending > 0 && <span className="ms-1 rounded-full bg-flame text-white text-[11px] px-1.5">{pending}</span>}</Link>
            <Link href="/admin/dashboard" className="hover:text-coral">Dashboard</Link>
            <Link href="/admin/settings" className="hover:text-coral">Settings</Link>
            <form action="/api/admin/logout" method="post">
              <button className="text-ink-soft hover:text-coral whitespace-nowrap">Log out</button>
            </form>
          </nav>
        </div>
        {(isMockDb || isMockEmail) && (
          <div className="bg-coral-soft text-coral-dark text-xs text-center py-1">
            Mock mode: {[isMockDb && "Supabase", isMockEmail && "Resend"].filter(Boolean).join(" · ")} not configured — see .env.example
          </div>
        )}
      </header>
      <main className="flex-1 mx-auto max-w-6xl px-4 py-6 w-full">{children}</main>
    </div>
  );
}
