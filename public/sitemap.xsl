<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex,follow" />
        <title>Sitemap — ConsentTheater</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <style type="text/css">
          /* ConsentTheater sitemap viewer — design tokens mirror globals.css.
             Inline because XSL is rendered in isolation from the site CSS. */
          :root {
            --background: #ffffff;
            --foreground: #14161a;
            --card: #ffffff;
            --muted: #f1f3f6;
            --muted-foreground: #525960;
            --border: #d4d8de;
            --primary: #003ea3;
            --primary-foreground: #ffffff;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --background: #0e1217;
              --foreground: #f2f2f2;
              --card: #161a20;
              --muted: #20252d;
              --muted-foreground: #aab1ba;
              --border: #2c323b;
              --primary: #ffd11a;
              --primary-foreground: #14161a;
            }
          }

          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            background: var(--background);
            color: var(--foreground);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1.55;
            -webkit-font-smoothing: antialiased;
          }

          .wrap { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1.5rem 3rem; }

          header { border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .kicker {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--muted-foreground);
          }
          h1 {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 1.75rem;
            font-weight: 700;
            margin: 0.25rem 0 0;
            letter-spacing: -0.01em;
          }
          .lede { color: var(--muted-foreground); font-size: 13px; margin: 0.75rem 0 0; }
          a { color: var(--primary); text-decoration: none; }
          a:hover { text-decoration: underline; }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--muted-foreground);
            margin-bottom: 1rem;
          }
          .meta span { white-space: nowrap; }
          .meta strong { color: var(--foreground); font-weight: 700; }

          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid var(--border);
            background: var(--card);
            font-size: 13px;
          }
          thead th {
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--muted-foreground);
            background: var(--muted);
            padding: 0.6rem 0.75rem;
            border-bottom: 1px solid var(--border);
          }
          tbody td {
            padding: 0.6rem 0.75rem;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
          }
          tbody tr:last-child td { border-bottom: none; }
          tbody tr:hover td { background: var(--muted); }

          a.url {
            color: var(--primary);
            text-decoration: none;
            word-break: break-all;
            font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Fira Code", Menlo, Consolas, monospace;
            font-size: 12px;
          }
          a.url:hover { text-decoration: underline; }

          .lastmod {
            font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Fira Code", Menlo, Consolas, monospace;
            font-size: 11px;
            color: var(--muted-foreground);
            white-space: nowrap;
          }

          .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
            display: grid;
            gap: 0.6rem;
          }
          .footer p { margin: 0; }
          .footer .copyright { font-size: 11px; color: var(--muted-foreground); }
          .footer .fineprint {
            font-size: 10px;
            line-height: 1.65;
            color: var(--muted-foreground);
            opacity: 0.85;
          }
          .footer .back {
            margin-bottom: 0.5rem;
          }
          .footer .back a {
            display: inline-block;
            font-size: 12px;
            font-weight: 600;
            padding: 0.45rem 0.9rem;
            border: 1px solid var(--border);
            background: var(--card);
            color: var(--foreground);
          }
          .footer .back a:hover {
            background: var(--muted);
            text-decoration: none;
          }
          .footer .build {
            font-size: 10px;
            color: var(--muted-foreground);
            opacity: 0.7;
          }
          .footer .mono {
            font-family: ui-monospace, SFMono-Regular, "Cascadia Code", "Fira Code", Menlo, Consolas, monospace;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <p class="kicker">Sitemap</p>
            <h1>ConsentTheater — sitemap</h1>
            <p class="lede">
              An XML sitemap intended for search-engine consumption. The browser-friendly
              rendering you are looking at is a stylesheet on top of the same XML.
              See <a href="https://www.sitemaps.org">sitemaps.org</a> for the spec.
            </p>
          </header>

          <xsl:if test="count(sitemap:sitemapindex/sitemap:sitemap) &gt; 0">
            <div class="meta">
              <span><strong><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></strong> sub-sitemaps</span>
              <span>Type: <strong>index</strong></span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Sitemap</th>
                  <th>Last modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                  <xsl:variable name="sitemapURL"><xsl:value-of select="sitemap:loc"/></xsl:variable>
                  <tr>
                    <td><a class="url" href="{$sitemapURL}"><xsl:value-of select="sitemap:loc"/></a></td>
                    <td><span class="lastmod"><xsl:value-of select="concat(substring(sitemap:lastmod,1,10),' ',substring(sitemap:lastmod,12,5))"/></span></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:if>

          <xsl:if test="count(sitemap:sitemapindex/sitemap:sitemap) &lt; 1">
            <div class="meta">
              <span><strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> URLs</span>
              <span>Type: <strong>urlset</strong></span>
              <span><a href="/sitemap-index.xml">↑ Sitemap index</a></span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Last modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <xsl:variable name="itemURL"><xsl:value-of select="sitemap:loc"/></xsl:variable>
                  <tr>
                    <td><a class="url" href="{$itemURL}"><xsl:value-of select="sitemap:loc"/></a></td>
                    <td><span class="lastmod"><xsl:value-of select="concat(substring(sitemap:lastmod,1,10),' ',substring(sitemap:lastmod,12,5))"/></span></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </xsl:if>

          <div class="footer">
            <p class="back">
              <a href="/">← Back to consenttheater.org</a>
            </p>
            <p class="copyright">
              © __YEAR__ ConsentTheater · Non-commercial, open-source project <span style="white-space:nowrap">(AGPL-3.0)</span>
            </p>
            <p class="fineprint">
              ConsentTheater is an independent, volunteer-run, non-commercial project.
              Content on this site is provided for educational purposes only and is
              not legal advice. Not affiliated with or endorsed by any regulator, law
              firm, browser vendor, or service listed in the catalogue. All trademarks
              and product names are the property of their respective owners.
            </p>
            <p class="build">
              Build <a href="https://github.com/ConsentTheater/website/commit/__COMMIT__"><span class="mono">__COMMIT__</span></a>
              · <time datetime="__BUILT_AT__" class="mono">__BUILT_AT__</time>
            </p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
