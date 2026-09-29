import { prepareZXingModule, readBarcodes, type ReaderOptions } from 'zxing-wasm/reader';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

// Serve the decoder from the app itself instead of the library's default CDN.
prepareZXingModule({
  overrides: {
    locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path),
  },
});

const FISCAL_URL_RE = /^https:\/\/suf\.purs\.gov\.rs\/v\/\?vl=/;

// Fiscal QR codes are very dense and printed on curling thermal paper. Tuned on real
// receipt photos: the plain image catches clean shots, while a smoothed, contrast-boosted
// grayscale upscale with a global threshold rescues angled / low-resolution ones.
const PASSES: { width: number | null; blur: number; binarizer: ReaderOptions['binarizer'] }[] = [
  { width: null, blur: 0, binarizer: 'LocalAverage' },
  { width: 1800, blur: 0.8, binarizer: 'GlobalHistogram' },
  { width: 2400, blur: 0.8, binarizer: 'GlobalHistogram' },
  { width: 1350, blur: 0.8, binarizer: 'GlobalHistogram' },
];

function render(bitmap: ImageBitmap, width: number | null, blur: number): ImageData | null {
  const scale = width ? width / bitmap.width : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.filter = width ? `grayscale(1) contrast(1.5) blur(${blur}px)` : 'grayscale(1)';
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Returns the Serbian fiscal verification URL encoded in the receipt's QR code, if any. */
export async function findFiscalQrUrl(image: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(image);
  try {
    for (const pass of PASSES) {
      const data = render(bitmap, pass.width, pass.blur);
      if (!data) continue;
      const results = await readBarcodes(data, {
        formats: ['QRCode'],
        tryHarder: true,
        binarizer: pass.binarizer,
        maxNumberOfSymbols: 1,
      });
      const text = results[0]?.text.trim();
      if (text && FISCAL_URL_RE.test(text)) return text;
    }
    return null;
  } finally {
    bitmap.close();
  }
}
