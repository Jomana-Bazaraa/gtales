"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureSource, track } from "@/lib/track";

/** page_view on every page + first-source capture (?ref / ?utm_source / ?code, SPEC §13). No personal data. */
export function PageViewBeacon() {
  const path = usePathname();
  useEffect(() => {
    captureSource();
    const page = path.replace(/\/story\/[^/]+/, "/story/:id").replace(/\/order\/[^/]+/, "/order/:id").replace(/\/admin.*/, "/admin");
    // Not admin, and not the print page (the PDF renderer's headless Chrome would count as a visitor).
    if (!page.startsWith("/admin") && !page.endsWith("/print")) track("page_view", { page });
  }, [path]);
  return null;
}
