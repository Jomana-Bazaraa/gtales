import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { listStories } from "@/lib/db";
import { KEEPERS, STRUGGLES } from "@/lib/keepers";

const badge: Record<string, string> = { ready: "bg-teal-soft text-teal-900", generating: "bg-indigo-soft text-indigo", pending: "bg-cream-deep", failed: "bg-coral-soft text-coral-dark" };

export default async function AdminStories() {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const stories = await listStories(300);
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Story orders <span className="text-ink-soft text-base font-normal">({stories.length})</span></h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-deep/60 text-left text-xs uppercase text-ink-soft">
            <tr>
              <th className="p-3">When</th><th className="p-3">Child</th><th className="p-3">Parent</th><th className="p-3">Struggle</th><th className="p-3">Keeper</th><th className="p-3">Lang</th><th className="p-3">Status</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {stories.map((s) => (
              <tr key={s.id} className="border-t border-line align-top">
                <td className="p-3 whitespace-nowrap text-ink-soft">{new Date(s.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" })}</td>
                <td className="p-3 font-semibold">{s.input.childName} <span className="text-ink-soft font-normal">({s.input.age})</span></td>
                <td className="p-3">{s.input.parentName}<br /><a className="text-indigo" href={`mailto:${s.input.parentEmail}`}>{s.input.parentEmail}</a>{s.input.parentPhone && <><br />{s.input.parentPhone}</>}</td>
                <td className="p-3">{STRUGGLES.find((x) => x.id === s.input.struggle)?.label.en}{s.input.struggle === "other" && <span className="ms-1 text-[10px] font-bold uppercase bg-coral-soft text-coral-dark rounded px-1">AI</span>}</td>
                <td className="p-3">{s.keeper_id ? KEEPERS[s.keeper_id].name.en : "—"}</td>
                <td className="p-3 uppercase">{s.input.language}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge[s.status]}`}>{s.status}</span>{s.error && <div className="text-[11px] text-coral-dark max-w-[200px] break-words mt-1">{s.error}</div>}</td>
                <td className="p-3 whitespace-nowrap">{s.status === "ready" && <Link href={`/story/${s.id}`} className="text-coral font-bold" target="_blank">Open ↗</Link>}</td>
              </tr>
            ))}
            {!stories.length && <tr><td className="p-6 text-center text-ink-soft" colSpan={8}>No stories yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
