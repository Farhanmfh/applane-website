// Renders the social share image and PNG icons from SVG. Run: npm run og
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';

const mark = (x, y, s) => `
  <g transform="translate(${x} ${y}) scale(${s / 32})">
    <rect width="32" height="32" rx="9" fill="#0B8A47"/>
    <path d="M8.5 25 14.6 7M23.5 25 17.4 7" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M16 24.5V20M16 16.5v-3M16 10.5V9" stroke="#18D26E" stroke-width="2.2" stroke-linecap="round"/>
  </g>`;

const lanes = Array.from({ length: 13 }, (_, i) => {
  const k = i - 6;
  return `<path d="M${900 + k * 9} 250 L${900 + k * 150} 700" stroke="url(#lf)" stroke-width="3" stroke-dasharray="14 18" fill="none"/>`;
}).join('');

let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const dots = Array.from({ length: 140 }, () => {
  const r = () => rand();
  const x = 600 + r(1) * 620, y = 60 + r(2) * 560, a = 0.15 + r(3) * 0.6, s = 1 + r(4) * 2.4;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="#18D26E" opacity="${a.toFixed(2)}"/>`;
}).join('');

const font = "Segoe UI, Arial, sans-serif";
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="lf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#18D26E" stop-opacity="0"/>
      <stop offset="1" stop-color="#18D26E" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="glow" cx="75%" cy="100%" r="70%">
      <stop offset="0" stop-color="#0B8A47" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#0B8A47" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0C0F0E"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${lanes}
  ${dots}
  ${mark(72, 64, 56)}
  <text x="142" y="105" font-family="${font}" font-weight="700" font-size="40" fill="#fff" letter-spacing="-1.5">applane</text>
  <text x="72" y="300" font-family="${font}" font-weight="700" font-size="74" fill="#fff" letter-spacing="-2.5">Custom apps &amp;</text>
  <text x="72" y="384" font-family="${font}" font-weight="700" font-size="74" fill="#fff" letter-spacing="-2.5">premium websites.</text>
  <text x="72" y="452" font-family="${font}" font-weight="600" font-size="38" fill="#18D26E" letter-spacing="-1">Built around how you work.</text>
  <rect x="72" y="520" width="356" height="52" rx="26" fill="#18D26E" fill-opacity="0.14"/>
  <text x="96" y="554" font-family="${font}" font-weight="600" font-size="24" fill="#BFF3D6">Websites from ₹1,999</text>
  <text x="456" y="554" font-family="${font}" font-weight="500" font-size="24" fill="#A7B4AD">Hyderabad · applane.in</text>
</svg>`;

const icon = (size, pad = 0) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${pad ? `<rect width="${size}" height="${size}" fill="#0B8A47"/>` : ''}
  ${mark(pad, pad, size - pad * 2)}
</svg>`;

const render = (svg, file, width) => {
  const png = new Resvg(svg, {
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
    font: { loadSystemFonts: true, defaultFontFamily: 'Segoe UI' },
  }).render().asPng();
  writeFileSync(new URL(`../public/${file}`, import.meta.url), png);
  console.log('wrote', file, png.length, 'bytes');
};

render(og, 'og.png');
render(icon(512), 'logo.png');
render(icon(512), 'icon-512.png');
render(icon(192), 'icon-192.png');
render(icon(180, 0), 'apple-touch-icon.png');
render(icon(32), 'favicon-32.png');
