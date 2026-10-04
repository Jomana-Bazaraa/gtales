import { cookies } from "next/headers";
import { Footer, Header } from "@/components/SiteChrome";
import { CreateForm } from "@/components/form/CreateForm";
import type { Lang } from "@/lib/i18n";

export default async function CreatePage() {
  const store = await cookies();
  const lang = (store.get("lang")?.value === "ar" ? "ar" : "en") as Lang;
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-6 sm:py-10 w-full">
        <CreateForm initialLang={lang} />
      </main>
      <Footer />
    </>
  );
}
