/** Shared catalog UI preferences (localStorage). */

export const CATALOG_LIST_VIEW_MODE_KEY = 'catalogListViewMode';

/** @deprecated legacy key from Data Models page — migrated on read */
export const LEGACY_DATA_MODELS_VIEW_KEY = 'dataModelsViewMode';

/** @returns {'grid'|'table'} */
export function readListViewMode() {
  if (typeof window === 'undefined') return 'grid';
  try {
    const v = localStorage.getItem(CATALOG_LIST_VIEW_MODE_KEY);
    if (v === 'table' || v === 'grid') return v;
    const leg = localStorage.getItem(LEGACY_DATA_MODELS_VIEW_KEY);
    if (leg === 'table' || leg === 'grid') {
      localStorage.setItem(CATALOG_LIST_VIEW_MODE_KEY, leg);
      return leg;
    }
  } catch {
    /* ignore */
  }
  return 'grid';
}

/** @param {'grid'|'table'} mode */
export function writeListViewMode(mode) {
  if (mode !== 'table' && mode !== 'grid') return;
  try {
    localStorage.setItem(CATALOG_LIST_VIEW_MODE_KEY, mode);
    localStorage.setItem(LEGACY_DATA_MODELS_VIEW_KEY, mode);
  } catch {
    /* ignore */
  }
}
