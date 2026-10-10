import Link from "next/link";
import { Footer, Header } from "@/components/SiteChrome";
import { MyStoriesForm } from "@/components/MyStoriesForm";
import { Icon } from "@/components/ui/Icon";
import { listBooks, ordersByWhatsapp } from "@/lib/db";
import { egp } from "@/lib/gtales";
import { STATUS_LABEL, STATUS_NEXT, STATUS_ORDER } from "@/lib/orders";
import { getSession } from "@/lib/session";
import { storyImage } from "@/stories/images";
import type { OrderRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

/** My stories (SPEC §10): saved hero, order tracker, free stories. */
export default async function MyStoriesPage({ searchParams }: PageProps<"/my-stories">) {
  const sp = await searchParams;
  const session = await getSession();
  if (!session) {
    return (<><Header /><main className="flex-1 mx-auto max-w-lg px-4 py-10 w-full"><MyStoriesForm initialOrder={typeof sp.order === "string" ? sp.order : ""} /></main><Footer /></>);
  }
  const books = session.email ? (await listBooks(2000)).filter((b) => b.contact === session.email) : [];
  const orders = session.whatsapp ? await ordersByWhatsapp(session.whatsapp) : [];
  const hero = orders[0];
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-xl px-4 py-6 md:py-10 w-full flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div><h1 className="text-[28px] leading-8 font-bold">My stories</h1><p className="m-0 text-sm text-ink-soft">Signed in with {session.email ?? session.whatsapp}.</p></div>
          <form action="/api/signout" method="post"><button className="text-sm font-bold text-sky">Sign out</button></form>
        </div>

        {hero && (
          <div className="rounded-3xl bg-surface-tint p-4 flex flex-col gap-3">
            <div><span className="eyebrow !text-ink-soft">Saved hero</span><p className="m-0 display text-[20px] font-bold">{hero.child.name}, {hero.child.age}</p><p className="m-0 text-sm text-ink-soft">{hero.parent.city} · {hero.strengths.slice(0, 3).join(", ")}</p></div>
            <div className="grid grid-cols-2 gap-2"><Link href={`/order?reorder=${hero.id}`} className="btn-primary">Order again</Link><Link href="/tales" className="btn-ghost">New free story</Link></div>
            <p className="m-0 text-[12px] text-ink-soft">Everything is pre-filled from the last order. The photos were deleted after delivery, so a reorder asks for them again.</p>
          </div>
        )}

        {orders.map((o) => <Tracker key={o.id} o={o} />)}

        {books.map((b) => (
          <div key={b.id} className="card p-4 flex gap-3 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={storyImage(b.slug, b.gender, "cover.jpg")} alt="" className="w-14 aspect-[5/7] object-cover rounded-lg" />
            <div className="flex-1 min-w-0"><b className="block font-bold truncate">{b.title}</b><span className="text-sm text-ink-soft">Free story · {new Date(b.created_at).toLocaleDateString("en-GB")}</span></div>
            <Link href={`/story/${b.id}`} className="btn-secondary !h-10 !px-4 text-sm">Open</Link>
          </div>
        ))}
        {!orders.length && !books.length && <p className="text-ink-soft">Nothing here yet. <Link href="/tales" className="text-sky font-bold">Try a free story</Link>.</p>}
      </main>
      <Footer />
    </>
  );
}

function Tracker({ o }: { o: OrderRecord }) {
  const idx = STATUS_ORDER.indexOf(o.status);
  const steps: { key: string; label: string; small: string }[] = [
    { key: "ordered", label: "Ordered", small: `${new Date(o.created_at).toLocaleDateString("en-GB")} · ${egp(o.total)}, pay on delivery` },
    { key: "being_made", label: "Being made", small: "Our team is creating the pictures and the three tales. Usually 5 days." },
    { key: "awaiting_approval", label: "Your approval", small: "We send every page to you on WhatsApp. Change anything, then approve." },
    { key: "printing", label: "Printing", small: "About 3 days after approval." },
    { key: "delivered_paid", label: "Delivered", small: `Pay ${egp(o.total)} to the courier, cash or card.` },
  ];
  const pos = (k: string) => STATUS_ORDER.indexOf(k as never);
  const cur = o.status === "approved" ? pos("printing") : o.status === "shipped" ? pos("delivered_paid") : idx;
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2"><b className="display text-[19px] font-bold">{o.child.name}'s books · {o.id}</b><span className={`pill ${o.status === "cancelled" ? "bg-[#fde8ec] text-danger" : "bg-flame-soft text-flame-deep"}`}>{STATUS_LABEL[o.status]}</span></div>
      {o.status === "cancelled" ? <p className="m-0 text-sm text-ink-soft">{STATUS_NEXT.cancelled}</p> : (
        <ol className="m-0 p-0 list-none flex flex-col">
          {steps.map((s, k) => {
            const done = pos(s.key) < cur || o.status === "delivered_paid";
            const now = !done && (pos(s.key) === cur || (s.key === "printing" && o.status === "approved") || (s.key === "delivered_paid" && o.status === "shipped"));
            return (
              <li key={s.key} className="grid grid-cols-[28px_1fr] gap-x-2.5">
                <div className="flex flex-col items-center"><span className={`w-7 h-7 rounded-full grid place-items-center border-[3px] box-border ${done ? "bg-mint border-mint text-white" : now ? "border-flame bg-flame-soft" : "border-line bg-white"}`}>{done ? <Icon name="check" size={14} strokeWidth={3.5} /> : now ? <span className="w-2.5 h-2.5 rounded-full bg-flame" /> : null}</span>{k < steps.length - 1 && <span className={`w-[3px] flex-1 min-h-5 ${done ? "bg-mint" : "bg-line"}`} />}</div>
                <div className={`pb-3 ${!done && !now ? "text-ink-soft" : ""}`}><b className="block text-[15px] font-bold">{s.label}{now && o.edit_requested ? " · edits in progress" : ""}</b><span className="block text-[13px] text-ink-soft">{now ? STATUS_NEXT[o.status] : s.small}</span></div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
