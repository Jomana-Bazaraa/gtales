import { notFound } from "next/navigation";
import { StoryBook } from "@/components/story/StoryBook";
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
      <style>{`@page { size: A4; margin: 0; } body { background: #fff; }`}</style>
      <StoryBook story={story} mode="print" variant={variant} />
    </div>
  );
}
