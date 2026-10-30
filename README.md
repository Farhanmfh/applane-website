# applane-website

The company site for **Applane** (applane.in): custom apps for small businesses and premium animated websites, Hyderabad.

Built with [Astro](https://astro.build) as a fully static site. No backend, no CMS, no tracking.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static export to dist/
npm run preview    # serve the built site
npm run zip        # build, then pack dist/ into applane-site.zip for upload
npm run og         # regenerate public/og.png and the PNG icons
```

Node 22.23.4 or newer is required (Astro 7).

## Deploy (Hostinger / cPanel)

The site is fully static: `npm run build` writes plain HTML, CSS and JS to `dist/`. `public/.htaccess` is copied in and handles the 404 page, HTTPS, `www` → `applane.in`, caching, compression and security headers.

1. Run `npm run zip`. This creates `applane-site.zip` with the **contents** of `dist/`, including `.htaccess`.
2. In hPanel (Hostinger) or cPanel, open **File Manager** → `public_html`.
3. First time only: delete the host's placeholder `index.html` / `default.php` if there is one.
4. Upload `applane-site.zip`, right-click it → **Extract** into `public_html`, then delete the zip.
5. Turn on SSL for the domain (hPanel → Security → SSL, or cPanel → SSL/TLS Status) so the HTTPS redirect has a certificate to use.
6. Check `https://applane.in/`, `https://applane.in/work/`, a made-up URL (should show the 404 page) and `https://www.applane.in/` (should redirect).

To update the site, repeat steps 1, 2 and 4. Extracting overwrites the old files. Old hashed files in `_astro/` are harmless, but you can clear that folder before extracting.

If the DNS is on Cloudflare with its proxy on, set Cloudflare SSL to **Full**, not Flexible.

## Deploy (Firebase Hosting, alternative)

`firebase.json` is already set up for the `dist/` folder, with trailing slashes, long-cache headers for `/_astro/*` and basic security headers.

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # pick the Firebase project for applane.in
npm run build && firebase deploy --only hosting
```

Then add `applane.in` and `www.applane.in` as custom domains in the Firebase console and create the DNS records it shows in Cloudflare. App subdomains such as `billing.applane.in` keep pointing at the apps.

After the first deploy, submit `https://applane.in/sitemap-index.xml` in Google Search Console.

## Pages

| URL | What |
| --- | --- |
| `/` | Home: 3D particle hero, the work, why Applane, how we work, ₹1,999 websites, FAQ |
| `/work/` | Apps hub |
| `/work/distributor-billing-software/` | Applane Billing, with a live sample bill you can edit |
| `/work/gym-management-software/` | Gym Owners, with a sample dashboard |
| `/websites/` | Dentologie case study, what a website includes, pricing |
| `/how-we-work/` | The three steps |
| `/contact/` | WhatsApp first; the form only builds a WhatsApp message, nothing is stored |
| `/privacy/`, `/terms/` | Needed for Google OAuth verification of the apps |

## Where things live

- `src/consts.ts`: phone and WhatsApp number, prefilled WhatsApp messages, nav, the ₹1,999 price.
- `src/schema.ts`: JSON-LD (Organization, FAQ, offers, breadcrumbs). Only facts that are true today: no ratings, reviews or client counts.
- `src/layouts/Base.astro`: SEO head (title, description, canonical, Open Graph, structured data).
- `src/scripts/lanes.ts`: the hero 3D scene in plain WebGL, about 9 KB. It loads after the page shows, pauses off-screen, is skipped for "reduce motion" and Save-Data, and falls back to static SVG lanes.
- `src/scripts/motion.ts`: scroll reveals, word-by-word headings, counters.
- `src/lib/bill.ts`: sample bill data and GST maths for the Billing mock-up, with made-up data only.

## Decisions so far

- Static websites **from ₹1,999**: one-time, includes the first year of hosting, domain charged separately. Everything else is "Get a quote".
- Contact is **WhatsApp and phone only** (+91 83319 70886). There is no email until the mailbox is set up.
- Applane is the only brand on the site, with no mention of Ember Consultants.
- Dentologie is named but **not linked** until the new site is live.
- The Billing client is not named, and Gym Owners makes no claim about being live or about automatic blocking.

## Still to confirm before launch

- Add `hello@applane.in` to the contact and privacy pages once mail works. Google's OAuth review usually expects a support email.
- Have Privacy and Terms reviewed. They are plain-language drafts.
- What the ₹1,999 plan includes (number of pages, revisions) and the hosting renewal price.
- Gym Owners: whether it's live, its final name and URL, and whether door blocking on expiry is automatic.
- Link Dentologie once dentologie.in is live, and add real screenshots if the clinic agrees.
