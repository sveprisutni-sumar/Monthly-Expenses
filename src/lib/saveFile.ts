// Minimal typings for the File System Access API (Chrome/Edge); not yet in TypeScript's DOM lib.
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}
interface WritableFile {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}
interface SaveFileHandle {
  createWritable(): Promise<WritableFile>;
}
declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;
  }
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type SaveTarget =
  | { kind: 'handle'; handle: SaveFileHandle }
  | { kind: 'download'; fileName: string };

/**
 * Opens the native "Save As" dialog, where the user can pick a new name or an existing
 * file (the OS asks before overwriting). Must be called straight from a click, before
 * any slow work, because browsers only allow the dialog during a user gesture.
 * Returns null if the user cancels. Falls back to a plain download in browsers
 * without the File System Access API (e.g. Firefox).
 */
export async function pickXlsxSaveTarget(suggestedName: string): Promise<SaveTarget | null> {
  if (!window.showSaveFilePicker) return { kind: 'download', fileName: suggestedName };
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'Excel workbook', accept: { [XLSX_MIME]: ['.xlsx'] } }],
    });
    return { kind: 'handle', handle };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null;
    throw err;
  }
}

export async function writeToTarget(target: SaveTarget, blob: Blob): Promise<void> {
  if (target.kind === 'handle') {
    const writable = await target.handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = target.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
