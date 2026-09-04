// _utils/markdown-variant.ts
// Shared markdown content-negotiation logic, ported from freshjuice-website
// (worker/_utils/markdown-variant.js, commit 9f64943) so all sites negotiate
// identically: full RFC 9110 §12.5.1 q-value parsing, wildcard specificity,
// ranked selection, q=0 honored.

export const AI_BOT_PATTERN =
  /\b(GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Anthropic-AI|PerplexityBot|Google-Extended|Applebot-Extended|Meta-ExternalAgent|FacebookBot|Bytespider|cohere-ai|YouBot|Diffbot|ImagesiftBot|Omgili|DuckAssistBot|CCBot|Amazonbot)\b/i;

// Parse Accept header into ranked entries (RFC 9110 §12.5.1)
function parseAccept(header: string): Array<{ type: string; q: number; specificity: number; position: number }> {
  if (!header) return [];
  return header
    .split(',')
    .map((raw, i) => {
      const parts = raw.trim().split(';').map((s) => s.trim());
      const type = parts[0].toLowerCase();
      let q = 1;
      for (const p of parts.slice(1)) {
        const [k, v] = p.split('=').map((s) => s.trim());
        if (k === 'q') q = Math.max(0, Math.min(1, Number(v) || 0));
      }
      const specificity = type === '*/*' ? 0 : type.endsWith('/*') ? 1 : 2;
      return { type, q, specificity, position: i };
    })
    .filter((e) => e.type);
}

// Pick best matching type from Accept header
export function preferredType(header: string, candidates: string[]): string | null {
  const entries = parseAccept(header);
  if (!entries.length) return candidates[0] || null;
  let best: string | null = null;
  let bestQ = -1;
  let bestPos = Infinity;
  for (const cand of candidates) {
    let matched: { q: number; specificity: number } | null = null;
    let matchedPos = Infinity;
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (
        e.type === '*/*' ||
        (e.type.endsWith('/*') && cand.startsWith(e.type.slice(0, -1))) ||
        e.type === cand
      ) {
        if (
          !matched ||
          e.specificity > matched.specificity ||
          (e.specificity === matched.specificity && i < matchedPos)
        ) {
          matched = e;
          matchedPos = i;
        }
      }
    }
    if (!matched || matched.q <= 0) continue;
    if (matched.q > bestQ || (matched.q === bestQ && matchedPos < bestPos)) {
      best = cand;
      bestQ = matched.q;
      bestPos = matchedPos;
    }
  }
  return best;
}

export function wantsMarkdown(accept = '', userAgent = ''): boolean {
  if (AI_BOT_PATTERN.test(userAgent)) return true;
  return preferredType(accept, ['text/html', 'text/markdown']) === 'text/markdown';
}

// Map a page URL to its sibling-file `.md` variant emitted by astro-llms-md:
//   "/about/"  → "/about.md"
//   "/about"   → "/about.md"
//   "/"        → "/.md"
export function markdownVariantUrl(url: URL): URL {
  if (url.pathname.endsWith('.md')) return url;
  const stripped = url.pathname.replace(/\/$/, '');
  return new URL(`${stripped}.md`, url);
}

/**
 * Fetch the `.md` variant from the ASSETS binding and return it as a
 * `text/markdown` response. Returns `null` when no variant exists so callers
 * can fall through to HTML.
 */
export async function serveMarkdownVariant(
  assets: { fetch: (req: Request) => Promise<Response> },
  url: URL
): Promise<Response | null> {
  const mdUrl = markdownVariantUrl(url);
  const mdRes = await assets.fetch(new Request(mdUrl.href, { method: 'GET' }));
  if (!mdRes.ok) return null;

  const headers = new Headers(mdRes.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.set('Vary', NEGOTIATED_VARY);
  headers.set('X-Content-Variant', 'markdown');
  return new Response(mdRes.body, { status: 200, statusText: 'OK', headers });
}

// Vary on everything the negotiation keys on, so caches never serve one
// variant where the other was negotiated.
export const NEGOTIATED_VARY = 'User-Agent, Accept, Accept-Encoding';