export type Region = 'AU' | 'US';

export function regionFromCountry(country?: string | null): Region {
  if (!country) return 'AU';
  const c = country.toLowerCase();
  if (c.includes('united states') || c === 'us' || c === 'usa') return 'US';
  return 'AU';
}

export function tzFor(region: Region): string {
  return region === 'US' ? 'America/New_York' : 'Australia/Sydney';
}

export function currencyFor(region: Region): string {
  return region === 'US' ? 'USD' : 'AUD';
}

const epochMsToDate = (ms?: number | null): Date | null => {
  if (ms == null) return null;
  // Some rows may store seconds — heuristic guard
  const n = Number(ms);
  if (!Number.isFinite(n)) return null;
  return new Date(n < 1e12 ? n * 1000 : n);
};

export function fmtTime(ms?: number | null, region: Region = 'AU') {
  const d = epochMsToDate(ms);
  if (!d) return '—';
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', timeZone: tzFor(region) });
}

export function fmtDate(ms?: number | null, region: Region = 'AU') {
  const d = epochMsToDate(ms);
  if (!d) return '—';
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: tzFor(region) });
}

export function fmtDateLong(ms?: number | null, region: Region = 'AU') {
  const d = epochMsToDate(ms);
  if (!d) return '—';
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tzFor(region) });
}

export function fmtMoney(n: number | null | undefined, region: Region = 'AU') {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat(region === 'US' ? 'en-US' : 'en-AU', {
    style: 'currency',
    currency: currencyFor(region),
    maximumFractionDigits: 2,
  }).format(v);
}

export function fmtHours(n: number | null | undefined) {
  if (n == null) return '—';
  return `${Number(n).toFixed(2)}h`;
}

export function fmtNumber(n: number | null | undefined, digits = 1) {
  if (n == null) return '—';
  return Number(n).toFixed(digits);
}

export function fmtPct(n: number | null | undefined) {
  if (n == null) return '—';
  const v = Number(n);
  return `${(v <= 1 ? v * 100 : v).toFixed(0)}%`;
}

export const BENCHMARKS = {
  Manual: 55,
  Autodial: 75,
  EasyAML: 50,
};

export function epochMs(ms?: number | null): Date | null {
  return epochMsToDate(ms);
}
