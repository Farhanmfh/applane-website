// Single source for business details used across pages and structured data.

export const SITE = {
  name: 'Applane',
  url: 'https://applane.in',
  tagline: 'Custom apps and premium websites, built around how your business works.',
  city: 'Hyderabad',
  region: 'Telangana',
  country: 'IN',
};

export const PHONE = {
  e164: '+918331970886',
  display: '+91 83319 70886',
  wa: '918331970886',
};

/** Build a wa.me link with a ready-to-send message. */
export function waLink(text = 'Hi Applane, I would like to know more.') {
  return `https://wa.me/${PHONE.wa}?text=${encodeURIComponent(text)}`;
}

export const WA = {
  general: waLink('Hi Applane, I would like to know more.'),
  quote: waLink('Hi Applane, I would like a quote. Here is what I need: '),
  billingDemo: waLink('Hi Applane, I would like a free demo of Applane Billing.'),
  gymDemo: waLink('Hi Applane, I would like a free demo of Gym Owners.'),
  website: waLink('Hi Applane, I would like a website for my business.'),
  staticSite: waLink('Hi Applane, I am interested in the static website from ₹1,999.'),
};

export const NAV = [
  { href: '/work/', label: 'Apps' },
  { href: '/websites/', label: 'Websites' },
  { href: '/how-we-work/', label: 'How we work' },
  { href: '/contact/', label: 'Contact' },
];

export const STATIC_PRICE = 1999;
