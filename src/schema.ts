// JSON-LD builders. Only facts from the brief: no ratings, reviews or client counts.
import { SITE, PHONE, STATIC_PRICE } from './consts';

export const ORG_ID = `${SITE.url}/#organization`;
export const SITE_ID = `${SITE.url}/#website`;

export const organization = {
  '@type': ['Organization', 'ProfessionalService'],
  '@id': ORG_ID,
  name: 'Applane',
  alternateName: 'App Lane',
  url: `${SITE.url}/`,
  logo: `${SITE.url}/logo.png`,
  image: `${SITE.url}/og.png`,
  description:
    'Applane is a Hyderabad software company that builds custom apps around how each business works, and premium animated websites that are fast and built to rank.',
  telephone: PHONE.e164,
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    addressCountry: 'IN',
  },
  areaServed: [
    { '@type': 'City', name: 'Hyderabad' },
    { '@type': 'State', name: 'Telangana' },
    { '@type': 'Country', name: 'India' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: PHONE.e164,
    contactType: 'sales',
    areaServed: 'IN',
    availableLanguage: ['English'],
  },
  knowsAbout: [
    'Custom software development',
    'Custom app development',
    'Distributor billing software',
    'GST billing',
    'Distributor Management System',
    'Gym management software',
    'Biometric attendance',
    'Website design',
    '3D websites',
    'Animated websites',
    'Clinic websites',
    'Search engine optimisation',
  ],
};

export const website = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: `${SITE.url}/`,
  name: 'Applane',
  inLanguage: 'en-IN',
  publisher: { '@id': ORG_ID },
};

export type Crumb = { name: string; href: string };

export function breadcrumbs(items: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE.url}${c.href}`,
    })),
  };
}

export type QA = { q: string; a: string };

export function faqPage(items: QA[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export const staticSiteOffer = {
  '@type': 'Offer',
  name: 'Static website',
  price: String(STATIC_PRICE),
  priceCurrency: 'INR',
  description: 'One-time price. Includes the first year of hosting. Domain is charged separately.',
  availability: 'https://schema.org/InStock',
  seller: { '@id': ORG_ID },
  priceSpecification: {
    '@type': 'PriceSpecification',
    minPrice: String(STATIC_PRICE),
    priceCurrency: 'INR',
  },
};
