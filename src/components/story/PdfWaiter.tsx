"use client";
import { useEffect, useState } from "react";

/** Polls the PDF job and opens the file when it exists (SPEC §8). */
export function PdfWaiter({ id }: { id: string }) {
  const [state, setState] = useState<"waiting" | "failed" | "slow">("waiting");
  useEffect(() => {
    let stop = false;
    const started = Date.now();
    const tick = async () => {
      if (stop) return;
      const r = await fetch(`/api/books/${id}/pdf?status=1`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (r?.status === "done") { location.href = `/api/books/${id}/pdf`; return; }
      if (r?.status === "failed") { setState("failed"); return; }
      if (Date.now() - started > 6 * 60_000) setState("slow");
      setTimeout(tick, 5000);
    };
    const t = setTimeout(tick, 4000);
    return () => { stop = true; clearTimeout(t); };
  }, [id]);
  if (state === "failed") return <p role="alert" className="m-0 font-bold text-coral-dark">Sorry, the PDF didn&apos;t work this time. We&apos;ve been told. Please try again in a few minutes: <a className="underline" href={`/story/${id}/pdf`}>try again</a>.</p>;
  return (
    <div className="flex flex-col items-center gap-2" aria-live="polite">
      <div className="h-2 w-48 rounded-full bg-white overflow-hidden"><div className="h-full w-1/3 rounded-full bg-sky animate-pulse" /></div>
      <span className="text-sm font-bold text-ink-soft">{state === "slow" ? "Still working, it's taking longer than usual…" : "Making the PDF…"}</span>
    </div>
  );
}
