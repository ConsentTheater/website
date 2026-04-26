/**
 * First-party analytics for ConsentTheater.
 *
 * No external scripts, no cross-origin requests, no third-party processors.
 * The visitor's browser sends a single `navigator.sendBeacon` request to
 * `/api/event` on this origin, which is handled by our own Cloudflare
 * Worker and stored in our own Cloudflare Analytics Engine dataset.
 *
 * The beacon fires only when:
 *   - the visitor has explicitly opted into analytics through the consent
 *     banner (Zest tracks this in the `analytics` category), AND
 *   - we haven't already fired a pageview for the current path on this
 *     page load (cheap dedupe to avoid double-counting on hydration).
 *
 * Privacy contract — see /privacy/ for full disclosure.
 */

const FIRED = new Set<string>();

interface EventPayload {
  e: 'pageview';
  p: string;            // path
  t: string;            // title
  r: string;            // document.referrer (full URL — server keeps host only)
  s: number;            // viewport width — server derives mobile/tablet/desktop
}

function buildPayload(): EventPayload {
  return {
    e: 'pageview',
    p: location.pathname || '/',
    t: (document.title || '').slice(0, 256),
    r: document.referrer || '',
    s: window.innerWidth || 0
  };
}

function send(payload: EventPayload): void {
  const body = JSON.stringify(payload);
  if (typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/event', blob);
  } else {
    // Best-effort fallback. keepalive lets the request survive page
    // unload, which sendBeacon would otherwise have handled for us.
    void fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  }
}

/**
 * Fire a single pageview beacon for the current page. Idempotent per
 * page-load (rerunning on the same path is a no-op).
 */
export function trackPageview(): void {
  if (typeof window === 'undefined') return;
  const path = location.pathname || '/';
  if (FIRED.has(path)) return;
  FIRED.add(path);
  send(buildPayload());
}

/**
 * Reset the local dedupe cache. Called when the visitor revokes
 * analytics consent so a future re-opt-in starts clean.
 */
export function resetTrackingCache(): void {
  FIRED.clear();
}
