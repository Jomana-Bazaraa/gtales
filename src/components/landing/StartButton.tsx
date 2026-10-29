"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";

/** landing_view once per home page load, for the Dashboard funnel (SPEC §13). Renders nothing. */
export function LandingView() {
  useEffect(() => { track("landing_view"); }, []);
  return null;
}
