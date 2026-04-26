import { Hono } from 'hono';
import { loadPlaybill, matchCookie, matchDomain } from '@consenttheater/playbill';

const playbill = loadPlaybill('full');

/**
 * Cloudflare Worker bindings. Define matching entries in wrangler.jsonc.
 *
 * - ANALYTICS:                Cloudflare Analytics Engine dataset, written
 *                             to from /api/event when a visitor has opted
 *                             into anonymous analytics.
 * - CLOUDFLARE_ACCOUNT_ID:    Account that owns the dataset, used by
 *                             /api/stats to query Analytics Engine via SQL.
 * - CLOUDFLARE_API_TOKEN:     Token with Analytics Engine read scope. Set
 *                             via `wrangler secret put`.
 */
type Env = {
  ANALYTICS?: AnalyticsEngineDataset;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
};

interface AnalyticsEngineDataset {
  writeDataPoint(point: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

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
  consent_burden: string;
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

const app = new Hono<{ Bindings: Env }>();

/**
 * Security headers for /api/* responses. Static HTML/assets served by
 * the ASSETS binding pick up their headers from `public/_headers`;
 * worker-controlled paths (run_worker_first) apply theirs here.
 *
 * The CSP is JSON-tight — these endpoints never serve HTML, so almost
 * everything is locked off. `frame-ancestors 'none'` blocks JSON
 * smuggling via embedded frames.
 */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  c.header(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
});

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

/**
 * First-party analytics — `/api/event`. ACTIVE.
 *
 * Receives a single page-view beacon from the consent-gated tracker on
 * the front-end. Writes one row to the Cloudflare Analytics Engine
 * dataset bound as ANALYTICS. Aggregates land on the public dashboard
 * at /stats/ via the companion /api/stats endpoint.
 *
 * Privacy contract:
 * - No IP is stored. Cloudflare gives us `cf.country` (already derived
 *   from the IP and discarded by their network); we keep the country
 *   only.
 * - No cookies, no cross-site identifier, no fingerprint.
 * - Path / title / referrer-host are bounded in length to prevent the
 *   beacon from being abused as arbitrary storage.
 *
 * Schema (positional, must match /api/stats SQL queries):
 *   blob1: path
 *   blob2: title (truncated)
 *   blob3: referrer host (no path, no query)
 *   blob4: country code (ISO-3166 alpha-2, "XX" for unknown)
 *   blob5: viewport class ("mobile" | "tablet" | "desktop")
 *   double1: 1 (per-event sample, kept for SUM aggregations)
 *
 * TODO(future):
 * - Optional UA-based bot filter (don't write events from obvious crawlers).
 * - Time-on-page or scroll-depth signals if the team decides they're worth
 *   the extra schema.
 */

const MAX_PATH = 256;
const MAX_TITLE = 256;
const MAX_HOST = 128;

function clampString(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

function viewportClass(width: unknown): 'mobile' | 'tablet' | 'desktop' {
  const w = typeof width === 'number' ? width : 0;
  if (w > 0 && w < 600) return 'mobile';
  if (w >= 600 && w < 1024) return 'tablet';
  return 'desktop';
}

function refererHost(value: unknown, ownHost: string): string {
  if (typeof value !== 'string' || !value) return '';
  try {
    const host = new URL(value).host;
    // Internal navigation between our own pages — collapse to empty so
    // we never see "consenttheater.org" dominating Top referrers. Only
    // external entry points are interesting there.
    if (host === ownHost) return '';
    return host.slice(0, MAX_HOST);
  } catch {
    return '';
  }
}

app.post('/api/event', async (c) => {
  if (!c.env.ANALYTICS) {
    return c.body(null, 204); // not configured — silently accept
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: 'invalid json' }, 400);
  }

  const path = clampString(payload.p, MAX_PATH) || '/';
  const title = clampString(payload.t, MAX_TITLE);
  const ownHost = (() => {
    try { return new URL(c.req.url).host; } catch { return ''; }
  })();
  const ref = refererHost(payload.r, ownHost);
  const vp = viewportClass(payload.s);

  const cf = (c.req.raw as Request & { cf?: { country?: string } }).cf;
  const country =
    typeof cf?.country === 'string' && /^[A-Z]{2}$/.test(cf.country)
      ? cf.country
      : 'XX';

  c.env.ANALYTICS.writeDataPoint({
    blobs: [path, title, ref, country, vp],
    doubles: [1],
    indexes: [path]
  });

  return c.body(null, 204);
});

/**
 * First-party analytics — `/api/stats`. ACTIVE.
 *
 * Public, unauthenticated. Returns aggregate counts only: top paths,
 * top referrers, top countries. No row-level data, no individual events.
 *
 * Reads from Analytics Engine via the Cloudflare SQL API. Both
 * CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set; without
 * them, returns a 503 with an empty `configured: false` payload so the
 * /stats/ page can render a "not yet wired up" state instead of crashing.
 *
 * Cached for 5 minutes at the edge (`s-maxage=600`) — counts don't move
 * fast enough to justify hitting the SQL API on every page-view of
 * /stats/.
 */

const STATS_DATASET = 'consenttheater_analytics_events';
const STATS_ALLOWED_WINDOWS = new Set([7, 30, 90]);
const STATS_DEFAULT_WINDOW = 90;
const STATS_LIMIT = 30;

/**
 * Referrer hosts to exclude from the Top Referrers panel. We filter
 * self-referrals at write time (see refererHost above), but rows
 * written before that fix landed still sit in the 90-day window. SQL
 * filter ensures the dashboard never surfaces them. Extend as needed.
 */
const STATS_REFERRER_EXCLUDES = [
  'consenttheater.org',
  'www.consenttheater.org'
];

function resolveWindowDays(raw: string | undefined): number {
  const parsed = parseInt(raw ?? '', 10);
  return STATS_ALLOWED_WINDOWS.has(parsed) ? parsed : STATS_DEFAULT_WINDOW;
}

async function runSql(env: Env, sql: string): Promise<unknown> {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error('analytics not configured');
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'text/plain'
    },
    body: sql
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`analytics engine ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

app.get('/api/stats', async (c) => {
  const days = resolveWindowDays(c.req.query('days'));

  if (!c.env.CLOUDFLARE_ACCOUNT_ID || !c.env.CLOUDFLARE_API_TOKEN) {
    c.header('cache-control', 'public, max-age=60');
    return c.json(
      {
        configured: false,
        window_days: days,
        total_views: 0,
        top_paths: [],
        top_referrers: [],
        top_countries: [],
        time_series: []
      },
      503
    );
  }

  const window = `INTERVAL '${days}' DAY`;

  try {
    const [topPaths, topReferrers, topCountries, totalRow, timeSeries] = await Promise.all([
      runSql(
        c.env,
        `SELECT blob1 AS path, SUM(_sample_interval) AS views
         FROM ${STATS_DATASET}
         WHERE timestamp > NOW() - ${window}
         GROUP BY path
         ORDER BY views DESC
         LIMIT ${STATS_LIMIT}`
      ),
      runSql(
        c.env,
        (() => {
          const excludesSql = STATS_REFERRER_EXCLUDES
            .map((h) => `'${h.replace(/'/g, "''")}'`)
            .join(', ');
          return `SELECT blob3 AS referrer, SUM(_sample_interval) AS views
            FROM ${STATS_DATASET}
            WHERE timestamp > NOW() - ${window}
              AND blob3 != ''
              AND blob3 NOT IN (${excludesSql})
            GROUP BY referrer
            ORDER BY views DESC
            LIMIT ${STATS_LIMIT}`;
        })()
      ),
      runSql(
        c.env,
        `SELECT blob4 AS country, SUM(_sample_interval) AS views
         FROM ${STATS_DATASET}
         WHERE timestamp > NOW() - ${window}
         GROUP BY country
         ORDER BY views DESC
         LIMIT ${STATS_LIMIT}`
      ),
      runSql(
        c.env,
        `SELECT SUM(_sample_interval) AS total
         FROM ${STATS_DATASET}
         WHERE timestamp > NOW() - ${window}`
      ),
      runSql(
        c.env,
        `SELECT toDate(timestamp) AS day, SUM(_sample_interval) AS views
         FROM ${STATS_DATASET}
         WHERE timestamp > NOW() - ${window}
         GROUP BY day
         ORDER BY day ASC`
      )
    ]);

    type Row = { data: Array<Record<string, unknown>> };
    const totals = (totalRow as Row).data?.[0]?.total ?? 0;

    c.header('cache-control', 'public, max-age=300, s-maxage=600');
    return c.json({
      configured: true,
      window_days: days,
      total_views: Number(totals) || 0,
      top_paths: (topPaths as Row).data ?? [],
      top_referrers: (topReferrers as Row).data ?? [],
      top_countries: (topCountries as Row).data ?? [],
      time_series: (timeSeries as Row).data ?? []
    });
  } catch (err) {
    return c.json(
      { configured: true, error: err instanceof Error ? err.message : 'unknown' },
      500
    );
  }
});

export default app;
