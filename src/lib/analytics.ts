/**
 * First-party analytics via Plausible (Hetzner Falkenstein, Germany).
 *
 * The tracker is bundled from the official npm package — no third-party
 * <script> is loaded from plausible.io at runtime. The only network
 * call to plausible.io is a single POST to /api/event when a pageview
 * is captured, sent directly from the visitor's browser. Cloudflare is
 * not in the analytics data path.
 *
 * Init is gated on explicit analytics consent through Zest. Without
 * consent the tracker is never initialised and no events are sent.
 *
 * The Plausible package is browser-only — we dynamic-import it inside
 * `startAnalytics` so the SSR/prerender pass never has to resolve it.
 */

const PLAUSIBLE_DOMAIN = 'consenttheater.org';

let initialized = false;

/**
 * Boot Plausible. Idempotent — calling more than once on the same page
 * load is a no-op. Safe to call from React effects and from consent
 * banner click handlers.
 */
export function startAnalytics(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;
  void import('@plausible-analytics/tracker').then(({ init }) => {
    init({
      domain: PLAUSIBLE_DOMAIN,
      autoCapturePageviews: true,
      outboundLinks: false,
      fileDownloads: false,
      formSubmissions: false
    });
  });
}

/**
 * Mark the tracker as inactive for this page load. Plausible's npm
 * package binds its handlers in `init` and offers no public teardown,
 * but the site is a static MPA — every navigation is a fresh document,
 * so revoked consent simply means startAnalytics() won't be called on
 * the next page load. The currently-fired pageview cannot be unsent.
 */
export function stopAnalytics(): void {
  initialized = false;
}
