"use client";
import { useState } from "react";

/** Sign-in (SPEC §10): email link for free stories, order number + WhatsApp for Series orders. */
export function MyStoriesForm({ initialOrder = "" }: { initialOrder?: string }) {
  const [tab, setTab] = useState<"order" | "email">(initialOrder ? "order" : "email");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(initialOrder);
  const [wa, setWa] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const body = tab === "email" ? { email } : { order, whatsapp: wa };
    const r = await fetch("/api/signin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.message || "Please check and try again.");
    if (tab === "email") setSent(true); else location.href = "/my-stories";
  };

  return (
    <div className="card p-5 md:p-8 flex flex-col gap-4">
      <div><h1 className="text-[26px] leading-8 font-bold">My stories</h1><p className="m-0 text-ink-soft text-[15px]">No password. Sign in the way you ordered.</p></div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setTab("order")} className={`chip justify-center ${tab === "order" ? "chip-on" : ""}`}>A printed order</button>
        <button type="button" onClick={() => setTab("email")} className={`chip justify-center ${tab === "email" ? "chip-on" : ""}`}>A free story</button>
      </div>
      {sent ? (
        <p className="rounded-2xl bg-mint-soft p-4 font-semibold m-0">Check your email: we've sent you a link to your stories.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          {tab === "email" ? (
            <label className="flex flex-col gap-1.5 font-bold text-[15px]">The email you used<input className="field font-medium" type="email" required placeholder="e.g. mariam@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          ) : (<>
            <label className="flex flex-col gap-1.5 font-bold text-[15px]">Order number<input className="field font-medium uppercase" required placeholder="GT-1234-ABCD" value={order} onChange={(e) => setOrder(e.target.value)} /></label>
            <label className="flex flex-col gap-1.5 font-bold text-[15px]">The WhatsApp number on the order<input className="field font-medium" inputMode="tel" required placeholder="010 1234 5678" value={wa} onChange={(e) => setWa(e.target.value)} /></label>
          </>)}
          {err && <p role="alert" className="m-0 text-sm font-bold text-danger">{err}</p>}
          <button disabled={busy} className="btn-primary">{tab === "email" ? "Send me the link" : "Open my order"}</button>
        </form>
      )}
    </div>
  );
}
