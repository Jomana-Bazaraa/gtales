/* GTales book renderer. Pure functions, no dependencies.
   renderBook(story, form, { imageBase }) -> HTML string (cover, 15 pages, back cover)
   fitPages(rootElement) -> call after the HTML is in the DOM and fonts have loaded */
(function (global) {
  const AGES = { 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function tokens(form) {
    const girl = form.gender === 'girl';
    return {
      name: form.name, age: AGES[form.age] || String(form.age), place: form.place, other: form.other,
      sidekick: form.sidekick, power_word: form.power_word, need: form.need, ask: form.ask, strength: form.strength, snack: form.snack, silly: form.silly,
      he: girl ? 'she' : 'he', him: girl ? 'her' : 'him', his: girl ? 'her' : 'his',
      He: girl ? 'She' : 'He', Him: girl ? 'Her' : 'Him', His: girl ? 'Her' : 'His'
    };
  }

  function fill(text, t) {
    let out = esc(text).replace(/{{(\w+)}}/g, (m, k) => {
      if (!(k in t) || t[k] === undefined || t[k] === '') throw new Error('Missing value for {{' + k + '}}');
      return esc(t[k]);
    });
    out = out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    if (/{{|}}/.test(out)) throw new Error('Unfilled token in: ' + text);
    return out;
  }

  function card(ch, t) {
    if (!ch) return '';
    const tag = fill(ch.tag || 'Your turn', t);
    let s = `<div class="gt-card"><div class="gt-tag">${tag}</div><div class="gt-q">${fill(ch.question, t)}</div>`;
    if (ch.riddle) s += `<div class="gt-riddle">${ch.riddle.map(l => fill(l, t)).join('<br>')}</div>`;
    if (ch.options) s += `<div class="gt-choices">${ch.options.map(o => `<span class="gt-choice">${fill(o.label, t)}</span>`).join('')}</div>`;
    if (ch.steps) s += `<ol class="gt-steps">${ch.steps.map(x => `<li>${fill(x, t)}</li>`).join('')}</ol>`;
    if (ch.type === 'boxes') s += `<div class="gt-boxes">${'<i></i>'.repeat(ch.count || 3)}</div>`;
    return s + '</div>';
  }

  function storyHtml(p, t) {
    const paras = p.text.map(x => `<p>${fill(x, t)}</p>`);
    if (p.screen) paras.splice(p.screen_after ?? 1, 0, `<p class="gt-screen">${fill(p.screen, t)}</p>`);
    if (p.sign) paras.push(`<p class="gt-sign">${fill(p.sign, t)}</p>`);
    const nodrop = /^["(]/.test(fill(p.text[0], t).replace(/&quot;/g,'"').trim()) ? ' nodrop' : '';
    return `<div class="gt-story${nodrop}">${paras.join('')}</div>`;
  }

  function renderBook(story, form, opts = {}) {
    const t = tokens(form), base = (opts.imageBase || '').replace(/\/?$/, '/');
    const title = fill(story.title, t);
    const out = [`<div class="gt-page gt-cover"><img class="gt-bg" src="${base}cover.jpg" alt=""><div class="gt-title"><small>A GTales story</small><h1>${title}</h1></div><div class="gt-made">Made for ${esc(t.name)}</div></div>`];
    for (const p of story.pages) {
      const len = p.text.join(' ').length, ch = p.challenge;
      const dense = len > 330 || (ch && (len > 220 || ch.steps || ch.riddle)) ? ' gt-dense' : '';
      const img = `${base}p${String(p.n).padStart(2, '0')}.jpg`;
      out.push(`<div class="gt-page gt-story-page${dense}"><div class="gt-pic"><img src="${img}" alt=""></div><div class="gt-txt">${storyHtml(p, t)}${card(ch, t)}</div><div class="gt-num">${p.n}</div></div>`);
    }
    out.push(`<div class="gt-page gt-cover"><img class="gt-bg" src="${base}back.jpg" alt=""><div class="gt-blurb">${story.back_blurb.map(x => `<p>${fill(x, t)}</p>`).join('')}</div><div class="gt-bfoot">A GTales story made for ${esc(t.name)} in ${esc(t.place)}</div></div>`);
    return out.join('\n');
  }

  /* Picture ends where the text begins; short text is centred in the white area. */
  function fitPages(root) {
    const MM = 96 / 25.4;
    root.querySelectorAll('.gt-story-page').forEach(pg => {
      const txt = pg.querySelector('.gt-txt'), pic = pg.querySelector('.gt-pic');
      const top = pg.clientHeight - txt.offsetHeight - 16 * MM;
      const h = Math.min(235 * MM, top - 1 * MM);
      pic.style.height = h + 'px';
      const free = (pg.clientHeight - 13 * MM) - (h + 1 * MM) - txt.offsetHeight;
      if (free > 0) txt.style.bottom = (13 * MM + free / 2) + 'px';
      if (txt.scrollHeight > txt.clientHeight + 1 || h < 150 * MM) console.warn('GTales: page', pg.querySelector('.gt-num').textContent, 'has too much text');
    });
  }

  global.GTales = { renderBook, fitPages, fill, tokens };
})(typeof window !== 'undefined' ? window : globalThis);
