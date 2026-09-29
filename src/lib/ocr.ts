import { createWorker } from 'tesseract.js';

export async function recognizeReceiptText(
  image: File | Blob,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const worker = await createWorker('srp_latn+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress);
      }
    },
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(image);
    return text;
  } finally {
    await worker.terminate();
  }
}
