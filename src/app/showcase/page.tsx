import "@fontsource/andika/400.css";
import "@fontsource/andika/700.css";
import { Reader } from "@/components/story/Reader";
import { showcaseStory } from "@/lib/showcase";

/** "Read Adam's story" from the landing: the sample story in the book reader. */
export default async function ShowcasePage() {
  const sample = await showcaseStory("en");
  return <Reader story={sample} backHref="/" />;
}
