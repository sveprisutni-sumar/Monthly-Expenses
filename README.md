# Monthly Expenses

A local, browser-based app for tracking monthly expenses from scanned receipts.

## Features

- **Scan a receipt** (upload or take a photo) — OCR runs entirely in your browser (Tesseract.js) and pulls out line items and prices automatically. Review/edit the parsed items before saving.
- **Categories** — create, color, and delete your own expense categories.
- **Drag and drop** — drag each expense card between category columns (or leave it in "Unassigned").
- **Monthly view** — switch months, see a running total and a per-category breakdown.

All data (expenses, categories, receipt images) is stored locally in your browser via IndexedDB — nothing is sent to a server.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Notes on receipt scanning

Serbian fiscal receipts carry a QR code linking to the tax office's official copy (`suf.purs.gov.rs`). The scanner looks for that code first and, when found, loads the exact items, prices, store and date from the tax office (through the dev server's `/suf` proxy, so the app must be started with `npm run dev` / `Start Expenses.bat` and needs internet). Without a readable QR code it falls back to OCR.

Receipt OCR is heuristic: it looks for lines ending in a price (`12.99`) and treats the rest of the line as the item name, skipping tax/subtotal/total/payment lines. It won't be perfect on every receipt format — always review the parsed items (add, edit, or remove rows) before saving. The first scan on a fresh browser session may take a few extra seconds while the OCR engine downloads its language data.

## Tech stack

- React + TypeScript + Vite
- Tesseract.js for client-side OCR
- Dexie (IndexedDB) for local storage
- @dnd-kit for drag-and-drop
