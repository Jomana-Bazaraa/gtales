/**
 * PDF rendering via headless Chrome, for local scripts only (scripts/pdf.mts, scripts/samples.mts).
 * Never imported by the web app: Cloudflare Workers can't run Chrome. Live PDFs are made by the
 * GitHub Action (.github/workflows/pdf.yml → scripts/pdf-worker.mjs).
 * Uses PUPPETEER_EXECUTABLE_PATH or /usr/bin/google-chrome. Set PDF_DISABLED=1 to skip PDFs entirely.
 */
import { putFile } from "./db";

export async function renderStoryPdf(id: string, variant: "color" | "lineart", baseUrl: string): Promise<string> {
  if (process.env.PDF_DISABLED === "1") {
    return `${baseUrl}/story/${id}/print?variant=${variant}`; // fallback: link to printable page
  }
  const puppeteer = await import("puppeteer-core");
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome";
  const args = ["--no-sandbox", "--disable-setuid-sandbox"];
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
