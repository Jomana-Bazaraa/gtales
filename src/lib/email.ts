/** Email via Resend. Mock mode (no RESEND_API_KEY) logs to console and writes to .data/outbox/. */
import { promises as fs } from "fs";
import path from "path";
import { KEEPERS } from "./keepers";
import { guideUrl } from "@/stories/images";
import type { BookRecord, OrderRecord, StoryRecord } from "./types";
import { booksLabel, orderQuantity } from "./orders";
import type { Review } from "./reviews";

export const isMockEmail = !process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "GTales <stories@gtales.kids>";

async function send(to: string, subject: string, html: string) {
  if (isMockEmail) {
    const dir = path.join(process.cwd(), ".data", "outbox");
    const f = path.join(dir, `${Date.now()}-${to.replace(/[^a-z0-9]/gi, "_")}.html`);
    // No disk on Cloudflare Workers: there it only logs (set RESEND_API_KEY in production).
    await fs.mkdir(dir, { recursive: true }).then(() => fs.writeFile(f, `<!-- to: ${to}\nsubject: ${subject} -->\n${html}`)).catch(() => {});
    console.log(`[gtales][mock email] → ${to}: ${subject} (outbox ${f})`);
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
}

/** Admin → Settings "Send test email": Resend's raw answer plus which settings this server can see (never their values). */
export async function sendTestEmail(to: string) {
  const env = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `set (${process.env.RESEND_API_KEY.slice(0, 3)}…, ${process.env.RESEND_API_KEY.length} chars)` : "MISSING",
    EMAIL_FROM: process.env.EMAIL_FROM || `not set (using ${FROM})`,
    ADMIN_NOTIFY_EMAIL: process.env.ADMIN_NOTIFY_EMAIL || "not set",
  };
  if (isMockEmail) return { sent: false, reason: "RESEND_API_KEY is not reaching this server, so emails are only logged (mock mode).", env };
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({ from: FROM, to, subject: "GTales test email", html: shell("en", `<h2 style="margin:0 0 8px">It works 🎉</h2><p>This test was sent from Admin → Settings at ${new Date().toISOString()}.</p>`) });
  return { sent: !result.error, from: FROM, to, resend: result, env };
}

function shell(lang: "en" | "ar", body: string) {
  return `<!doctype html><html dir="${lang === "ar" ? "rtl" : "ltr"}"><body style="margin:0;background:#fff8ef;font-family:${lang === "ar" ? "Tahoma,Arial" : "Nunito,Arial"},sans-serif;color:#2a2320">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-size:28px;font-weight:800;color:#e8673f;margin-bottom:16px">GTales</div>
    <div style="background:#fff;border:1px solid #ead9c6;border-radius:24px;padding:28px">${body}</div>
    <p style="font-size:12px;color:#6b5f58;margin-top:20px">GTales · gtales.kids · ${lang === "ar" ? "للأسئلة: hello@gtales.kids" : "Questions: hello@gtales.kids"}</p>
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
         <p>أهلاً ${input.parentName}، ده لينك قصة ${name} ودليل الأهل.</p>
         ${btn(url, "اقرا القصة")}
         <p style="font-size:13px;color:#6b5f58;margin-top:16px">احتفظ بالإيميل ده — اللينك هو طريقتك للرجوع للقصة في أي وقت. عايزها كتاب مطبوع؟ هتلاقي الطلب في آخر صفحة القصة.</p>`
      : `<h2 style="margin:0 0 8px">${name}'s story with ${k?.name.en ?? "the Keeper"} is ready!</h2>
         <p>Hi ${input.parentName}, here's the link to ${name}'s story and your parent guide.</p>
         ${btn(url, "Read the story")}
         <p style="font-size:13px;color:#6b5f58;margin-top:16px">Keep this email — the link is your way back to the story any time. Want it as a printed book? The order form is at the end of the story.</p>`;
  if (!input.parentEmail) return;
  await send(input.parentEmail, subject, shell(lang, body));
}

export async function sendMagicLinkEmail(email: string, lang: "en" | "ar", link: string) {
  const subject = lang === "ar" ? "لينك قصصك على GTales" : "Your GTales stories";
  const body =
    lang === "ar"
      ? `<h2 style="margin:0 0 8px">قصصك</h2><p>دوس على الزرار عشان تشوف كل القصص اللي اتعملت بالإيميل ده. اللينك صالح ٢٤ ساعة.</p>${btn(link, "افتح قصصي")}`
      : `<h2 style="margin:0 0 8px">Your stories</h2><p>Tap the button to see every story made with this email. The link works for 24 hours.</p>${btn(link, "Open my stories")}`;
  await send(email, subject, shell(lang, body));
}

export async function sendPhysicalOrderNotice(adminEmail: string, summary: string) {
  await send(adminEmail, "New printed-book order", shell("en", `<h2>New printed-book order</h2><pre style="white-space:pre-wrap">${summary}</pre>`));
}

/** Free story (SPEC §7): the link back to the story, sent once when it is made. */
export async function sendBookEmail(book: BookRecord, baseUrl: string) {
  if (!book.contact.includes("@")) return;
  const url = `${baseUrl}/story/${book.id}`;
  const body = `<h2 style="margin:0 0 8px">${esc(book.child_name)}'s story is ready</h2>
     <p>Here's the link to ${esc(book.child_name)}'s story and your parent guide.</p>
     ${btn(url, "Open the story")} ${btn(`${baseUrl}${guideUrl(book.slug)}`, "Open the parent guide", "#2b2d6b")}
     <p style="font-size:13px;color:#6b5f58;margin-top:16px">Keep this email: the link is your way back to the story any time.</p>
     <p style="margin-top:16px">Did your child enjoy it? <a href="${baseUrl}/reviews/new?tale=${encodeURIComponent(book.slug)}" style="color:#e8673f;font-weight:700">Tell other families</a>.</p>`;
  await send(book.contact, `${book.child_name}'s story is ready`, shell("en", body));
}

/** Admin alert for every Series order (LAUNCH-PLAN §2). Goes to ADMIN_NOTIFY_EMAIL only. */
export async function sendOrderNotice(o: OrderRecord, baseUrl: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;
  const rows: [string, string][] = [
    ["Order", o.id], ["Child", `${o.child.name}, ${o.child.age}, ${o.child.gender}`], ["Books", `${booksLabel(orderQuantity(o))} · ${o.books.map((b) => b.struggle).join(" · ")}`],
    ["Parent", `${o.parent.name} · ${o.parent.whatsapp}`], ["Address", `${o.parent.street}, ${o.parent.city}, ${o.parent.governorate}`],
    ...(o.parent.gift ? [["Gift", `for ${o.parent.gift.recipient}${o.parent.gift.message ? ` · first page: "${o.parent.gift.message}"` : ""}${o.parent.gift.hide_price ? " · NO PRICE in the parcel" : ""}`] as [string, string]] : []),
    ["Total", `${o.total ? `${o.total} EGP (cash on delivery)` : "Free"}${o.promo_code ? ` · ${o.promo_code}` : ""}`], ["Source", o.ref || "direct"],
  ];
  const body = `<h2 style="margin:0 0 8px">New Series order ${esc(o.id)}</h2>
     <table style="font-size:14px;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b5f58">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join("")}</table>
     ${btn(`${baseUrl}/admin/series/${o.id}`, "Open in admin")}`;
  await send(to, `New order ${o.id} · ${o.child.name} · ${booksLabel(orderQuantity(o))} · ${o.total ? `${o.total} EGP` : `Free (${o.promo_code})`}`, shell("en", body));
}

/** Admin alert: a new review is waiting for approval (Admin → Reviews). */
export async function sendReviewNotice(r: Review, baseUrl: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;
  const media = [r.media.filter((m) => m.type === "image").length && `${r.media.filter((m) => m.type === "image").length} photo(s)`, r.media.some((m) => m.type === "video") && "1 video"].filter(Boolean).join(", ") || "no photos";
  const body = `<h2 style="margin:0 0 8px">New review to check: ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</h2>
     <p><b>${esc(r.first_name)}</b>${r.city ? `, ${esc(r.city)}` : ""}${r.child_age ? ` · child ${r.child_age}` : ""} · ${media}</p>
     <p style="white-space:pre-wrap;background:#fff8ef;border-radius:12px;padding:12px">${esc(r.text.slice(0, 1200))}${r.text.length > 1200 ? "…" : ""}</p>
     ${btn(`${baseUrl}/admin/reviews?status=pending`, "Approve or hide")}
     <p style="font-size:13px;color:#6b5f58">It stays hidden until you approve it.</p>`;
  await send(to, `New review to check · ${r.rating}★ · ${r.first_name}`, shell("en", body));
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
