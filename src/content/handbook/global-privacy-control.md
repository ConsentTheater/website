---
title: 'Global Privacy Control — what it is and how to turn it on'
summary: >-
  GPC is a browser-level signal that automatically tells every website "do not
  sell or share my data". A plain-language guide to what it does, where it is
  legally binding, and step-by-step instructions to enable it on every major
  browser — desktop and mobile.
category: consent
updated: '2026-05-09'
created: '2026-05-09'
related:
  - tracking-pixels
  - privacy-friendly-browsers
---

If you have ever clicked "reject all" on twenty different cookie banners
in one day, you have already noticed that consent UX on the web is broken.
**Global Privacy Control (GPC)** is an attempt to fix that — at the browser
level, once, automatically, for every site you ever visit.

## What GPC actually is

GPC is two simple things working together:

1. **An HTTP request header**: `Sec-GPC: 1` that the browser sends with every
   request when GPC is on.
2. **A JavaScript property**: `navigator.globalPrivacyControl` that scripts on
   the page can read to learn the same signal.

If a website's server or scripts see either of those, the browser is telling
them: *the user does not consent to having their personal information sold or
shared with third parties for purposes like cross-site advertising.*

That's the whole protocol. It is intentionally narrow: it expresses a single
specific opt-out, not generic "respect my privacy" — because that turned out
to be the fatal weakness of the older Do Not Track signal, which sites simply
ignored on the grounds that it didn't mean anything legally.

GPC is currently a [W3C work-in-progress specification](https://w3c.github.io/gpc/),
adopted as an official W3C work item by the Privacy Working Group in late
2024. The pre-W3C reference is at [globalprivacycontrol.org](https://globalprivacycontrol.org/).

## Where GPC is legally binding

This is the bit that makes GPC actually useful, where Do Not Track wasn't.

- **California (CCPA / CPRA)** — the California Attorney General's office
  has [explicitly stated](https://oag.ca.gov/privacy/ccpa/gpc) that ignoring
  a GPC signal is a violation of CCPA's opt-out-of-sale right. A 2022
  Attorney-General settlement (Sephora) made this enforcement-real, not
  theoretical.
- **Colorado, Connecticut, Texas, and several other US states** — their
  consumer privacy laws now reference "universal opt-out mechanisms" by
  similar wording, and GPC is the working implementation of that.
- **EU / UK** — GPC is **not** legally recognised in EU/UK law as an opt-in
  consent expression. ePrivacy still requires explicit consent for storage
  and access, and a "do not sell" signal is not the same as "do not store
  cookies." That said, well-built consent platforms can choose to honour GPC
  as an opt-out signal voluntarily, and some do.

So GPC's legal teeth are sharpest in the US. Outside the US it's currently
"good signal of preference" rather than "do this or get fined."

## How websites should respond

A website that respects GPC and falls under a regime that recognises it
should:

- **Not** trigger any sale or sharing of the visitor's personal information
  by default. No setting up a cross-site advertising profile, no transferring
  data to ad-tech partners that would qualify as a "sale" under CCPA.
- **Not** show "click here to opt out" prompts again — the GPC signal *is*
  the opt-out. Asking the user to confirm something they've already
  signalled is a dark pattern.
- **Not** treat GPC as an excuse to break the site or refuse to serve content.
  GPC opts out of *sale/sharing*, not out of *receiving the service*.

In practice, sites that use a consent management platform (CMP) usually have
a setting to read GPC and pre-set the opt-out flags accordingly.

## How to turn it on

### Firefox (desktop, version 120 and later)

GPC ships built-in. To enable:

1. Open the menu (☰) → **Settings**
2. **Privacy & Security** in the left sidebar
3. Scroll to **Website Privacy Preferences**
4. Tick **"Tell websites not to sell or share my data"**

Firefox documents this on its
[support page](https://support.mozilla.org/en-US/kb/global-privacy-control).
The same setting appears in Firefox for Android with
[its own guide](https://support.mozilla.org/en-US/kb/global-privacy-control-firefox-android).
Firefox for iOS does not currently expose a GPC toggle (Apple-platform
constraints).

### Brave (desktop and mobile)

GPC is **on by default** — no action required. You can verify by visiting
[globalprivacycontrol.org](https://globalprivacycontrol.org/) and looking for
the green "GPC signal detected" indicator.

### DuckDuckGo Browser (desktop and mobile)

GPC is **on by default**. DuckDuckGo was a founding member of the GPC
standards effort and ships it active in the browser and the browser
extension. Their documentation: [GPC in DuckDuckGo](https://duckduckgo.com/duckduckgo-help-pages/privacy/gpc).

### Chrome / Edge / Opera

There is **no native GPC support** in any Chromium-based browser at time of
writing. Workarounds:

- **Privacy Badger** extension (from EFF) sets GPC automatically.
- **DuckDuckGo Privacy Essentials** extension does the same.
- Some other privacy extensions (e.g. uBlock Origin's privacy-focused forks)
  also expose a GPC option.

Without an extension, Chrome and Edge will not transmit GPC, regardless of
how many other privacy settings you enable.

### Safari (macOS and iOS)

Apple has not added GPC to Safari, citing existing Intelligent Tracking
Prevention as their preferred mechanism. There is currently no native GPC
toggle. A handful of Safari extensions claim to add it, but support is
patchy.

### Tor Browser

GPC is on as part of Tor Browser's privacy defaults; you don't need to
enable anything.

### Mullvad Browser, LibreWolf, Zen

All three are Firefox-based. Mullvad Browser ships with GPC on by default.
LibreWolf has it as a default-on hardened setting. Zen inherits the
standard Firefox toggle (Settings → Privacy & Security → Website Privacy
Preferences).

## Why GPC isn't perfect — yet

Two honest caveats.

**Adoption is uneven.** Plenty of sites still don't read the signal. The
ones that do tend to be in regulated industries (publishers in California,
ad networks who got fined). On the long tail of the web, GPC is invisible
to many sites. That's a softer state than the law would describe — it's
not yet "send GPC and you're protected."

**Scope is narrow by design.** GPC says one thing: "do not sell/share."
It does not say "do not track me at all", "do not set cookies", or "do not
fingerprint." Those are bigger asks that are addressed by other tools
([browser-level privacy](/handbook/privacy-friendly-browsers/), tracker
blockers, the EU consent regime). GPC is one specific, legally-anchored
signal — useful exactly because it doesn't try to do everything.

That said: enabling it costs nothing, it works automatically, and where it
*is* legally binding, ignoring it is a fineable offence. Worth turning on.

## Reading list

- **[Global Privacy Control specification](https://w3c.github.io/gpc/)** —
  the W3C work-in-progress spec, with the legal-and-implementation
  considerations [explainer](https://w3c.github.io/gpc/explainer.html).
- **[California AG — Global Privacy Control](https://oag.ca.gov/privacy/ccpa/gpc)** —
  official state position that ignoring GPC violates CCPA.
- **[MDN: Sec-GPC header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-GPC)**
  and **[Navigator.globalPrivacyControl](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/globalPrivacyControl)** —
  technical references for site implementers.
- **[Firefox: Global Privacy Control](https://support.mozilla.org/en-US/kb/global-privacy-control)** —
  desktop how-to.
- **[Firefox for Android: GPC](https://support.mozilla.org/en-US/kb/global-privacy-control-firefox-android)** —
  mobile how-to.
- **[DuckDuckGo: GPC](https://duckduckgo.com/duckduckgo-help-pages/privacy/gpc)** —
  on by default in DDG products.
