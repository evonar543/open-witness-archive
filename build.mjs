import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, m => m.slice(1)));
const sourceDir = path.join(root, 'content');
const outDir = path.join(root, 'public');
const base = (process.env.SITE_URL || fs.readFileSync(path.join(root, 'site-url.txt'), 'utf8')).trim().replace(/\/$/, '');
const fandom = 'https://open-witness-archive.fandom.com/wiki/';

const pages = [
  ['02_SOVEREIGN_MAIN_PAGE.wikitext', 'Sovereign'],
  ['03_SOVEREIGN_HISTORY.wikitext', 'Sovereign/History'],
  ['04_SELF_REFINEMENT.wikitext', 'Sovereign/Self-Refinement'],
  ['05_SOVEREIGN_ABILITIES.wikitext', 'Sovereign/Abilities'],
  ['06_SOVEREIGN_COSMOLOGY.wikitext', 'Sovereign/Cosmology'],
  ['07_SOVEREIGN_AXIOMS.wikitext', 'Sovereign/Axioms'],
  ['08_SOVEREIGN_FEATS.wikitext', 'Sovereign/Feats'],
  ['09_SOVEREIGN_PHILOSOPHY.wikitext', 'Sovereign/Philosophy'],
  ['10_SOVEREIGN_RELATIONSHIPS.wikitext', 'Sovereign/Relationships'],
  ['11_ANCHOR_MEMORY.wikitext', 'The Anchor Memory'],
  ['12_THE_UNWRITTEN_STATE.wikitext', 'The Unwritten State'],
  ['13_QUOTES.wikitext', 'Sovereign/Quotes'],
  ['14_NAVIGATION_TEMPLATE.wikitext', 'Template:Sovereign navigation'],
  ['15_INFOBOX_TEMPLATE.wikitext', 'Template:Sovereign infobox'],
  ['17_MAIN_PAGE.wikitext', 'The Open Witness Archive Wiki'],
  ['18_THE_MEASURE.wikitext', 'The Measure'],
  ['19_THE_CLOSED_KING.wikitext', 'The Closed King'],
  ['20_THE_READER_PROBLEM.wikitext', 'The Reader Problem'],
  ['21_CROSS_FICTION_MODEL.wikitext', 'Sovereign/Comparative model'],
  ['22_CATEGORY_CHARACTERS.wikitext', 'Category:Characters'],
  ['23_CATEGORY_HISTORY.wikitext', 'Category:History'],
  ['24_CATEGORY_MECHANICS.wikitext', 'Category:Mechanics'],
  ['25_CATEGORY_COSMOLOGY.wikitext', 'Category:Cosmology'],
  ['26_CATEGORY_ARCHIVE_RECORDS.wikitext', 'Category:Archive records'],
  ['27_CATEGORY_THEMES.wikitext', 'Category:Themes'],
  ['28_CATEGORY_ARTIFACTS.wikitext', 'Category:Artifacts'],
  ['29_CATEGORY_QUOTATIONS.wikitext', 'Category:Quotations'],
  ['30_CATEGORY_TEMPLATES.wikitext', 'Category:Templates'],
  ['31_CATEGORY_ARCHIVE_INDEX.wikitext', 'Category:Archive index'],
  ['33_THE_LAST_MERCY.wikitext', 'The Last Mercy'],
  ['34_THE_UNSIGNED_REPLY.wikitext', 'The Unsigned Reply'],
  ['35_THE_WHITE_INTERVAL.wikitext', 'The White Interval'],
  ['36_THE_UNCONDITIONED_DRAFT.wikitext', 'The Unconditioned Draft']
];

const portalTitle = 'The Open Witness Archive Wiki';
const info = pages.map(([file, title]) => ({ file, title, raw: fs.readFileSync(path.join(sourceDir, file), 'utf8') }));
const known = new Set(info.map(x => x.title));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const slug = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase();
const urlFor = title => title === portalTitle ? '/' : '/wiki/' + title.split('/').map(slug).join('/') + '/';
const titleFromTarget = target => target === 'Main Page' ? portalTitle : target;
const displayTitle = title => title.startsWith('Category:') ? title.slice(9) : title.startsWith('Template:') ? title.slice(9) : title.replace('Sovereign/', '');
const section = title => title.startsWith('Category:') ? 'Categories' : title.startsWith('Template:') ? 'Templates' : title === portalTitle ? 'Home' : title === 'The Unconditioned Draft' ? 'Cosmology' : title.includes('Comparative') ? 'Comparative reading' : title === 'The Unsigned Reply' ? 'Archive record' : title.startsWith('Sovereign/') ? 'Sovereign' : 'Archive record';
const original = title => fandom + encodeURI(title.replaceAll(' ', '_'));

function inline(raw, refs) {
  const held = [];
  const hold = html => `\u001f${held.push(html) - 1}\u001f`;
  let s = String(raw).trim();
  s = s.replace(/<ref>([\s\S]*?)<\/ref>/g, (_, body) => {
    const n = refs.length + 1;
    refs.push(body);
    return hold(`<sup class="reference"><a href="#ref-${n}" id="cite-${n}" aria-label="Reference ${n}">[${n}]</a></sup>`);
  });
  s = s.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const [targetRaw, labelRaw] = inner.split('|', 2);
    const [t, anchor] = targetRaw.split('#', 2);
    const title = titleFromTarget(t);
    const label = labelRaw || (t || anchor);
    if (!known.has(title)) return hold(`<span class="unresolved">${esc(label)}</span>`);
    return hold(`<a href="${urlFor(title)}${anchor ? '#' + slug(anchor) : ''}">${esc(label)}</a>`);
  });
  s = s.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, (_, href, label) => hold(`<a href="${esc(href)}" rel="noopener noreferrer">${esc(label)}</a>`));
  s = s.replace(/<br\s*\/?\s*>/gi, () => hold('<br>'));
  s = s.replace(/<\/?big>/gi, m => hold(m.startsWith('</') ? '</span>' : '<span class="large-text">'));
  s = esc(s);
  s = s.replace(/'''([\s\S]+?)'''/g, '<strong>$1</strong>').replace(/''([\s\S]+?)''/g, '<em>$1</em>');
  return s.replace(/\u001f(\d+)\u001f/g, (_, i) => held[Number(i)]);
}

function infobox(raw, refs) {
  const data = Object.fromEntries(raw.split('\n').slice(1, -1).map(line => {
    const m = line.match(/^\|([^=]+)=(.*)$/);
    return m ? [m[1], m[2]] : ['', ''];
  }).filter(x => x[0]));
  const labels = [['birth_name', 'Birth name'], ['other_names', 'Other names'], ['home', 'Home'], ['first_state', 'First state'], ['known_state', 'Strongest known state'], ['signature_object', 'Signature object'], ['central_vow', 'Central vow']];
  return `<aside class="infobox"><div class="infobox-title">${esc(data.name || 'Sovereign')}</div>${labels.map(([key, label]) => data[key] ? `<div class="infobox-row"><span>${label}</span><b>${inline(data[key], refs)}</b></div>` : '').join('')}</aside>`;
}

function table(lines, refs) {
  const rows = [];
  for (const line of lines) {
    if (line.startsWith('!')) rows.push({ head: true, cells: line.slice(1).split('!!') });
    else if (line.startsWith('|') && line !== '|-' && line !== '|}') rows.push({ head: false, cells: line.slice(1).split('||') });
  }
  return `<div class="table-scroll"><table>${rows.map(row => `<tr>${row.cells.map(cell => `<${row.head ? 'th' : 'td'}>${inline(cell.trim(), refs)}</${row.head ? 'th' : 'td'}>`).join('')}</tr>`).join('')}</table></div>`;
}

function parseArticle(item) {
  if (item.title.startsWith('Template:')) {
    return { body: `<p>This is a source template preserved from the original wiki.</p><pre class="source-template">${esc(item.raw)}</pre>`, headings: [], categories: [], description: 'Source template from The Open Witness Archive.' };
  }
  const refs = [], headings = [], categories = [];
  let raw = item.raw.replace(/__\w+__/g, '').replace(/<mainpage-[^>]+\/>/g, '').replace(/\{\{Sovereign navigation\}\}/g, '');
  raw = raw.replace(/\[\[Category:([^\]]+)\]\]/g, (_, c) => { categories.push('Category:' + c); return ''; });
  const lines = raw.split(/\r?\n/);
  const out = [];
  let paragraph = [], list = [], listType = '';
  const flushParagraph = () => { if (paragraph.length) { out.push(`<p>${inline(paragraph.join(' '), refs)}</p>`); paragraph = []; } };
  const flushList = () => { if (list.length) { out.push(`<${listType}>${list.map(x => `<li>${inline(x, refs)}</li>`).join('')}</${listType}>`); list = []; listType = ''; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    if (line.startsWith('{{Sovereign infobox')) {
      flushParagraph(); flushList(); const block = [line];
      while (i + 1 < lines.length && !lines[i].trim().endsWith('}}')) block.push(lines[++i]);
      out.push(infobox(block.join('\n'), refs)); continue;
    }
    if (line.startsWith('{|')) {
      flushParagraph(); flushList(); const block = [line];
      while (i + 1 < lines.length && lines[i].trim() !== '|}') block.push(lines[++i].trim());
      out.push(table(block, refs)); continue;
    }
    if (line.startsWith('<blockquote>')) {
      flushParagraph(); flushList(); let content = line;
      while (!content.includes('</blockquote>') && i + 1 < lines.length) content += '\n' + lines[++i].trim();
      content = content.replace(/^<blockquote>/, '').replace(/<\/blockquote>$/, '');
      out.push(`<blockquote>${inline(content, refs)}</blockquote>`); continue;
    }
    if (line.startsWith('<div')) {
      flushParagraph(); flushList(); const block = [];
      while (i + 1 < lines.length && !lines[i].trim().includes('</div>')) block.push(lines[++i].trim());
      out.push(`<div class="archive-note">${block.filter(x => x && x !== '</div>').map(x => inline(x, refs)).join('<br>')}</div>`); continue;
    }
    if (line === '<references/>') {
      flushParagraph(); flushList();
      out.push(`<ol class="references">${refs.map((body, n) => `<li id="ref-${n + 1}">${inline(body, [])} <a href="#cite-${n + 1}" aria-label="Back to citation ${n + 1}">↩</a></li>`).join('')}</ol>`); continue;
    }
    const hm = line.match(/^(={2,6})\s*(.*?)\s*\1$/);
    if (hm) {
      flushParagraph(); flushList(); const level = Math.min(hm[1].length, 4); const label = hm[2]; const id = slug(label);
      headings.push({ label, id, level }); out.push(`<h${level} id="${id}">${inline(label, refs)}</h${level}>`); continue;
    }
    const lm = line.match(/^([*#])\s+(.+)$/);
    if (lm) {
      flushParagraph(); const type = lm[1] === '*' ? 'ul' : 'ol';
      if (listType && listType !== type) flushList(); listType = type; list.push(lm[2]); continue;
    }
    flushList(); paragraph.push(line);
  }
  flushParagraph(); flushList();
  if (refs.length && !item.raw.includes('<references/>')) out.push(`<h2 id="references">References</h2><ol class="references">${refs.map((body, n) => `<li id="ref-${n + 1}">${inline(body, [])} <a href="#cite-${n + 1}">↩</a></li>`).join('')}</ol>`);
  const summary = raw.replace(/\{\{[\s\S]*?\}\}/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/'{2,3}/g, '').replace(/\s+/g, ' ').trim();
  const shortSummary = summary.length <= 180 ? summary : summary.slice(0, 180).replace(/\s+\S*$/, '') + '…';
  const description = item.title === portalTitle ? 'An original-fiction archive of memory, revision, and the lives a correction can change.' : shortSummary;
  return { body: out.join('\n'), headings, categories, description };
}

const css = `:root{--bg:#0d1420;--panel:#141f2e;--panel2:#1a2939;--text:#e7e7e3;--muted:#a8b3b9;--gold:#dbbd77;--line:#354657;--link:#9bd5d4}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:17px/1.72 Georgia,serif}a{color:var(--link);text-decoration-thickness:1px;text-underline-offset:3px}a:hover{color:#d2f2ee}.skip{position:absolute;left:-9999px}.skip:focus{left:1rem;top:1rem;background:var(--panel);padding:.5rem;z-index:20}.site-header{border-bottom:1px solid var(--line);background:#0b121d}.header-inner{max-width:1320px;margin:auto;padding:1rem 1.4rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}.brand{font:600 1.05rem/1.2 system-ui,sans-serif;color:var(--gold);letter-spacing:.11em;text-transform:uppercase;text-decoration:none}.brand-mark{font-size:1.5rem;margin-right:.6rem}.header-links{display:flex;gap:1.4rem;font:600 .85rem system-ui,sans-serif}.header-links a{text-decoration:none;color:var(--muted)}.header-links a:hover{color:var(--gold)}.layout{max-width:1320px;margin:auto;display:grid;grid-template-columns:220px minmax(0,780px) 220px;gap:2.2rem;padding:2rem 1.4rem}.sidebar,.rightbar{font: .88rem/1.55 system-ui,sans-serif}.sidebar{position:sticky;top:1.2rem;align-self:start}.side-title,.right-title{color:var(--gold);text-transform:uppercase;letter-spacing:.13em;font-size:.73rem;font-weight:700;margin:1.5rem 0 .55rem}.side-title:first-child{margin-top:0}.sidebar a,.rightbar a{display:block;text-decoration:none;color:var(--muted);padding:.27rem 0}.sidebar a:hover,.rightbar a:hover{color:var(--link)}.sidebar a.current{color:var(--gold)}main{min-width:0}.eyebrow{color:var(--gold);font:700 .75rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.16em;margin:0 0 .65rem}.page-title{font-size:clamp(2.25rem,4vw,3.55rem);line-height:1.13;letter-spacing:-.035em;font-weight:500;margin:.1rem 0 .9rem}.deck{color:var(--muted);font-size:1.11rem;line-height:1.55;margin:0 0 2rem;border-bottom:1px solid var(--line);padding-bottom:1.8rem}.article{font-size:1.02rem}.article p{margin:0 0 1.2rem}.article h2{font-weight:500;font-size:1.75rem;line-height:1.25;margin:2.7rem 0 1rem;color:#f4efe3;scroll-margin-top:1rem}.article h3{font-weight:500;font-size:1.35rem;margin:2rem 0 .8rem;scroll-margin-top:1rem}.article h4{font-size:1.08rem;margin:1.5rem 0 .6rem;scroll-margin-top:1rem}.article ul,.article ol{padding-left:1.45rem;margin:0 0 1.5rem}.article li{margin:.45rem 0}.article blockquote{border-left:3px solid var(--gold);margin:1.8rem 0;padding:.6rem 1.3rem;color:#f4e9d0;background:#182536;font-style:italic}.article strong{color:#f6e6bb}.archive-note{border:1px solid #806d51;background:#172231;padding:1rem 1.2rem;margin:1.5rem 0}.large-text{font-size:1.3rem}.infobox{float:right;width:min(40%,300px);margin:.2rem 0 1.4rem 1.7rem;background:var(--panel);border:1px solid var(--line);font:.82rem/1.5 system-ui,sans-serif}.infobox-title{padding:.85rem 1rem;background:#24364a;color:var(--gold);font-size:1rem;font-weight:700}.infobox-row{display:grid;grid-template-columns:1fr 1.4fr;gap:.5rem;padding:.55rem .85rem;border-top:1px solid var(--line)}.infobox-row span{color:var(--muted)}.infobox-row b{font-weight:500}.table-scroll{overflow-x:auto;margin:1.6rem 0}table{border-collapse:collapse;width:100%;font:.9rem/1.5 system-ui,sans-serif}th,td{text-align:left;vertical-align:top;border:1px solid var(--line);padding:.65rem .75rem;min-width:130px}th{background:#25364a;color:var(--gold)}tr:nth-child(even) td{background:#152232}.reference{font: .72rem system-ui,sans-serif;vertical-align:super;padding-left:.1rem}.references{font:.83rem/1.5 system-ui,sans-serif;color:var(--muted);overflow-wrap:anywhere}.references li{padding:.3rem 0}.rightbar{position:sticky;top:1.2rem;align-self:start;max-height:calc(100vh - 2rem);overflow:auto}.rightbar .sub{padding-left:.8rem}.cat-links{border-top:1px solid var(--line);padding-top:1rem;margin-top:2.5rem;font: .82rem system-ui,sans-serif}.cat-links a{margin-right:.7rem}.page-end{border-top:1px solid var(--line);margin:3rem 0 0;padding-top:1.2rem;color:var(--muted);font:.8rem/1.6 system-ui,sans-serif}.page-end a{color:var(--muted)}.index-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.8rem;margin:1.5rem 0}.index-card{background:var(--panel);border:1px solid var(--line);padding:.8rem 1rem;text-decoration:none;display:block}.index-card:hover{border-color:var(--gold)}.index-card small{display:block;color:var(--muted);font: .7rem system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}.index-card span{display:block;color:var(--text);font-size:1rem}.search{width:100%;background:var(--panel);border:1px solid var(--line);color:var(--text);padding:.8rem 1rem;font:1rem system-ui,sans-serif;border-radius:4px}.search:focus{outline:2px solid var(--gold)}.source-template{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--panel);padding:1rem;border:1px solid var(--line);font:.82rem/1.5 monospace}.site-footer{border-top:1px solid var(--line);color:var(--muted);font:.8rem/1.5 system-ui,sans-serif;padding:1.5rem;text-align:center;margin-top:3rem}@media(max-width:1050px){.layout{grid-template-columns:180px minmax(0,1fr)}.rightbar{display:none}}@media(max-width:700px){.layout{display:block;padding:1.5rem 1rem}.sidebar{position:static;border-bottom:1px solid var(--line);padding-bottom:1rem;margin-bottom:1.6rem;display:flex;gap:.6rem;overflow-x:auto;white-space:nowrap}.sidebar .side-title{display:none}.sidebar a{padding:.4rem .7rem;background:var(--panel);border-radius:3px}.header-inner{padding:.8rem 1rem}.header-links{gap:.8rem}.header-links a:last-child{display:none}.infobox{float:none;width:100%;margin:0 0 1.5rem}.page-title{font-size:2.4rem}}`;

const byTitle = new Map(info.map(x => [x.title, x]));
const navGroups = [
  ['Start here', [portalTitle, 'Sovereign', 'Sovereign/History', 'The Anchor Memory']],
  ['Explore', ['Sovereign/Self-Refinement', 'Sovereign/Abilities', 'Sovereign/Cosmology', 'Sovereign/Feats', 'The Reader Problem']],
  ['Archive', ['The Measure', 'The Closed King', 'The Last Mercy', 'The White Interval', 'The Unconditioned Draft', 'The Unwritten State', 'Sovereign/Quotes', 'Sovereign/Comparative model']]
];
const sidebar = current => navGroups.map(([label, titles]) => `<div class="side-title">${esc(label)}</div>${titles.map(t => `<a class="${t === current ? 'current' : ''}" href="${urlFor(t)}">${esc(displayTitle(t))}</a>`).join('')}`).join('');
const footer = `<footer class="site-footer">The Open Witness Archive · Original fiction · Text adapted from the <a href="https://open-witness-archive.fandom.com/wiki/Main_Page">Fandom edition</a> under <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.</footer>`;

function layout(item, parsed) {
  const isHome = item.title === portalTitle;
  const pathname = urlFor(item.title);
  const canonical = base + pathname;
  const toc = parsed.headings.filter(h => h.level <= 3 && h.label.toLowerCase() !== 'references');
  const index = isHome ? `<section class="site-index"><h2 id="archive-index">Explore the archive</h2><p>Browse the public record. Some fragments are reached through links within the story.</p><label for="page-search" class="eyebrow">Find a page</label><input id="page-search" class="search" type="search" placeholder="Search page titles and descriptions" aria-label="Search archive pages"><div class="index-list" id="page-index">${info.filter(x => x.title !== portalTitle && x.title !== 'The Unsigned Reply' && !x.title.startsWith('Template:')).map(x => `<a class="index-card" href="${urlFor(x.title)}" data-search="${esc((x.title + ' ' + (parseArticle(x).description || '')).toLowerCase())}"><small>${esc(section(x.title))}</small><span>${esc(x.title)}</span></a>`).join('')}</div></section><script>const q=document.getElementById('page-search');q?.addEventListener('input',()=>{const s=q.value.toLowerCase().trim();document.querySelectorAll('.index-card').forEach(a=>{a.hidden=!a.dataset.search.includes(s)})})</script>` : '';
  const cat = parsed.categories.length ? `<div class="cat-links">Filed under ${parsed.categories.map(c => `<a href="${urlFor(c)}">${esc(c.slice(9))}</a>`).join('')}</div>` : '';
  const source = `<div class="page-end">Source: <a href="${original(item.title)}">original Fandom page</a>. This edition preserves the archive text and credits its contributors under CC BY-SA 3.0.</div>`;
  const right = toc.length ? `<aside class="rightbar" aria-label="On this page"><div class="right-title">On this page</div>${toc.map(h => `<a class="${h.level > 2 ? 'sub' : ''}" href="#${h.id}">${esc(h.label)}</a>`).join('')}</aside>` : '<aside class="rightbar"></aside>';
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': isHome ? 'CollectionPage' : 'Article', headline: item.title, description: parsed.description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'The Open Witness Archive', url: base + '/' }, license: 'https://creativecommons.org/licenses/by-sa/3.0/', creditText: 'The Open Witness Archive Wiki on Fandom' }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(isHome ? 'The Open Witness Archive' : item.title + ' | The Open Witness Archive')}</title><meta name="description" content="${esc(parsed.description)}"><meta name="robots" content="index,follow,max-snippet:-1"><link rel="canonical" href="${esc(canonical)}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:type" content="${isHome ? 'website' : 'article'}"><meta property="og:title" content="${esc(item.title)}"><meta property="og:description" content="${esc(parsed.description)}"><meta property="og:url" content="${esc(canonical)}"><link rel="stylesheet" href="/style.css"><script type="application/ld+json">${schema}</script></head><body><a class="skip" href="#content">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="/"><span class="brand-mark">◈</span>The Open Witness Archive</a><nav class="header-links" aria-label="Top navigation"><a href="/">Home</a><a href="/wiki/sovereign/">Sovereign</a><a href="/#archive-index">All pages</a></nav></div></header><div class="layout"><nav class="sidebar" aria-label="Archive navigation">${sidebar(item.title)}</nav><main id="content"><div class="eyebrow">${esc(section(item.title))}</div><h1 class="page-title">${esc(isHome ? 'The Open Witness Archive' : item.title)}</h1>${isHome ? '' : `<p class="deck">${esc(parsed.description)}</p>`}<article class="article">${parsed.body}</article>${index}${cat}${source}</main>${right}</div>${footer}</body></html>`;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'style.css'), css);
fs.writeFileSync(path.join(outDir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#0d1420"/><path d="M32 7 52 32 32 57 12 32Z" fill="none" stroke="#dbbd77" stroke-width="4"/><circle cx="32" cy="32" r="6" fill="#9bd5d4"/></svg>');
for (const item of info) {
  const parsed = parseArticle(item);
  const pathname = urlFor(item.title);
  const folder = path.join(outDir, pathname === '/' ? '' : pathname.slice(1));
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'index.html'), layout(item, parsed));
}
const locs = info.map(x => base + urlFor(x.title));
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs.map(loc => `<url><loc>${esc(loc)}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
fs.writeFileSync(path.join(outDir, 'llms.txt'), `# The Open Witness Archive\n\nOriginal-fiction archive about Ivo Ren / Sovereign. Read complete, publicly accessible HTML pages. Distinguish the chosen Open Witness practice from the Unruled Witness peak state. Canon events, in-universe theory, peak-form design, and comparative analysis are marked within the text.\n\n- [Archive home](${base}/)\n- [Sovereign](${base}/wiki/sovereign/)\n- [History](${base}/wiki/sovereign/history/)\n- [Self-Refinement](${base}/wiki/sovereign/self-refinement/)\n- [Feats](${base}/wiki/sovereign/feats/)\n- [Comparative model](${base}/wiki/sovereign/comparative-model/)\n- [The Unconditioned Draft](${base}/wiki/the-unconditioned-draft/)\n- [The White Interval](${base}/wiki/the-white-interval/)\n- [The Unsigned Reply](${base}/wiki/the-unsigned-reply/)\n- [Sitemap](${base}/sitemap.xml)\n\nText adapted from https://open-witness-archive.fandom.com/wiki/Main_Page under CC BY-SA 3.0.\n`);
console.log(`Built ${info.length} complete HTML pages at ${base}`);
