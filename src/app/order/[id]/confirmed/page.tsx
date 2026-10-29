import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer, Header } from "@/components/SiteChrome";
import { Icon, type IconName } from "@/components/ui/Icon";
import { getOrder } from "@/lib/db";
import { COPY, egp, egpOrFree } from "@/lib/gtales";

export const metadata: Metadata = { title: "Order received — GTales" };

/** Confirmation — SPEC §9: order number and the four next steps. */
export default async function Confirmed({ params }: PageProps<"/order/[id]/confirmed">) {
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();
  const name = o.child.name;
  const steps: { icon: IconName; tint: string; title: string; copy: string }[] = [
    { icon: "book", tint: "bg-flame-soft text-flame-deep", title: "We create the pictures and the three tales", copy: `From ${name}'s photo, built around what you told us. About 5 days.` },
    { icon: "chat", tint: "bg-sky-soft text-sky", title: "You approve every page on WhatsApp", copy: `We send the full story to ${o.parent.whatsapp}. Change anything, as many times as you like.` },
    { icon: "home", tint: "bg-sun-soft text-cta-shadow", title: "We print and deliver", copy: `${o.parent.city}, ${o.parent.governorate}. About 5 days after your approval.` },
    o.total ? { icon: "star", tint: "bg-mint-soft text-mint", title: `You pay ${egp(o.total)} to the courier`, copy: "Cash or card at the door. Nothing online." }
      : { icon: "star", tint: "bg-mint-soft text-mint", title: "It's free: nothing to pay", copy: `With ${o.promo_code ?? "your code"}, the books and the delivery are on us.` },
  ];
  return (
    <>
      <Header />
      <main className="flex-1 w-full">
        <section className="mx-auto max-w-xl px-4 py-8 md:py-12 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="w-16 h-16 rounded-full bg-mint-soft text-mint grid place-items-center"><Icon name="check" size={34} strokeWidth={3} /></span>
            <h1 className="text-[30px] leading-9 md:text-[40px] md:leading-[44px] font-bold">{name}'s books are on the way</h1>
            <p className="m-0 text-ink-soft">Order <b className="text-ink">{o.id}</b>. We've sent a WhatsApp message to {o.parent.whatsapp}.</p>
          </div>
          <ol className="m-0 p-0 list-none flex flex-col gap-3">
            {steps.map((s, k) => (
              <li key={s.title} className="flex gap-3 items-start card p-4">
                <span className={`relative shrink-0 w-12 h-12 rounded-2xl grid place-items-center ${s.tint}`}><Icon name={s.icon} size={24} /><i className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-ink text-white text-[12px] leading-6 text-center font-extrabold not-italic border-[3px] border-white box-content">{k + 1}</i></span>
                <span><b className="block font-bold">{s.title}</b><span className="block text-sm text-ink-soft">{s.copy}</span></span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl bg-surface-tint p-4 flex flex-col gap-1 text-[15px]">
            <div className="flex justify-between"><span>Three printed books + parent guide</span><b>{egp(o.list_price)}</b></div>
            {o.discount > 0 && <div className="flex justify-between text-mint"><span>{o.promo_code}</span><b>−{egp(o.discount)}</b></div>}
            <div className="flex justify-between"><span>Delivery</span><b>{egpOrFree(o.delivery)}</b></div>
            <div className="flex justify-between font-bold"><span>{o.total ? "Pay on delivery" : "To pay"}</span><b>{egpOrFree(o.total)}</b></div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/my-stories?order=${o.id}`} className="btn-secondary">Track this order</Link>
            <Link href="/tales" className="btn-ghost">{COPY.ctaSecondary} for another child</Link>
            <Link href="/reviews/new" className="text-center text-[15px] font-extrabold text-sky">★ Loved your free story? Add a review for other families</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
