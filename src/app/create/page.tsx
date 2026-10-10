import type { Metadata } from "next";
import { Header } from "@/components/SiteChrome";
import { CreateForm } from "@/components/form/CreateForm";
import { taleBySlug } from "@/lib/gtales";

export const metadata: Metadata = { title: "Try a free story — GTales" };

/** Free story form — docs/SPEC.md §7. `?tale=<slug>` pre-selects step 1. */
export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.tale) ? sp.tale[0] : sp.tale;
  const tale = raw && taleBySlug(raw) ? raw : undefined;
  return (
    <>
      <Header />
      <main className="flex-1 w-full bg-white">
        <CreateForm initialTale={tale} />
      </main>
    </>
  );
}
