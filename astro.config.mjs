import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import llms from 'astro-llms-md';
import webmcp from '@freshjuice/astro-webmcp';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
import { visit, SKIP } from 'unist-util-visit';
import { minify as minifyHtml } from 'html-minifier-terser';

/**
 * Wrap markdown <table> elements in <table-saw> so the zachleat/table-saw
 * custom element can progressively enhance them on small viewports. The
 * wrapper is inert without JS — table renders as a normal <table>.
 */
function rehypeWrapTablesInTableSaw() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table') return;
      if (!parent || index == null) return;
      if (parent.type === 'element' && parent.tagName === 'table-saw') return;
      parent.children[index] = {
        type: 'element',
        tagName: 'table-saw',
        properties: {},
        children: [node]
      };
      return [SKIP, index];
    });
  };
}

function readBuildInfo() {
  const builtAt = new Date().toISOString().slice(0, 10);
  let commit = 'dev';
  try {
    commit = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    /* not a git checkout — leave as 'dev' */
  }
  return { commit, builtAt };
}

/**
 * Two post-build fixes for the XML sitemap and its viewer:
 *
 *  1. @astrojs/sitemap turns `xslURL: '/sitemap.xsl'` into an absolute URL at
 *     build time (`https://consenttheater.org/sitemap.xsl`). Locally that
 *     means `npm run preview` tries to fetch the stylesheet from production.
 *     Rewrite the reference to a site-relative path so it resolves against
 *     whichever origin is serving the document.
 *  2. The viewer (`public/sitemap.xsl`) carries `__YEAR__`, `__COMMIT__` and
 *     `__BUILT_AT__` placeholders in its footer. Fill them in here so the
 *     sitemap shows the same build hash and date that the main site footer
 *     does.
 */
const sitemapPostBuild = {
  name: 'sitemap-post-build',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const distDir = fileURLToPath(dir);
      const entries = await readdir(distDir);

      // Rewrite stylesheet href in every sitemap-*.xml.
      const sitemapFiles = entries.filter((e) => /^sitemap.*\.xml$/.test(e));
      for (const name of sitemapFiles) {
        const path = join(distDir, name);
        const xml = await readFile(path, 'utf8');
        const rewritten = xml.replace(
          /href="https?:\/\/[^"]+\/sitemap\.xsl"/g,
          'href="/sitemap.xsl"'
        );
        if (rewritten !== xml) await writeFile(path, rewritten);
      }

      // Fill build tokens in sitemap.xsl.
      const xslPath = join(distDir, 'sitemap.xsl');
      try {
        await access(xslPath);
      } catch {
        return;
      }
      const { commit, builtAt } = readBuildInfo();
      const year = new Date().getUTCFullYear();
      const xsl = await readFile(xslPath, 'utf8');
      const filled = xsl
        .replace(/__YEAR__/g, String(year))
        .replace(/__COMMIT__/g, commit)
        .replace(/__BUILT_AT__/g, builtAt);
      if (filled !== xsl) await writeFile(xslPath, filled);
    }
  }
};

async function walkHtml(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkHtml(p)));
    } else if (e.isFile() && p.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

const htmlMinifyPostBuild = {
  name: 'html-minify-post-build',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const distDir = fileURLToPath(dir);
      const files = await walkHtml(distDir);
      let totalBefore = 0;
      let totalAfter = 0;
      for (const path of files) {
        try {
          const before = await readFile(path, 'utf8');
          totalBefore += before.length;
          const after = await minifyHtml(before, {
            collapseWhitespace: true,
            conservativeCollapse: true,
            collapseBooleanAttributes: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
            keepClosingSlash: true,
            sortAttributes: false,
            sortClassName: false,
          });
          await writeFile(path, after);
          totalAfter += after.length;
        } catch (err) {
          logger.warn(`html-minify skipped ${relative(distDir, path)}: ${err.message}`);
        }
      }
      const saved = totalBefore - totalAfter;
      const pct = totalBefore > 0 ? ((saved / totalBefore) * 100).toFixed(1) : '0';
      logger.info(
        `html-minify: ${files.length} files, ${(totalBefore / 1024).toFixed(0)} KB → ${(totalAfter / 1024).toFixed(0)} KB (-${pct}%)`
      );
    }
  }
};

export default defineConfig({
  compressHTML: true,
  integrations: [
    sitemap({
      xslURL: '/sitemap.xsl',
      lastmod: new Date()
    }),
    sitemapPostBuild,
    htmlMinifyPostBuild,
    icon(),
    webmcp({
      customTools: [
        {
          name: 'search_tracker',
          description:
            'Search the ConsentTheater tracker database by cookie name or domain. ' +
            'Returns structured data: company, service, category, consent burden, ' +
            'lifetime, and related cookies/domains. Examples: _ga, _fbp, hotjar.com.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Cookie name or tracker domain to look up (max 100 chars)',
              },
            },
            required: ['query'],
          },
          executeBody: `const q = String(params.query ?? '').trim().slice(0, 100);
if (!q) return { error: 'query is required' };
const res = await fetch('/api/search?q=' + encodeURIComponent(q));
if (!res.ok) return { error: 'API error ' + res.status };
return safeOutput(await res.json());`,
          annotations: { readOnlyHint: true, untrustedContentHint: true },
        },
      ],
    }),
    // Auto-generate .md siblings for hand-curated .astro pages (about,
    // methodology, privacy, etc.). Lossy HTML→MD — fine for LLMs.
    // Handbook and law collections have their own hand-rolled .md
    // endpoints with richer metadata, so we exclude them here.
    llms({
      generateLlmsTxt: false,
      generateLlmsFullTxt: false,
      generateIndividualMd: true,
      exclude: [
        '404',
        '404.html',
        '_astro',
        '**.xml',
        '**.txt',
        'node_modules',
        'handbook/*/**',
        'law/gdpr/**',
        'law/eprivacy/**'
      ]
    })
  ],
  markdown: {
    processor: unified({
      rehypePlugins: [
        [rehypeExternalLinks, {
          target: '_blank',
          // Security only. We deliberately keep referrers and dofollow.
          rel: ['noopener']
        }],
        rehypeWrapTablesInTableSaw
      ]
    })
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname
      }
    }
  },
  site: 'https://consenttheater.org'
});
