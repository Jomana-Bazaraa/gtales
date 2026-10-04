import { Footer, Header } from "@/components/SiteChrome";
import { MyStoriesForm } from "@/components/MyStoriesForm";

export default function MyStoriesPage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-lg px-4 py-12 w-full">
        <MyStoriesForm />
      </main>
      <Footer />
    </>
  );
}
