import { Hono } from 'hono';
import { loadPlaybill, matchCookie, matchDomain } from '@consenttheater/playbill';

const playbill = loadPlaybill('full');

type Kind = 'cookie' | 'domain' | 'auto';
type ResolvedKind = 'cookie' | 'domain' | 'company';

function detectKind(q: string): Exclude<Kind, 'auto'> {
  const looksLikeHost = /\.[a-z]{2,}$/i.test(q) || q.includes('/');
  return looksLikeHost ? 'domain' : 'cookie';
}

function normalizeHost(raw: string): string {
  let host = raw.trim().toLowerCase();
  try {
    if (host.includes('://')) host = new URL(host).hostname;
    else if (host.includes('/')) host = new URL('https://' + host).hostname;
  } catch {
    /* fall through with raw */
  }
  return host.replace(/^www\./, '');
}

function companyNeedle(raw: string): string {
  const lower = raw.trim().toLowerCase().replace(/^www\./, '');
  const parts = lower.split('.');
  if (parts.length >= 2 && parts[parts.length - 1].length <= 6) {
    return parts[parts.length - 2];
  }
  return lower;
}

type RelatedEntry = {
  kind: 'cookie' | 'domain';
  name: string;
  company: string;
  service: string;
  category: string;
  severity: string;
  description?: string;
  lifetime?: string;
  docs_url?: string;
  pattern?: boolean;
};

function collectByCompany(
  predicate: (company: string) => boolean,
  exclude?: { kind: 'cookie' | 'domain'; name: string }
): RelatedEntry[] {
  const out: RelatedEntry[] = [];
  for (const [name, entry] of Object.entries(playbill.cookies)) {
    if (!predicate(entry.company)) continue;
    if (exclude?.kind === 'cookie' && exclude.name === name) continue;
    out.push({ kind: 'cookie', name, ...entry });
  }
  for (const [name, entry] of Object.entries(playbill.domains)) {
    if (!predicate(entry.company)) continue;
    if (exclude?.kind === 'domain' && exclude.name === name) continue;
    out.push({ kind: 'domain', name, ...entry });
  }
  return out;
}

const app = new Hono();

app.get('/api/search', (c) => {
  const q = (c.req.query('q') ?? '').trim();
  const kindParam = (c.req.query('kind') ?? 'auto') as Kind;

  if (!q) {
    return c.json({ error: 'missing q', hint: 'try ?q=_ga or ?q=apollo.com' }, 400);
  }
  if (q.length > 200) {
    return c.json({ error: 'query too long' }, 400);
  }

  const kind = kindParam === 'auto' ? detectKind(q) : kindParam;
  const host = kind === 'domain' ? normalizeHost(q) : undefined;

  type PrimaryMatch =
    | (ReturnType<typeof matchCookie> & { _kind: 'cookie' })
    | (ReturnType<typeof matchDomain> & { _kind: 'domain' });

  let primary: PrimaryMatch | null = null;
  let primaryKey: { kind: 'cookie' | 'domain'; name: string } | undefined;

  if (kind === 'cookie') {
    const m = matchCookie(playbill, q);
    if (m) {
      primary = { ...m, _kind: 'cookie' } as PrimaryMatch;
      primaryKey = { kind: 'cookie', name: m.name! };
    }
  } else {
    const m = matchDomain(playbill, host!);
    if (m) {
      primary = { ...m, _kind: 'domain' } as PrimaryMatch;
      primaryKey = { kind: 'domain', name: m.hostname! };
    }
  }

  let related: RelatedEntry[] = [];
  let resolvedKind: ResolvedKind = kind;

  if (primary) {
    const company = (primary as any).company as string;
    related = collectByCompany((c) => c === company, primaryKey);
  } else {
    const needle = companyNeedle(q);
    if (needle.length >= 3) {
      const lower = needle.toLowerCase();
      related = collectByCompany((company) => company.toLowerCase().includes(lower));
      if (related.length > 0) resolvedKind = 'company';
    }
  }

  const { _kind, ...primaryOut } = primary ?? ({} as any);
  c.header('cache-control', 'public, max-age=60, s-maxage=300');
  return c.json({
    query: q,
    normalized: host,
    kind: resolvedKind,
    match: primary ? primaryOut : null,
    related,
    source: `playbill@${playbill.version}`,
    stats: playbill.stats
  });
});

export default app;
