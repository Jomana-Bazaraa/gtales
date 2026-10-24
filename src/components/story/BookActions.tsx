"use client";
import Link from "next/link";
import type { BookRecord } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { track } from "@/lib/track";
import { EmailMe } from "./EmailMe";
import { guideUrl } from "@/stories/images";

/** Ready screen buttons for engine books (SPEC §7): Open, Story PDF, Parent guide, share. */
export function BookActions({ book, url }: { book: BookRecord; url: string }) {
  const beacon = (event: string, meta?: Record<string, unknown>) => track(event, { story_id: book.id, meta });
  const share = async () => {
    beacon("story_shared", { via: "share" in navigator ? "share_sheet" : "whatsapp" });
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
        <a href={guideUrl(book.slug)} target="_blank" rel="noreferrer" onClick={() => beacon("pdf_downloaded", { kind: "guide" })} className="btn-ghost">Parent guide</a>
      </div>
      <span className="text-xs font-bold text-ink-soft">The PDF is made the first time you open it, about two minutes.</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${book.child_name}'s story on GTales: ${url}?ref=share`)}`} target="_blank" rel="noreferrer" onClick={() => beacon("story_shared", { via: "whatsapp_link" })} className="btn-ghost w-full md:w-auto md:self-start">Send to WhatsApp</a>
      <Link href={`/reviews/new?tale=${encodeURIComponent(book.slug)}`} className="text-left text-[15px] font-extrabold text-sky inline-flex items-center gap-2">★ Loved it? Add your review</Link>
      {!(book.contact ?? "").includes("@") && <EmailMe bookId={book.id} compact />}
      <button type="button" onClick={share} className="text-left text-[15px] font-extrabold text-sky inline-flex items-center gap-2"><Icon name="heart" size={18} />Make a story for another child</button>
    </div>
  );
}

/** The tale's parent guide PDF, tracked as pdf_downloaded(guide). */
export function GuideLink({ bookId, slug, children, className }: { bookId: string; slug: string; children: React.ReactNode; className?: string }) {
  return <a href={guideUrl(slug)} target="_blank" rel="noreferrer" onClick={() => track("pdf_downloaded", { story_id: bookId, meta: { kind: "guide" } })} className={className}>{children}</a>;
}
