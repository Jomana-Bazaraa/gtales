/**
 * PDF rendering via headless Chrome. Renders /story/[id]/print?variant=color|lineart
 * On Vercel: @sparticuz/chromium + puppeteer-core. Locally: uses PUPPETEER_EXECUTABLE_PATH or a system Chrome.
 * Set PDF_DISABLED=1 to skip PDFs entirely (dev without Chrome).
 */
import { putFile } from "./db";

export async function renderStoryPdf(id: string, variant: "color" | "lineart", baseUrl: string): Promise<string> {
  if (process.env.PDF_DISABLED === "1") {
    return `${baseUrl}/story/${id}/print?variant=${variant}`; // fallback: link to printable page
  }
  const puppeteer = await import("puppeteer-core");
  let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  let args: string[] = ["--no-sandbox", "--disable-setuid-sandbox"];
  if (process.env.VERCEL || !executablePath) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }
  const browser = await puppeteer.launch({ executablePath, args, headless: true });
  try {
    const page = await browser.newPage();
    const token = process.env.INTERNAL_RENDER_TOKEN || "dev";
    await page.goto(`${baseUrl}/story/${id}/print?variant=${variant}&token=${token}`, { waitUntil: "load", timeout: 90_000 });
    await page.evaluate(async () => {
      await (document as Document).fonts.ready;
      await Promise.all(Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise<void>((r) => { i.onload = () => r(); i.onerror = () => r(); })));
    });
    const pdf = await page.pdf({ width: "200mm", height: "200mm", printBackground: true, preferCSSPageSize: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
    return putFile(`${id}/${variant}.pdf`, Buffer.from(pdf), "application/pdf");
  } finally {
    await browser.close();
  }
}

/** GTales free story: A4 portrait, 16 pages (SPEC §8). Renders /story/[id]/print. */
export async function renderBookPdf(id: string, baseUrl: string): Promise<string> {
  if (process.env.PDF_DISABLED === "1") return `${baseUrl}/story/${id}/print`;
  const puppeteer = await import("puppeteer-core");
  let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  let args: string[] = ["--no-sandbox", "--disable-setuid-sandbox"];
  if (process.env.VERCEL || !executablePath) {
    const chromium = (await import("@sparticuz/chromium")).default;
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }
  const browser = await puppeteer.launch({ executablePath, args, headless: true });
  try {
    const page = await browser.newPage();
    const token = process.env.INTERNAL_RENDER_TOKEN || "dev";
    await page.goto(`${baseUrl}/story/${id}/print?token=${token}`, { waitUntil: "load", timeout: 90_000 });
    await page.evaluate(async () => {
      await (document as Document).fonts.ready;
      await Promise.all(Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise<void>((r) => { i.onload = () => r(); i.onerror = () => r(); })));
    });
    // Font step-down for overflowing pages (SPEC §8): shrink one step at a time, never below 15pt, and log.
    const shrunk = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>(".a4 .txt").forEach((el) => {
        let size = parseFloat(getComputedStyle(el).fontSize) * 0.75; // px → pt
        while (el.scrollHeight > el.clientHeight + 1 && size > 15) {
          size -= 1;
          el.style.fontSize = `${size}pt`;
        }
        if (el.scrollHeight > el.clientHeight + 1) out.push(`${el.dataset.page}: still overflows at 15pt`);
        else if (el.style.fontSize) out.push(`${el.dataset.page}: ${size}pt`);
      });
      return out;
    });
    if (shrunk.length) console.warn("[pdf] font step-down:", shrunk.join("; "));
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
    return putFile(`${id}/story.pdf`, Buffer.from(pdf), "application/pdf");
  } finally {
    await browser.close();
  }
}
