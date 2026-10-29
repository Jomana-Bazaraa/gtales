"use client";
import Link from "next/link";
import type { StoryRecord } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

/** Ready screen buttons for old (Estoria) story records: Open the story, Parent guide. No PDFs for parents (29 Oct). */
export function ReadyActions({ story }: { story: StoryRecord }) {
  const beacon = (event: string, meta?: Record<string, unknown>) => {
    try { navigator.sendBeacon("/api/events", new Blob([JSON.stringify({ event, story_id: story.id, meta })], { type: "application/json" })); } catch {}
  };
  return (
    <div className="flex flex-col gap-3">
      <Link href={`/story/${story.id}/read`} onClick={() => beacon("story_opened")} className="btn-secondary w-full md:w-auto md:self-start md:!h-14 md:!px-7 md:text-lg"><Icon name="book" size={22} />Open the story</Link>
      <a href="#guide" className="btn-ghost w-full md:w-auto md:self-start">Parent guide</a>
    </div>
  );
}
