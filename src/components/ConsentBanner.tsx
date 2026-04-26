import * as React from 'react';
import Zest from '@freshjuice/zest/headless';
import { CookieIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { startAnalytics, stopAnalytics } from '@/lib/analytics';

/**
 * ConsentTheater consent banner.
 *
 * - Lists strictly-necessary storage explicitly (transparency under
 *   ePrivacy Art. 5(3) "clear and comprehensive information").
 * - Asks for consent on a single optional category — anonymous analytics
 *   via Counterscale. Default is OFF.
 * - Reject and Accept buttons are equal in size and prominence (no dark
 *   pattern, per GDPR Art. 7 "freely given" reading).
 * - Banner is dismissable, but choosing Reject vs Accept persists the
 *   decision and hides the banner on subsequent visits.
 * - Footer link "Cookie preferences" dispatches `ct:open-consent-banner`
 *   to reopen the banner.
 */

const REOPEN_EVENT = 'ct:open-consent-banner';

export function ConsentBanner() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    // Zest as a pure consent-state engine — we gate the only optional
    // script (the analytics beacon) ourselves in analytics.ts, so
    // there's nothing for Zest's interceptors to do here.
    //
    // `essentialKeys` declares `ct_settings` (our theme/contrast pref)
    // as strictly-necessary so the storage interceptor doesn't classify
    // it as marketing-by-default and block the user's explicit toggle.
    //
    // `intercept.scripts: false` skips the script blocker entirely —
    // we don't ship any third-party `<script>` tags that need consent
    // gating. (cookies + storage interception stay on for defence in
    // depth — `essentialKeys` is enough to allow `ct_settings` through.)
    Zest.init({
      respectDNT: true,
      expiration: 365,
      essentialKeys: ['ct_settings'],
      intercept: { scripts: false }
    });

    if (!Zest.hasConsentDecision()) {
      setOpen(true);
    } else if (Zest.hasConsent('analytics')) {
      startAnalytics();
    }

    const handleReopen = () => setOpen(true);
    window.addEventListener(REOPEN_EVENT, handleReopen);
    return () => window.removeEventListener(REOPEN_EVENT, handleReopen);
  }, []);

  const acceptAnalytics = () => {
    Zest.updateConsent({ essential: true, analytics: true });
    startAnalytics();
    setOpen(false);
  };

  const rejectAnalytics = () => {
    Zest.updateConsent({ essential: true, analytics: false });
    stopAnalytics();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:px-0"
    >
      <div className="mx-auto w-full max-w-2xl border border-border bg-card text-card-foreground shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <CookieIcon size={18} aria-hidden="true" className="text-muted-foreground" />
            <p id="consent-title" className="font-display text-sm font-bold tracking-tight">
              Cookies &amp; Analytics
            </p>
          </div>
          <button
            type="button"
            aria-label="Close — choose later"
            onClick={() => setOpen(false)}
            className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <XIcon size={14} aria-hidden="true" />
          </button>
        </div>

        <div id="consent-body" className="space-y-4 px-5 py-4 text-sm leading-relaxed">
          <p className="text-foreground/90">
            ConsentTheater is a non-commercial, open-source project. We don't sell data,
            run ads, or share anything with third parties. Here's exactly what your
            browser stores and what we'd like to measure.
          </p>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Strictly necessary · always on
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-foreground/85">
              <li>
                <code className="bg-secondary px-1 font-mono">ct_settings</code>
                <span className="text-muted-foreground"> (localStorage)</span> — your
                theme, contrast, and language preferences. Never leaves your browser.
              </li>
              <li>
                <code className="bg-secondary px-1 font-mono">zest_consent</code>
                <span className="text-muted-foreground"> (cookie, 365 days)</span> —
                records this consent decision so we can honour it on your next visit.
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-muted-foreground">
              No consent required for these — they remember choices you've explicitly
              made on this site, and qualify as strictly-necessary under ePrivacy
              Art. 5(3).
            </p>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Optional · anonymous analytics
            </p>
            <p className="mt-2 text-xs text-foreground/85">
              <strong>Privacy-friendly page-view counter</strong> via{' '}
              <a
                href="https://plausible.io/privacy-focused-web-analytics"
                target="_blank"
                rel="noopener"
                className="link"
              >Plausible Analytics</a>{' '}
              — open-source, EU-hosted (Falkenstein, Germany), no cookies, no
              fingerprint, no cross-site identifier, no IP storage.{' '}
              <strong>If you accept</strong>, your browser sends a single
              pageview event directly to plausible.io recording path, referrer,
              country, and device class.{' '}
              The full dashboard is{' '}
              <a href="/stats/" className="link">public</a>{' '}
              — anyone can audit what we collect. Off by default.
            </p>
          </section>

          <p className="text-[11px] text-muted-foreground">
            We do <strong>not</strong> use marketing trackers, advertising pixels,
            personalisation cookies, or any other tracking technology. Those are
            permanently off by design — there is no toggle for them because they
            don't exist on this site.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-secondary/30 px-5 py-3 sm:flex-row-reverse sm:items-center sm:justify-start">
          <Button
            type="button"
            onClick={acceptAnalytics}
            className="sm:min-w-[10rem]"
          >
            Accept analytics
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={rejectAnalytics}
            className="sm:min-w-[10rem]"
          >
            Reject analytics
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dispatch from anywhere in the page (e.g. a "Cookie preferences" footer link).
 */
export function openConsentBanner() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(REOPEN_EVENT));
}
