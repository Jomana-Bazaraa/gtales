import Link from "next/link";
import { Footer, Header } from "@/components/SiteChrome";
import { KeeperAvatar } from "@/components/KeeperAvatar";
import { consumeMagicToken, storiesByEmail } from "@/lib/db";
import { KEEPERS, STRUGGLES } from "@/lib/keepers";

export default async function MyStoriesListPage({ params }: PageProps<"/my-stories/[token]">) {
  const { token } = await params;
  const email = await consumeMagicToken(token);
  const stories = email ? await storiesByEmail(email) : [];
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-2xl px-4 py-10 w-full">
        {!email ? (
          <div className="card p-8 text-center">
            <p className="font-bold mb-3">This link has expired.</p>
            <Link href="/my-stories" className="btn-primary">Request a new one</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-5">Stories for {email}</h1>
            <ul className="space-y-3">
              {stories.map((s) => {
                const k = s.keeper_id ? KEEPERS[s.keeper_id] : null;
                const st = STRUGGLES.find((x) => x.id === s.input.struggle);
                return (
                  <li key={s.id}>
                    <Link href={s.status === "ready" ? `/story/${s.id}` : `/story/${s.id}/status`} className="card p-4 flex items-center gap-4 hover:border-coral">
                      {k ? <KeeperAvatar id={k.id} size={52} /> : <span className="w-13 h-13" />}
                      <div className="flex-1">
                        <div className="font-bold">{s.assembled?.title ?? s.input.childName}</div>
                        <div className="text-sm text-ink-soft">{st?.label[s.input.language]} · {new Date(s.created_at).toLocaleDateString()} · {s.status}</div>
                      </div>
                      <span className="text-coral font-bold">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
