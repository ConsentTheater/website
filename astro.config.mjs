import { defineConfig } from 'astro/config';
import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';
import { visit, SKIP } from 'unist-util-visit';

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

export default defineConfig({
  integrations: [
    sitemap({
      xslURL: '/sitemap.xsl',
      lastmod: new Date()
    }),
    sitemapPostBuild,
    icon()
  ],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, {
        target: '_blank',
        // Security only. We deliberately keep referrers and dofollow.
        rel: ['noopener']
      }],
      rehypeWrapTablesInTableSaw
    ]
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
