import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { recognizeReceiptText } from '../lib/ocr';
import { parseReceipt } from '../lib/receiptParser';
import { findFiscalQrUrl } from '../lib/qr';
import { fetchFiscalReceipt } from '../lib/fiscalReceipt';
import type { ExpenseItem } from '../types';
import { ExpenseForm, type ExpenseFormValues } from './ExpenseForm';

type Stage = 'idle' | 'scanning' | 'review';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReceiptScanner({ onSaved }: { onSaved: () => void }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [parsed, setParsed] = useState<{ merchant: string; date: string; items: ExpenseItem[] }>({
    merchant: '',
    date: todayIso(),
    items: [],
  });

  // Free the in-memory preview as soon as it is replaced or the scanner closes.
  useEffect(() => {
    if (!imageUrl) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  async function handleFile(file: File) {
    setError(null);
    setNotice(null);
    setImageUrl(URL.createObjectURL(file));
    setStage('scanning');
    setProgress(0);
    setStatus('Looking for fiscal QR code…');

    // Preferred path: the fiscal QR links to the tax office's exact copy of the receipt.
    let fallbackReason = 'No fiscal QR code found';
    try {
      const qrUrl = await findFiscalQrUrl(file);
      if (qrUrl) {
        setStatus('Fetching official receipt…');
        const receipt = await fetchFiscalReceipt(qrUrl);
        setParsed({
          merchant: receipt.merchant,
          date: receipt.date ?? todayIso(),
          items: receipt.items.map((i) => ({ id: uuid(), ...i })),
        });
        setNotice('Read from the fiscal QR code – exact data from the tax office.');
        setStage('review');
        return;
      }
    } catch {
      fallbackReason = 'Could not load the official receipt from the tax office';
    }

    setStatus('Reading receipt');
    setNotice(`${fallbackReason} – read with OCR, please check the items.`);
    try {
      const text = await recognizeReceiptText(file, setProgress);
      const result = parseReceipt(text);
      setParsed({
        merchant: result.merchant,
        date: todayIso(),
        items: result.items.map((i) => ({ id: uuid(), name: i.name, price: i.price })),
      });
    } catch {
      setError('Could not read that receipt. Try a clearer photo, or add items manually below.');
      setParsed({ merchant: 'Receipt', date: todayIso(), items: [] });
    }
    setStage('review');
  }

  async function save(values: ExpenseFormValues) {
    await db.expenses.add({
      id: uuid(),
      ...values,
      createdAt: Date.now(),
    });
    reset();
    onSaved();
  }

  function reset() {
    setStage('idle');
    setImageUrl(null);
    setProgress(0);
    setError(null);
    setNotice(null);
    setParsed({ merchant: '', date: todayIso(), items: [] });
  }

  return (
    <div className="scanner">
      {stage === 'idle' && (
        <label className="dropzone">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="dropzone-icon">📷</div>
          <div className="dropzone-text">Take a photo or upload a receipt</div>
          <div className="dropzone-hint">We'll read the items and total automatically</div>
        </label>
      )}

      {stage === 'scanning' && (
        <div className="scanning-panel">
          {imageUrl && <img className="receipt-preview" src={imageUrl} alt="Receipt" />}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div className="progress-label">{status}{progress > 0 ? `… ${Math.round(progress * 100)}%` : ''}</div>
        </div>
      )}

      {stage === 'review' && (
        <ExpenseForm
          initial={parsed}
          imageUrl={imageUrl}
          initialError={error}
          notice={notice}
          saveLabel="Save expense"
          onSave={save}
          onCancel={reset}
        />
      )}
    </div>
  );
}
