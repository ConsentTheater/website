---
regulation: ePrivacy Directive
articleLabel: Article 5
title: Confidentiality of the communications
summary: >-
  The "cookie article" — the rule that storing or accessing information on a
  user's terminal device requires prior informed consent, with a narrow
  strictly-necessary exemption.
eurLexUrl: https://eur-lex.europa.eu/eli/dir/2002/58/oj
citation: Directive 2002/58/EC
updated: '2026-04-25'
order: 6
---

## In plain language

The ePrivacy Directive predates the GDPR by 14 years but is still the rule that governs **storing or accessing information on a user's terminal device** — including cookies, localStorage, IndexedDB, fingerprinting probes, and similar techniques. Article 5 is the part everyone in the cookie-banner industry actually argues about.

Article 5(3) — the famous "cookie article" — sets a default rule: **you may not store information in, or read information from, a user's terminal equipment unless the user has given prior informed consent**. There are two narrow exemptions:

1. The sole purpose is to **carry out the transmission of a communication** over an electronic communications network.
2. The storage or access is **strictly necessary** in order to provide an information society service explicitly requested by the user.

Both exemptions are read narrowly by EU regulators. "Strictly necessary" does not mean "convenient", "useful", or "the user expects this to work" — it means the service literally cannot function without that storage. Most analytics, marketing, A/B testing, advertising and personalisation cookies are explicitly out of scope.

The "consent" required by Article 5(3) is the GDPR's definition of consent — see [Article 7](/law/gdpr/art-7/). The two regulations are stitched together: ePrivacy says *you need consent*, GDPR says *this is what consent looks like*.

**UK:** The UK transposed ePrivacy via PECR (SI 2003/2426). **Regulation 6 of PECR** carries the same prior-consent requirement and the same "strictly necessary" exemption for cookies and similar technologies. See the [UK mapping page](/law/uk-gdpr-and-pecr/).

## How we use this on consenttheater.org

- The [minimal](/methodology/#minimal) consent burden tier in our catalogue covers exactly the kinds of trackers that fall under the Article 5(3) "strictly necessary" carve-out — CSRF tokens, language preferences, cart state.
- Every other tier ([contested](/methodology/#contested), [required](/methodology/#required), [strict consent](/methodology/#required-strict)) is what Article 5(3) calls "outside strictly necessary" — needs prior informed consent before any storage or access happens on the user's device.
- The browser extension and the planned snapshots collector both observe page traffic **before** any user interaction with the consent banner. This is the moment Article 5(3) actually applies — once consent is given (or deliberately rejected), the legal regime changes.

## Original text

Reproduced verbatim from *Directive 2002/58/EC*, published by the Publications Office of the European Union on [eur-lex.europa.eu](https://eur-lex.europa.eu/eli/dir/2002/58/oj). The official source is authoritative; this rendering is a navigation convenience.

> **1.** Member States shall ensure the confidentiality of communications and the related traffic data by means of a public communications network and publicly available electronic communications services, through national legislation. In particular, they shall prohibit listening, tapping, storage or other kinds of interception or surveillance of communications and the related traffic data by persons other than users, without the consent of the users concerned, except when legally authorised to do so in accordance with Article 15(1). This paragraph shall not prevent technical storage which is necessary for the conveyance of a communication without prejudice to the principle of confidentiality.
>
> **2.** Paragraph 1 shall not affect any legally authorised recording of communications and the related traffic data when carried out in the course of lawful business practice for the purpose of providing evidence of a commercial transaction or of any other business communication.
>
> **3.** Member States shall ensure that the storing of information, or the gaining of access to information already stored, in the terminal equipment of a subscriber or user is only allowed on condition that the subscriber or user concerned has given his or her consent, having been provided with clear and comprehensive information, in accordance with Directive 95/46/EC, inter alia, about the purposes of the processing. This shall not prevent any technical storage or access for the sole purpose of carrying out the transmission of a communication over an electronic communications network, or as strictly necessary in order for the provider of an information society service explicitly requested by the subscriber or user to provide the service.

Note: the reference to Directive 95/46/EC must be read as a reference to the GDPR by virtue of Article 94(2) of Regulation (EU) 2016/679. The "consent" required here is therefore the consent defined in [GDPR Article 7](/law/gdpr/art-7/).

Prefer the canonical version? [Open this article on eur-lex.europa.eu →](https://eur-lex.europa.eu/eli/dir/2002/58/oj)
