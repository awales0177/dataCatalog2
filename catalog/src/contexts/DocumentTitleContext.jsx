import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { getStaticDocumentTitle } from '../utils/documentTitle';

const DocumentTitleContext = createContext(null);

export function DocumentTitleProvider({ children }) {
  const { pathname } = useLocation();
  const [entityTitle, setEntityTitleState] = useState(null);

  const setEntityTitle = useCallback((value) => {
    if (value != null && String(value).trim() !== '') {
      setEntityTitleState(String(value).trim());
    } else {
      setEntityTitleState(null);
    }
  }, []);

  useEffect(() => {
    const base = getStaticDocumentTitle(pathname);
    document.title = entityTitle ? `${entityTitle} · ${base}` : base;
  }, [pathname, entityTitle]);

  const value = useMemo(() => ({ setEntityTitle }), [setEntityTitle]);

  return (
    <DocumentTitleContext.Provider value={value}>{children}</DocumentTitleContext.Provider>
  );
}

export function useDocumentTitleActions() {
  const ctx = useContext(DocumentTitleContext);
  if (!ctx) {
    return { setEntityTitle: () => {} };
  }
  return ctx;
}

/**
 * Syncs the current entity name into the tab title (`Name · static route label`).
 * Clears on unmount or when `title` becomes empty.
 */
export function useSyncDocumentTitle(title) {
  const { setEntityTitle } = useDocumentTitleActions();
  const { pathname } = useLocation();

  useEffect(() => {
    const t = title != null && String(title).trim() !== '' ? String(title).trim() : null;
    if (t) setEntityTitle(t);
    else setEntityTitle(null);
    return () => setEntityTitle(null);
  }, [title, pathname, setEntityTitle]);
}
