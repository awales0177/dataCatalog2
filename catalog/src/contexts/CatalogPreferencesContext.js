import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { readListViewMode, writeListViewMode } from '../constants/catalogPreferences';

const CatalogPreferencesContext = createContext(null);

export function CatalogPreferencesProvider({ children }) {
  const [listViewMode, setListViewModeState] = useState(() => readListViewMode());

  const setListViewMode = useCallback((mode) => {
    if (mode !== 'table' && mode !== 'grid') return;
    writeListViewMode(mode);
    setListViewModeState(mode);
  }, []);

  const value = useMemo(
    () => ({
      listViewMode,
      setListViewMode,
    }),
    [listViewMode, setListViewMode],
  );

  return <CatalogPreferencesContext.Provider value={value}>{children}</CatalogPreferencesContext.Provider>;
}

export function useCatalogPreferences() {
  const ctx = useContext(CatalogPreferencesContext);
  if (!ctx) {
    throw new Error('useCatalogPreferences must be used within CatalogPreferencesProvider');
  }
  return ctx;
}
