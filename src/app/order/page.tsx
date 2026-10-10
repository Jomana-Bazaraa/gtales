import type { Metadata } from "next";
import { Header } from "@/components/SiteChrome";
import { OrderForm, type Prefill } from "@/components/order/OrderForm";
import { getBook } from "@/lib/db";
import { taleBySlug } from "@/lib/gtales";

export const metadata: Metadata = { title: "Create your child's books — GTales" };
export const dynamic = "force-dynamic";

const STRUGGLE_FROM_TALE: Record<string, string> = { anger: "Tantrums", anxiety: "Worries", bullied: "Being bullied", lying: "Lying", feelings: "Big feelings", friendship: "Making friends" };

/** Series order form — docs/SPEC.md §9. `?story=<id>` pre-fills the hero from a free story. */
export default async function OrderPage({ searchParams }: PageProps<"/order">) {
  const sp = await searchParams;
  const storyId = Array.isArray(sp.story) ? sp.story[0] : sp.story;
  let prefill: Prefill = {};
  if (storyId) {
    const b = await getBook(storyId);
    if (b) prefill = { name: b.child_name, age: b.form.age, gender: b.gender, struggle: STRUGGLE_FROM_TALE[b.slug] ?? taleBySlug(b.slug)?.helps, storyId };
  }
  return (
    <>
      <Header />
      <main className="flex-1 w-full bg-white"><OrderForm prefill={prefill} /></main>
    </>
  );
}
