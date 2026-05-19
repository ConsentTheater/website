import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  HANDBOOK_CATEGORY_LABELS,
  HANDBOOK_CATEGORY_ORDER
} from '@/content.config';

export const GET: APIRoute = async ({ site }) => {
  const handbookAll = await getCollection('handbook', ({ data }) => !data.draft);
  const lawAll = await getCollection('law');

  const lines: string[] = [];
  lines.push('# ConsentTheater');
  lines.push('');
  lines.push(
    '> Plain-language reference handbook on GDPR, ePrivacy and the UK PECR — written for developers, DPOs and engineers who need to get cookie consent and tracking right. Topic-organised, current-state, no marketing.'
  );
  lines.push('');
  lines.push(
    `For one-shot ingestion of every handbook entry and law article in a single document, fetch [${new URL('/llms-full.txt', site!).toString()}](${new URL('/llms-full.txt', site!).toString()}).`
  );
  lines.push('');

  const projectPages: Array<[string, string, string]> = [
    ['About', '/about.md', 'What ConsentTheater is, what it is not, and how the project is run.'],
    ['Methodology', '/methodology.md', 'How trackers are classified by category and consent burden under GDPR.'],
    ['Privacy policy', '/privacy.md', 'How the site itself handles visitor data. Short version: no analytics, no cookies, no trackers.'],
    ['License', '/license.md', 'AGPL-3.0-or-later licensing terms for the project.'],
    ['Acknowledgements', '/acknowledgements.md', 'Open-source projects ConsentTheater is built on, with licenses and links.'],
    ['Browser extension', '/extension.md', 'Free Chrome/Firefox extension for live pre-consent tracker auditing.'],
    ['UK GDPR & PECR mapping', '/law/uk-gdpr-and-pecr.md', 'How UK GDPR and PECR map onto the EU GDPR and ePrivacy Directive articles, regulated by the ICO.']
  ];
  lines.push('## Project pages');
  lines.push('');
  for (const [label, path, blurb] of projectPages) {
    const url = new URL(path, site!).toString();
    lines.push(`- [${label}](${url}): ${blurb}`);
  }
  lines.push('');

  for (const cat of HANDBOOK_CATEGORY_ORDER) {
    const entries = handbookAll
      .filter((e) => e.data.category === cat)
      .sort((a, b) => {
        const ao = a.data.order ?? Number.POSITIVE_INFINITY;
        const bo = b.data.order ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return a.data.title.localeCompare(b.data.title);
      });
    if (entries.length === 0) continue;

    lines.push(`## ${HANDBOOK_CATEGORY_LABELS[cat]}`);
    lines.push('');
    for (const e of entries) {
      const url = new URL(`/handbook/${e.id}.md`, site!).toString();
      const blurb = e.data.summary.trim().replace(/\s+/g, ' ');
      lines.push(`- [${e.data.title}](${url}): ${blurb}`);
    }
    lines.push('');
  }

  const lawEntries = lawAll.sort((a, b) => {
    const ao = a.data.order ?? Number.POSITIVE_INFINITY;
    const bo = b.data.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });
  if (lawEntries.length > 0) {
    lines.push('## Law references');
    lines.push('');
    for (const e of lawEntries) {
      const url = new URL(`/law/${e.id}.md`, site!).toString();
      const blurb = e.data.summary.trim().replace(/\s+/g, ' ');
      const label = `${e.data.regulation} ${e.data.articleLabel} — ${e.data.title}`;
      lines.push(`- [${label}](${url}): ${blurb}`);
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
