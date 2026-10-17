/**
 * Client-side tracking (SPEC §13, LAUNCH-PLAN §1b). No personal data: a random session id kept in the
 * browser, the first source the visitor came from (?ref= / ?utm_source= / ?code=), and the event.
 */
const SID = "gtales.sid";
const REF = "gtales.ref";
const clean = (s: string) => s.replace(/[^a-z0-9_-]/gi, "").slice(0, 60);

export function sessionId(): string | undefined {
  try {
    let id = localStorage.getItem(SID);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(SID, id); }
    return id;
  } catch { return undefined; }
}

/** Remembers the first source seen; a later visit with a new ?ref doesn't overwrite it. */
export function captureSource(): void {
  try {
    const q = new URLSearchParams(location.search);
    const r = q.get("ref") || q.get("utm_source") || q.get("code");
    if (r && !localStorage.getItem(REF)) localStorage.setItem(REF, clean(r));
  } catch {}
}
export function source(): string | undefined {
  try { captureSource(); const r = localStorage.getItem(REF); return r ? clean(r) : undefined; } catch { return undefined; }
}

export function track(event: string, data: { story_id?: string; order_id?: string; page?: string | number; meta?: Record<string, unknown> } = {}): void {
  try {
    const ref = source();
    const body = JSON.stringify({ event, ...data, session_id: sessionId(), meta: { ...data.meta, ...(ref ? { ref } : {}) } });
    if (!navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) {
      fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}
