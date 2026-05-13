---
title: 'DNS sinkholes — taking your privacy back at the network level'
summary: >-
  Browser-level defences only protect the browser. A DNS sinkhole blocks
  trackers across every device on your network — phones, TVs, IoT junk,
  and apps that ignore your ad blocker. This article explains how DNS
  blocking works, what it cannot fix, and walks through the practical
  options (NextDNS, ControlD, Pi-hole, AdGuard Home).
category: privacy-tools
updated: '2026-05-13'
created: '2026-05-13'
related:
  - privacy-friendly-browsers
  - tracking-pixels
---

Browser-level defences are one layer of privacy protection — but only one.
They protect the browser. Your phone's apps, your smart TV, your Wi-Fi
thermostat, the random toy with a chip in it — none of those run uBlock
Origin. They all phone home to whatever servers their vendors point them
at, and many of those servers are ad networks and analytics platforms.

A **DNS sinkhole** is a way to cut off those phone-home requests one
layer below the browser — at the network's address-lookup layer. Set
once, applies to every device on the network.

## The DNS angle

When any program on your computer or phone tries to connect to
`facebook.com`, it first has to ask "what IP address is `facebook.com`?"
That question goes to a **DNS resolver**, which returns an IP. Once your
device has the IP, the actual connection happens.

If the resolver simply refuses to answer for known-tracker domains —
returns `NXDOMAIN` ("no such domain") or `0.0.0.0` — the connection
never happens. Your device tried, your network didn't help, the tracker
gets nothing.

That's a DNS sinkhole: a resolver you control (or that you trust)
configured to selectively block the lookups you don't want.

## What it gives you that browser tools don't

- **Network-wide.** Every device on your home network — phones, tablets,
  smart TVs, game consoles, IoT — gets the same blocking, with no
  per-device extensions to install.
- **App-level protection.** Mobile apps that ignore browser content
  blockers (because they aren't running in a browser) still hit your DNS
  resolver. Block ad networks at the resolver and the app's ads break.
- **Faster pages.** Pages that would have loaded twenty tracker scripts
  now just don't. On ad-heavy sites the difference is dramatic —
  sometimes 50%+ less time-to-interactive.
- **Less bandwidth.** Mobile data plans last longer.
- **Visibility.** The dashboards on hosted services show you which
  domains your devices try to reach. You'll be surprised. (Your TV is
  noisier than you think.)

## What it cannot fix

This part matters. DNS sinkholes are powerful but they aren't a complete
privacy solution.

- **First-party trackers aren't blocked.** If a site loads analytics
  from `example.com/analytics/track.js` instead of `google-analytics.com`,
  the blocklist can't catch it without breaking the whole site. CNAME
  cloaking — where a tracker domain is aliased onto the site's own
  subdomain — also evades DNS-level blocking. Browser extensions still
  matter here.
- **Encrypted DNS bypasses your sinkhole.** Many apps and browsers
  (Firefox, Chrome, iOS) now use **DNS-over-HTTPS (DoH)** by default
  with their own resolvers — Cloudflare, Google, your phone vendor.
  If you don't disable that, the app routes around your sinkhole
  entirely. Most consumer sinkhole setups include guidance for this.
- **In-page tracking still happens.** Fingerprinting via JavaScript on
  pages you *do* allow happens entirely inside the browser; DNS can't
  see it.
- **Doesn't replace consent rules for sites.** A site you run still has
  to comply with consent rules regardless of how its visitors block
  things on their end. DNS sinkholing is **user self-defence**, not a
  legal compliance pattern.
- **False positives.** Aggressive blocklists occasionally block
  legitimate functionality — login redirects, payment widgets, account
  recovery flows. You will need an "allow this domain" override
  workflow.

## The practical options

DNS sinkholes come in two flavours:

- **Hosted DNS services** — someone else runs the resolver, you point
  your device or router at it. Easy. Usually offer per-device profiles,
  encrypted DNS-over-HTTPS, dashboards, custom blocklists.
- **Self-hosted** — you run the resolver, usually on a Raspberry Pi or
  a Linux box on your home network. Free, total control, but you own
  uptime and updates.

Both work. Which fits depends on whether you'd rather pay a few
dollars a month for convenience or spend a weekend setting up a Pi.

| Service | Type | Operator & network | Cost |
|---|---|---|---|
| [NextDNS](#nextdns) | Hosted SaaS | NextDNS Inc., Delaware-incorporated (French founders); global anycast network with EU pops, optional EU-only log jurisdiction | Free tier (300k queries/mo) + paid |
| [DNS4EU](#dns4eu) | Hosted SaaS | Whalebone-led consortium across 10 EU countries, originally EU-Commission-funded; 100% EU-hosted infrastructure | Free public tier |
| [ControlD](#controld) | Hosted SaaS | ControlD, Toronto-based (Windscribe subsidiary); global anycast network | Free tier + paid |
| [Pi-hole](#pi-hole) | Self-hosted | You, on your own hardware | Free (hardware cost only) |
| [AdGuard Home](#adguard-home) | Self-hosted | You, on your own hardware | Free (hardware cost only) |

### NextDNS

[NextDNS](https://nextdns.io/) is the easiest entry point. Sign up,
create a "configuration profile" (which gets a unique ID), pick
blocklists from a long menu, point your device or router at the
endpoint. Encrypted DNS (DoH / DoT / DoQ) is supported out of the box.
Free tier covers 300,000 queries per month — enough for one phone or
laptop, not enough for a whole household; paid plans are inexpensive.

Setup is genuinely click-through. Their dashboard shows you what's
being queried and what's being blocked, in real time.

**On jurisdiction.** NextDNS Inc. is incorporated in Delaware, US — a
detail worth knowing if jurisdiction matters to you. The founders are
French (Olivier Poitrey and Romain Cointepas, both ex-Netflix Paris),
the privacy posture is EU-aware in design, and you can configure log
retention and log location independently — including EU-only options.
If you want a stricter "no US entity at all" setup, see **DNS4EU**
just below.

### DNS4EU

[DNS4EU](https://joindns4.eu/) is the EU's own public DNS resolver,
launched on 9 June 2025. It is operated by a consortium led by the
Czech cybersecurity company Whalebone with infrastructure across **at
least 14 EU member states**, all of it **100% EU-hosted**. The
initial build-out was co-funded by the European Commission (2023–2025);
the consortium is now transitioning to a self-sustaining model funded
by commercial tiers (DNS4GOV for governments / critical infrastructure),
with the free public tier kept open for individual users.

What it offers individuals:

- **Five pre-curated resolver profiles** — unfiltered, malware-blocking,
  malware + adult content, malware + ads + tracking, child-protection.
  Pick the endpoint that matches what you want filtered.
- **DoH, DoT, DNSSEC** out of the box.
- **Anonymisation at the server** — personal data is anonymised on the
  resolver before any backend processing, with retention bounded by
  GDPR and EU data-protection norms.
- **No account, no commercial relationship** — just point your device
  at the endpoint IPs or use the encrypted endpoints.

It is **less configurable** than NextDNS or ControlD — no per-device
profiles, no custom blocklists, no real-time dashboard. That's a
feature if you don't want to fiddle, a limit if you do. For EU
readers who want the simplest "DNS-level privacy, EU jurisdiction
all the way down, institutional backing" answer, DNS4EU is currently
the strongest fit.

### ControlD

[ControlD](https://controld.com/) is the most actively-developed
alternative — weekly releases, a much larger catalogue of one-click
service blocks (you can block "TikTok" or "Snapchat" as named units
across all their domains, not by manually editing lists), and the
ability to *route* traffic in addition to *blocking* it (useful for
geo-relocation). Free tier exists; paid tiers unlock more profiles
and advanced features.

Similar UX to NextDNS, similar privacy posture. Pick on
preference / feature fit.

### Pi-hole

The classic self-hosted option. [Pi-hole](https://pi-hole.net/) runs
on a Raspberry Pi (any model) or any Linux box and acts as the DNS
server for your home network. You point your router at the Pi-hole;
every device automatically goes through it.

Strengths: free, completely under your control, mature codebase, large
community of blocklists. Weaknesses: requires basic Linux
comfort, hardware to buy if you don't already have a Pi, and DoH/DoT
support isn't built-in — typical setup pairs Pi-hole with `cloudflared`
or Unbound for encrypted upstream.

The [Pi-hole documentation](https://docs.pi-hole.net/) is excellent
and walks through every step.

### AdGuard Home

[AdGuard Home](https://adguard.com/en/adguard-home/overview.html) is
Pi-hole's modern competitor. Same self-hosted model, more modern web
UI, **built-in DoH/DoT** without extra components, single-binary
install, easier on first-time users than Pi-hole. The AdGuard company
also offers a hosted public DNS at `dns.adguard.com` if you want
their blocklists without running anything.

If you're starting fresh and don't have an existing Pi-hole setup, AdGuard
Home is often the simpler first build.

## A practical tip: encrypted DNS leaks

The single biggest gotcha with any DNS sinkhole is browsers and apps
that have DoH built in and pointed at someone else's resolver:

- Firefox enables DoH-to-Cloudflare by default in some locales.
- iOS allows individual apps to configure their own DoH.
- Some smart TV apps hardcode Google DNS.

If your devices are talking to `1.1.1.1` or `8.8.8.8` directly over
HTTPS, your local DNS sinkhole never sees the lookup. There are two
realistic responses:

1. **Disable in-browser DoH** so the OS resolver (your sinkhole) is
   used. Firefox: Settings → Privacy & Security → DNS over HTTPS →
   Off (or pointed at your sinkhole). Chrome: Settings → Privacy and
   security → Use secure DNS → Off.
2. **Block the public DoH endpoints** at your sinkhole. NextDNS,
   ControlD, Pi-hole and AdGuard Home all have presets or
   instructions for this — they refuse `dns.google`, `cloudflare-dns.com`,
   and similar, forcing the device to fall back to your sinkhole.

Without one of these, the sinkhole is a paper firewall.

## Combining with browser-level tools

DNS sinkholes and browser extensions live on different layers and are
**complementary**, not redundant:

- **DNS sinkhole** catches: known-tracker domains, ad network domains,
  mobile-app analytics endpoints. Cross-device, low setup cost.
- **Browser extensions** catch: in-page scripts you didn't want loaded,
  first-party tracking that uses the same domain as the site, URL
  parameters, fingerprinting attempts, page-level CMP shenanigans.

The strongest setup runs both. A [privacy-friendly browser](/handbook/privacy-friendly-browsers/)
with uBlock Origin on, pointed at a NextDNS / ControlD / Pi-hole
resolver, covers most of what's covereable without paying for a VPN
or going full Tor.

## A note on VPNs

VPNs are sometimes pitched as "privacy tools" but they solve a
**different problem** — hiding your IP and network identity from the
sites you visit, and your traffic from your ISP. They don't block
trackers (unless the VPN bundles a tracker blocker, which a few do).
A DNS sinkhole and a VPN can coexist; they answer different threats.
Don't substitute one for the other.

## Reading list

- **[Privacy-friendly browsers](/handbook/privacy-friendly-browsers/)** —
  the complementary layer that catches what DNS can't.
- **[Tracking pixels](/handbook/tracking-pixels/)** — what DNS
  sinkholes are blocking when they refuse `facebook.com/tr/...`
- **[NextDNS](https://nextdns.io/)** — hosted DNS service with
  per-device profiles, Delaware-incorporated with French founders and
  EU log-jurisdiction options.
- **[DNS4EU](https://joindns4.eu/)** — the EU's own public resolver,
  100% EU-hosted, free for individuals, operated by a Whalebone-led
  consortium under European Commission backing.
- **[ControlD](https://controld.com/)** — actively-developed
  alternative based in Toronto, Canada, with finer service-level
  blocking.
- **[Pi-hole documentation](https://docs.pi-hole.net/)** — the
  reference self-hosted setup.
- **[AdGuard Home](https://adguard.com/en/adguard-home/overview.html)** —
  modern self-hosted alternative with built-in encrypted DNS.
