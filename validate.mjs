import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, m => m.slice(1)));
const publicDir = path.join(root, 'public');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const files = walk(publicDir).filter(p => p.endsWith('index.html'));
const errors = [];
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<meta name="robots" content="index,follow')) errors.push(`${file}: no index directive`);
  if (!html.includes('<link rel="canonical"')) errors.push(`${file}: no canonical`);
  if (!html.includes('<article class="article">')) errors.push(`${file}: no article`);
  if (!file.includes('template-') && /\[\[|<ref>|<references\/>|\{\{Sovereign/.test(html)) errors.push(`${file}: unrendered wiki syntax`);
  for (const [, href] of html.matchAll(/href="(\/wiki\/[^"#?]+\/)(?:#[^"]*)?"/g)) {
    if (!fs.existsSync(path.join(publicDir, href.slice(1), 'index.html'))) errors.push(`${file}: missing ${href}`);
  }
  for (const [, href] of html.matchAll(/href="(\/wiki\/[^"#?]+\/#([^"]+))"/g)) {
    const target = fs.readFileSync(path.join(publicDir, href.slice(1).split('#')[0], 'index.html'), 'utf8');
    const anchor = href.split('#')[1];
    if (!target.includes(`id="${anchor}"`)) errors.push(`${file}: missing anchor ${href}`);
  }
}
const sitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
const urls = (sitemap.match(/<loc>/g) || []).length;
if (urls !== files.length) errors.push(`sitemap URLs ${urls} vs pages ${files.length}`);
console.log(`Checked ${files.length} pages, ${urls} sitemap URLs, ${errors.length} issues`);
for (const e of errors) console.log(e);
if (errors.length) process.exitCode = 1;
