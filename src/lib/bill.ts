// Sample bill used by the Applane Billing mock-up. All data is made up.

export type BillItem = { name: string; hsn: string; perBox: number; box: number; pcs: number; rate: number };

export const SAMPLE_ITEMS: BillItem[] = [
  { name: 'Vanilla Cup 100 ml', hsn: '2105', perBox: 24, box: 2, pcs: 6, rate: 12 },
  { name: 'Chocolate Cone 120 ml', hsn: '2105', perBox: 20, box: 1, pcs: 4, rate: 22 },
  { name: 'Mango Bar 60 ml', hsn: '2105', perBox: 30, box: 3, pcs: 0, rate: 8.5 },
  { name: 'Kesar Pista 1 L', hsn: '2105', perBox: 6, box: 0, pcs: 4, rate: 135 },
];

export const GST_RATE = 0.18;
export const PREVIOUS_DUE = 700;

const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const money = (n: number) => `₹${inr2.format(n)}`;
export const rupees = (n: number) => `₹${inr0.format(n)}`;

export function lineQty(i: BillItem) {
  return i.box * i.perBox + i.pcs;
}

export function computeBill(items: BillItem[], previousDue = PREVIOUS_DUE) {
  const lines = items.map((i) => ({ qty: lineQty(i), amount: lineQty(i) * i.rate }));
  const taxable = lines.reduce((s, l) => s + l.amount, 0);
  const cgst = Math.round(taxable * (GST_RATE / 2) * 100) / 100;
  const sgst = cgst;
  const exact = taxable + cgst + sgst;
  const total = Math.round(exact);
  const roundOff = Math.round((total - exact) * 100) / 100;
  return { lines, taxable, cgst, sgst, roundOff, total, previousDue, due: total + previousDue };
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
}
function threeDigits(n: number) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', r ? twoDigits(r) : ''].filter(Boolean).join(' ');
}

/** Indian numbering: crore, lakh, thousand. */
export function amountInWords(n: number) {
  n = Math.round(n);
  if (n === 0) return 'Rupees Zero Only';
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1e3;
  const parts = [
    crore ? `${threeDigits(crore)} Crore` : '',
    lakh ? `${twoDigits(lakh)} Lakh` : '',
    thousand ? `${twoDigits(thousand)} Thousand` : '',
    rest ? threeDigits(rest) : '',
  ].filter(Boolean);
  return `Rupees ${parts.join(' ')} Only`;
}
