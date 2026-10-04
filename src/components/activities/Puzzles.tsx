/** Code-generated puzzles rendered as SVG (print-safe, RTL-safe). */
import type { Maze, WordSearch } from "@/lib/activities/generators";

export function MazeSvg({ maze, showSolution = false, startLabel, endLabel }: { maze: Maze; showSolution?: boolean; startLabel?: string; endLabel?: string }) {
  const cell = 40, pad = 10;
  const W = maze.w * cell + pad * 2, H = maze.h * cell + pad * 2;
  const lines: string[] = [];
  for (let y = 0; y < maze.h; y++)
    for (let x = 0; x < maze.w; x++) {
      const w = maze.walls[y][x];
      const x0 = pad + x * cell, y0 = pad + y * cell;
      if (w & 1) lines.push(`M${x0} ${y0} h${cell}`);
      if (w & 2) lines.push(`M${x0 + cell} ${y0} v${cell}`);
      if (w & 4) lines.push(`M${x0} ${y0 + cell} h${cell}`);
      if (w & 8) lines.push(`M${x0} ${y0} v${cell}`);
    }
  const sol = maze.solution.map(([x, y], i) => `${i ? "L" : "M"}${pad + x * cell + cell / 2} ${pad + y * cell + cell / 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md mx-auto" direction="ltr">
      <rect x={pad + 2} y={pad + 2} width={cell - 4} height={cell - 4} rx="6" fill="#fbe3d8" />
      <rect x={pad + (maze.w - 1) * cell + 2} y={pad + (maze.h - 1) * cell + 2} width={cell - 4} height={cell - 4} rx="6" fill="#d8f5f0" />
      <path d={lines.join(" ")} stroke="#2a2320" strokeWidth="4" strokeLinecap="round" fill="none" />
      {showSolution && <path d={sol} stroke="#e8673f" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />}
      <text x={pad + cell / 2} y={pad + cell / 2 + 5} textAnchor="middle" fontSize="16">{startLabel ?? "🔥"}</text>
      <text x={pad + (maze.w - 1) * cell + cell / 2} y={pad + (maze.h - 1) * cell + cell / 2 + 6} textAnchor="middle" fontSize="16">{endLabel ?? "💧"}</text>
    </svg>
  );
}

export function WordSearchGrid({ ws, rtl, showSolution = false }: { ws: WordSearch; rtl: boolean; showSolution?: boolean }) {
  const cell = 34, pad = 4;
  const S = ws.size * cell + pad * 2;
  // Arabic: columns rendered right-to-left so horizontal words read naturally
  const col = (x: number) => (rtl ? ws.size - 1 - x : x);
  return (
    <div>
      <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-sm mx-auto" direction="ltr">
        {ws.grid.map((row, y) =>
          row.map((ch, x) => (
            <g key={`${x}-${y}`}>
              <rect x={pad + col(x) * cell} y={pad + y * cell} width={cell} height={cell} fill="#fff" stroke="#ead9c6" />
              <text x={pad + col(x) * cell + cell / 2} y={pad + y * cell + cell / 2 + 7} textAnchor="middle" fontSize="18" fontWeight="700" fill="#2a2320">{ch}</text>
            </g>
          )),
        )}
        {showSolution &&
          ws.placements.map((p) => {
            const n = [...p.word].length;
            const x1 = pad + col(p.x) * cell + cell / 2, y1 = pad + p.y * cell + cell / 2;
            const x2 = pad + col(p.x + p.dx * (n - 1)) * cell + cell / 2, y2 = pad + (p.y + p.dy * (n - 1)) * cell + cell / 2;
            return <line key={p.word} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e8673f" strokeWidth={cell * 0.7} strokeLinecap="round" opacity=".3" />;
          })}
      </svg>
      <ul className="flex flex-wrap justify-center gap-2 mt-3">
        {ws.words.map((w) => (
          <li key={w} className="chip !cursor-default !min-h-0 !py-1.5">{w}</li>
        ))}
      </ul>
    </div>
  );
}

export function DotsSvg({ points, showLines = false }: { points: Array<[number, number]>; showLines?: boolean }) {
  const S = 320;
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x * S} ${y * S}`).join(" ") + " Z";
  return (
    <svg viewBox={`-10 -10 ${S + 20} ${S + 20}`} className="w-full max-w-sm mx-auto" direction="ltr">
      {showLines && <path d={path} stroke="#e8673f" strokeWidth="3" fill="#fbe3d8" strokeLinejoin="round" />}
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x * S} cy={y * S} r="5" fill="#2a2320" />
          <text x={x * S + 9} y={y * S - 6} fontSize="13" fontWeight="700" fill="#2b2d6b">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export function BreathingStar({ animate }: { animate: boolean }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 60 : 140, a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${160 + r * Math.cos(a)},${160 + r * Math.sin(a)}`);
  }
  return (
    <svg viewBox="0 0 320 320" className="w-56 h-56 sm:w-64 sm:h-64 mx-auto" direction="ltr">
      <polygon points={pts.join(" ")} fill="none" stroke="#2b2d6b" strokeWidth="4" strokeLinejoin="round" strokeDasharray="6 8" />
      <circle cx="160" cy="160" r="110" fill="#5bb3f0" opacity=".25" className={animate ? "breathe" : ""} style={{ transformOrigin: "160px 160px" }} />
      <polygon points={pts.join(" ")} fill="none" stroke="#e8673f" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const [x, y] = p.split(",").map(Number);
        return i % 2 === 0 ? <text key={i} x={x} y={y - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#2b2d6b">{i / 2 + 1}</text> : null;
      })}
    </svg>
  );
}

export function Thermometer({ label, color }: { label: string; color: string }) {
  return (
    <svg viewBox="0 0 120 300" className="h-56 mx-auto" direction="ltr">
      <rect x="45" y="20" width="30" height="220" rx="15" fill="#fff" stroke="#2a2320" strokeWidth="3" />
      <circle cx="60" cy="255" r="30" fill="#fff" stroke="#2a2320" strokeWidth="3" />
      <circle cx="60" cy="255" r="18" fill={color} opacity=".4" />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1="75" y1={40 + i * 50} x2="90" y2={40 + i * 50} stroke="#2a2320" strokeWidth="2" />
          <text x="96" y={44 + i * 50} fontSize="12" fill="#6b5f58">{5 - i}</text>
        </g>
      ))}
      <text x="60" y="292" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2b2d6b">{label}</text>
    </svg>
  );
}

export function WritingLines({ n = 3 }: { n?: number }) {
  return (
    <div className="space-y-5 mt-3">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="border-b-2 border-dashed border-line h-8" />
      ))}
    </div>
  );
}

export function DrawFrame({ className = "" }: { className?: string }) {
  return <div className={`rounded-2xl border-[3px] border-dashed border-indigo/40 bg-white aspect-[4/3] ${className}`} />;
}
