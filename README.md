# ConsentTheater — Website

The public website of ConsentTheater, a non-commercial, open-source project
for GDPR and tracker transparency on the web.

This repository is the source of [consenttheater.org](https://consenttheater.org):
a tracker-lookup tool and information hub. Its goal is to make the web's
tracking layer legible to the people it's pointed at — to help anyone
understand which cookies and domains are tracking them, who runs those
trackers, what each of them actually does, and where they sit in the GDPR
picture.

The project is run as a community resource, not a commercial product. The
source code, the website, and the tracker catalogue it reads from are all
open source under AGPL-3.0.

## What this repository is

The site is built as **pure static HTML** and a **small Cloudflare Worker**
that serves the tracker-lookup API.

| Path | Purpose |
| --- | --- |
| `src/` | Astro pages, layouts, React components, design tokens |
| `worker/` | Cloudflare Worker (Hono) — `/api/search` |
| `public/` | Static assets served as-is (favicons, manifest) |
| `astro.config.mjs` | Astro configuration |
| `wrangler.jsonc` | Cloudflare Worker configuration |

Cloudflare serves the static output via the `ASSETS` binding and routes
`/api/*` to the Worker. There is no database, no server-rendered page, no
analytics, no third-party scripts, no external fonts.

## The Playbill

The tracker catalogue — every known cookie and domain, with its company,
service, category, severity, and documentation link — lives in a separate
package: [`@consenttheater/playbill`](https://www.npmjs.com/package/@consenttheater/playbill).

The Worker imports it directly and keeps it in memory. When the catalogue
changes, a new playbill version is published and the Worker is redeployed.

Data corrections and additions belong in the playbill repository, not here.

## Develop

Requires Node 24 (see `.nvmrc`).

```bash
nvm use
npm install
npm run dev          # Astro dev server at http://localhost:4321
```

`npm run dev` gives you fast iteration on pages and components. Search API
requests to `/api/search` will not resolve in this mode — the Astro dev server
does not run the Worker.

To exercise the full site + Worker locally:

```bash
npm run build
npx wrangler dev     # http://127.0.0.1:8787
```

This builds `./dist` and runs the Worker in Cloudflare's local simulator. No
Cloudflare login required.

## Build and deploy

```bash
npm run build        # astro check + astro build → ./dist
npm run deploy       # astro build + wrangler deploy
```

`wrangler deploy` uploads both the Worker and the static assets to the
Cloudflare account linked to your CLI. On the first run, wrangler will prompt
you to log in.

## Privacy

The website itself loads no third-party scripts, no external fonts, no
analytics, and sets no cookies. Requests reach Cloudflare's edge network, and
Cloudflare's standard privacy terms apply as the sole processor. The full
statement is at [`/privacy/`](./src/pages/privacy.astro).

## Contributing

Bug reports and corrections are welcome on this repository — for website
bugs, accessibility issues, copy improvements, and translations.

Corrections to the tracker catalogue itself (new cookies, domains, company
attribution, severity tuning) belong in the playbill package, not here.

Please don't add dependencies that pull in third-party scripts, fonts, or
analytics. The no-third-party-requests property is intentional and any PR that
breaks it will be asked to revise.

## License

[AGPL-3.0-or-later](./LICENSE).

In practice this means:

- You may use, modify, and redistribute the code freely.
- If you run a modified version as a network service, you must provide the
  modified source to its users (see `§13` of the licence).
- No warranty is provided. The software is distributed as-is.

The full licence is also rendered on the site at [`/license/`](./src/pages/license.astro).
