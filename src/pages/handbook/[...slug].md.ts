import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { HANDBOOK_CATEGORY_LABELS } from '@/content.config';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = await getCollection('handbook', ({ data }) => !data.draft);
  return all.map((entry) => ({
    params: { slug: entry.id },
    props: { entry }
  }));
};

export const GET: APIRoute = ({ props, site }) => {
  const entry = (props as { entry: CollectionEntry<'handbook'> }).entry;
  const { title, summary, category, updated, created, legal_refs, related } = entry.data;
  const categoryLabel = HANDBOOK_CATEGORY_LABELS[category];
  const canonical = new URL(`/handbook/${entry.id}/`, site!).toString();
  const cleanSummary = summary.trim().replace(/\s+/g, ' ');

  const lines: string[] = [];
  lines.push(`# ${title}`, '');
  lines.push(`> ${cleanSummary}`, '');
  lines.push(`Category: ${categoryLabel}  `);
  lines.push(
    `Updated: ${updated}${created && created !== updated ? ` (first published ${created})` : ''}  `
  );
  lines.push(`Source: ${canonical}`);
  lines.push('', '---', '');
  lines.push(entry.body!.trim());

  if (legal_refs?.length) {
    lines.push('', '---', '', '## Legal references on this site', '');
    for (const ref of legal_refs) {
      const href = new URL(ref.href, site!).toString();
      lines.push(`- [${ref.label}](${href})`);
    }
  }

  if (related?.length) {
    lines.push('', '---', '', '## Related handbook entries', '');
    for (const slug of related) {
      const mdUrl = new URL(`/handbook/${slug}.md`, site!).toString();
      lines.push(`- ${mdUrl}`);
    }
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
};
