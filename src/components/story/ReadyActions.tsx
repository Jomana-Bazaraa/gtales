"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { StoryRecord } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

/** Ready screen buttons (SPEC §7): Open the story, three PDFs, share for another child. */
export function ReadyActions({ story, url }: { story: StoryRecord; url: string }) {
  const [pdfs, setPdfs] = useState({ color: story.pdf_color_url, lineart: story.pdf_lineart_url });
  const pending = !pdfs.color || !pdfs.lineart;

  useEffect(() => {
    if (!pending) return;
    const iv = setInterval(async () => {
      const r = await fetch(`/api/stories/${story.id}/status`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (r?.pdf_color_url) { setPdfs({ color: r.pdf_color_url, lineart: r.pdf_lineart_url }); clearInterval(iv); }
      if (r?.progress === "done") clearInterval(iv);
    }, 4000);
    return () => clearInterval(iv);
  }, [story.id, pending]);

  const beacon = (event: string, meta?: Record<string, unknown>) => {
    try { navigator.sendBeacon("/api/events", new Blob([JSON.stringify({ event, story_id: story.id, meta })], { type: "application/json" })); } catch {}
  };
  const share = async () => {
    beacon("share_clicked");
    const text = `${story.input.childName}'s story on GTales`;
    const shareUrl = `${url}?ref=share`;
    if (navigator.share) await navigator.share({ title: text, url: shareUrl }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${text}: ${shareUrl}`)}`, "_blank");
  };

  const pdf = (href: string | null, label: string, kind: string) => (
    <a href={href ?? "#"} target="_blank" rel="noreferrer" onClick={() => beacon("pdf_downloaded", { kind })} aria-disabled={!href} className={`btn-ghost ${!href ? "opacity-50 pointer-events-none" : ""}`}>{label}</a>
  );

  return (
    <div className="flex flex-col gap-3">
      <Link href={`/story/${story.id}/read`} onClick={() => beacon("story_opened")} className="btn-secondary w-full md:w-auto md:self-start md:!h-14 md:!px-7 md:text-lg"><Icon name="book" size={22} />Open the story</Link>
      <div className="grid grid-cols-3 gap-2">
        {pdf(pdfs.color, "Story PDF", "story")}
        {pdf(pdfs.lineart, "Colouring", "colouring")}
        <a href="#guide" className="btn-ghost">Parent guide</a>
      </div>
      {pending && <span className="text-xs font-bold text-ink-soft">The PDFs are being prepared, a few seconds more.</span>}
      <button type="button" onClick={share} className="text-left text-[15px] font-extrabold text-sky inline-flex items-center gap-2"><Icon name="heart" size={18} />Make a story for another child</button>
    </div>
  );
}
