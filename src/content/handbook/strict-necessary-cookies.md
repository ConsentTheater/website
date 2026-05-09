---
title: 'Strict-necessary cookies — what actually qualifies'
summary: >-
  The "strictly necessary" exemption is the most-misused phrase in cookie compliance.
  This article walks through the legal text, the EDPB's interpretation, and concrete
  examples of what does and does not qualify — including the popular myths.
category: tracking
updated: '2026-05-09'
created: '2026-05-09'
legal_refs:
  - label: 'ePrivacy Directive Article 5(3)'
    href: '/law/eprivacy/art-5/'
  - label: 'GDPR Article 7'
    href: '/law/gdpr/art-7/'
related:
  - tracking-pixels
---

If you build websites in the EU, you have probably written `consent: 'strictly_necessary'`
in some banner config. The label is everywhere, and almost nobody uses it correctly.

This guide unpacks what the law actually says, what the EDPB has clarified, and gives
concrete examples for the things people most often get wrong.

## Where the exemption comes from

The "strictly necessary" carve-out lives in the **ePrivacy Directive Article 5(3)**.
The default rule is that storing or accessing information on a user's device — cookies,
`localStorage`, `IndexedDB`, fingerprinting — requires **prior informed consent**.

Article 5(3) provides exactly two narrow exemptions:

1. **Communication exemption** — when storage is "for the sole purpose of carrying out
   the transmission of a communication over an electronic communications network".
2. **Strictly necessary exemption** — when storage is "strictly necessary in order for
   the provider of an information society service explicitly requested by the subscriber
   or user to provide the service".

Two things to notice immediately:

- The user has to **explicitly request** the service.
- The cookie has to be **strictly necessary** — not "useful", not "nice to have", not
  "industry standard", not "needed for our analytics".

## The EDPB test

The European Data Protection Board's
[Guidelines 2/2023](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)
gave the practical test:

> *"Strictly necessary" must be read narrowly. The functionality must be one the user has
> explicitly requested, and the storage must be necessary for that functionality alone.*

If removing the cookie would only make the experience "less smooth" or "harder to
analyse", it is **not** strictly necessary.

## What qualifies — examples

These genuinely fall under the exemption:

- **Session ID** for an authenticated user. You logged into your bank — the cookie
  keeping you signed in for the next 20 minutes is genuinely necessary. Without it
  the bank can't remember it's you, and "be logged in" is exactly what you asked
  for.
- **Shopping-cart contents.** You added a pair of shoes to your cart on an
  e-commerce site. The cart cookie keeps the items as you browse to a second
  product. Without it, the cart empties on every page.
- **Load-balancer routing token** that pins the user to a backend during a
  multi-step flow. You're filling out a checkout form across three pages — the
  cookie keeps your requests going to the same server so your partial state
  isn't lost mid-flow.
- **Cookie-consent state itself** — the cookie that remembers whether the user
  has already accepted or refused. Without it you'd ask again on every page,
  which is itself a dark pattern.
- **CSRF tokens** for security on forms the user submitted. Without them,
  malicious sites could trick the browser into submitting forms on the user's
  behalf. The cookie protects an action the user just initiated.
- **Language / locale preference** when it comes from the user. That includes
  the browser's `Accept-Language` header (which the user configured in their
  OS or browser settings) and explicit on-site language switchers. It does
  **not** include IP-geolocation guesses — those are inferences about the user,
  not preferences the user expressed.

## What does **not** qualify — common myths

Commonly mis-labelled as strictly necessary:

- **Analytics, even "anonymous" or "first-party".** Google Analytics on your blog
  so you can see where readers come from. Useful for you, but the visitor did not
  ask to be counted. Plausible-as-script and Matomo with `_pk_id` sit in the same
  bucket. (Narrow exception: pure server-side counting from access logs, with no
  cookie and no device-readable state, is not in scope of Article 5(3) at all —
  though GDPR still applies to whatever IPs you log.)
- **A/B testing and feature flags.** Optimizely or VWO decides which variant to
  show you and stores that decision in a cookie. Reasonable business need, but
  the user came to read the article — they didn't ask to be a variable in
  someone's experiment.
- **Personalisation that the user didn't turn on.** An e-commerce site dropping
  a "last viewed products" cookie so it can show recommendations. Convenient,
  not necessary — the user asked to view a product, not to be remembered.
- **Marketing and conversion pixels** — Meta Pixel, Google Ads tag, LinkedIn
  Insight, TikTok Pixel. Even when these don't set a cookie of their own, they
  are in scope: loading the pixel's URL causes the third party (Meta, Google,
  etc.) to read the cookies the browser already has on its domain, which is
  "accessing information already stored" under Article 5(3). See the dedicated
  [tracking pixels](/handbook/tracking-pixels/) article for the deep dive on
  how this works and what consent rules apply across jurisdictions.

The general rule: **if the cookie's purpose is for the website operator's benefit
rather than directly fulfilling something the user asked the website to do, it
needs consent.**

## Genuinely contested — bot mitigation and fraud detection

This category is different from the myths above. There is a legitimate engineering
argument that anti-bot and anti-fraud cookies *are* strictly necessary, and that
argument has not been settled by any court ruling. Both sides have a point.

The textbook example is **`__cf_bm` from Cloudflare**. Cloudflare classifies it as
strictly necessary because without bot mitigation, sites are exposed to scraping,
credential stuffing, layer-7 DDoS — and a site that's down or compromised cannot
deliver the service the user requested anyway.

EU regulators read Article 5(3) ePD more literally:

- The cookie has to be necessary for the **service the user explicitly requested**
- The user requested "show me this page". They did not request "protect this site
  from bots"
- Bot mitigation primarily benefits the **operator**; user benefit is indirect at
  best
- Therefore the exemption does not apply, and consent is required

The French **CNIL** has made this position explicit in its guidance and
enforcement: `__cf_bm` requires consent in the EU. The **EDPB's Guidelines 2/2023**
align with the same narrow reading — operator-side performance and security
optimisations sit outside the exemption.

There is no CJEU ruling on this point. Until there is one, `__cf_bm` and similar
bot/fraud cookies live in the *contested* zone:

- **Vendor reading:** strictly necessary, no consent needed.
- **Prevailing EU regulator reading:** consent needed, even if the cookie is
  genuinely useful for security.

This is the kind of case our `consent_burden: 'contested'` value exists for — we
surface the disagreement rather than picking a side.

There is one narrower distinction worth keeping: even regulators agree that
**server-side** anti-bot work — rate limits, IP-based blocks, ASN heuristics — is
outside the scope of Article 5(3) entirely, because nothing is stored or read on
the user's device. The dispute is specifically about cookies and similar
device-side state.

## How long can a strict-necessary cookie live?

The other half of "strictly necessary" is duration. A cookie can be necessary for the
length of the user's session (closes the tab → cookie expires) but not for two years.
A typical authenticated-session cookie is bounded to a session or a short
"keep me logged in" window the user explicitly opted into.

Long-lived cookies declared as "strictly necessary" are a strong signal the
classification is wrong.

## Why this matters for ConsentTheater's catalogue

Our `consent_burden` field draws a line:

- `minimal` — genuinely strict-necessary, low ambiguity.
- `required` — needs consent under EU rules, even if the vendor's own documentation
  says otherwise.
- `required_strict` — needs consent **and** has been the subject of regulator
  enforcement or CJEU rulings against the same pattern.
- `contested` — vendors and regulators disagree; we surface the disagreement
  rather than picking a side.

Where vendors call something "strictly necessary" but the EDPB test would fail,
our catalogue sides with the regulator's reading.

## Reading list

- **[ePrivacy Directive Article 5(3)](/law/eprivacy/art-5/)** — primary text.
- **[GDPR Article 7](/law/gdpr/art-7/)** — what consent must look like *when* it is required.
- **[EDPB Guidelines 2/2023](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)** — technical scope of Article 5(3).
- **[CJEU Planet49 (C-673/17)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62017CJ0673)** — pre-checked boxes are not consent.
