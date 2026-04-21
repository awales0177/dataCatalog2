import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router-dom';

/** Drawer, sidebar visibility, chrome menus, dark mode — layout-only state (no catalog data fetching). */
export function useAppLayout() {
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
    return saved || 'auto';
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [infoSidebarOpen, setInfoSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (sidebarVisibilityMode === 'always-visible') {
      setIsDrawerCollapsed(false);
      return;
    }
    if (sidebarVisibilityMode === 'always-hidden') {
      setIsDrawerCollapsed(true);
      return;
    }

    if (userManuallyCollapsed) {
      return;
    }

    const pathSegments = location.pathname.split('/').filter((segment) => segment !== '');

    if (
      pathSegments.length === 2 ||
      (pathSegments.length === 3 && pathSegments[2] === 'edit') ||
      (pathSegments.length === 3 && pathSegments[1] === 'edit') ||
      (pathSegments.length === 3 && pathSegments[1] === 'function') ||
      (pathSegments.length === 3 && pathSegments[1] === 'sop') ||
      (pathSegments.length === 3 && pathSegments[1] === 'package') ||
      (pathSegments.length === 3 && pathSegments[1] === 'container') ||
      (pathSegments.length === 3 && pathSegments[1] === 'infrastructure') ||
      (pathSegments.length === 4 && pathSegments[1] === 'container' && pathSegments[3] === 'edit') ||
      (pathSegments.length === 4 && pathSegments[1] === 'infrastructure' && pathSegments[3] === 'edit')
    ) {
      setIsDrawerCollapsed(true);
    } else {
      setIsDrawerCollapsed(false);
    }
  }, [location.pathname, userManuallyCollapsed, sidebarVisibilityMode]);

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
    const apply = () => {
      flushSync(() => {
        setDarkMode(newDarkMode);
      });
      try {
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      } catch {
        /* ignore */
      }
    };

    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduceMotion && typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
      document.startViewTransition(apply);
    } else {
      apply();
    }
  };

  const handleDrawerCollapse = () => {
    if (sidebarVisibilityMode === 'always-visible' || sidebarVisibilityMode === 'always-hidden') {
      return;
    }

    const newCollapsedState = !isDrawerCollapsed;
    setIsDrawerCollapsed(newCollapsedState);
    localStorage.setItem('drawerCollapsed', JSON.stringify(newCollapsedState));

    if (newCollapsedState) {
      setUserManuallyCollapsed(true);
      localStorage.setItem('drawerManuallyCollapsed', 'true');
    } else {
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

    if (newMode === 'always-visible') {
      setIsDrawerCollapsed(false);
      setUserManuallyCollapsed(false);
    } else if (newMode === 'always-hidden') {
      setIsDrawerCollapsed(true);
      setUserManuallyCollapsed(false);
    }
  };

  const handleInfoSidebarToggle = () => {
    setInfoSidebarOpen(!infoSidebarOpen);
  };

  return {
    mobileOpen,
    isDrawerCollapsed,
    anchorEl,
    notificationsAnchorEl,
    infoSidebarOpen,
    darkMode,
    sidebarVisibilityMode,
    handleDrawerToggle,
    handleProfileMenuOpen,
    handleNotificationsMenuOpen,
    handleMenuClose,
    handleThemeToggle,
    handleDrawerCollapse,
    handleInfoSidebarToggle,
    handleSidebarVisibilityToggle,
  };
}
