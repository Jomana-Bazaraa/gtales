import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Footer, Header } from "@/components/SiteChrome";
import { consumeMagicToken } from "@/lib/db";
import { sessionCookie } from "@/lib/session";

/** Magic-link landing: turns the token into a session, then opens My stories. */
export default async function MagicLink({ params }: PageProps<"/my-stories/[token]">) {
  const { token } = await params;
  const email = await consumeMagicToken(token);
  if (email) {
    const store = await cookies();
    store.set(sessionCookie({ email, at: Date.now() }));
    redirect("/my-stories");
  }
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-lg px-4 py-16 w-full text-center">
        <div className="card p-8"><p className="font-bold mb-3">This link has expired.</p><Link href="/my-stories" className="btn-primary">Request a new one</Link></div>
      </main>
      <Footer />
    </>
  );
}
