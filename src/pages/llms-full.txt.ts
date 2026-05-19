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

  lines.push('# ConsentTheater — full reference');
  lines.push('');
  lines.push(
    '> All handbook articles and EU law-reference pages from consenttheater.org concatenated into a single document for one-shot ingestion (RAG pipelines, IDEs, tools that do not follow links). For an index instead, see /llms.txt. For individual files, each entry below also exists at its own /handbook/<slug>.md or /law/<path>.md URL.'
  );
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`Source: ${new URL('/llms-full.txt', site!).toString()}`);
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('# Handbook');
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
      const canonical = new URL(`/handbook/${e.id}/`, site!).toString();
      const cleanSummary = e.data.summary.trim().replace(/\s+/g, ' ');
      lines.push(`### ${e.data.title}`);
      lines.push('');
      lines.push(`> ${cleanSummary}`);
      lines.push('');
      lines.push(`Updated: ${e.data.updated} · Source: ${canonical}`);
      lines.push('');
      lines.push(e.body!.trim());
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  lines.push('# Law references');
  lines.push('');

  const lawSorted = lawAll.sort((a, b) => {
    const ao = a.data.order ?? Number.POSITIVE_INFINITY;
    const bo = b.data.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.id.localeCompare(b.id);
  });

  for (const e of lawSorted) {
    const canonical = new URL(`/law/${e.id}/`, site!).toString();
    const cleanSummary = e.data.summary.trim().replace(/\s+/g, ' ');
    lines.push(`## ${e.data.regulation} ${e.data.articleLabel} — ${e.data.title}`);
    lines.push('');
    lines.push(`> ${cleanSummary}`);
    lines.push('');
    lines.push(
      `Citation: *${e.data.citation}* · Last reconciled ${e.data.updated} · Canonical: ${e.data.eurLexUrl} · Source: ${canonical}`
    );
    lines.push('');
    lines.push(e.body!.trim());
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('# Project pages');
  lines.push('');
  lines.push(
    'Hand-curated pages (about, methodology, privacy, licensing, etc.) are not bundled in this file because they are visually rich .astro source and their lossy HTML→MD conversion lives at the URLs below — fetch individually if needed:'
  );
  lines.push('');
  const projectPages: Array<[string, string]> = [
    ['About', '/about.md'],
    ['Methodology', '/methodology.md'],
    ['Privacy policy', '/privacy.md'],
    ['License (full AGPL-3.0 text)', '/license.md'],
    ['Acknowledgements', '/acknowledgements.md'],
    ['Browser extension', '/extension.md'],
    ['UK GDPR & PECR mapping', '/law/uk-gdpr-and-pecr.md']
  ];
  for (const [label, path] of projectPages) {
    const url = new URL(path, site!).toString();
    lines.push(`- [${label}](${url})`);
  }
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
