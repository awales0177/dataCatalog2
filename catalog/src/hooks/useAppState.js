import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchTheme, fetchItemCount } from '../services/api';
import { menuItems } from '../constants/navigation';

export const useAppState = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
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

  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    let title = 'Data Catalog';
    
    if (path === '/') {
      title = 'Home';
    } else if (path === '/models') {
      title = 'Data Models';
    } else if (path === '/agreements') {
      title = 'Product Agreements';
    } else if (path === '/domains') {
      title = 'Data Domains';
    } else if (path === '/applications') {
      title = 'Data Applications';
    } else if (path === '/toolkit') {
      title = 'Developer Toolkit';
    } else if (path.startsWith('/toolkit/function/')) {
      title = 'Function Details';
    } else if (path === '/policies') {
      title = 'Data Policies';
    } else if (path === '/reference') {
      title = 'Reference Data';
    } else if (path.startsWith('/models/')) {
      const shortName = path.split('/').pop().toUpperCase();
      title = shortName;
    } else if (path.startsWith('/agreements/')) {
      title = 'Product Agreement Details';
    } else if (path.startsWith('/reference/')) {
      title = 'Reference Data Details';
    }

    document.title = title;
  }, [location.pathname]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const theme = await fetchTheme();
        setThemeData(theme);
        safeSetMenuData({ items: menuItems }); // Use local menuItems directly
      } catch (error) {
        setError('Failed to load initial data');
        // Set default values if API is down
        setThemeData({ 
          light: { 
            background: '#f5f5f5', 
            text: '#000000', 
            primary: '#1976d2', 
            card: '#ffffff', 
            border: '#e0e0e0', 
            textSecondary: '#757575' 
          }, 
          dark: { 
            background: '#121212', 
            text: '#ffffff', 
            primary: '#90caf9', 
            card: '#1e1e1e', 
            border: '#333333', 
            textSecondary: '#b0b0b0' 
          } 
        });
        safeSetMenuData({ items: menuItems }); // Use local menuItems even if API fails
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
            if (item.id === 'home') return item;
            try {
              const endpoint = item.id === 'agreements' ? 'dataAgreements' : 
                              item.id === 'models' ? 'models' : item.id;
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
      const response = await fetch('/api/data/models');
      if (!response.ok) {
        throw new Error('Failed to fetch data models');
      }
      const data = await response.json();
      setDataModels(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataModels();
  }, [fetchDataModels]);

  // Add effect to handle sidebar collapse on detail pages, 2-level navigation and edit mode
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    
    // Collapse if we're exactly 2 levels deep (e.g., /models/CUST)
    // OR if we're in edit mode (e.g., /models/CUST/edit, /applications/edit/123, /policies/edit/456)
    // OR if we're in detail view (e.g., /toolkit/function/123, /reference/456)
    if (pathSegments.length === 2 || 
        (pathSegments.length === 3 && pathSegments[2] === 'edit') ||
        (pathSegments.length === 3 && pathSegments[1] === 'edit') ||
        (pathSegments.length === 3 && pathSegments[1] === 'function') ||
        (pathSegments.length === 3 && pathSegments[1] === 'reference')) {
      setIsDrawerCollapsed(true);
    } else {
      setIsDrawerCollapsed(false);
    }
  }, [location.pathname]);

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
    setIsDrawerCollapsed(!isDrawerCollapsed);
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
    
    // Handlers
    handleDrawerToggle,
    handleProfileMenuOpen,
    handleNotificationsMenuOpen,
    handleMenuClose,
    handleThemeToggle,
    handleDrawerCollapse,
    handleInfoSidebarToggle,
  };
};
