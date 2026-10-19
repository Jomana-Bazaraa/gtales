/* GTales story variants. Pure function, no dependencies.
   applyVariants(story, variants, form) -> a NEW story object (the original is never changed).
   - variants.fun[]   : extra funny lines, inserted only when every key in `requires` has a value in form
   - variants.little{}: challenge replacements by page number, used when form.age <= 5
   No variants file, or no matching keys = the story is returned unchanged. */
(function (global) {
  function applyVariants(story, variants, form) {
    if (!variants) return story;
    const s = JSON.parse(JSON.stringify(story));
    const page = n => s.pages.find(p => p.n === Number(n));
    const fun = (variants.fun || []).filter(f => (f.requires || []).every(k => form[k] && String(form[k]).trim()));
    // insert from the highest index down so earlier inserts don't shift later ones on the same page
    fun.sort((a, b) => a.page - b.page || b.after - a.after).forEach(f => {
      const p = page(f.page);
      if (p) p.text.splice(Math.min(f.after + 1, p.text.length), 0, f.text);
    });
    const age = parseInt(form.age, 10);
    if (age && age <= 5) {
      for (const [n, ch] of Object.entries(variants.little || {})) {
        const p = page(n);
        if (p && p.challenge) p.challenge = ch;
      }
    }
    return s;
  }
  global.GTales = Object.assign(global.GTales || {}, { applyVariants });
})(typeof window !== 'undefined' ? window : globalThis);
