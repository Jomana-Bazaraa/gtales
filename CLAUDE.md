@AGENTS.md

# GTales
1. Read `docs/CONTEXT.md` first — the shared working context between Ayman and Jomana: current state, decisions, open items, worklog. Then read `docs/SPEC.md` fully before writing any code; it is the source of truth for copy, screens, forms, pricing, tracking and acceptance criteria. When a screen and the spec disagree, the spec wins: update the spec first.
2. Before every push: run `npm test` and `npm run build`, then add one worklog line to `docs/CONTEXT.md` (date · who · what changed · what the other person must do) and update its *Current state* / *Open items* if they changed. Commit it with the code.
3. Product config (tales, pricing, promises, CTAs) lives in `src/lib/gtales.ts`; template keys never change, only display names. Never put secrets in the repo.
