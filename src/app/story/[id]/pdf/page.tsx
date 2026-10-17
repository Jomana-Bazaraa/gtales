import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Footer, Header } from "@/components/SiteChrome";
import { PdfWaiter } from "@/components/story/PdfWaiter";
import { getBook } from "@/lib/db";
import { requestPdf } from "@/lib/pdf-jobs";

export const dynamic = "force-dynamic";

/** "Your PDF is being made" (SPEC §8): queues the render job, then waits for it. */
export default async function PdfPage({ params }: PageProps<"/story/[id]/pdf">) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();
  const state = await requestPdf(id, "parent");
  if (state?.status === "done") redirect(`/api/books/${id}/pdf`);
  return (
    <>
      <Header />
      <main className="flex-1 w-full bg-surface-tint">
        <section className="mx-auto max-w-xl px-4 py-12 flex flex-col gap-4 text-center">
          <h1 className="text-[28px] leading-8 md:text-[36px] md:leading-10 font-bold text-balance">{book.child_name}&apos;s PDF is being made</h1>
          <p className="m-0 text-[16px] leading-6 text-ink-soft">This takes about two minutes the first time. Keep this page open: the PDF opens by itself when it is ready. After that it opens straight away.</p>
          <PdfWaiter id={id} />
          <Link href={`/story/${id}/read`} className="btn-secondary self-center">Read the story while you wait</Link>
          <Link href={`/story/${id}`} className="text-[15px] font-extrabold text-sky">Back to the story page</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
