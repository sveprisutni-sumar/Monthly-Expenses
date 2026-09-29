import { roundDinars } from './format';
import { toLatin } from './translit';

export interface FiscalReceipt {
  merchant: string;
  date: string | null; // ISO yyyy-MM-dd
  items: { name: string; price: number }[];
}

// Requests go through the Vite dev-server proxy (`/suf` → suf.purs.gov.rs) because
// the tax office site does not allow cross-origin browser requests.
const PROXY = '/suf';

/** Parses a Serbian amount such as "1.234,56" or "59,99" into a number. */
function amount(raw: string): number {
  return parseFloat(raw.replace(/\./g, '').replace(',', '.'));
}

function decodeHtml(html: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

/** Strips the trailing unit / tax label, e.g. "Hleb 500g /KOM (Đ)" → "Hleb 500g". */
function cleanName(name: string): string {
  return toLatin(name)
    .replace(/\s*\([A-ZĐŽА-Я]{1,2}\)\s*$/u, '')
    .replace(/\s*\/\s*[\p{L}.]{1,5}\s*$/u, '')
    .trim();
}

function isoFromSerbianDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function labelText(html: string, id: string): string | null {
  const m = html.match(new RegExp(`id="${id}"[^>]*>([^<]*)<`));
  return m ? decodeHtml(m[1]).trim() || null : null;
}

async function fetchSpecifications(html: string): Promise<FiscalReceipt['items'] | null> {
  const invoiceNumber = html.match(/InvoiceNumber\(\s*['"]([^'"]+)['"]/i)?.[1];
  const token = html.match(/Token\(\s*['"]([^'"]+)['"]/i)?.[1];
  if (!invoiceNumber || !token) return null;

  const res = await fetch(`${PROXY}/specifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams({ invoiceNumber, token }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { success?: boolean; items?: { name: string; total: number }[] };
  if (!json.success || !json.items?.length) return null;
  return json.items.map((i) => ({ name: cleanName(i.name), price: roundDinars(i.total) }));
}

/** Reads items from the printed journal: a name line followed by a "price qty total" line. */
function parseJournal(journal: string): FiscalReceipt['items'] {
  const lines = journal.split('\n').map((l) => l.trim());
  // `\b` does not match after Cyrillic letters in JS regexes, hence `\s`.
  const start = lines.findIndex((l) => /^(Назив|Naziv)\s/i.test(l));
  const items: FiscalReceipt['items'] = [];
  const amountsRe = /^([\d.]+,\d{2})\s+(-?[\d.]+(?:,\d+)?)\s+(-?[\d.]+,\d{2})$/;
  let pendingName = '';
  for (const line of lines.slice(start + 1)) {
    if (/^-{5,}|^={5,}/.test(line)) break;
    const m = line.match(amountsRe);
    if (m && pendingName) {
      items.push({ name: cleanName(pendingName), price: roundDinars(amount(m[3])) });
      pendingName = '';
    } else if (line) {
      pendingName = pendingName ? `${pendingName} ${line}` : line;
    }
  }
  return items;
}

/** Fetches the official copy of a receipt from its fiscal QR URL. */
export async function fetchFiscalReceipt(qrUrl: string): Promise<FiscalReceipt> {
  const url = new URL(qrUrl);
  const res = await fetch(`${PROXY}${url.pathname}${url.search}`, { headers: { Accept: 'text/html' } });
  if (!res.ok) throw new Error(`Tax office returned ${res.status}`);
  const html = await res.text();

  const journal = decodeHtml(html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)?.[1] ?? '');
  const journalLines = journal.split('\n').map((l) => l.trim()).filter(Boolean);

  // The shop label carries a numeric point-of-sale prefix, e.g. "1267897-KLIK SHOP".
  // Fallback: the journal opens with a header, the tax ID, then the company name.
  const merchant =
    toLatin((labelText(html, 'shopFullNameLabel') ?? journalLines[2] ?? '').replace(/^\d+-/, '')) || 'Receipt';

  const dateSource =
    labelText(html, 'sdcDateTimeLabel') ?? journalLines.find((l) => /ПФР време|PFR vreme/i.test(l)) ?? '';
  const date = isoFromSerbianDate(dateSource);

  let items: FiscalReceipt['items'] | null = null;
  try {
    items = await fetchSpecifications(html);
  } catch {
    items = null;
  }
  if (!items?.length) items = parseJournal(journal);
  if (!items.length) throw new Error('No items found on the official receipt');

  return { merchant, date, items };
}
