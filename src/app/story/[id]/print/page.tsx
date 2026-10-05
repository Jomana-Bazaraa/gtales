import { notFound } from "next/navigation";
import { PrintBook } from "@/components/story/PrintBook";
import { getStory } from "@/lib/db";
import { showcaseStory } from "@/lib/showcase";

/** Print-only route used by the PDF renderer. Same components as the web view. */
export default async function PrintPage({ params, searchParams }: PageProps<"/story/[id]/print">) {
  const { id } = await params;
  const sp = await searchParams;
  const variant = sp.variant === "lineart" ? "lineart" : "color";
  const story = id === "showcase" ? await showcaseStory(sp.lang === "ar" ? "ar" : "en") : await getStory(id);
  if (!story || !story.assembled) notFound();
  return (
    <div className="bg-white">
      <style>{`@page { size: 200mm 200mm; margin: 0; } html, body { background: #fff; margin: 0; }`}</style>
      <PrintBook story={story} variant={variant} />
    </div>
  );
}
