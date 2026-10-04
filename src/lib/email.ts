/** Email via Resend. Mock mode (no RESEND_API_KEY) logs to console and writes to .data/outbox/. */
import { promises as fs } from "fs";
import path from "path";
import { KEEPERS } from "./keepers";
import type { StoryRecord } from "./types";

export const isMockEmail = !process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Estoria <stories@estoria.kids>";

async function send(to: string, subject: string, html: string) {
  if (isMockEmail) {
    const dir = path.join(process.cwd(), ".data", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const f = path.join(dir, `${Date.now()}-${to.replace(/[^a-z0-9]/gi, "_")}.html`);
    await fs.writeFile(f, `<!-- to: ${to}\nsubject: ${subject} -->\n${html}`);
    console.log(`[estoria][mock email] → ${to}: ${subject} (saved ${f})`);
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
}

function shell(lang: "en" | "ar", body: string) {
  return `<!doctype html><html dir="${lang === "ar" ? "rtl" : "ltr"}"><body style="margin:0;background:#fff8ef;font-family:${lang === "ar" ? "Tahoma,Arial" : "Nunito,Arial"},sans-serif;color:#2a2320">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:28px;font-weight:800;color:#e8673f;margin-bottom:16px">Estoria</div>
    <div style="background:#fff;border:1px solid #ead9c6;border-radius:24px;padding:28px">${body}</div>
    <p style="font-size:12px;color:#6b5f58;margin-top:20px">Estoria · ${lang === "ar" ? "قصص طفلك بيعيشها" : "Stories your child lives"}</p>
  </div></body></html>`;
}

const btn = (href: string, label: string, color = "#e8673f") =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;margin:6px 4px 6px 0">${label}</a>`;

export async function sendStoryEmail(rec: StoryRecord, baseUrl: string) {
  const { input } = rec;
  const lang = input.language;
  const k = rec.keeper_id ? KEEPERS[rec.keeper_id] : null;
  const url = `${baseUrl}/story/${rec.id}`;
  const name = input.childName;
  const subject = lang === "ar" ? `قصة ${name} جاهزة 🎉` : `${name}'s story is ready 🎉`;
  const body =
    lang === "ar"
      ? `<h2 style="margin:0 0 8px">قصة ${name} مع ${k?.name.ar ?? "الحارس"} جاهزة!</h2>
         <p>أهلاً ${input.parentName}، القصة اتكتبت والرسمة اتعملت. اقراها على الموقع أو حمّل ملفات الـ PDF.</p>
         ${btn(url, "اقرا القصة")}<br/>
         ${rec.pdf_color_url ? btn(rec.pdf_color_url, "PDF بالألوان", "#2b2d6b") : ""}
         ${rec.pdf_lineart_url ? btn(rec.pdf_lineart_url, "PDF الأنشطة", "#2b2d6b") : ""}
         <p style="font-size:13px;color:#6b5f58;margin-top:16px">احتفظ بالإيميل ده — اللينك هو طريقتك للرجوع للقصة في أي وقت. عايزها كتاب مطبوع؟ هتلاقي الطلب في آخر صفحة القصة.</p>`
      : `<h2 style="margin:0 0 8px">${name}'s story with ${k?.name.en ?? "the Keeper"} is ready!</h2>
         <p>Hi ${input.parentName}, the story is written and illustrated. Read it online or download the PDFs.</p>
         ${btn(url, "Read the story")}<br/>
         ${rec.pdf_color_url ? btn(rec.pdf_color_url, "Color PDF", "#2b2d6b") : ""}
         ${rec.pdf_lineart_url ? btn(rec.pdf_lineart_url, "Activity PDF", "#2b2d6b") : ""}
         <p style="font-size:13px;color:#6b5f58;margin-top:16px">Keep this email — the link is your way back to the story any time. Want it as a printed book? The order form is at the end of the story.</p>`;
  await send(input.parentEmail, subject, shell(lang, body));
}

export async function sendMagicLinkEmail(email: string, lang: "en" | "ar", link: string) {
  const subject = lang === "ar" ? "لينك قصصك على إستوريا" : "Your Estoria stories";
  const body =
    lang === "ar"
      ? `<h2 style="margin:0 0 8px">قصصك</h2><p>دوس على الزرار عشان تشوف كل القصص اللي اتعملت بالإيميل ده. اللينك صالح ٢٤ ساعة.</p>${btn(link, "افتح قصصي")}`
      : `<h2 style="margin:0 0 8px">Your stories</h2><p>Tap the button to see every story made with this email. The link works for 24 hours.</p>${btn(link, "Open my stories")}`;
  await send(email, subject, shell(lang, body));
}

export async function sendPhysicalOrderNotice(adminEmail: string, summary: string) {
  await send(adminEmail, "New printed-book order", shell("en", `<h2>New printed-book order</h2><pre style="white-space:pre-wrap">${summary}</pre>`));
}
