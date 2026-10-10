"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** page_view on every page + first-ref capture (SPEC §13). No personal data. */
export function PageViewBeacon() {
  const path = usePathname();
  useEffect(() => {
    try {
      const ref = new URLSearchParams(location.search).get("ref");
      if (ref && !localStorage.getItem("gtales.ref")) localStorage.setItem("gtales.ref", ref.replace(/[^a-z0-9_-]/gi, "").slice(0, 60));
      const page = path.replace(/\/story\/[^/]+/, "/story/:id").replace(/\/order\/[^/]+/, "/order/:id").replace(/\/admin.*/, "/admin");
      if (page.startsWith("/admin")) return;
      navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify({ event: "page_view", page, meta: { ref: localStorage.getItem("gtales.ref") || undefined } })], { type: "application/json" }));
    } catch {}
  }, [path]);
  return null;
}
