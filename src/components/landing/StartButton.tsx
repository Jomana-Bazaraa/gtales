"use client";
import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/track";

/** The landing's one big "start" button: start_click, and landing_view once per page load (SPEC §5.1, §13). */
export function StartButton({ where, className, children }: { where: string; className?: string; children: React.ReactNode }) {
  return <Link href="/create" onClick={() => track("start_click", { meta: { where } })} className={className}>{children}</Link>;
}
export function LandingView() {
  useEffect(() => { track("landing_view"); }, []);
  return null;
}
