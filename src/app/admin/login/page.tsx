export default async function AdminLogin({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <form action="/api/admin/login" method="post" className="card p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">GTales admin</h1>
        <input name="password" type="password" placeholder="Password" className="field mb-3" autoFocus />
        {sp.error && <p className="text-sm text-coral-dark mb-3">Wrong password.</p>}
        <button className="btn-primary w-full">Log in</button>
      </form>
    </div>
  );
}
