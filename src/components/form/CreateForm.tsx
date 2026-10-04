"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";
import { HAIR_COLORS, HAIR_STYLES, INTEREST_CHIPS, SKIN_TONES, VIBES, type Lang } from "@/lib/i18n";
import { STRUGGLES } from "@/lib/keepers";
import { ACTIVITIES, ageBand, challengeOptions, type ActivityId } from "@/lib/activities/registry";
import type { ChallengeType, StoryInput } from "@/lib/types";
import { KeeperAvatar } from "../KeeperAvatar";

type Draft = Omit<StoryInput, "age" | "interests"> & { age: number; interests: string[]; interestCustom: string; sidekickName: string; sidekickRel: "sibling" | "friend" | "pet" | "cousin" };

const TOTAL = 12;

const H = ({ title, desc }: { title: string; desc?: string }) => (
  <div className="mb-5">
    <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
    {desc && <p className="text-ink-soft mt-1">{desc}</p>}
  </div>
);
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className={`chip ${on ? "chip-on" : ""}`}>{children}</button>
);

export function CreateForm({ initialLang }: { initialLang: Lang }) {
  const { t, lang, isAr } = useLang();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState<Draft>({
    childName: "",
    age: 6,
    gender: "boy",
    appearance: { skinTone: "medium", hairStyle: "short", hairColor: "dark_brown", details: "" },
    interests: [],
    interestCustom: "",
    sidekickName: "",
    sidekickRel: "sibling",
    struggle: "anger",
    struggleOther: "",
    challengeType: "maze",
    vibe: "funny",
    favoriteBook: "",
    personalDetail: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    language: initialLang,
    consent: false,
  });
  const u = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const band = ageBand(d.age);
  const challenges = useMemo(() => challengeOptions(d.struggle, band), [d.struggle, band]);
  const struggle = STRUGGLES.find((s) => s.id === d.struggle)!;

  const valid = (s: number): string | null => {
    switch (s) {
      case 1: return d.childName.trim() ? null : t("f_required");
      case 4: return d.interests.length || d.interestCustom.trim() ? null : t("f_required");
      case 6: return d.struggle === "other" && (d.struggleOther ?? "").trim().length < 10 ? t("f_required") : null;
      case 9: return d.personalDetail.trim().length >= 3 ? null : t("f_required");
      case 10: return d.parentName.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.parentEmail) ? null : t("f_required");
      case 12: return d.consent ? null : t("f_required");
      default: return null;
    }
  };
  const next = () => {
    const e = valid(step);
    setErr(e);
    if (!e) setStep((s) => Math.min(TOTAL, s + 1));
  };
  const back = () => { setErr(null); setStep((s) => Math.max(1, s - 1)); };

  const submit = async () => {
    const e = valid(12);
    if (e) return setErr(e);
    setBusy(true);
    const interests = [...d.interests, ...(d.interestCustom.trim() ? [d.interestCustom.trim()] : [])].slice(0, 5);
    const payload: StoryInput = {
      childName: d.childName.trim(),
      age: d.age,
      gender: d.gender,
      appearance: { ...d.appearance, details: d.appearance.details?.trim() || undefined },
      interests,
      sidekick: d.sidekickName.trim() ? { name: d.sidekickName.trim(), relation: d.sidekickRel } : undefined,
      struggle: d.struggle,
      struggleOther: d.struggle === "other" ? d.struggleOther?.trim() : undefined,
      challengeType: challenges.includes(d.challengeType) ? d.challengeType : challenges[0],
      vibe: d.vibe,
      favoriteBook: d.favoriteBook?.trim() || undefined,
      personalDetail: d.personalDetail.trim(),
      parentName: d.parentName.trim(),
      parentEmail: d.parentEmail.trim(),
      parentPhone: d.parentPhone?.trim() || undefined,
      language: d.language,
      consent: true,
      website: (document.getElementById("website") as HTMLInputElement | null)?.value || "",
    };
    const r = await fetch("/api/stories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setBusy(false);
      setErr(r.status === 429 ? (isAr ? "عملت قصص كتير في وقت قصير. جرّب بعد شوية." : "Too many stories in a short time. Please try again later.") : t("s_failed"));
      return;
    }
    router.push(`/story/${j.id}/status`);
  };

  return (
    <div className="mx-auto max-w-xl w-full">
      {/* progress */}
      <div className="flex items-center justify-between text-xs font-bold text-ink-soft mb-2">
        <span>{t("f_step")} {step} {t("f_of")} {TOTAL}</span>
        <span>{Math.round((step / TOTAL) * 100)}%</span>
      </div>
      <div className="h-2 rounded-full bg-cream-deep mb-6 overflow-hidden"><div className="h-full bg-coral transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} /></div>

      <div className="card p-5 sm:p-8 min-h-[360px]">
        <input id="website" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        {step === 1 && (
          <>
            <H title={t("f1_t")} desc={t("f1_d")} />
            <input className="field text-xl" autoFocus placeholder={t("f1_ph")} value={d.childName} onChange={(e) => u("childName", e.target.value)} maxLength={30} />
          </>
        )}

        {step === 2 && (
          <>
            <H title={t("f2_t")} />
            <label className="block font-bold mb-2">{t("f2_age")}: <span className="text-coral text-xl">{d.age}</span></label>
            <input type="range" min={3} max={12} value={d.age} onChange={(e) => u("age", Number(e.target.value))} className="w-full accent-coral mb-6" />
            <div className="grid grid-cols-2 gap-3">
              {(["boy", "girl"] as const).map((g) => (
                <button key={g} type="button" onClick={() => u("gender", g)} className={`card p-5 text-center font-bold text-lg transition ${d.gender === g ? "!border-coral !bg-coral-soft" : ""}`}>
                  <span className="text-3xl block mb-1">{g === "boy" ? "👦" : "👧"}</span>{g === "boy" ? t("f2_boy") : t("f2_girl")}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <H title={t("f3_t")} desc={t("f3_d")} />
            <p className="font-bold mb-2">{t("f3_skin")}</p>
            <div className="flex gap-2 mb-5 flex-wrap">
              {SKIN_TONES.map((s) => (
                <button key={s.id} type="button" title={s[lang]} onClick={() => u("appearance", { ...d.appearance, skinTone: s.id })} className={`w-11 h-11 rounded-full border-4 transition ${d.appearance.skinTone === s.id ? "border-coral scale-110" : "border-white shadow"}`} style={{ background: s.hex }} aria-label={s[lang]} />
              ))}
            </div>
            <p className="font-bold mb-2">{t("f3_hair_style")}</p>
            <div className="flex gap-2 mb-5 flex-wrap">
              {HAIR_STYLES.map((h) => <Chip key={h.id} on={d.appearance.hairStyle === h.id} onClick={() => u("appearance", { ...d.appearance, hairStyle: h.id })}>{h[lang]}</Chip>)}
            </div>
            <p className="font-bold mb-2">{t("f3_hair_color")}</p>
            <div className="flex gap-2 mb-5 flex-wrap">
              {HAIR_COLORS.map((h) => (
                <button key={h.id} type="button" title={h[lang]} onClick={() => u("appearance", { ...d.appearance, hairColor: h.id })} className={`w-11 h-11 rounded-full border-4 transition ${d.appearance.hairColor === h.id ? "border-coral scale-110" : "border-white shadow"}`} style={{ background: h.hex }} aria-label={h[lang]} />
              ))}
            </div>
            <input className="field" placeholder={t("f3_details")} value={d.appearance.details} onChange={(e) => u("appearance", { ...d.appearance, details: e.target.value })} maxLength={120} />
          </>
        )}

        {step === 4 && (
          <>
            <H title={t("f4_t")} desc={t("f4_d")} />
            <div className="flex gap-2 flex-wrap mb-4">
              {INTEREST_CHIPS.map((c) => {
                const on = d.interests.includes(c[lang]);
                return <Chip key={c.id} on={on} onClick={() => u("interests", on ? d.interests.filter((x) => x !== c[lang]) : [...d.interests, c[lang]].slice(0, 3))}>{c[lang]}</Chip>;
              })}
            </div>
            <input className="field" placeholder={t("f4_ph")} value={d.interestCustom} onChange={(e) => u("interestCustom", e.target.value)} maxLength={40} />
          </>
        )}

        {step === 5 && (
          <>
            <H title={`${t("f5_t")} (${t("f_optional")})`} desc={t("f5_d")} />
            <input className="field mb-3" placeholder={t("f5_name")} value={d.sidekickName} onChange={(e) => u("sidekickName", e.target.value)} maxLength={30} />
            <div className="flex gap-2 flex-wrap">
              {(["sibling", "friend", "pet", "cousin"] as const).map((r) => <Chip key={r} on={d.sidekickRel === r} onClick={() => u("sidekickRel", r)}>{t(`rel_${r}`)}</Chip>)}
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <H title={t("f6_t")} desc={t("f6_d")} />
            <div className="grid gap-2">
              {STRUGGLES.map((s) => (
                <button key={s.id} type="button" onClick={() => u("struggle", s.id)} className={`flex items-center gap-3 card px-3 py-2.5 text-start transition ${d.struggle === s.id ? "!border-coral !bg-coral-soft" : ""}`}>
                  {s.keeper ? <KeeperAvatar id={s.keeper} size={36} /> : <span className="w-9 h-9 rounded-full bg-indigo-soft flex items-center justify-center">✍️</span>}
                  <span className="font-semibold">{s.label[lang]}</span>
                </button>
              ))}
            </div>
            {d.struggle === "other" && (
              <div className="mt-3">
                <textarea className="field min-h-[110px]" placeholder={t("f6_other_ph")} value={d.struggleOther} onChange={(e) => u("struggleOther", e.target.value)} maxLength={600} />
                <p className="text-sm rounded-xl bg-coral-soft text-coral-dark p-3 mt-2">⚠️ {t("f6_other_warn")}</p>
              </div>
            )}
          </>
        )}

        {step === 7 && (
          <>
            <H title={t("f7_t")} desc={t("f7_d")} />
            <div className="grid grid-cols-2 gap-2">
              {challenges.map((c) => {
                const m = ACTIVITIES[c as ActivityId];
                return (
                  <button key={c} type="button" onClick={() => u("challengeType", c as ChallengeType)} className={`card p-3 text-start transition ${d.challengeType === c ? "!border-coral !bg-coral-soft" : ""}`}>
                    <div className="font-bold">{m.label[lang]}</div>
                    <div className="text-xs text-ink-soft">{m.blurb[lang]}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-soft mt-3">{isAr ? `+ ٣ أنشطة في ورشة ${struggle.keeper ? "الحارس" : ""} بعد القصة، مناسبة لسن ${d.age}.` : `+ 3 Workshop activities after the story, matched to age ${d.age}.`}</p>
          </>
        )}

        {step === 8 && (
          <>
            <H title={t("f8_t")} desc={t("f8_d")} />
            <div className="grid grid-cols-2 gap-2 mb-4">
              {VIBES.map((v) => <Chip key={v.id} on={d.vibe === v.id} onClick={() => u("vibe", v.id as Draft["vibe"])}>{v[lang]}</Chip>)}
            </div>
            <input className="field" placeholder={t("f8_book")} value={d.favoriteBook} onChange={(e) => u("favoriteBook", e.target.value)} maxLength={80} />
          </>
        )}

        {step === 9 && (
          <>
            <H title={t("f9_t")} desc={t("f9_d")} />
            <textarea className="field min-h-[130px]" placeholder={t("f9_ph")} value={d.personalDetail} onChange={(e) => u("personalDetail", e.target.value)} maxLength={400} />
          </>
        )}

        {step === 10 && (
          <>
            <H title={t("f10_t")} />
            <div className="grid gap-3">
              <input className="field" placeholder={t("f10_name")} value={d.parentName} onChange={(e) => u("parentName", e.target.value)} autoComplete="name" />
              <input className="field" placeholder={t("f10_email")} type="email" inputMode="email" value={d.parentEmail} onChange={(e) => u("parentEmail", e.target.value)} autoComplete="email" />
              <input className="field" placeholder={t("f10_phone")} type="tel" inputMode="tel" value={d.parentPhone} onChange={(e) => u("parentPhone", e.target.value)} autoComplete="tel" />
            </div>
          </>
        )}

        {step === 11 && (
          <>
            <H title={t("f11_t")} />
            <div className="grid grid-cols-2 gap-3">
              {(["ar", "en"] as const).map((l) => (
                <button key={l} type="button" onClick={() => u("language", l)} className={`card p-5 text-center font-bold text-lg transition ${d.language === l ? "!border-coral !bg-coral-soft" : ""}`}>{t(`lang_${l}`)}</button>
              ))}
            </div>
          </>
        )}

        {step === 12 && (
          <>
            <H title={t("f12_review")} />
            <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 mb-5">
              <dt className="text-ink-soft">{t("f1_t")}</dt><dd className="font-semibold">{d.childName}, {d.age}</dd>
              <dt className="text-ink-soft">{t("f6_t")}</dt><dd className="font-semibold">{struggle.label[lang]}</dd>
              <dt className="text-ink-soft">{t("f4_t")}</dt><dd className="font-semibold">{[...d.interests, d.interestCustom].filter(Boolean).join(", ")}</dd>
              <dt className="text-ink-soft">{t("f7_t")}</dt><dd className="font-semibold">{ACTIVITIES[d.challengeType as ActivityId].label[lang]}</dd>
              <dt className="text-ink-soft">{t("f11_t")}</dt><dd className="font-semibold">{t(`lang_${d.language}`)}</dd>
              <dt className="text-ink-soft">{t("f10_email")}</dt><dd className="font-semibold">{d.parentEmail}</dd>
            </dl>
            <label className="flex gap-3 items-start text-sm">
              <input type="checkbox" checked={d.consent} onChange={(e) => u("consent", e.target.checked)} className="mt-1 w-5 h-5 accent-coral shrink-0" />
              <span>{t("f12_consent")}</span>
            </label>
          </>
        )}

        {err && <p className="mt-3 text-sm text-coral-dark font-semibold">{err}</p>}
      </div>

      <div className="flex gap-3 mt-4 sticky bottom-0 py-3 bg-cream/90 backdrop-blur">
        {step > 1 && <button type="button" onClick={back} className="btn-ghost flex-1">{t("f_back")}</button>}
        {step < TOTAL ? (
          <button type="button" onClick={next} className="btn-primary flex-[2]">{t("f_next")}</button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className="btn-primary flex-[2]">{busy ? t("f_creating") : t("f_submit")}</button>
        )}
      </div>
    </div>
  );
}
