/**
 * Browser-local audit trail of Excel imports per reference dataset (no server).
 */

const EXCEL_IMPORT_HISTORY_KEY = 'catalog_reference_excel_import_history_v1';
const MAX_PER_REF = 25;

function safeParse(raw) {
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && !Array.isArray(p)) return p;
  } catch {
    /* ignore */
  }
  return {};
}

export function loadImportHistoryAll() {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    return safeParse(window.localStorage.getItem(EXCEL_IMPORT_HISTORY_KEY));
  } catch {
    return {};
  }
}

/** @param {string} refId */
export function getImportHistoryForRef(refId) {
  const key = String(refId ?? '');
  if (!key) return [];
  const all = loadImportHistoryAll();
  const list = all[key];
  return Array.isArray(list) ? list : [];
}

/**
 * @param {string} refId
 * @param {{ by: string, fileName: string, tableCount?: number }} entry
 */
export function appendImportHistory(refId, entry) {
  const key = String(refId ?? '');
  if (!key) return;
  const all = loadImportHistoryAll();
  const prev = Array.isArray(all[key]) ? all[key] : [];
  const row = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    at: new Date().toISOString(),
    by: String(entry.by || 'Unknown'),
    fileName: String(entry.fileName || ''),
    tableCount: typeof entry.tableCount === 'number' ? entry.tableCount : 0,
  };
  all[key] = [row, ...prev].slice(0, MAX_PER_REF);
  try {
    window.localStorage.setItem(EXCEL_IMPORT_HISTORY_KEY, JSON.stringify(all));
  } catch {
    /* quota */
  }
}
