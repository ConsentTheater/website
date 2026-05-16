#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const W = 1200;
const H = 628;
const OUT_DIR = path.join(ROOT, 'public/og');
const BG_PATH = path.join(ROOT, 'public/og-default-bg.jpg');
const FONT_DIR = path.join(ROOT, 'node_modules/@fontsource/lora/files');

async function loadFonts() {
  const [regular, medium, bold] = await Promise.all([
    fs.readFile(path.join(FONT_DIR, 'lora-latin-400-normal.woff')),
    fs.readFile(path.join(FONT_DIR, 'lora-latin-500-normal.woff')),
    fs.readFile(path.join(FONT_DIR, 'lora-latin-700-normal.woff'))
  ]);
  return [
    { name: 'Lora', data: regular, weight: 400, style: 'normal' },
    { name: 'Lora', data: medium, weight: 500, style: 'normal' },
    { name: 'Lora', data: bold, weight: 700, style: 'normal' }
  ];
}

function autoTitleSize(title) {
  const len = title.length;
  if (len <= 18) return 92;
  if (len <= 28) return 80;
  if (len <= 45) return 64;
  if (len <= 70) return 50;
  return 42;
}

function escapeText(s) {
  return String(s ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function preventWidow(s) {
  if (!s) return s;
  return String(s).replace(/ (\S+)\s*$/, ' $1');
}

// Approx char budget that fits 6 lines at 34px Lora in a 760px column.
// Anything past that gets an ellipsis instead of bleeding off the canvas.
const SUBTITLE_MAX_CHARS = 250;
function softTruncate(s, max = SUBTITLE_MAX_CHARS) {
  if (!s) return s;
  const str = String(s);
  if (str.length <= max) return str;
  return str.slice(0, max).replace(/\s+\S*$/, '').trimEnd() + '…';
}

function template({ title, subtitle, titleSize }) {
  const sub = softTruncate(subtitle);
  return html(
    `<div style="display:flex;flex-direction:column;width:1200px;height:628px;padding:88px 96px 64px;font-family:Lora,serif;">` +
      `<div style="display:flex;width:940px;font-size:${titleSize}px;font-weight:700;line-height:1.08;letter-spacing:-1.5px;color:#ffffff;">` +
        `<span>${escapeText(preventWidow(title))}</span>` +
      `</div>` +
      (sub
        ? `<div style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:6;overflow:hidden;width:760px;height:306px;font-size:34px;font-weight:500;line-height:1.5;color:#ffffff;opacity:0.9;margin-top:28px;">` +
            escapeText(preventWidow(sub)) +
          `</div>`
        : '') +
    `</div>`
  );
}

async function renderToJpg(markup, fonts, bgBuf) {
  const svg = await satori(markup, { width: W, height: H, fonts });
  const png = new Resvg(svg, {
    background: 'rgba(0,0,0,0)',
    fitTo: { mode: 'width', value: W }
  }).render().asPng();
  return sharp(bgBuf)
    .composite([{ input: png, top: 0, left: 0 }])
    .jpeg({ quality: 85, progressive: true, mozjpeg: true })
    .toBuffer();
}

function pathToFilename(pathname) {
  let slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (slug === '') slug = 'index';
  return slug.replaceAll('/', '-');
}

const STATIC_ROUTES = [
  { pathname: '/', title: 'ConsentTheater', subtitle: 'GDPR cookie and tracker lookup — in plain language.' },
  { pathname: '/about/', title: 'About the project', subtitle: 'A non-commercial, open-source effort for tracker transparency.' },
  { pathname: '/methodology/', title: 'Methodology', subtitle: 'How we classify trackers and rate consent burden.' },
  { pathname: '/extension/', title: 'Browser extension', subtitle: 'See what a website is really up to — in plain language.' },
  { pathname: '/handbook/', title: 'The Handbook', subtitle: 'Plain-language guides to GDPR, consent, tracking and rights.' },
  { pathname: '/law/', title: 'Law library', subtitle: 'GDPR, ePrivacy and UK PECR in plain English.' },
  { pathname: '/privacy/', title: 'Privacy', subtitle: "What we don't collect — in detail." },
  { pathname: '/license/', title: 'License', subtitle: 'AGPL-3.0 — free, open, copyleft.' },
  { pathname: '/acknowledgements/', title: 'Acknowledgements', subtitle: 'The open-source projects this site stands on.' },
  { pathname: '/404', title: 'Not found', subtitle: "That page doesn't exist — or doesn't anymore." }
];

const LAW_ROUTES = [
  { pathname: '/law/gdpr/art-5/', title: 'GDPR Article 5', subtitle: 'Principles relating to the processing of personal data.' },
  { pathname: '/law/gdpr/art-6/', title: 'GDPR Article 6', subtitle: 'Lawfulness of processing — the six legal bases.' },
  { pathname: '/law/gdpr/art-7/', title: 'GDPR Article 7', subtitle: 'Conditions for valid consent.' },
  { pathname: '/law/gdpr/art-17/', title: 'GDPR Article 17', subtitle: 'The right to erasure (right to be forgotten).' },
  { pathname: '/law/gdpr/art-89/', title: 'GDPR Article 89', subtitle: 'Safeguards for research, archiving and statistics.' },
  { pathname: '/law/eprivacy/art-5/', title: 'ePrivacy Article 5', subtitle: 'Confidentiality of communications and stored data.' },
  { pathname: '/law/uk-gdpr-and-pecr/', title: 'UK GDPR & PECR', subtitle: 'Post-Brexit privacy law in the United Kingdom.' }
];

async function scanHandbook() {
  const dir = path.join(ROOT, 'src/content/handbook');
  const entries = await fs.readdir(dir);
  const out = [];
  for (const f of entries) {
    if (!f.endsWith('.md')) continue;
    const raw = await fs.readFile(path.join(dir, f), 'utf8');
    const fm = matter(raw).data;
    if (fm.draft) continue;
    out.push({
      pathname: `/handbook/${path.basename(f, '.md')}/`,
      title: fm.title,
      subtitle: fm.summary
    });
  }
  return out;
}

async function main() {
  console.log('→ Loading fonts + BG…');
  const [fonts, bgBuf] = await Promise.all([loadFonts(), fs.readFile(BG_PATH)]);

  console.log('→ Scanning handbook…');
  const handbook = await scanHandbook();

  const all = [...STATIC_ROUTES, ...LAW_ROUTES, ...handbook];
  console.log(`→ Generating ${all.length} OG images…`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const f of await fs.readdir(OUT_DIR).catch(() => [])) {
    if (f.endsWith('.jpg')) await fs.unlink(path.join(OUT_DIR, f)).catch(() => {});
  }

  const t0 = Date.now();
  let ok = 0;
  for (const r of all) {
    const filename = pathToFilename(r.pathname);
    const markup = template({
      title: r.title,
      subtitle: r.subtitle,
      titleSize: autoTitleSize(r.title)
    });
    try {
      const buf = await renderToJpg(markup, fonts, bgBuf);
      await fs.writeFile(path.join(OUT_DIR, `${filename}.jpg`), buf);
      console.log(`  ✓ ${filename}.jpg (${(buf.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${filename}.jpg — ${e.message}`);
    }
  }
  const ms = Date.now() - t0;
  console.log(`\n✓ Generated ${ok}/${all.length} in ${(ms / 1000).toFixed(1)}s (avg ${(ms / ok).toFixed(0)}ms)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
