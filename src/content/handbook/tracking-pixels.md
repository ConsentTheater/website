---
title: 'Tracking pixels — what they are and what consent rules apply'
summary: >-
  "We don't use cookies, just pixels" is one of the most common compliance
  myths. This article walks through what a pixel actually is technically, why
  it's still in scope of EU consent rules, and how the picture shifts under
  UK and California law.
category: tracking
updated: '2026-05-09'
created: '2026-05-09'
legal_refs:
  - label: 'ePrivacy Directive Article 5(3)'
    href: '/law/eprivacy/art-5/'
  - label: 'GDPR Article 6'
    href: '/law/gdpr/art-6/'
related:
  - strict-necessary-cookies
  - global-privacy-control
---

If you have ever heard a vendor or a marketing team say *"we don't use cookies,
we just use pixels — so consent isn't needed"*, that sentence is almost always
wrong. This article unpacks why.

## What a pixel actually is

A "tracking pixel" is not a special technology. It is just any of the following:

- A `<img>` tag with `src` pointing at a 1×1 transparent image on the third
  party's domain.
- An `<iframe>` or `<script>` tag that loads from the third party's domain.
- A JavaScript snippet that fires `fetch()` or `navigator.sendBeacon()` to the
  third party.

In all three cases the mechanic is the same: the user's browser is told to make
an HTTP request to a third-party domain — `facebook.com/tr/`, `linkedin.com/li.lms-analytics`,
`analytics.tiktok.com`, `bat.bing.com`, etc.

That's the entire pixel. It's a request, not a cookie.

## Why pixels still trigger Article 5(3) ePD

The crucial bit of EU law is in Article 5(3) of the ePrivacy Directive. It
covers **two** operations on the user's terminal equipment, and most people
remember only one of them:

1. *Storing* information — the classic "setting a cookie" case.
2. *Gaining access to* information already stored — the often-forgotten case.

Now picture what happens when a website embeds a Meta Pixel:

- The browser is instructed to load `https://www.facebook.com/tr/?id=...&ev=PageView&...`
- Browsers automatically attach all `facebook.com` cookies to any request going
  to `facebook.com` — including session cookies the user accumulated by being
  logged into Facebook earlier
- Facebook's server reads those cookies on its side
- That read is "gaining access to information already stored on terminal
  equipment" — the user's browser cookie store

**The pixel didn't store anything.** Your site didn't store anything. But
*access* did happen, and the request was caused by your site. So Article 5(3)
applies.

The European Data Protection Board's
[Guidelines 2/2023](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)
make this explicit: storage *and* access are equally in scope, and pixels are
listed as one of the techniques covered.

In practice almost every commercial pixel also sets companion first-party
cookies on the embedding site — `_fbp` for Meta, `_gads` and `_gcl_*` for
Google, `_uetsid` for Bing — so the "we don't set cookies" claim usually isn't
even technically true. But even if it were, the access leg of Article 5(3)
would still bite.

## The pixels you'll meet in practice

| Pixel | Vendor | Typical cookies it co-sets | Purpose |
|---|---|---|---|
| Meta Pixel (`fbq`) | Meta | `_fbp`, reads `_fbc` | Ad targeting + conversion attribution |
| Google Ads tag (`gtag`) | Google | `_gads`, `_gcl_*`, `_gac_*` | Ad targeting + conversion attribution |
| LinkedIn Insight Tag | LinkedIn | `li_*`, `lidc`, `bcookie` | B2B audience building |
| TikTok Pixel (`ttq`) | TikTok | `_ttp` | Ad targeting + conversion |
| X (Twitter) Pixel | X | `personalization_id` | Ad targeting |
| Reddit Pixel | Reddit | `_rdt_uuid` | Ad targeting + conversion |
| Microsoft UET (`uetq`) | Microsoft | `_uetsid`, `_uetvid` | Bing Ads conversion |
| Pinterest Tag (`pintrk`) | Pinterest | `_pinterest_*` | Ad targeting |

All of these need consent under the EU/UK reading. None of them qualify for
the strict-necessary exemption.

## What about server-side conversion APIs?

Around 2020 every major ad platform introduced a server-side equivalent of its
pixel: Meta's *Conversions API*, Google's *Enhanced Conversions* and *server-side
GTM*, TikTok's *Events API*, and so on. The marketing pitch was usually "this is
more privacy-friendly because no pixel runs in the browser."

The reality is more nuanced.

- **From a pure ePrivacy perspective**, server-to-server transmission with no
  browser pixel and no device-side state read is genuinely outside Article
  5(3). No storage, no access on the user's terminal. So the consent rule
  doesn't trigger for that specific transmission.
- **From a GDPR perspective**, sending personal data (hashed email, IP,
  click ID, browsing history) to Meta/Google/TikTok is still processing
  personal data, and you still need a lawful basis under Article 6. For
  ad-targeting purposes the only realistic basis is consent.
- **In practice**, almost every server-side conversion implementation **also**
  runs a browser pixel for first-touch identification and to capture click
  IDs, so the ePrivacy trigger is back. The "server-side" pitch usually just
  means "the conversion event itself is sent server-to-server, but we still
  need the pixel for the front-door identification."

So server-side APIs let you keep tracking working when third-party cookies are
blocked or when ad-blockers strip the pixel, but they do **not** make the
consent question disappear.

## Under EU rules

Default position: a pixel needs **prior, informed, freely-given consent**
because it falls in scope of Article 5(3). The Planet49 ruling clarified that
pre-ticked consent boxes are not valid; consent has to be a clear affirmative
action.

There is no narrow exemption that pixels can credibly claim:

- They are not "for the sole purpose of carrying out the transmission of a
  communication" — that exemption is for routing/delivery infrastructure, not
  marketing tags.
- They are not strictly necessary for any service the user requested.

The legal position has been confirmed in formal enforcement: **CNIL**
specifically fined Meta and Google over Facebook Pixel and Google Analytics
deployment in 2022, and similar findings exist across other EU national DPAs.

If consent is refused or not yet given, the pixel must not load and must not
fire. Practical implication: pixel tags need to be wrapped in a consent gate
on the page, not just hidden.

## Under UK rules

The UK's
[Privacy and Electronic Communications Regulations 2003 (PECR)](https://www.legislation.gov.uk/uksi/2003/2426/contents)
mirror Article 5(3) of the ePrivacy Directive almost verbatim — Brexit didn't
change this part. The
[ICO's guidance on storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/)
explicitly applies to pixels, fingerprinting, and similar techniques the same
way it applies to cookies.

Practical effect: same rule. Pixels need consent.

The Data (Use and Access) Act 2025 amended PECR slightly but the pixel /
device-state access regime stayed essentially the same.

## Under California rules (CCPA / CPRA)

California uses a different framework, and this is where the user's mental
model has to switch.

**It's an opt-out regime, not opt-in.** A site can run pixels by default. But
it must:

1. Provide a clear *"Do Not Sell or Share My Personal Information"* link in
   the footer (or equivalent — there are also approved opt-out icons).
2. Honor any [Global Privacy Control](https://globalprivacycontrol.org/)
   browser signal as an opt-out request, automatically.
3. For *sensitive personal information*, provide a separate *"Limit the Use
   of My Sensitive Personal Information"* control.
4. For consumers under 16, **opt-IN** consent is required for sale or sharing
   (real consent, not opt-out). For under 13, parental consent.

The reason pixels are in scope: under
[CCPA §1798.140](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.5),
"sale" includes any disclosure of personal information for *monetary or other
valuable consideration*, and "sharing" specifically covers *cross-context
behavioral advertising*. When your site fires a Meta Pixel and Meta uses the
data to target ads, that almost always meets the "sharing" definition; ad-tech
arrangements often meet "sale" too.

Failure to provide the opt-out mechanism, or — increasingly enforced — failure
to honor a GPC signal, is a CCPA violation. The
[California Attorney General's GPC notice](https://oag.ca.gov/privacy/ccpa/gpc)
has been clear that ignoring GPC counts as ignoring an opt-out request.

## What good looks like

If you genuinely care about doing this right:

- **EU/UK**: don't load any tracking pixel until the user has given consent.
  Use a consent management platform (CMP) or roll your own gate. Default-deny.
  Granular categories ("Marketing" vs "Analytics") so users can pick.
- **California**: provide a "Do Not Sell or Share" link, plumb it into your
  pixel loaders so they don't fire when opted out, and parse the
  `Sec-GPC: 1` request header / `navigator.globalPrivacyControl === true`
  signal as an automatic opt-out.
- **Both**: log consent state alongside any data you do send, so you can
  prove later that the user agreed at the time. CMP integrations usually
  handle this; rolling your own means storing a timestamped consent record.
- **Don't lean on dark patterns** (pre-ticked boxes, "agree to keep reading",
  reject-all buried three clicks deep). The Planet49 ruling and post-2023
  enforcement waves are explicit: that's not consent.

## Reading list

- **[ePrivacy Directive Article 5(3)](/law/eprivacy/art-5/)** — primary EU text.
- **[GDPR Article 6](/law/gdpr/art-6/)** — lawful bases for processing personal data.
- **[Strict-necessary cookies — what actually qualifies](/handbook/strict-necessary-cookies/)** — the companion piece on what's in or out of the consent exemption.
- **[EDPB Guidelines 2/2023](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)** — confirms pixels and similar techniques are in scope.
- **[ICO PECR guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/)** — UK's equivalent.
- **[CCPA full text](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.5)** — California Civil Code §1798.100 et seq.
- **[California AG on Global Privacy Control](https://oag.ca.gov/privacy/ccpa/gpc)** — official position that ignoring GPC is an opt-out violation.
- **[Global Privacy Control specification](https://w3c.github.io/gpc/)** — W3C work-in-progress spec for the browser signal.
