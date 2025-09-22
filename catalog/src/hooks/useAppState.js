import { useState, useEffect } from 'react';
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
  const safeSetMenuData = (newData) => {
    if (newData && newData.items && newData.items.length > 0) {
      setMenuData(newData);
    } else {
      console.warn('Attempted to set empty menu data, using fallback');
      setMenuData({ items: menuItems });
    }
  };
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
        console.error('Error loading initial data:', error);
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
  }, []);

  // Update the menu count fetching
  useEffect(() => {
    const loadMenuCounts = async () => {
      if (countsLoaded) return;
      try {
        console.log('Loading menu counts...');
        const itemsWithCounts = await Promise.allSettled(
          menuItems.map(async (item) => {
            if (item.id === 'home') return item;
            try {
              const endpoint = item.id === 'agreements' ? 'dataAgreements' : 
                              item.id === 'models' ? 'models' : 
                              item.id === 'data-products' ? 'dataProducts' : item.id;
              const count = await fetchItemCount(endpoint);
              return { ...item, count };
            } catch (error) {
              console.error(`Error fetching count for ${item.name}:`, error);
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
            console.error(`Failed to load count for ${menuItems[index].name}:`, result.reason);
            // Return the original item without count on failure
            return { ...menuItems[index], count: undefined };
          }
        });
        
        console.log('Menu items with counts loaded:', processedItems);
        safeSetMenuData({ items: processedItems });
        setCountsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Critical error loading menu counts:', err);
        // Fallback to original menu items without counts
        safeSetMenuData({ items: menuItems });
        setCountsLoaded(true);
        setError('Failed to load menu counts, using fallback');
      }
    };
    loadMenuCounts();
  }, [countsLoaded]);

  useEffect(() => {
    fetchDataModels();
  }, []);

  const fetchDataModels = async () => {
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
  };

  // Add effect to handle sidebar collapse - only expand on main listing pages
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    console.log('Current path segments:', pathSegments);
    
    // Only expand sidebar on main listing pages (exactly 1 level deep)
    // Collapse on all other pages (detail views, edit modes, etc.)
    const isMainListingPage = pathSegments.length === 1;
    
    if (isMainListingPage) {
      console.log('Expanding sidebar - main listing page');
      setIsDrawerCollapsed(false);
    } else {
      console.log('Collapsing sidebar - detail page or sub-page detected');
      setIsDrawerCollapsed(true);
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
