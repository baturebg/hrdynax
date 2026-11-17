export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 864e5);

/** 05 Nov 26 */
export const fd = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')} ${MON[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;

export const whenTxt = (h: number) => (h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`);

export const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export const pct = (p: number) => Math.round(p * 100);

export const signed = (n: number) => `${n > 0 ? '+' : ''}${n}`;

const ZAR = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ZAR0 = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 });

/** R 1 234,56 — South African rand with cents */
export const zar = (n: number) => ZAR.format(n);
/** R 1 235 — whole rand */
export const zar0 = (n: number) => ZAR0.format(n);
/** R1.27bn / R125.8m / R 84 000 */
export const zarCompact = (n: number) =>
  Math.abs(n) >= 1e9 ? `R${(n / 1e9).toFixed(2)}bn` : Math.abs(n) >= 1e6 ? `R${(n / 1e6).toFixed(1)}m` : zar0(n);
export const num = (n: number) => NUM.format(n);

/** Parse "30 000", "R30,000", "30k", "1.2m" into a number. */
export function parseAmount(text: string): number | null {
  const m = text.toLowerCase().match(/(\d[\d\s,]*(?:\.\d+)?)\s*(k|m|million|bn)?\b/);
  if (!m) return null;
  const n = Number(m[1].replace(/[\s,]/g, ''));
  if (!Number.isFinite(n)) return null;
  const mult = m[2] === 'k' ? 1e3 : m[2] === 'm' || m[2] === 'million' ? 1e6 : m[2] === 'bn' ? 1e9 : 1;
  return n * mult;
}
