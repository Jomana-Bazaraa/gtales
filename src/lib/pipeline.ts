/**
 * Story generation pipeline.
 *   runTextAndImages(id)  — template → 1 text call → assemble → 2 image calls → status ready
 *   runPdfsAndEmail(id)   — 2 PDFs via headless Chrome → email parent
 * Split in two so each stays inside a serverless time budget.
 */
import { generateStoryText } from "./ai";
import { getStory, updateStory } from "./db";
import { generateCover, generateLineArt } from "./images";
import { KEEPERS, struggleById, type KeeperId } from "./keepers";
import { ageBand, defaultWorkshop } from "./activities/registry";
import { assemblePages, fallbackInterest, loadTemplate, slotContext, splitParas, substitute, templateExists, type SubstitutionContext } from "./template-engine";
import type { AssembledStory, StoryPage, StoryRecord } from "./types";
import { renderStoryPdf } from "./pdf";
import { sendStoryEmail } from "./email";

export async function runTextAndImages(id: string): Promise<void> {
  const rec = await getStory(id);
  if (!rec) throw new Error("story not found");
  if (rec.status === "ready") return;
  const { input } = rec;
  await updateStory(id, { status: "generating", progress: "template" });
  try {
    const struggle = struggleById(input.struggle)!;
    const lang = input.language;
    const band = ageBand(input.age);

    // 1. template (static) — "other" has none
    let tpl = null as Awaited<ReturnType<typeof loadTemplate>> | null;
    let keeperId: KeeperId | null = struggle.keeper;
    if (struggle.template) {
      const key = (await templateExists(struggle.template, lang)) ? struggle.template : "blaze-anger"; // TODO: remove fallback once all 11 templates exist
      if (key !== struggle.template) console.warn(`[estoria] template ${struggle.template}.${lang} missing — falling back to blaze-anger`);
      tpl = await loadTemplate(key, lang);
      if (key === "blaze-anger") keeperId = "blaze";
    }

    // 2. the single text call
    await updateStory(id, { progress: "text" });
    const slot = tpl ? slotContext(tpl.pages, "[PERSONAL_DETAIL_SLOT]") : { before: "", after: "" };
    const generated = await generateStoryText({ input, keeper: keeperId, slotBefore: slot.before, slotAfter: slot.after, templateTitle: tpl?.title });
    if (!keeperId) keeperId = (generated.full_story?.keeper as KeeperId) || "chroma";
    if (!KEEPERS[keeperId]) keeperId = "chroma";

    // 3. assemble
    const workshop = defaultWorkshop(input.struggle, keeperId, band);
    const ctx: SubstitutionContext = {
      childName: input.childName,
      gender: input.gender,
      keeper: keeperId,
      lang,
      sidekick: input.sidekick?.name,
      interest: generated.interest_phrases ?? fallbackInterest(input, lang),
      personalDetail: generated.personal_detail_text,
    };
    let assembled: AssembledStory;
    if (tpl) {
      assembled = { title: substitute(tpl.title, ctx), keeper: keeperId, pages: assemblePages(tpl, ctx, workshop), workshop };
    } else {
      const fs = generated.full_story!;
      const pages: StoryPage[] = [{ kind: "cover", title: fs.title, image: "cover" }];
      for (const p of fs.pages) {
        if (p.includes("[INTERACTIVE_SLOT]")) {
          const text = p.replace("[INTERACTIVE_SLOT]", "").trim();
          if (text) pages.push({ kind: "text", paragraphs: splitParas(text) });
          pages.push({ kind: "challenge" });
        } else pages.push({ kind: "text", paragraphs: splitParas(p) });
      }
      if (!pages.some((p) => p.kind === "challenge")) pages.splice(Math.max(2, pages.length - 2), 0, { kind: "challenge" });
      for (const a of workshop) pages.push({ kind: "activity", activity: a });
      pages.push({ kind: "badge" }, { kind: "parents" });
      assembled = { title: fs.title, keeper: keeperId, pages, workshop };
    }
    await updateStory(id, { generated, assembled, keeper_id: keeperId, progress: "images" });

    // 4. images (2 calls)
    const scene = generated.cover_scene || (tpl ? substitute(tpl.coverScene, ctx) : `${input.childName} with ${KEEPERS[keeperId].name.en}`);
    const cover = await generateCover({ storyId: id, keeper: keeperId, scene, appearance: input.appearance, gender: input.gender, age: input.age });
    const lineart = await generateLineArt({ storyId: id, keeper: keeperId, cover });
    await updateStory(id, { cover_url: cover.url, lineart_url: lineart, status: "ready", progress: "pdf" });
  } catch (e) {
    console.error("[estoria] generation failed", e);
    await updateStory(id, { status: "failed", error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}

export async function runPdfsAndEmail(id: string, baseUrl: string): Promise<void> {
  const rec = await getStory(id);
  if (!rec || rec.status !== "ready") return;
  if (rec.pdf_color_url && rec.email_sent_at) return;
  try {
    let patch: Partial<StoryRecord> = {};
    if (!rec.pdf_color_url) {
      const color = await renderStoryPdf(id, "color", baseUrl);
      const lineart = await renderStoryPdf(id, "lineart", baseUrl);
      patch = { pdf_color_url: color, pdf_lineart_url: lineart };
      await updateStory(id, patch);
    }
    if (!rec.email_sent_at) {
      await sendStoryEmail({ ...rec, ...patch }, baseUrl);
      await updateStory(id, { email_sent_at: new Date().toISOString(), progress: "done" });
    }
  } catch (e) {
    console.error("[estoria] pdf/email failed", e);
    await updateStory(id, { error: `pdf/email: ${e instanceof Error ? e.message : String(e)}`, progress: "done" });
  }
}
