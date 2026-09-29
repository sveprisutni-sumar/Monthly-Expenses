import { roundDinars } from './format';

export interface ParsedItem {
  name: string;
  price: number;
}

export interface ParsedReceipt {
  items: ParsedItem[];
  itemsSum: number;
  detectedTotal: number | null;
  merchant: string;
}

// Serbian fiscal receipts print prices like "1.234,56" or "199,00", optionally
// followed by a currency marker (RSD / din / дин). Matches that layout as well
// as the plain "1,234.56" style, since the separator roles are disambiguated
// by `toAmount` below rather than by the regex.
const PRICE_RE = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:RSD|rsd|din\.?|дин\.?)?\s*$/;

// "UKUPNO" / "UKUPAN IZNOS" = total; keep the English equivalents too since
// some receipts (imported goods, chain-store templates) print in English.
const TOTAL_RE = /\b(ukupno|ukupan\s*iznos|za\s*naplatu|total)\b/i;

const SKIP_RE =
  /subtotal|sub[-\s]?total|\btax\b|balance|change due|change\b|cash\b|visa|mastercard|amex|debit|credit\s*card|\bcard\b|tender|amount due|payment|\bqty\b|approval|auth code|invoice|receipt no|order\s*#|pdv|gotovina|kartic[au]|karticom|povra[cć]aj|razlika|ra[cč]un\s*br|esir|pfr\s*vreme|fiskalni/i;

/** Normalizes a matched price string (either "1.234,56" or "1,234.56" style) to a number. */
function toAmount(raw: string): number {
  const digitsAndSeparators = raw.trim();
  const decimalDigits = digitsAndSeparators.slice(-2);
  const integerPart = digitsAndSeparators.slice(0, -3).replace(/[.,\s]/g, '');
  return roundDinars(parseFloat(`${integerPart || '0'}.${decimalDigits}`));
}

/** Turns raw OCR text from a receipt into candidate line items + a detected total. */
export function parseReceipt(rawText: string): ParsedReceipt {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedItem[] = [];
  let detectedTotal: number | null = null;

  for (const line of lines) {
    const match = line.match(PRICE_RE);
    if (!match) continue;

    const price = toAmount(match[1]);
    if (Number.isNaN(price) || price <= 0) continue;

    const name = line.slice(0, match.index).trim().replace(/[-.\s:]+$/, '');

    if (TOTAL_RE.test(line) && !/sub[-\s]?total/i.test(line)) {
      if (detectedTotal === null || price > detectedTotal) detectedTotal = price;
      continue;
    }

    if (SKIP_RE.test(line)) continue;
    if (!name || name.length < 2) continue;

    items.push({ name, price });
  }

  const itemsSum = items.reduce((sum, i) => sum + i.price, 0);
  const merchant = lines[0] ?? 'Receipt';

  return { items, itemsSum, detectedTotal, merchant };
}
