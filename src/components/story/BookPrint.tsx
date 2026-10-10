/**
 * Print layout for engine stories — docs/SPEC.md §8.
 * A4 portrait, 16 pages: cover + 15 story pages (back cover printed separately).
 * Picture full width on top (5:4, 3 mm bleed), sign over it, text below; challenges as circles to tick.
 * The PDF renderer steps the font down on `.txt` elements that overflow (never below 15 pt).
 */
import type { BookRecord } from "@/lib/types";
import { storyImage } from "@/stories/images";
import type { Challenge } from "@/stories/schema";

const A4 = { w: 210, h: 297, bleed: 3 };

export function BookPrint({ book }: { book: BookRecord }) {
  const s = book.story;
  const img = (f: string) => storyImage(book.slug, book.gender, f);
  return (
    <div className="print-a4">
      <style>{`
        @page { size: A4; margin: 0; }
        html, body { margin: 0; background: #fff; }
        .a4 { width: ${A4.w}mm; height: ${A4.h}mm; position: relative; overflow: hidden; page-break-after: always; background: #fff; font-family: "Andika", "Nunito Variable", sans-serif; color: #3d2b1f; }
        .a4:last-child { page-break-after: auto; }
        .pic { position: absolute; left: -${A4.bleed}mm; top: -${A4.bleed}mm; width: ${A4.w + 2 * A4.bleed}mm; height: ${(A4.w + 2 * A4.bleed) * 4 / 5}mm; object-fit: cover; display: block; }
        .sign { position: absolute; left: 16mm; right: 16mm; top: 18mm; text-align: center; font-style: italic; font-weight: 700; font-size: 17pt; line-height: 1.25; }
        .txt { position: absolute; left: 16mm; right: 16mm; top: ${Math.round((A4.w + 2 * A4.bleed) * 4 / 5 - A4.bleed + 9)}mm; bottom: 16mm; font-size: 19pt; line-height: 1.55; overflow: hidden; }
        .txt p { margin: 0 0 5mm; }
        .ch { margin-top: 4mm; padding: 4mm 5mm; border: 0.6mm solid #e4e1f5; border-radius: 5mm; font-size: 15pt; }
        .ch .q { font-weight: 700; margin: 0 0 3mm; }
        .ch .opts { display: flex; flex-wrap: wrap; gap: 3mm 8mm; }
        .ch .opt { display: inline-flex; align-items: center; gap: 2.5mm; }
        .ch .circle { width: 6mm; height: 6mm; border: 0.6mm solid #3d2b1f; border-radius: 50%; display: inline-block; }
        .ch .box { width: 7mm; height: 7mm; border: 0.6mm solid #3d2b1f; border-radius: 1.5mm; display: inline-block; }
        .num { position: absolute; bottom: 7mm; left: 0; right: 0; text-align: center; font-size: 11pt; font-weight: 700; color: rgba(61,43,31,.55); }
        .cover { background: #fbf5e9; }
        .cover .pic { height: ${(A4.w + 2 * A4.bleed) * 7 / 5}mm; }
        .cover .title { position: absolute; left: 14mm; right: 14mm; bottom: 16mm; font-family: "Fredoka Variable", "Nunito Variable", sans-serif; font-weight: 700; font-size: 30pt; line-height: 1.1; color: #1e1b4b; text-shadow: 0 0 6mm #fff, 0 0 2mm #fff; }
        .cover .star { font-size: 14pt; font-weight: 700; margin-top: 3mm; display: block; }
        .ded { background: #fbf5e9; display: flex; align-items: center; justify-content: center; text-align: center; padding: 30mm; font-style: italic; font-size: 20pt; line-height: 1.6; }
      `}</style>

      <section className="a4 cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pic" src={img("cover.jpg")} alt="" />
        <div className="title">{s.title}<span className="star">starring {book.child_name}</span></div>
      </section>

      {book.dedication && <section className="a4 ded"><p style={{ margin: 0 }}>{book.dedication}</p></section>}

      {s.pages.map((p) => (
        <section className="a4" key={p.n}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pic" src={img(p.image)} alt="" />
          {p.sign && <div className="sign">{p.sign}</div>}
          <div className="txt" data-page={p.n}>
            {p.text.map((t, k) => <p key={k}>{t}</p>)}
            {p.challenge && <PrintChallenge c={p.challenge} />}
          </div>
          <div className="num">— {p.n} —</div>
        </section>
      ))}
    </div>
  );
}

function PrintChallenge({ c }: { c: Challenge }) {
  return (
    <div className="ch">
      <p className="q">Your turn: {c.question}</p>
      {c.riddle?.map((l, k) => <p key={k} style={{ margin: "0 0 2mm", fontStyle: "italic" }}>{l}</p>)}
      {(c.type === "choice" || c.type === "riddle") && (
        <div className="opts">{c.options?.map((o, k) => <span key={k} className="opt"><span className="circle" />{o.label}</span>)}</div>
      )}
      {c.type === "steps" && (
        <div className="opts" style={{ flexDirection: "column", gap: "2mm" }}>{c.steps?.map((st, k) => <span key={k} className="opt"><span className="box" />{st}</span>)}</div>
      )}
      {c.type === "boxes" && (
        <div className="opts">{Array.from({ length: c.count ?? 3 }).map((_, k) => <span key={k} className="box" />)}</div>
      )}
      {c.type === "say" && <p style={{ margin: 0, fontWeight: 700 }}>Say it out loud: “{c.line ?? c.question}”</p>}
    </div>
  );
}
