import { KEEPERS, type KeeperId } from "@/lib/keepers";

/** Original, simple SVG portraits of each Keeper — used across the site until reference art is supplied. */
export function KeeperAvatar({ id, size = 120, mood = "calm", className = "" }: { id: KeeperId; size?: number; mood?: "calm" | "trouble"; className?: string }) {
  const k = KEEPERS[id];
  const c = k.color;
  const eyes = (
    <>
      <circle cx="42" cy="52" r="5" fill="#2a2320" />
      <circle cx="62" cy="52" r="5" fill="#2a2320" />
      <circle cx="44" cy="50" r="1.6" fill="#fff" />
      <circle cx="64" cy="50" r="1.6" fill="#fff" />
    </>
  );
  const mouth = mood === "calm" ? <path d="M44 66 Q52 74 60 66" stroke="#2a2320" strokeWidth="3" fill="none" strokeLinecap="round" /> : <path d="M44 70 Q52 64 60 70" stroke="#2a2320" strokeWidth="3" fill="none" strokeLinecap="round" />;
  const brows = mood === "trouble" ? <><path d="M36 42 L46 46" stroke="#2a2320" strokeWidth="3" strokeLinecap="round" /><path d="M68 42 L58 46" stroke="#2a2320" strokeWidth="3" strokeLinecap="round" /></> : null;

  let body: React.ReactNode;
  switch (id) {
    case "blaze": {
      const fc = mood === "calm" ? "#5bb3f0" : c;
      body = (
        <>
          <path d="M52 8 C70 30 82 42 80 62 C78 84 64 94 52 94 C40 94 26 84 24 62 C22 42 34 30 52 8 Z" fill={fc} />
          <path d="M52 30 C60 42 68 50 66 64 C64 78 58 84 52 84 C46 84 40 78 38 64 C36 50 44 42 52 30 Z" fill={mood === "calm" ? "#bfe4ff" : "#ffd27a"} opacity=".8" />
          {mood === "trouble" && <><path d="M30 26 L36 40" stroke={c} strokeWidth="5" strokeLinecap="round" /><path d="M74 26 L68 40" stroke={c} strokeWidth="5" strokeLinecap="round" /></>}
        </>
      );
      break;
    }
    case "wisp": {
      const fc = mood === "calm" ? "#ffffff" : "#b9bddb";
      body = (
        <>
          <ellipse cx="52" cy="62" rx="36" ry="24" fill={fc} stroke={c} strokeWidth="3" />
          <circle cx="30" cy="54" r="14" fill={fc} stroke={c} strokeWidth="3" />
          <circle cx="50" cy="42" r="18" fill={fc} stroke={c} strokeWidth="3" />
          <circle cx="72" cy="52" r="14" fill={fc} stroke={c} strokeWidth="3" />
          <ellipse cx="52" cy="60" rx="33" ry="20" fill={fc} />
          <circle cx="36" cy="62" r="3" fill="#f6b4b4" /><circle cx="68" cy="62" r="3" fill="#f6b4b4" />
          {mood === "trouble" && <><path d="M40 90 l0 6" stroke={c} strokeWidth="3" strokeLinecap="round" /><path d="M62 92 l0 6" stroke={c} strokeWidth="3" strokeLinecap="round" /></>}
        </>
      );
      break;
    }
    case "pip":
      body = (
        <>
          <ellipse cx="52" cy="62" rx="30" ry="28" fill={c} />
          <ellipse cx="52" cy="70" rx="16" ry="14" fill="#fff3cf" />
          <path d="M52 60 l-6 6 l12 0 z" fill="#e8673f" />
          <path d="M50 34 q6 -14 10 -2" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M26 66 q-10 6 -6 16" stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M78 66 q10 6 6 16" stroke={c} strokeWidth="6" fill="none" strokeLinecap="round" />
          <text x="76" y="30" fontSize="14" fill={mood === "calm" ? "#2b2d6b" : "#c9c9c9"}>♪</text>
        </>
      );
      break;
    case "zigzag":
      body = (
        <>
          <path d="M28 30 L40 48 L64 48 L76 30 L74 56 L30 56 Z" fill={c} />
          <ellipse cx="52" cy="62" rx="26" ry="24" fill={c} />
          <ellipse cx="52" cy="70" rx="14" ry="12" fill="#fff6ea" />
          <path d={mood === "calm" ? "M20 80 q-8 -16 6 -24" : "M22 82 q-14 -10 2 -22 q-10 8 0 16"} stroke="#14b8a6" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d={mood === "calm" ? "M84 80 q8 -16 -6 -24" : "M82 82 q14 -10 -2 -22 q10 8 0 16"} stroke="#e8673f" strokeWidth="7" fill="none" strokeLinecap="round" />
          <ellipse cx="52" cy="66" rx="4" ry="3" fill="#2a2320" />
        </>
      );
      break;
    case "bolt":
      body = (
        <>
          <ellipse cx="52" cy="78" rx="18" ry="16" fill={mood === "calm" ? "#ffe27a" : "#e0d8c0"} />
          {mood === "calm" && <ellipse cx="52" cy="78" rx="28" ry="24" fill="#ffe27a" opacity=".35" />}
          <ellipse cx="52" cy="56" rx="20" ry="18" fill="#2b2d6b" />
          <ellipse cx="34" cy="60" rx="14" ry="8" fill="#cfe4f7" opacity=".8" transform="rotate(-25 34 60)" />
          <ellipse cx="70" cy="60" rx="14" ry="8" fill="#cfe4f7" opacity=".8" transform="rotate(25 70 60)" />
          <path d="M44 40 q-4 -10 -10 -12" stroke="#2b2d6b" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M60 40 q4 -10 10 -12" stroke="#2b2d6b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case "chroma":
      body = (
        <>
          <defs>
            <linearGradient id={`ch-${mood}`} x1="0" x2="1">
              {mood === "calm" ? (
                <><stop offset="0" stopColor="#14b8a6" /><stop offset=".5" stopColor="#f2b134" /><stop offset="1" stopColor="#9b6bd6" /></>
              ) : (
                <><stop offset="0" stopColor="#9a9a9a" /><stop offset="1" stopColor="#c4c4c4" /></>
              )}
            </linearGradient>
          </defs>
          <ellipse cx="52" cy="64" rx="34" ry="24" fill={`url(#ch-${mood})`} />
          <path d="M84 70 q14 8 2 18 q-10 6 -8 -6" stroke={mood === "calm" ? "#14b8a6" : "#9a9a9a"} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M38 40 l6 -10 l6 10 M50 40 l6 -10 l6 10" stroke="#7fae5b" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case "willow":
      body = (
        <>
          <rect x="42" y="56" width="20" height="38" rx="8" fill="#8a5a3c" />
          <ellipse cx="52" cy="40" rx="34" ry="24" fill={mood === "calm" ? c : "#b8c79a"} />
          {[-24, -12, 0, 12, 24].map((dx) => (
            <path key={dx} d={`M${52 + dx} 52 q${dx / 4} 18 ${dx / 3} 30`} stroke={mood === "calm" ? c : "#b8c79a"} strokeWidth="4" fill="none" strokeLinecap="round" />
          ))}
          {mood === "calm" && <><circle cx="30" cy="34" r="3" fill="#f6b4b4" /><circle cx="70" cy="30" r="3" fill="#f6b4b4" /></>}
          {mood === "trouble" && <><path d="M20 80 l-4 8" stroke="#b8c79a" strokeWidth="3" strokeLinecap="round" /><path d="M84 76 l4 8" stroke="#b8c79a" strokeWidth="3" strokeLinecap="round" /></>}
        </>
      );
      break;
    case "pebble":
      body = (
        <>
          <ellipse cx="52" cy="66" rx="36" ry="26" fill={c} />
          {[[40, 58], [52, 54], [64, 58], [46, 70], [58, 70]].map(([x, y]) => (
            <polygon key={`${x}${y}`} points={`${x},${y - 6} ${x + 5},${y - 3} ${x + 5},${y + 3} ${x},${y + 6} ${x - 5},${y + 3} ${x - 5},${y - 3}`} fill="#7fb3c9" />
          ))}
          {mood === "calm" ? (
            <><ellipse cx="52" cy="38" rx="14" ry="12" fill="#9bd1a2" /><ellipse cx="24" cy="84" rx="8" ry="6" fill="#9bd1a2" /><ellipse cx="80" cy="84" rx="8" ry="6" fill="#9bd1a2" /></>
          ) : (
            <ellipse cx="52" cy="60" rx="12" ry="8" fill="#9bd1a2" />
          )}
        </>
      );
      break;
    case "tangle":
      body = (
        <>
          {mood === "calm" ? (
            <g stroke="#d9d0ea" strokeWidth="1.5" fill="none">
              <circle cx="52" cy="52" r="40" /><circle cx="52" cy="52" r="28" /><circle cx="52" cy="52" r="16" />
              <path d="M52 12 V92 M12 52 H92 M24 24 L80 80 M80 24 L24 80" />
            </g>
          ) : (
            <path d="M14 30 q30 40 10 60 q40 -30 60 0 q-10 -40 10 -60 q-40 20 -80 0" stroke="#d9d0ea" strokeWidth="2" fill="none" />
          )}
          <ellipse cx="52" cy="62" rx="22" ry="20" fill={c} />
          {[-1, 1].map((s) => [0, 1, 2, 3].map((i) => <path key={`${s}${i}`} d={`M${52 + s * 18} ${56 + i * 6} q${s * 14} ${-4 + i * 4} ${s * 20} ${8}`} stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />))}
          <path d="M40 40 l6 6 l6 -6 l-6 -2 z" fill="#e8673f" />
        </>
      );
      break;
  }
  const faceOffset = id === "chroma" || id === "pebble" ? 10 : id === "willow" ? -14 : 0;
  return (
    <svg viewBox="0 0 104 104" width={size} height={size} className={className} role="img" aria-label={k.name.en}>
      {body}
      <g transform={`translate(0 ${faceOffset})`}>
        {eyes}
        {brows}
        {mouth}
      </g>
    </svg>
  );
}
