import * as React from 'react';
import {
  MagnifyingGlassIcon,
  SpinnerIcon,
  WarningIcon,
  CheckCircleIcon
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ConsentBurden = 'required_strict' | 'required' | 'contested' | 'minimal';
type Category = string;

const BURDEN_LABELS: Record<ConsentBurden, string> = {
  required_strict: 'Strict consent',
  required: 'Consent required',
  contested: 'Contested',
  minimal: 'Minimal'
};

interface Match {
  company: string;
  service: string;
  category: Category;
  consent_burden: ConsentBurden;
  description?: string;
  lifetime?: string;
  docs_url?: string;
  name?: string;
  hostname?: string;
  matchedPattern?: string;
  matchedDomain?: string;
}

interface RelatedEntry {
  kind: 'cookie' | 'domain';
  name: string;
  company: string;
  service: string;
  category: Category;
  consent_burden: ConsentBurden;
  description?: string;
  lifetime?: string;
  docs_url?: string;
  pattern?: boolean;
}

interface ApiResult {
  query: string;
  normalized?: string;
  kind: 'cookie' | 'domain' | 'company';
  match: Match | null;
  related: RelatedEntry[];
  source: string;
  stats: { cookies: number; domains: number; companies: number };
}

const EXAMPLES = ['_ga', '_fbp', 'connect.facebook.net', 'hotjar.com', '_ga_ABC123'];

// Defence in depth: docs_url comes from playbill JSON (schema-validated,
// reviewed in PR), but JSX `href` does not block `javascript:` or `data:`
// schemes. Allow only http(s) and reject anything that fails to parse so
// a malformed entry can't render a broken link or worse.
function safeHttpUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function SearchBar() {
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ApiResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function runSearch(q: string) {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = (await res.json()) as ApiResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={(e) => { e.preventDefault(); void runSearch(query); }}
        className="relative flex items-stretch gap-2"
      >
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cookie name or domain — e.g. _ga, connect.facebook.net"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search for a cookie or domain"
            className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm font-mono outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={loading || !query.trim()}
          className="h-12 cursor-pointer disabled:pointer-events-auto disabled:cursor-pointer disabled:opacity-100"
        >
          {loading ? (
            <>
              <SpinnerIcon className="animate-spin" aria-hidden="true" />
              <span className="sr-only">Searching</span>
            </>
          ) : (
            'Identify'
          )}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQuery(ex);
              void runSearch(ex);
            }}
            className="font-mono border border-border bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && (
        <Card
          role="alert"
          className="mt-6 border-destructive/40 bg-destructive/5"
        >
          <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
            <WarningIcon size={18} aria-hidden="true" />
            Request failed: {error}
          </CardContent>
        </Card>
      )}

      <div aria-live="polite" aria-atomic="false">
        {result && !error && <ResultCard result={result} />}
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: ApiResult }) {
  const hasPrimary = !!result.match;
  const hasRelated = result.related.length > 0;

  if (!hasPrimary && !hasRelated) {
    return (
      <Card className="mt-6">
        <CardContent className="flex items-start gap-3 p-5">
          <CheckCircleIcon size={20} className="mt-0.5 shrink-0 text-band-compliant" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">No known tracker matches</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-mono">{result.normalized ?? result.query}</span> isn't in our catalogue.
              It may be first-party, niche, or not yet classified.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {hasPrimary && <PrimaryCard match={result.match!} kind={result.kind} query={result.query} />}
      {hasRelated && (
        <RelatedCard
          entries={result.related}
          company={result.match?.company ?? null}
          query={result.query}
        />
      )}
    </>
  );
}

function PrimaryCard({
  match: m,
  kind,
  query
}: {
  match: Match;
  kind: ApiResult['kind'];
  query: string;
}) {
  const ident = m.name ?? m.hostname ?? query;
  const burdenLabel = BURDEN_LABELS[m.consent_burden] ?? m.consent_burden;
  const docsUrl = safeHttpUrl(m.docs_url);

  return (
    <Card className="mt-6">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-mono text-base font-semibold">{ident}</p>
            <p className="text-xs text-muted-foreground">
              {kind === 'cookie' ? 'Cookie' : 'Domain'}
              {m.matchedPattern && <> · matched pattern <code className="font-mono">{m.matchedPattern}</code></>}
              {m.matchedDomain && m.matchedDomain !== m.hostname && (
                <> · matched <code className="font-mono">{m.matchedDomain}</code></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={m.consent_burden}>{burdenLabel}</Badge>
            <Badge variant="outline" className="font-mono normal-case">
              {m.category}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Company" value={m.company} />
          <FieldRow label="Service" value={m.service} />
          {m.lifetime && <FieldRow label="Lifetime" value={m.lifetime} />}
          {docsUrl && (
            <FieldRow
              label="Docs"
              value={
                <a
                  href={docsUrl.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  {docsUrl.hostname}
                </a>
              }
            />
          )}
        </div>

        {m.description && (
          <p className={cn('text-sm leading-relaxed text-foreground/80', 'border-t border-border pt-4')}>
            {m.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RelatedCard({
  entries,
  company,
  query
}: {
  entries: RelatedEntry[];
  company: string | null;
  query: string;
}) {
  const cookies = entries.filter((e) => e.kind === 'cookie');
  const domains = entries.filter((e) => e.kind === 'domain');
  const heading = company
    ? `Also from ${company}`
    : `Entries matching "${query}"`;

  return (
    <Card className="mt-4">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{heading}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {cookies.length} cookie{cookies.length === 1 ? '' : 's'} · {domains.length} domain{domains.length === 1 ? '' : 's'}
          </p>
        </div>

        {cookies.length > 0 && <RelatedGroup label="Cookies" entries={cookies} />}
        {domains.length > 0 && <RelatedGroup label="Domains" entries={domains} />}
      </CardContent>
    </Card>
  );
}

function RelatedGroup({ label, entries }: { label: string; entries: RelatedEntry[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <ul className="divide-y divide-border border-y border-border">
        {entries.map((e) => (
          <li
            key={`${e.kind}:${e.name}`}
            className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="font-mono text-sm">{e.name}</p>
              <p className="truncate text-xs text-muted-foreground">{e.service}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={e.consent_burden}>
                {BURDEN_LABELS[e.consent_burden] ?? e.consent_burden}
              </Badge>
              <Badge variant="outline" className="font-mono normal-case">
                {e.category}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
