---
title: 'Privacy-friendly browsers — what is built in and where extensions help'
summary: >-
  Some browsers ship with anti-tracking, fingerprint resistance, and Global
  Privacy Control already on. Others give you a clean slate that you have
  to harden yourself. An honest look at the spectrum, where each major
  browser sits, and what extensions still add value on top.
category: privacy-tools
updated: '2026-05-09'
created: '2026-05-09'
related:
  - global-privacy-control
  - tracking-pixels
  - dns-sinkholes
---

The simplest, most effective privacy upgrade most people can make is to
**switch their default browser**. Defaults matter more than settings: a
browser that ships with tracker blocking on for everyone protects far more
people than one that has the option buried three menus deep.

This article walks through the current spectrum honestly — what each major
browser actually does, where the tradeoffs are, and where extensions still
fill gaps even in the privacy-first ones.

## The privacy spectrum

Browsers fall into roughly three groups:

1. **Privacy-first by default** — strong anti-tracking, fingerprint
   resistance, and often GPC on out of the box. Zen, Brave, DuckDuckGo,
   LibreWolf, Mullvad, Tor Browser.
2. **Reasonable defaults you can harden** — solid baseline, but you should
   tweak some settings or add extensions. Firefox falls here.
3. **Need help to be private** — defaults work for the vendor's business
   model, not your privacy. Chrome, Edge, and Safari to a lesser extent.

The more privacy a browser provides by default, the more likely it is to
break some sites. That's a real tradeoff, not a hypothetical one.

## Browsers with privacy baked in

### Zen Browser

**Our pick** when you want a modern, polished browsing experience without
giving up privacy. Zen is a [Firefox fork](https://zen-browser.app/)
launched in 2024 with two design priorities: a contemporary UX (workspaces,
vertical tabs, deeply customisable layouts) and privacy-aware defaults out
of the box.

What's on by default:

- All Mozilla telemetry stripped
- Standard Firefox tracking protection enabled
- DNS-over-HTTPS available
- Same Global Privacy Control toggle as upstream Firefox (Settings →
  Privacy & Security)

**Tradeoffs.** Young project. The codebase is small, the team is
volunteer-scale, and the security audit story is "trust the upstream
Firefox audits, plus our defaults." That's a reasonable bet — Firefox
does the heavy lifting under the hood — but it's not hardened in the
LibreWolf sense. Worth picking if the modern UX matters to you and
you're comfortable being on a project that's actively maturing.

**Best for**: users who want a Firefox-engine browser with a contemporary
UX, telemetry stripped, and a reasonable privacy posture from the first
launch.

### Brave

The conservative alternative if you'd rather pick a browser with more
miles on it. Brave is a Chromium fork built by Brendan Eich's team, with
[Brave Shields](https://brave.com/shields/) on by default for every site:

- Blocks third-party trackers and cross-site cookie tracking
- Randomises the browser values that fingerprinters read, so each session
  presents a slightly different fingerprint
- Strips known ad-tech URL parameters
- Built-in [Tor mode](https://brave.com/privacy-features/) — a private
  window routed through the Tor network, handy for one-off sensitive
  lookups (not a substitute for Tor Browser)
- GPC on by default

**Tradeoffs.** Brave includes its own ad/rewards ecosystem (BAT), which
is opt-in but visible in the UI. In 2020 Brave was caught
[silently injecting referral codes](https://en.wikipedia.org/wiki/Brave_\(web_browser\)#Affiliate_link_controversy)
into some cryptocurrency-related URLs; they fixed it and apologised, but
it's worth knowing if you're picking on trust grounds. Built on Chromium,
so it inherits Google's engine (with the Privacy Sandbox / Topics hooks
removed by Brave).

**Best for**: users who want a strong privacy default with a more
battle-tested codebase than Zen's.

### Firefox + Total Cookie Protection

The mainstream privacy-aware choice. Firefox's
[Enhanced Tracking Protection](https://www.mozilla.org/en-US/firefox/features/block-content/)
is on by default, and "Total Cookie Protection" — every site gets its
own cookie jar, isolated from every other site — is a strong defence
against cross-site tracking. Firefox 120+ added a built-in GPC toggle
(see [our GPC article](/handbook/global-privacy-control/) for how to
flip it).

**Tradeoffs.** Mozilla's recent corporate direction has caused some
unease — TOS updates in 2025 and the acquisition of the Anonym ad-tech
company sit awkwardly with Firefox's privacy positioning. The browser
itself remains a strong privacy tool, but Mozilla's institutional trust
is a separate question that some users weigh differently than others.
Firefox is also the only mainstream browser not built on Chromium, which
matters for engine diversity on the web.

**Best for**: users who want a fully cross-platform browser (including
iOS as Firefox or Firefox Focus / Klar) and are fine with Mozilla's
governance.

### DuckDuckGo Browser

A free desktop and mobile browser from the DuckDuckGo search team. Their
focus is making strong privacy defaults *easy* — no settings to find, no
extensions to install. Tracker blocking, link tracking protection, CNAME
cloaking protection, and GPC are
[on by default](https://duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections).
The mobile apps include a "Fire Button" that wipes browsing data with one
tap.

**Tradeoffs.** Smaller team than Mozilla or Brave, fewer power-user
features. Desktop versions are newer and less mature than the mobile
apps where DuckDuckGo started. Telemetry exists but is documented and
narrow.

**Best for**: less-technical users where simplicity matters more than
configurability, and mobile-first audiences.

### LibreWolf

A community-maintained [Firefox fork](https://librewolf.net/) with
privacy and security defaults set high out of the box. Telemetry
removed, Mozilla services like Pocket disabled, hardening preferences
applied, uBlock Origin pre-installed.

**Tradeoffs.** Small volunteer team, slower update cadence than upstream
Firefox in some configurations, can break sites due to aggressive
defaults. No mobile version. Auto-update story varies by platform.

**Best for**: technically inclined users who want Firefox's engine with
none of Mozilla's corporate footprint, and who are comfortable
configuring their browser when something breaks.

### Mullvad Browser

A joint project of [Mullvad VPN](https://mullvad.net/en/browser) and the
Tor Project. Best understood as **Tor Browser without the Tor network** —
all the same fingerprinting resistance and hardening, but routed through
your normal connection (or, ideally, a VPN of your choice).

- No telemetry of any kind
- Aggressive anti-fingerprinting that keeps users in a small, identical
  bucket
- Cookies wiped between sessions by default
- Same security profile as Tor Browser without the speed cost

**Tradeoffs.** Strict by design: many sites detect "non-standard"
fingerprints and may break or challenge you. Not optimised for keeping
logins, syncing across devices, or running heavy web apps. Best paired
with a VPN, which is what its makers sell — though the browser itself
is free and works without any VPN.

**Best for**: users who want Tor-Browser-grade hardening for daily
browsing, without using the Tor network itself.

### Tor Browser — for the genuinely paranoid only

The reference for "real" anonymity on the web. Built by the
[Tor Project](https://www.torproject.org/), it routes every request
through the Tor network and is hardened against virtually every known
fingerprinting technique.

This one's worth knowing exists, but be honest with yourself about
whether you actually need it. Tor Browser was built for specific threat
models: investigative journalists, dissidents under regimes that surveil
their ISPs, researchers handling topics that can't be tied to their
real identity. **For the ordinary "I don't want Meta tracking me across
sites" goal, the browsers above are sufficient and far more usable.**

**Tradeoffs.** The Tor network adds hundreds of milliseconds per
request, and many services block known Tor exit IPs entirely. Banking,
e-commerce, and any account-protected site will routinely challenge or
refuse you. Daily-driver usage requires a tolerance for friction most
people don't have.

**Best for**: cases where the threat model genuinely includes a
state-level adversary or someone who could subpoena your ISP. For
everyone else: overkill, and you'll be happier on one of the options
above.

## Browsers that need help to be private

### Chrome

Built and maintained by Google, whose core business is targeted
advertising. Chrome still allows third-party cookies by default at time
of writing; Google's "Privacy Sandbox" / Topics API is the planned
replacement, and it's a different ad-tech mechanism, not the absence of
one. No native Global Privacy Control support. Telemetry to Google is
extensive.

You *can* harden Chrome with extensions and settings, but every privacy
gain is fighting the browser's defaults rather than working with them.

**Recommendation**: if you need Chromium for compatibility reasons,
prefer Brave instead.

### Edge

Microsoft's Chromium fork. Better than Chrome on some defaults
(tracking-prevention level setting), worse on others (Bing integration,
Microsoft account telemetry). No GPC. Same general comment as Chrome:
better Chromium options exist.

### Safari

The privacy story on Apple platforms. Intelligent Tracking Prevention
(ITP) is genuinely good — third-party cookies are blocked by default,
and link decoration tracking is partially mitigated. Safari does not,
however, support Global Privacy Control, which Apple has stated is a
deliberate choice in favour of their own ITP mechanism.

The result: Safari is a *reasonable* default on Apple devices, better
than Chrome by a wide margin, but missing the explicit opt-out signal
that GPC provides. On iOS, Safari's privacy features extend to all
browsers (Apple requires WebKit on iOS), so even Firefox / Brave on
iPhone are Safari underneath.

**Recommendation**: fine as a default, but pair with an ad/tracker
blocker extension and assume the GPC layer simply isn't there.

## What extensions still add — even on privacy browsers

Even on Brave or Firefox, a small set of extensions is worth running:

- **[uBlock Origin](https://ublockorigin.com/)** — the canonical
  ad/tracker blocker. Configurable, free, open-source, far more
  effective than browser-built-in shields on edge cases. Note that
  Manifest V3 in Chromium has limited what uBlock Origin can do on
  Chrome/Edge — Firefox and Firefox-forks remain the cleanest home for
  it.
- **[Privacy Badger](https://privacybadger.org/)** (EFF) — sets GPC
  automatically on browsers that don't ship it, learns and blocks
  third-party trackers heuristically.
- **ClearURLs** — strips tracking query parameters (`utm_*`, `fbclid`,
  `gclid`, etc.) from URLs as you click them.
- **LocalCDN** or **Decentraleyes** — serves common JS libraries
  (jQuery, Bootstrap) from a local copy instead of fetching them from a
  CDN, removing one tracking surface.
- **Cookie AutoDelete** — wipes cookies for closed tabs after a delay,
  retaining only whitelisted sites.
- **[ConsentTheater](https://github.com/ConsentTheater/extension)**
  (full disclosure: this is our own project) — shows what trackers and
  cookies are present on the current site and what consent burden they
  carry under GDPR. It does not block; it informs.

Extensions handle things browser engines can't or won't:
finer-grained control over what loads, awareness of new trackers as they
emerge, audit-style visibility into what a site is doing.

## Tradeoffs to keep in mind

Three honest caveats apply across all the privacy browsers above:

**Sites can break.** The more aggressive the default, the more often
something doesn't work. Mullvad and Tor will break more sites than
Brave; Brave breaks more than Firefox. Plan to have a "fallback" browser
for the rare case where something has to work and won't.

**Browsers themselves have data flows.** Even privacy-positioned
browsers ship with some telemetry, sync services, and web compatibility
infrastructure. Mullvad and LibreWolf are the strictest "no telemetry"
options; the rest sit on a spectrum. Read the privacy policy of whatever
you pick, not the marketing page.

**Migration takes effort.** Bookmarks, passwords, autofill, two-factor
secrets — moving them takes a weekend. Plan it as a project rather than
a casual afternoon. Most browsers can import from Chrome/Edge directly.

## Recommendations by use case

- **Most users, easiest upgrade:** Zen Browser. Modern UX, Firefox
  engine, telemetry stripped, privacy posture from the first launch.
- **Want something more battle-tested:** Brave on desktop and mobile.
  Mature, strong defaults, almost no configuration needed.
- **Want to stay mainstream and cross-platform:** Firefox + Total
  Cookie Protection + uBlock Origin + GPC toggle on. Available on every
  platform, including iOS.
- **Mobile-first or non-technical users:** DuckDuckGo Browser. Less to
  understand, strong defaults.
- **Strong hardening for daily browsing:** LibreWolf or Mullvad Browser
  (Mullvad is stricter; LibreWolf is closer to a "regular" Firefox).
- **Apple ecosystem and don't want to switch from Safari:** Safari with
  an ad/tracker-blocker extension and the awareness that GPC isn't
  there.
- **Threat model genuinely includes a state-level adversary or
  subpoena-grade ISP risk:** Tor Browser, accepting the friction. For
  everyone else: overkill, see options above.

## Reading list

- **[Global Privacy Control — what it is and how to turn it on](/handbook/global-privacy-control/)** —
  the companion piece on the GPC signal these browsers carry.
- **[Tracking pixels — what they are and what consent rules apply](/handbook/tracking-pixels/)** —
  what these browsers are defending against.
- **[Brave Shields](https://brave.com/shields/)** — Brave's
  documentation of what it blocks by default.
- **[Zen Browser](https://zen-browser.app/)** — modern Firefox-fork.
- **[LibreWolf](https://librewolf.net/)** — community Firefox-hardening
  project.
- **[Mullvad Browser](https://mullvad.net/en/browser)** — Tor Project
  collaboration, no Tor network.
- **[Tor Browser](https://www.torproject.org/)** — reference for
  high-threat-model browsing.
