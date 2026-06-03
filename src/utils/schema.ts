// JSON-LD builders. One @graph per page: Organization + WebSite are emitted on
// every page by Layout.astro; pages contribute their own typed nodes (Article,
// SoftwareApplication, BreadcrumbList, FAQPage) that reference the base nodes by
// @id. Keep schema identity defined here, not sprinkled across pages.

type SiteInput = URL | string;

const originOf = (site: SiteInput): string => new URL(site).origin;

export const orgId = (site: SiteInput): string => `${originOf(site)}/#organization`;
export const webSiteId = (site: SiteInput): string => `${originOf(site)}/#website`;

/** Sitewide identity nodes — emitted on every page by the Layout. */
export function baseNodes(site: SiteInput): Record<string, unknown>[] {
  const o = originOf(site);
  return [
    {
      '@type': 'Organization',
      '@id': orgId(site),
      name: 'ConsentTheater',
      url: `${o}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${o}/web-app-manifest-512x512.png`,
        width: 512,
        height: 512
      },
      description:
        'Independent, open-source project documenting cookies, trackers and consent under GDPR.',
      sameAs: [
        'https://codeberg.org/ConsentTheater',
        'https://github.com/ConsentTheater',
        'https://www.linkedin.com/company/consenttheater'
      ]
    },
    {
      '@type': 'WebSite',
      '@id': webSiteId(site),
      url: `${o}/`,
      name: 'ConsentTheater',
      alternateName: 'ConsentTheater — GDPR cookie & tracker lookup',
      inLanguage: 'en',
      publisher: { '@id': orgId(site) },
      // The homepage reads ?q= on load and runs the lookup, so this target is a
      // real, working page (see SearchBar.astro). Google retired the sitelinks
      // search box in Nov 2024, but the markup stays valid and the URL works.
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${o}/?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    }
  ];
}

interface BreadcrumbItem {
  name: string;
  /** Site-absolute path, e.g. "/handbook/". Omit for the current page (last crumb). */
  path?: string;
}

export function breadcrumbList(
  site: SiteInput,
  items: BreadcrumbItem[]
): Record<string, unknown> {
  const o = originOf(site);
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.path ? { item: `${o}${it.path}` } : {})
    }))
  };
}

interface TechArticleInput {
  /** Canonical absolute URL of the page. */
  url: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  image?: string;
  section?: string;
}

export function techArticle(
  site: SiteInput,
  a: TechArticleInput
): Record<string, unknown> {
  return {
    '@type': 'TechArticle',
    '@id': `${a.url}#article`,
    headline: a.headline,
    description: a.description,
    inLanguage: 'en',
    url: a.url,
    mainEntityOfPage: a.url,
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    ...(a.image ? { image: a.image } : {}),
    ...(a.section ? { articleSection: a.section } : {}),
    isPartOf: { '@id': webSiteId(site) },
    author: { '@id': orgId(site) },
    publisher: { '@id': orgId(site) }
  };
}

interface SoftwareApplicationInput {
  /** Canonical absolute URL of the extension page. */
  url: string;
  description: string;
  version: string;
  image?: string;
  downloadUrl?: string;
}

export function softwareApplication(
  site: SiteInput,
  s: SoftwareApplicationInput
): Record<string, unknown> {
  return {
    '@type': 'SoftwareApplication',
    name: 'ConsentTheater',
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Chrome, Edge, Brave, Arc, Firefox, Zen',
    description: s.description,
    url: s.url,
    softwareVersion: s.version,
    ...(s.image ? { image: s.image } : {}),
    ...(s.downloadUrl ? { downloadUrl: s.downloadUrl } : {}),
    // Free and open source. No aggregateRating: Google requires ratings to be
    // genuine and shown on this page; our store ratings are off-site, so marking
    // them up here would risk a manual action.
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    license: 'https://www.gnu.org/licenses/agpl-3.0.html',
    isPartOf: { '@id': webSiteId(site) },
    publisher: { '@id': orgId(site) }
  };
}

export function faqPage(
  faqs: { q: string; text: string }[]
): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.text }
    }))
  };
}