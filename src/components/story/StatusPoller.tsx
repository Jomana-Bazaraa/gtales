"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n-client";
import { KeeperAvatar } from "../KeeperAvatar";

const ORDER = ["template", "text", "images", "pdf", "done"];

export function StatusPoller({ id, childName, initialStatus, initialProgress }: { id: string; childName: string; initialStatus: string; initialProgress: string }) {
  const { t, isAr } = useLang();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "ready") {
      router.replace(`/story/${id}`);
      return;
    }
    if (status === "failed") return;
    const iv = setInterval(async () => {
      const r = await fetch(`/api/stories/${id}/status`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (!r) return;
      setStatus(r.status);
      setProgress(r.progress);
      if (r.error) setError(r.error);
    }, 2500);
    return () => clearInterval(iv);
  }, [id, status, router]);

  const steps = [
    { k: "template", label: t("s_step_template") },
    { k: "text", label: t("s_step_text") },
    { k: "images", label: t("s_step_images") },
    { k: "pdf", label: t("s_step_pdf") },
  ];
  const cur = ORDER.indexOf(progress);

  if (status === "failed") {
    return (
      <div className="card p-8">
        <p className="text-xl font-bold mb-2">😔 {t("s_failed")}</p>
        {error && <p className="text-xs text-ink-soft mb-4 break-words">{error}</p>}
        <Link href="/create" className="btn-primary">{t("cta_short")}</Link>
      </div>
    );
  }
  return (
    <div className="card p-8">
      <div className="mx-auto w-28 h-28 rounded-full bg-coral-soft flex items-center justify-center mb-4 float">
        <KeeperAvatar id="blaze" size={84} />
      </div>
      <h1 className="text-2xl font-bold mb-6">{isAr ? `قصة ${childName} ${t("s_writing")}` : `${childName}'s story ${t("s_writing")}`}</h1>
      <ol className="text-start space-y-3 max-w-xs mx-auto">
        {steps.map((s, i) => {
          const done = i < cur, active = i === cur;
          return (
            <li key={s.k} className={`flex items-center gap-3 ${done ? "text-teal" : active ? "text-indigo font-bold" : "text-ink-soft/60"}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${done ? "bg-teal text-white" : active ? "bg-indigo text-white animate-pulse" : "bg-cream-deep"}`}>{done ? "✓" : i + 1}</span>
              {s.label}
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-ink-soft mt-6">{isAr ? "عادةً أقل من دقيقة. هنبعتلك إيميل كمان." : "Usually under a minute. We'll email you too."}</p>
    </div>
  );
}
