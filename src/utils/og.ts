export function ogImagePath(pathname: string): string {
  let slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (slug === '') slug = 'index';
  slug = slug.replaceAll('/', '-');
  return `/og/${slug}.jpg`;
}
