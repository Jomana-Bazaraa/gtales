"use client";
import Link from "next/link";
import type { BookRecord } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

/** Ready screen buttons for engine books (SPEC §7): Open, Story PDF, Parent guide, share. */
export function BookActions({ book, url }: { book: BookRecord; url: string }) {
  const beacon = (event: string, meta?: Record<string, unknown>) => {
    try { navigator.sendBeacon("/api/events", new Blob([JSON.stringify({ event, story_id: book.id, meta })], { type: "application/json" })); } catch {}
  };
  const share = async () => {
    beacon("share_clicked");
    const text = `${book.child_name}'s story on GTales`;
    const shareUrl = `${url}?ref=share`;
    if (navigator.share) await navigator.share({ title: text, url: shareUrl }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${text}: ${shareUrl}`)}`, "_blank");
  };
  return (
    <div className="flex flex-col gap-3">
      <Link href={`/story/${book.id}/read`} onClick={() => beacon("story_opened")} className="btn-secondary w-full md:w-auto md:self-start md:!h-14 md:!px-7 md:text-lg"><Icon name="book" size={22} />Open the story</Link>
      <div className="grid grid-cols-2 gap-2">
        <a href={`/api/books/${book.id}/pdf`} target="_blank" rel="noreferrer" className="btn-ghost">Story PDF</a>
        <a href="#guide" className="btn-ghost">Parent guide</a>
      </div>
      <span className="text-xs font-bold text-ink-soft">The PDF is made the first time you open it, a few seconds.</span>
      <button type="button" onClick={share} className="text-left text-[15px] font-extrabold text-sky inline-flex items-center gap-2"><Icon name="heart" size={18} />Make a story for another child</button>
    </div>
  );
}
