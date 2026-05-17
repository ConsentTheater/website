#!/usr/bin/env node
// Accessibility test runner. Drives axe-core directly via puppeteer so we
// can pin the theme via prefers-color-scheme emulation + localStorage seed
// — pa11y's CLI can't do that, and pa11y's page setup was producing
// false-positive contrast failures by running axe before the emulated
// theme was actually applied.
//
// Usage:
//   node scripts/a11y.mjs                            # light + AA
//   node scripts/a11y.mjs --theme=dark               # dark + AA
//   node scripts/a11y.mjs --contrast=high            # light + high-contrast + AAA
//   node scripts/a11y.mjs --theme=dark --contrast=high  # dark + HC + AAA
//
// URL list and runner defaults come from .pa11yci.json (single source of
// truth, kept compatible with pa11y if we ever switch back).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import puppeteer from 'puppeteer';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(resolve(root, '.pa11yci.json'), 'utf8'));
const axeSrc = readFileSync(
  resolve(root, 'node_modules/axe-core/axe.min.js'),
  'utf8'
);

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const theme = arg('theme', 'light');
const contrast = arg('contrast', 'normal');
if (!['light', 'dark'].includes(theme)) {
  console.error(`unknown theme: ${theme} (expected light|dark)`);
  process.exit(64);
}
if (!['normal', 'high'].includes(contrast)) {
  console.error(`unknown contrast: ${contrast} (expected normal|high)`);
  process.exit(64);
}
const highContrast = contrast === 'high';
const standardLabel = highContrast ? 'WCAG2AAA' : 'WCAG2AA';
const axeTags = highContrast
  ? ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa', 'wcag2aaa']
  : ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'];

const launchArgs = config.defaults?.chromeLaunchConfig?.args ?? [];
const browser = await puppeteer.launch({ args: launchArgs });

const { urls } = config;
const label = `theme: ${theme}, contrast: ${contrast}, ${standardLabel}`;
console.log(`Running axe on ${urls.length} URLs (${label})\n`);

let totalIssues = 0;
let failedUrls = 0;

for (const url of urls) {
  const page = await browser.newPage();
  // puppeteer's emulateMediaFeatures whitelist doesn't include
  // `prefers-contrast`, but Chromium DevTools does. Go through CDP so we
  // can set both features in one call.
  const cdp = await page.createCDPSession();
  const mediaFeatures = [{ name: 'prefers-color-scheme', value: theme }];
  if (highContrast) {
    mediaFeatures.push({ name: 'prefers-contrast', value: 'more' });
  }
  await cdp.send('Emulation.setEmulatedMedia', { features: mediaFeatures });
  await page.evaluateOnNewDocument(
    (t, hc) => {
      try {
        localStorage.setItem(
          'ct_settings',
          JSON.stringify({ theme: t, highContrast: hc ? 'on' : 'off' })
        );
      } catch {}
    },
    theme,
    highContrast
  );

  let violations = [];
  let error = null;
  try {
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: config.defaults?.timeout ?? 30000
    });
    await page.addScriptTag({ content: axeSrc });
    const result = await page.evaluate(async (tags) => {
      const res = await window.axe.run(document, {
        runOnly: { type: 'tag', values: tags },
        resultTypes: ['violations']
      });
      return JSON.parse(JSON.stringify(res.violations));
    }, axeTags);
    violations = result;
  } catch (err) {
    error = err;
  } finally {
    await page.close();
  }

  if (error) {
    console.log(`\n✘ ${url}\n   error: ${error.message}`);
    failedUrls++;
    continue;
  }

  const issueCount = violations.reduce((n, v) => n + v.nodes.length, 0);
  totalIssues += issueCount;

  if (issueCount === 0) {
    console.log(`✓ ${url}`);
    continue;
  }

  failedUrls++;
  console.log(`\n✘ ${url}  (${issueCount} ${issueCount === 1 ? 'issue' : 'issues'})`);
  for (const v of violations) {
    for (const node of v.nodes) {
      console.log(`   • ${v.help}  [${v.id}]`);
      console.log(`     ${node.target.join(' ')}`);
      if (node.failureSummary) {
        const summary = node.failureSummary.replace(/\n+/g, ' | ');
        console.log(`     ${summary}`);
      }
    }
  }
}

await browser.close();

console.log(
  `\n${urls.length - failedUrls}/${urls.length} URLs passed` +
    `  (${totalIssues} total ${totalIssues === 1 ? 'issue' : 'issues'}, ${label})`
);

process.exit(failedUrls > 0 ? 2 : 0);
