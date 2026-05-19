import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export const getStaticPaths: GetStaticPaths = async () => {
  const all = await getCollection('law');
  return all.map((entry) => ({
    params: { slug: entry.id },
    props: { entry }
  }));
};

export const GET: APIRoute = ({ props, site }) => {
  const entry = (props as { entry: CollectionEntry<'law'> }).entry;
  const { regulation, articleLabel, title, summary, eurLexUrl, citation, updated } =
    entry.data;
  const canonical = new URL(`/law/${entry.id}/`, site!).toString();
  const cleanSummary = summary.trim().replace(/\s+/g, ' ');

  const lines: string[] = [];
  lines.push(`# ${regulation} ${articleLabel} — ${title}`, '');
  lines.push(`> ${cleanSummary}`, '');
  lines.push(`Citation: *${citation}*  `);
  lines.push(`Last reconciled with canonical source: ${updated}  `);
  lines.push(`Canonical: ${eurLexUrl}  `);
  lines.push(`Source: ${canonical}`);
  lines.push('', '---', '');
  lines.push(entry.body!.trim());
  lines.push('', '---', '', '## Reproduction notice', '');
  lines.push(
    `The text reproduced on this page is taken from the consolidated version of *${citation}*, an official act of the European Union. EU legislative texts are excluded from copyright protection (recital 22 of Directive (EU) 2019/790). ConsentTheater is not affiliated with, endorsed by, or sponsored by any EU institution. For binding legal use always consult the official source on [eur-lex.europa.eu](${eurLexUrl}). We re-verify each reproduction against the canonical text on the date shown at the top of this page.`
  );

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
};
