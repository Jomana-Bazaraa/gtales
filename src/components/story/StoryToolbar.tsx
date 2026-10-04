"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n-client";
import type { StoryRecord } from "@/lib/types";

export function StoryToolbar({ story, url }: { story: StoryRecord; url: string }) {
  const { t, isAr } = useLang();
  const [pdfs, setPdfs] = useState({ color: story.pdf_color_url, lineart: story.pdf_lineart_url });
  const [copied, setCopied] = useState(false);

  // PDFs arrive a little after the story; poll until they exist
  useEffect(() => {
    if (pdfs.color && pdfs.lineart) return;
    const iv = setInterval(async () => {
      const r = await fetch(`/api/stories/${story.id}/status`).then((x) => x.json()).catch(() => null);
      if (r?.pdf_color_url) {
        setPdfs({ color: r.pdf_color_url, lineart: r.pdf_lineart_url });
        clearInterval(iv);
      }
      if (r?.progress === "done") clearInterval(iv);
    }, 4000);
    return () => clearInterval(iv);
  }, [story.id, pdfs.color, pdfs.lineart]);

  const share = async () => {
    const text = isAr ? `قصة ${story.input.childName} على إستوريا` : `${story.input.childName}'s Estoria story`;
    if (navigator.share) {
      await navigator.share({ title: text, url }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`, "_blank");
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="no-print sticky top-16 z-20 -mx-4 px-4 py-2 bg-cream/90 backdrop-blur border-b border-line mb-5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <a href={pdfs.color ?? "#"} className={`btn-primary !py-2 !min-h-[42px] text-sm whitespace-nowrap ${!pdfs.color && "opacity-50 pointer-events-none"}`} target="_blank" rel="noreferrer">
          📕 {t("st_dl_color")}
        </a>
        <a href={pdfs.lineart ?? "#"} className={`btn-secondary !py-2 !min-h-[42px] text-sm whitespace-nowrap ${!pdfs.lineart && "opacity-50 pointer-events-none"}`} target="_blank" rel="noreferrer">
          ✏️ {t("st_dl_lineart")}
        </a>
        <button onClick={share} className="btn-ghost !py-2 !min-h-[42px] text-sm whitespace-nowrap">↗ {t("st_share")}</button>
        <button onClick={copy} className="btn-ghost !py-2 !min-h-[42px] text-sm whitespace-nowrap">{copied ? "✓" : "🔗"}</button>
      </div>
      {!pdfs.color && <p className="text-xs text-ink-soft mt-1">{isAr ? "ملفات الـ PDF بتتجهز… ثواني" : "PDFs are being prepared… a few seconds"}</p>}
      <p className="text-xs text-ink-soft mt-1">{t("st_save_link")}</p>
    </div>
  );
}
