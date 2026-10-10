/**
 * Print page for the PDF renderer: the template HTML with book.css, nothing else.
 * Puppeteer waits for fonts, calls GTales.fitPages, then prints A4 with zero margins (handoff brief, step 4).
 */
export function BookPrint({ html }: { html: string }) {
  return (
    <div className="gt-book">
      <link rel="stylesheet" href="/gtales-book/book.css" />
      <script src="/gtales-book/render.js" />
      <style>{`html, body { margin: 0; background: #fff; } .gt-book { background: none; } .gt-page { margin: 0; }`}</style>
      <div id="book" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
