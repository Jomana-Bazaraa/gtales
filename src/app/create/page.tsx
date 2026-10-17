import type { Metadata } from "next";
import { Header } from "@/components/SiteChrome";
import { CreateForm, type TaleMeta } from "@/components/form/CreateForm";
import { TALES, taleBySlug } from "@/lib/gtales";
import { loadStory } from "@/stories";
import { hasImageSet } from "@/stories/images";

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
      const sets = { boy: hasImageSet(t.slug, "boy"), girl: hasImageSet(t.slug, "girl") };
      return s && (sets.boy || sets.girl)
        ? { slug: t.slug, available: true, sets, uses: s.uses, title: s.title, other_rule: s.other_rule }
        : { slug: t.slug, available: false, sets, uses: [], title: "", other_rule: null };
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
