import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isValidAdminCookie } from "@/lib/admin-auth";
import { getOrder, privatePhotoUrl } from "@/lib/db";
import { egp } from "@/lib/gtales";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/orders";
import { statusMessage, waLink } from "@/lib/whatsapp";
import { baseUrl } from "@/lib/site";

/** Admin order detail: every field from the form, including loved-ones' photos (SPEC §11). */
export default async function AdminSeriesOrder({ params }: PageProps<"/admin/series/[id]">) {
  const store = await cookies();
  if (!isValidAdminCookie(store.get("estoria_admin")?.value)) redirect("/admin/login");
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();
  const photo = async (k?: string) => (k && !o.photos_deleted_at ? await privatePhotoUrl(k) : "");
  const face = await photo(o.photos.face);
  const msg = statusMessage(o, await baseUrl());
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="card p-4 flex flex-col gap-2"><h2 className="font-bold">{title}</h2>{children}</section>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{o.id} · {o.child.name}, {o.child.age}, {o.child.gender}</h1>
        <form action={`/api/admin/series/${o.id}`} method="post" className="flex gap-2 items-center flex-wrap">
          <select name="status" defaultValue={o.status} className="field !w-auto !min-h-10 !py-1">
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}<option value="cancelled">Cancelled</option>
          </select>
          <label className="text-sm font-bold flex items-center gap-1"><input type="checkbox" name="edit_requested" defaultChecked={o.edit_requested} /> edits requested</label>
          <button className="btn-primary !h-10 !px-4 text-sm">Update</button>
        </form>
      </div>
      <div className="card p-4 flex flex-col gap-2 bg-sun-soft">
        <b className="font-bold">WhatsApp message for this status</b>
        <p className="m-0 text-sm whitespace-pre-wrap">{msg}</p>
        <a href={waLink(o.parent.whatsapp, msg)} target="_blank" rel="noreferrer" className="btn-secondary self-start !h-10 !px-4 text-sm">Open in WhatsApp</a>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Section title="The hero">
          <div className="flex gap-3 items-start">
            {face ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={face} alt="Face" className="w-32 h-32 object-cover rounded-xl" /> : <span className="text-ink-soft text-sm">{o.photos_deleted_at ? "Photo deleted after delivery" : "No photo uploaded — ask for one on WhatsApp"}</span>}
            {o.child.description && <p className="m-0 text-sm">{o.child.description}</p>}
          </div>
        </Section>
        <Section title="Good at">{o.strengths.join(", ")}</Section>
        {await Promise.all(o.books.map(async (b, k) => (
          <Section key={k} title={`Book ${k + 1}: ${b.struggle}`}>
            {b.context && <p className="m-0 text-sm"><b>When/where:</b> {b.context}</p>}
            {b.setting && <p className="m-0 text-sm"><b>Special moment:</b> {b.setting}</p>}
            {b.people.length ? <ul className="m-0 ps-5 text-sm">{await Promise.all(b.people.map(async (p, j) => { const u = await photo(p.photo_key); return <li key={j}>{p.name} ({p.who}){p.description ? ` — ${p.description}` : ""}{u && /* eslint-disable-next-line @next/next/no-img-element */ <img src={u} alt="" className="inline-block w-12 h-12 object-cover rounded-lg ml-2 align-middle" />}</li>; }))}</ul> : <span className="text-sm text-ink-soft">No extra characters.</span>}
          </Section>
        )))}
        <Section title="World and words"><p className="m-0 text-sm">{o.world.favourites.join(", ")}{o.world.notes ? ` · ${o.world.notes}` : ""}</p><p className="m-0 text-sm">Parent says: {o.words.parent || "—"} · Child says: {o.words.child || "—"} · Nicknames: {o.words.nicknames || "—"}</p></Section>
        <Section title="Play pages">{o.activities.join(", ") || "Team's choice"}</Section>
        <Section title="Message">{o.dedication || "None"}</Section>
        <Section title="Delivery"><p className="m-0 text-sm">{o.parent.name} · <a className="text-sky" href={`https://wa.me/${o.parent.whatsapp.replace(/^0/, "20")}`}>{o.parent.whatsapp}</a> · best time {o.parent.best_time || "any"}</p><p className="m-0 text-sm">{o.parent.street}, {o.parent.city}, {o.parent.governorate}{o.parent.landmark ? ` (${o.parent.landmark})` : ""}</p><p className="m-0 text-sm">{egp(o.list_price)} − {egp(o.discount)} + {egp(o.delivery)} = <b>{egp(o.total)}</b> {o.promo_code ? `· ${o.promo_code}` : ""}</p></Section>
        <Section title="Notes"><form action={`/api/admin/series/${o.id}`} method="post" className="flex flex-col gap-2"><textarea name="notes" defaultValue={o.notes ?? ""} className="field min-h-20" /><input name="courier_confirmation" defaultValue={o.courier_confirmation ?? ""} placeholder="Courier confirmation / tracking" className="field" /><button className="btn-ghost !h-10 self-start text-sm">Save notes</button></form></Section>
      </div>
    </div>
  );
}
