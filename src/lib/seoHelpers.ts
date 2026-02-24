const SEO_CANONICAL_ID = 'seo-canonical';
const SEO_JSONLD_CLASS = 'seo-jsonld';

/**
 * Set or update the canonical link tag.
 */
export function setCanonical(url: string) {
  let link = document.getElementById(SEO_CANONICAL_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = SEO_CANONICAL_ID;
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

interface MetaTagsConfig {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * Set OG + Twitter meta tags. Uses property for OG, name for Twitter.
 */
export function setMetaTags(config: MetaTagsConfig) {
  if (config.title) document.title = config.title;

  const tags: Record<string, string | undefined> = {
    'og:title': config.ogTitle || config.title,
    'og:description': config.ogDescription || config.description,
    'og:image': config.ogImage,
    'og:url': config.ogUrl,
    'og:type': config.ogType || 'website',
  };

  // OG tags (property attribute)
  for (const [prop, content] of Object.entries(tags)) {
    if (!content) continue;
    let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  // Twitter meta tags (name attribute)
  const twitterTags: Record<string, string | undefined> = {
    'twitter:card': config.twitterCard || 'summary',
    'twitter:title': config.ogTitle || config.title,
    'twitter:description': config.ogDescription || config.description,
    'twitter:image': config.ogImage,
  };

  for (const [name, content] of Object.entries(twitterTags)) {
    if (!content) continue;
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  // Description meta
  if (config.description) {
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.setAttribute('name', 'description');
      document.head.appendChild(desc);
    }
    desc.setAttribute('content', config.description);
  }
}

/**
 * Inject JSON-LD structured data into <head>.
 */
export function injectJsonLd(data: object) {
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.classList.add(SEO_JSONLD_CLASS);
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Cleanup: remove canonical link and all JSON-LD scripts injected by SEO helpers.
 */
export function cleanupSeo() {
  document.getElementById(SEO_CANONICAL_ID)?.remove();
  document.querySelectorAll(`script.${SEO_JSONLD_CLASS}`).forEach(el => el.remove());
}

/**
 * Get the canonical base origin for SEO URLs.
 */
export function getSeoOrigin(): string {
  return 'https://angel.fun.rich';
}
