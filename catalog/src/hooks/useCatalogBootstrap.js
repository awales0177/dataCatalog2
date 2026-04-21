import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchTheme,
  fetchItemCount,
  trackPageView,
  trackSiteVisit,
  fetchModels,
} from '../services/api';
import { menuItems } from '../constants/navigation';
import { isWorkbenchPath } from '../constants/workbenchPaths';

/** Theme/menu loading, nav counts, models list, analytics hooks — no drawer/theme-toggle UI state. */
export function useCatalogBootstrap() {
  const location = useLocation();
  const [themeData, setThemeData] = useState(null);
  const [menuData, setMenuData] = useState({ items: menuItems });

  const safeSetMenuData = useCallback((newData) => {
    if (newData && newData.items && newData.items.length > 0) {
      setMenuData(newData);
    } else {
      setMenuData({ items: menuItems });
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [dataModels, setDataModels] = useState([]);

  const getPageName = (path) => {
    if (path === '/') return 'home';
    if (path === '/workspaces') return 'workspaces';
    if (path === '/models' || path.startsWith('/models/')) return 'models';
    if (path === '/agreements' || path.startsWith('/agreements/')) return 'agreements';
    if (path === '/domains') return 'domains';
    if (path === '/applications' || path.startsWith('/applications/')) return 'applications';
    if (path === '/toolkit' || path.startsWith('/toolkit/')) return 'toolkit';
    if (path === '/standards' || path.startsWith('/standards/')) return 'standards';
    if (path === '/policies' || path.startsWith('/policies/')) return 'standards';
    if (path === '/glossary' || path.startsWith('/glossary/')) return 'glossary';
    if (path === '/rules' || path.startsWith('/rules/')) return 'rules';
    if (path === '/statistics') return 'statistics';
    if (path === '/settings') return 'settings';
    if (path === '/users') return 'users';
    if (isWorkbenchPath(path)) return 'workbench';
    return 'other';
  };

  useEffect(() => {
    const siteVisitKey = 'site_visit_tracked';
    const alreadyTracked = sessionStorage.getItem(siteVisitKey);

    if (location.pathname !== '/role' && location.pathname !== '/unauthorized' && !alreadyTracked) {
      sessionStorage.setItem(siteVisitKey, 'true');

      trackSiteVisit().catch((err) => {
        sessionStorage.removeItem(siteVisitKey);
        console.warn('Failed to track site visit:', err);
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    const pageName = getPageName(location.pathname);
    if (location.pathname !== '/role' && location.pathname !== '/unauthorized') {
      const sessionKey = `page_viewed_${pageName}`;
      const alreadyViewed = sessionStorage.getItem(sessionKey);

      if (!alreadyViewed) {
        trackPageView(pageName)
          .then(() => {
            sessionStorage.setItem(sessionKey, 'true');
          })
          .catch((err) => {
            console.warn('Failed to track page view:', err);
          });
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const loadData = async () => {
      const fallbackTheme = {
        light: {
          background: '#f5f5f5',
          text: '#000000',
          primary: '#37ABBF',
          card: '#ffffff',
          border: '#e0e0e0',
          textSecondary: '#757575',
        },
        dark: {
          background: '#121212',
          card: '#1e1e1e',
          text: '#e8e8ea',
          textSecondary: '#9d9da3',
          primary: '#37ABBF',
          primaryHover: '#2a8a9a',
          border: 'rgba(255, 255, 255, 0.12)',
          favorite: '#f1c40f',
          favoriteInactive: '#6b6b70',
          success: '#66bb6a',
          warning: '#ffa726',
          error: '#ef5350',
          quality: { high: '#66bb6a', medium: '#ffa726', low: '#ef5350' },
        },
      };
      const themeTimeoutMs = 12_000;
      try {
        const theme = await Promise.race([
          fetchTheme(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('theme fetch timeout')), themeTimeoutMs),
          ),
        ]);
        setThemeData(theme);
        safeSetMenuData({ items: menuItems });
      } catch (err) {
        setError('Failed to load initial data');
        setThemeData(fallbackTheme);
        safeSetMenuData({ items: menuItems });
        console.warn('Theme load failed; using defaults:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [safeSetMenuData]);

  useEffect(() => {
    const loadMenuCounts = async () => {
      if (countsLoaded) return;
      try {
        const itemsWithCounts = await Promise.allSettled(
          menuItems.map(async (item) => {
            if (item.id === 'home' || item.id === 'workspaces' || item.id === 'settings') return item;
            try {
              let endpoint = item.id;
              if (item.id === 'agreements') {
                endpoint = 'dataAgreements';
              } else if (item.id === 'models') {
                endpoint = 'models';
              }
              const count = await fetchItemCount(endpoint);
              return { ...item, count };
            } catch {
              return { ...item, count: undefined };
            }
          }),
        );

        const processedItems = itemsWithCounts.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          return { ...menuItems[index], count: undefined };
        });

        safeSetMenuData({ items: processedItems });
        setCountsLoaded(true);
        setError(null);
      } catch {
        safeSetMenuData({ items: menuItems });
        setCountsLoaded(true);
        setError('Failed to load menu counts, using fallback');
      }
    };
    loadMenuCounts();
  }, [countsLoaded, safeSetMenuData]);

  const fetchDataModels = useCallback(async () => {
    try {
      const data = await fetchModels();
      const models = data?.models ?? (Array.isArray(data) ? data : []);
      setDataModels(models);
    } catch (err) {
      setDataModels([]);
      console.warn('Failed to load data models list:', err);
    }
  }, []);

  useEffect(() => {
    fetchDataModels();
  }, [fetchDataModels]);

  return {
    themeData,
    menuData,
    loading,
    error,
    dataModels,
  };
}
