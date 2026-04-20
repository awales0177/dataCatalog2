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
import { WORKBENCH_PATHS, isWorkbenchPath } from '../constants/workbenchPaths';

export const useAppState = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(() => {
    const saved = localStorage.getItem('drawerCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [userManuallyCollapsed, setUserManuallyCollapsed] = useState(() => {
    return localStorage.getItem('drawerManuallyCollapsed') === 'true';
  });
  const [sidebarVisibilityMode, setSidebarVisibilityMode] = useState(() => {
    const saved = localStorage.getItem('sidebarVisibilityMode');
    return saved || 'auto'; // 'auto', 'always-visible', 'always-hidden'
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [infoSidebarOpen, setInfoSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [themeData, setThemeData] = useState(null);
  const [menuData, setMenuData] = useState({ items: menuItems });
  
  // Safety function to ensure menu data is never empty
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

  // Map route to page name for tracking
  const getPageName = (path) => {
    if (path === '/') return 'home';
    if (path === '/workspaces') return 'workspaces';
    if (path === '/models' || path.startsWith('/models/')) return 'models';
    if (path === '/agreements' || path.startsWith('/agreements/')) return 'agreements';
    if (path === '/domains') return 'domains';
    if (path === '/applications' || path.startsWith('/applications/')) return 'applications';
    if (path === '/toolkit' || path.startsWith('/toolkit/')) return 'toolkit';
    if (path === '/policies' || path.startsWith('/policies/')) return 'policies';
    if (path === '/glossary' || path.startsWith('/glossary/')) return 'glossary';
    if (path === '/rules' || path.startsWith('/rules/')) return 'rules';
    if (path === '/statistics') return 'statistics';
    if (path === '/settings') return 'settings';
    if (path === '/users') return 'users';
    if (isWorkbenchPath(path)) return 'workbench';
    return 'other';
  };

  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    let title = 'DH-TEST';
    
    if (path === '/') {
      title = 'Home';
    } else if (path === '/workspaces') {
      title = 'Workspaces';
    } else if (path === '/models') {
      title = 'Data Models';
    } else if (path === '/agreements') {
      title = 'Product Agreements';
    } else if (path === '/domains') {
      title = 'Data Domains';
    } else if (path === '/applications') {
      title = 'Data Applications';
    } else if (path === '/toolkit') {
      title = 'Toolkit';
    } else if (path.startsWith('/toolkit/function/')) {
      title = 'Function Details';
    } else if (path === '/policies') {
      title = 'Data Standards';
    } else if (path === '/settings') {
      title = 'Settings';
    } else if (path === '/rules') {
      title = 'Data Quality Rules';
    } else if (path.startsWith('/models/')) {
      const seg = path.split('/')[2] || '';
      const decoded = decodeURIComponent(seg);
      title = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(decoded) ? 'Data model' : decoded.toUpperCase();
    } else if (path.startsWith('/agreements/')) {
      title = 'Product Agreement Details';
    } else if (path === WORKBENCH_PATHS.query) {
      title = 'Query workbench';
    } else if (path === WORKBENCH_PATHS.modeling) {
      title = 'Data modeling';
    } else if (path === WORKBENCH_PATHS.studio) {
      title = 'Modeling studio';
    } else if (path === WORKBENCH_PATHS.ruleBuilder) {
      title = 'Rule builder';
    } else if (path === WORKBENCH_PATHS.referenceData) {
      title = 'Reference data hub';
    }

    document.title = title;
  }, [location.pathname]);

  // Track site visit (once per session)
  useEffect(() => {
    // Check if site visit has already been tracked in this session
    const siteVisitKey = 'site_visit_tracked';
    const alreadyTracked = sessionStorage.getItem(siteVisitKey);
    
    // Skip tracking for role page and unauthorized page
    if (location.pathname !== '/role' && location.pathname !== '/unauthorized' && !alreadyTracked) {
      // Mark as tracked IMMEDIATELY to prevent double-tracking (even in StrictMode)
      sessionStorage.setItem(siteVisitKey, 'true');
      
      // Track site visit (non-blocking, once per session)
      trackSiteVisit()
        .catch(err => {
          // If tracking fails, remove the flag so it can be retried
          sessionStorage.removeItem(siteVisitKey);
          // Silently fail - don't break the app
          console.warn('Failed to track site visit:', err);
        });
    }
  }, []); // Only run once on mount

  // Track page views (session-specific)
  useEffect(() => {
    const pageName = getPageName(location.pathname);
    // Skip tracking for role page and unauthorized page
    if (location.pathname !== '/role' && location.pathname !== '/unauthorized') {
      // Check if this page has already been viewed in this session
      const sessionKey = `page_viewed_${pageName}`;
      const alreadyViewed = sessionStorage.getItem(sessionKey);
      
      // Only track the page view if it hasn't been viewed in this session
      if (!alreadyViewed) {
        // Track page view (non-blocking)
        trackPageView(pageName)
          .then(() => {
            // Mark as viewed in this session after successful tracking
            sessionStorage.setItem(sessionKey, 'true');
          })
          .catch(err => {
            // Silently fail - don't break the app
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
      } catch (error) {
        setError('Failed to load initial data');
        setThemeData(fallbackTheme);
        safeSetMenuData({ items: menuItems });
        console.warn('Theme load failed; using defaults:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [safeSetMenuData]);

  // Update the menu count fetching
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
            } catch (error) {
              // Return item without count on error, don't break the entire menu
              return { ...item, count: undefined };
            }
          })
        );
        
        // Process results and handle any failures gracefully
        const processedItems = itemsWithCounts.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            // Return the original item without count on failure
            return { ...menuItems[index], count: undefined };
          }
        });
        
        safeSetMenuData({ items: processedItems });
        setCountsLoaded(true);
        setError(null);
      } catch (err) {
        // Fallback to original menu items without counts
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

  // Add effect to handle sidebar collapse on detail pages, 2-level navigation and edit mode
  // Only auto-collapse if user hasn't manually set a preference and visibility mode is 'auto'
  useEffect(() => {
    // If visibility mode is set to always visible or always hidden, respect that
    if (sidebarVisibilityMode === 'always-visible') {
      setIsDrawerCollapsed(false);
      return;
    }
    if (sidebarVisibilityMode === 'always-hidden') {
      setIsDrawerCollapsed(true);
      return;
    }

    // If user manually collapsed, respect that preference and don't auto-collapse
    if (userManuallyCollapsed) {
      return;
    }

    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    
    // Collapse if we're exactly 2 levels deep (e.g., /models/CUST)
    // OR if we're in edit mode (e.g., /models/CUST/edit, /applications/edit/123, /policies/edit/456)
    // OR if we're in detail view (e.g., /toolkit/function/123, /toolkit/container/123, /toolkit/infrastructure/123)
    if (pathSegments.length === 2 || 
        (pathSegments.length === 3 && pathSegments[2] === 'edit') ||
        (pathSegments.length === 3 && pathSegments[1] === 'edit') ||
        (pathSegments.length === 3 && pathSegments[1] === 'function') ||
        (pathSegments.length === 3 && pathSegments[1] === 'sop') ||
        (pathSegments.length === 3 && pathSegments[1] === 'package') ||
        (pathSegments.length === 3 && pathSegments[1] === 'container') ||
        (pathSegments.length === 3 && pathSegments[1] === 'infrastructure') ||
        (pathSegments.length === 4 && pathSegments[1] === 'container' && pathSegments[3] === 'edit') ||
        (pathSegments.length === 4 && pathSegments[1] === 'infrastructure' && pathSegments[3] === 'edit')) {
      setIsDrawerCollapsed(true);
    } else {
      setIsDrawerCollapsed(false);
    }
  }, [location.pathname, userManuallyCollapsed, sidebarVisibilityMode]);

  // Event handlers
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const handleDrawerCollapse = () => {
    // If in always-visible or always-hidden mode, don't allow manual collapse
    if (sidebarVisibilityMode === 'always-visible' || sidebarVisibilityMode === 'always-hidden') {
      return;
    }
    
    const newCollapsedState = !isDrawerCollapsed;
    setIsDrawerCollapsed(newCollapsedState);
    // Save to localStorage
    localStorage.setItem('drawerCollapsed', JSON.stringify(newCollapsedState));
    
    if (newCollapsedState) {
      // User manually collapsed - mark as manual preference
      setUserManuallyCollapsed(true);
      localStorage.setItem('drawerManuallyCollapsed', 'true');
    } else {
      // User manually expanded - clear manual preference to allow auto-collapse again
      setUserManuallyCollapsed(false);
      localStorage.setItem('drawerManuallyCollapsed', 'false');
    }
  };

  const handleSidebarVisibilityToggle = () => {
    let newMode;
    if (sidebarVisibilityMode === 'auto') {
      newMode = 'always-visible';
    } else if (sidebarVisibilityMode === 'always-visible') {
      newMode = 'always-hidden';
    } else {
      newMode = 'auto';
    }
    
    setSidebarVisibilityMode(newMode);
    localStorage.setItem('sidebarVisibilityMode', newMode);
    
    // Apply the new mode immediately
    if (newMode === 'always-visible') {
      setIsDrawerCollapsed(false);
      setUserManuallyCollapsed(false);
    } else if (newMode === 'always-hidden') {
      setIsDrawerCollapsed(true);
      setUserManuallyCollapsed(false);
    }
    // If switching back to 'auto', let the useEffect handle the state
  };

  const handleInfoSidebarToggle = () => {
    setInfoSidebarOpen(!infoSidebarOpen);
  };

  const currentTheme = themeData ? {
    ...(darkMode ? themeData.dark : themeData.light),
    darkMode
  } : null;

  return {
    // State
    mobileOpen,
    isDrawerCollapsed,
    anchorEl,
    notificationsAnchorEl,
    infoSidebarOpen,
    darkMode,
    themeData,
    menuData,
    loading,
    error,
    dataModels,
    currentTheme,
    sidebarVisibilityMode,
    
    // Handlers
    handleDrawerToggle,
    handleProfileMenuOpen,
    handleNotificationsMenuOpen,
    handleMenuClose,
    handleThemeToggle,
    handleDrawerCollapse,
    handleInfoSidebarToggle,
    handleSidebarVisibilityToggle,
  };
};
