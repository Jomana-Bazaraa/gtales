"use client";
import { useState } from "react";

/** Optional "Email me this story" (the free-story form no longer asks for an email). */
export function EmailMe({ bookId, compact }: { bookId: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);
  const send = async () => {
    setErr(null); setState("busy");
    const r = await fetch(`/api/books/${bookId}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (r?.ok) return setState("done");
    setState("idle"); setErr(j.message || "No connection. Please try again.");
  };
  if (state === "done") return <p className="m-0 text-[15px] font-bold text-mint">Sent! Check your inbox (and spam, just in case).</p>;
  return (
    <div className={`flex flex-col gap-2 ${compact ? "" : "card p-4"}`}>
      <span className="text-[15px] font-bold">Keep it: email me this story</span>
      <div className="flex gap-2">
        <input className="field flex-1 min-w-0" type="email" inputMode="email" autoComplete="email" placeholder="you@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
        <button type="button" onClick={send} disabled={state === "busy" || !email.includes("@")} className="btn-secondary shrink-0">{state === "busy" ? "…" : "Send"}</button>
      </div>
      {err && <span role="alert" className="text-sm font-bold text-danger">{err}</span>}
    </div>
  );
}
