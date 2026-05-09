import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const HANDBOOK_CATEGORIES = [
  'consent',          // banners, withdrawal, dark patterns, valid consent
  'lawful-bases',     // Article 6 grounds, legitimate interest in practice
  'rights',           // access, erasure, portability, objection
  'tracking',         // cookies, fingerprinting, what's "strictly necessary"
  'privacy-tools',    // browsers, extensions, audit tools — for users and devs
  'roles',            // controllers, processors, joint controllers
  'compliance'        // DPAs, fines, enforcement, practical compliance
] as const;

const handbook = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/handbook' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(HANDBOOK_CATEGORIES),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    legal_refs: z.array(z.object({
      label: z.string(),
      href: z.string()
    })).optional(),
    related: z.array(z.string()).optional(),
    order: z.number().optional(),
    draft: z.boolean().optional()
  })
});

export const collections = { handbook };

export const HANDBOOK_CATEGORY_LABELS: Record<typeof HANDBOOK_CATEGORIES[number], string> = {
  consent: 'Consent & banners',
  'lawful-bases': 'Lawful bases',
  rights: 'Rights & user options',
  tracking: 'Tracking & cookies',
  'privacy-tools': 'Privacy tools',
  roles: 'Roles & responsibilities',
  compliance: 'Compliance & enforcement'
};

export const HANDBOOK_CATEGORY_ORDER = HANDBOOK_CATEGORIES;
