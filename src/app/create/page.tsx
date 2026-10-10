import type { Metadata } from "next";
import { Header } from "@/components/SiteChrome";
import { CreateForm, type TaleMeta } from "@/components/form/CreateForm";
import { TALES, taleBySlug } from "@/lib/gtales";
import { loadStory } from "@/stories";
import { storyFolder } from "@/stories/images";
import { promises as fs } from "fs";
import path from "path";

export const metadata: Metadata = { title: "Try a free story — GTales" };
export const dynamic = "force-dynamic";

/** Free story form — docs/SPEC.md §7.2. `?tale=<slug>` pre-selects step 1. */
export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.tale) ? sp.tale[0] : sp.tale;
  const tale = raw && taleBySlug(raw) ? raw : undefined;
  const metas: TaleMeta[] = await Promise.all(
    TALES.map(async (t) => {
      const s = await loadStory(t.slug);
      const has = async (g: "boy" | "girl") => fs.access(path.join(process.cwd(), "public", "stories", storyFolder(t.slug), g, "cover.jpg")).then(() => true, () => false);
      const sets = { boy: await has("boy"), girl: await has("girl") };
      return s && (sets.boy || sets.girl)
        ? { slug: t.slug, available: true, sets, uses: s.uses, need_choices: s.need_choices, ask_choices: s.ask_choices, other_rule: s.other_rule }
        : { slug: t.slug, available: false, sets, uses: [], need_choices: [], ask_choices: [], other_rule: null };
    }),
  );
  return (
    <>
      <Header />
      <main className="flex-1 w-full bg-white">
        <CreateForm initialTale={tale} metas={metas} />
      </main>
    </>
  );
}
