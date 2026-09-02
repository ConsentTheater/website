import { Hono } from 'hono';
import { loadPlaybill, matchCookie, matchDomain } from '@consenttheater/playbill';

const playbill = loadPlaybill('full');

type Env = {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
};

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

// =============================================================================
// Shared search — single implementation behind both /api/search and /mcp.
// =============================================================================

type SearchResult = {
  query: string;
  normalized?: string;
  kind: ResolvedKind;
  match: Record<string, unknown> | null;
  related: RelatedEntry[];
  source: string;
  stats: typeof playbill.stats;
};

function runSearch(rawQ: string, kindParam: Kind): SearchResult | { error: string; hint?: string } {
  const q = rawQ.trim();
  if (!q) return { error: 'missing q', hint: 'try _ga or apollo.com' };
  if (q.length > 100) return { error: 'query too long' };

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
  return {
    query: q,
    normalized: host,
    kind: resolvedKind,
    match: primary ? primaryOut : null,
    related,
    source: `playbill@${playbill.version}`,
    stats: playbill.stats
  };
}

const app = new Hono<{ Bindings: Env }>();

/**
 * Security headers for /api/* responses. Static HTML/assets served by
 * the ASSETS binding pick up their headers from `public/_headers`; this
 * middleware is scoped to API paths so it doesn't trample the static
 * CSP for HTML pages now that the worker fronts every request.
 *
 * The CSP is JSON-tight — these endpoints never serve HTML, so almost
 * everything is locked off. `frame-ancestors 'none'` blocks JSON
 * smuggling via embedded frames.
 */
app.use('/api/*', async (c, next) => {
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
  const q = c.req.query('q') ?? '';
  const kindParam = (c.req.query('kind') ?? 'auto') as Kind;
  const result = runSearch(q, kindParam);
  if ('error' in result) {
    return c.json(result, 400);
  }
  c.header('cache-control', 'public, max-age=60, s-maxage=300');
  return c.json(result);
});

// =============================================================================
// MCP endpoint (Streamable HTTP, stateless)
// =============================================================================
// Exposes the Playbill search as MCP tools so LLM clients (Claude, ChatGPT,
// IDEs) can query trackers natively. This is a read-only lookup with no
// per-session state, so we run Streamable HTTP in its stateless form: plain
// JSON-RPC 2.0 over POST, no SSE stream, no Mcp-Session-Id. Each call is
// self-contained. Only the three methods any tool-client needs are handled.

const MCP_PROTOCOL_VERSION = '2025-03-26';

const MCP_SERVER_INFO = {
  name: 'consenttheater-playbill',
  version: String(playbill.version)
};

const MCP_TOOLS = [
  {
    name: 'search_tracker',
    description:
      'Look up a tracker in the ConsentTheater Playbill (GDPR tracker knowledge base) by cookie name or domain. ' +
      'Auto-detects whether the query is a cookie or a domain. Returns the matching tracker (company, service, ' +
      'category, GDPR consent burden) plus related trackers from the same company.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Cookie name (e.g. "_ga") or domain (e.g. "apollo.com") to look up.'
        },
        kind: {
          type: 'string',
          enum: ['auto', 'cookie', 'domain'],
          description: 'Force the lookup kind. Defaults to "auto" (detect from the query).'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'list_companies',
    description: 'List every company tracked in the ConsentTheater Playbill.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'list_categories',
    description: 'List every tracker category in the ConsentTheater Playbill (e.g. advertising, analytics).',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_stats',
    description: 'Get Playbill catalogue stats: counts of cookies, domains, and companies.',
    inputSchema: { type: 'object', properties: {} }
  }
];

function mcpText(payload: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function mcpResult(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}

function mcpError(id: unknown, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function handleMcpMethod(method: string, params: any, id: unknown) {
  switch (method) {
    case 'initialize':
      return mcpResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: MCP_SERVER_INFO
      });

    case 'ping':
      return mcpResult(id, {});

    case 'tools/list':
      return mcpResult(id, { tools: MCP_TOOLS });

    case 'tools/call': {
      const name = params?.name;
      const args = params?.arguments ?? {};
      if (name === 'search_tracker') {
        const result = runSearch(String(args.query ?? ''), (args.kind ?? 'auto') as Kind);
        if ('error' in result) {
          return mcpResult(id, { ...mcpText(result), isError: true });
        }
        return mcpResult(id, mcpText(result));
      }
      if (name === 'list_companies') {
        const companies = [...new Set([
          ...Object.values(playbill.cookies).map((e) => e.company),
          ...Object.values(playbill.domains).map((e) => e.company)
        ])].sort();
        return mcpResult(id, mcpText({ count: companies.length, companies }));
      }
      if (name === 'list_categories') {
        const categories = [...new Set([
          ...Object.values(playbill.cookies).map((e) => e.category),
          ...Object.values(playbill.domains).map((e) => e.category)
        ])].sort();
        return mcpResult(id, mcpText({ categories }));
      }
      if (name === 'get_stats') {
        return mcpResult(id, mcpText({ source: `playbill@${playbill.version}`, stats: playbill.stats }));
      }
      return mcpError(id, -32602, `unknown tool: ${name}`);
    }

    default:
      return mcpError(id, -32601, `method not found: ${method}`);
  }
}

app.use('/mcp', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

async function handleMcpPost(c: any) {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json(mcpError(null, -32700, 'parse error'), 400);
  }

  // Notifications (no id) — acknowledge, no response body.
  const isNotification = body && body.id === undefined && typeof body.method === 'string';
  if (isNotification) {
    return c.body(null, 202);
  }

  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return c.json(mcpError(body?.id ?? null, -32600, 'invalid request'), 400);
  }

  return c.json(handleMcpMethod(body.method, body.params, body.id));
}

app.post('/mcp', handleMcpPost);
// Some clients probe GET for an SSE stream; we are stateless, so decline.
app.get('/mcp', (c) => c.json({ error: 'SSE not supported; POST JSON-RPC' }, 405));

// =============================================================================
// Markdown-for-AI fallback
// =============================================================================
// AI crawlers and `Accept: text/markdown` clients get the build-time `.md`
// variant (generated by astro-llms-md) instead of the rendered HTML. Cleaner
// for ingestion, smaller payload, and we get to audit exactly what they see.
//
// Path mapping uses the sibling-file layout astro-llms-md emits:
//   /handbook/dns-sinkholes/  →  /handbook/dns-sinkholes.md
//   /about/                    →  /about.md
//   /                          →  /.md
//
// `Vary: User-Agent, Accept` is set on both variants so CF's edge cache
// (and any downstream proxy) keys them separately.

const AI_BOT_PATTERN =
  /\b(GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Anthropic-AI|PerplexityBot|Google-Extended|Applebot-Extended|Meta-ExternalAgent|FacebookBot|Bytespider|cohere-ai|YouBot|Diffbot|ImagesiftBot|Omgili|DuckAssistBot|CCBot|Amazonbot)\b/i;

function wantsMarkdown(req: Request): boolean {
  const ua = req.headers.get('User-Agent') || '';
  const accept = req.headers.get('Accept') || '';
  return AI_BOT_PATTERN.test(ua) || /text\/markdown/i.test(accept);
}

// True for "page-like" paths (no file extension in the last segment, or a
// trailing slash). Skips the variant lookup for things that are already
// static files: /methodology.md, /llms.txt, /sitemap-index.xml, /_astro/*,
// etc. — those should go straight to ASSETS without a wasted MD probe.
function looksLikePage(pathname: string): boolean {
  if (pathname.endsWith('/')) return true;
  const lastSlash = pathname.lastIndexOf('/');
  const lastSegment = pathname.slice(lastSlash + 1);
  return !lastSegment.includes('.');
}

function htmlPathToMdPath(pathname: string): string {
  // Drop a trailing slash so `/foo/` and `/foo` both map to `/foo.md`.
  // Root `/` becomes `.md` — astro-llms-md emits `dist/.md` for the index.
  const stripped = pathname.replace(/\/$/, '');
  return `${stripped}.md`;
}

async function serveMarkdownVariant(c: { req: { raw: Request; url: string }; env: Env }): Promise<Response | null> {
  const url = new URL(c.req.url);
  const mdPath = htmlPathToMdPath(url.pathname);
  const mdReq = new Request(new URL(mdPath, url), { method: 'GET' });
  const mdRes = await c.env.ASSETS.fetch(mdReq);
  if (!mdRes.ok) return null;

  const headers = new Headers(mdRes.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Vary', 'User-Agent, Accept');
  headers.set('X-Content-Variant', 'markdown');
  return new Response(mdRes.body, {
    status: 200,
    statusText: 'OK',
    headers
  });
}

// Catch-all for non-API traffic. AI crawlers get the .md sibling when one
// exists; everything else falls through to ASSETS, which applies the static
// `public/_headers` cascade.
app.get('*', async (c) => {
  const url = new URL(c.req.url);
  if (looksLikePage(url.pathname) && wantsMarkdown(c.req.raw)) {
    const md = await serveMarkdownVariant(c);
    if (md) return md;
    // No .md variant for this path → fall through to HTML so the bot
    // still gets a usable response.
  }

  const res = await c.env.ASSETS.fetch(c.req.raw);

  // Tell caches that HTML responses vary by UA/Accept too, so they don't
  // serve markdown to a browser (or vice versa).
  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('text/html')) {
    const headers = new Headers(res.headers);
    const existingVary = headers.get('Vary');
    headers.set(
      'Vary',
      existingVary ? `${existingVary}, User-Agent, Accept` : 'User-Agent, Accept'
    );
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers
    });
  }
  return res;
});

export default app;
