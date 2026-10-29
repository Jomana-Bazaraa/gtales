"use client";
import { useState } from "react";

/** Sends a test email through Resend and shows the raw response (Admin → Settings). */
export function TestEmail({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true); setOut(null);
    const r = await fetch("/api/admin/test-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ to }) }).catch(() => null);
    setOut(r ? `HTTP ${r.status}\n${JSON.stringify(await r.json().catch(() => ({})), null, 2)}` : "No connection.");
    setBusy(false);
  };
  return (
    <div className="card p-4 flex flex-col gap-2">
      <b>Email (Resend)</b>
      <div className="flex gap-2 flex-wrap"><input className="field !w-auto flex-1 min-w-56" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@gmail.com" />
        <button type="button" onClick={send} disabled={busy} className="btn-secondary">{busy ? "Sending…" : "Send test email"}</button></div>
      {out && <pre className="m-0 text-xs bg-surface-tint rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">{out}</pre>}
    </div>
  );
}
