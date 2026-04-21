import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  CircularProgress,
} from '@mui/material';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';

import NavigationDrawer from './components/NavigationDrawer';
import AppRoutes from './routes/AppRoutes';
import GlobalSearch from './components/GlobalSearch';
import MainGlassHeader from './components/MainGlassHeader';
import InfoSidebar from './components/InfoSidebar';

// Import theme and hooks
import { theme, addGoogleFonts } from './theme/theme';
import { catalogMuiCardOverrides, catalogThemeColorTransitionOverrides } from './theme/catalogSurfaces';
import { useAppState } from './hooks/useAppState';
import { getRandomColor } from './utils/common';
import {
  collapsedDrawerWidth,
  drawerWidth,
  sidebarFloatInset,
  sidebarContentGap,
} from './constants/navigation';
import { ThemeContext } from './contexts/ThemeContext';
import { DocumentTitleProvider } from './contexts/DocumentTitleContext';
import { AuthProvider } from './contexts/AuthContext';
import { WorkbenchModalsProvider } from './contexts/WorkbenchModalsContext';
import { CatalogPreferencesProvider } from './contexts/CatalogPreferencesContext';
import WelcomeModal, { shouldShowWelcomeModal } from './components/WelcomeModal';

function AppContent() {
  const {
    mobileOpen,
    darkMode,
    themeData,
    menuData,
    loading,
    currentTheme,
    sidebarVisibilityMode,
    isDrawerCollapsed,
    handleDrawerToggle,
    handleDrawerCollapse,
    handleThemeToggle,
    handleSidebarVisibilityToggle,
    infoSidebarOpen,
    handleInfoSidebarToggle,
  } = useAppState();
  
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [welcomeOpen, setWelcomeOpen] = React.useState(false);
  const mainScrollRef = React.useRef(null);

  const [avatarColor] = React.useState(getRandomColor());

  const sidebarHidden = sidebarVisibilityMode === 'always-hidden';
  const desktopRailWidthPx = isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth;
  const floatingRailOffsetPx = sidebarHidden
    ? 0
    : sidebarFloatInset + desktopRailWidthPx + sidebarContentGap;

  const muiTheme = React.useMemo(() => {
    if (!currentTheme) return theme;
    return createTheme({
      ...theme,
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: currentTheme.primary,
          dark: currentTheme.primaryHover,
          contrastText: '#ffffff',
        },
        background: {
          default: currentTheme.background,
          paper: currentTheme.card,
        },
        text: {
          primary: currentTheme.text,
          secondary: currentTheme.textSecondary,
        },
        divider: currentTheme.border,
        success: { main: currentTheme.success },
        warning: { main: currentTheme.warning },
        error: { main: currentTheme.error },
        info: {
          main: currentTheme.primary,
          dark: currentTheme.primaryHover,
          light: alpha(currentTheme.primary, darkMode ? 0.22 : 0.14),
          contrastText: '#ffffff',
        },
      },
      components: {
        ...catalogMuiCardOverrides(),
        ...catalogThemeColorTransitionOverrides(),
      },
    });
  }, [darkMode, currentTheme]);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (loading || !currentTheme) return;
    setWelcomeOpen(shouldShowWelcomeModal());
  }, [loading, currentTheme]);

  if (loading || !themeData || !menuData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: themeData?.light?.background || '#f5f5f5'
      }}>
        <CircularProgress />
      </Box>
    );
  }

    return (
    <ThemeContext.Provider
      value={{ currentTheme, darkMode, toggleColorMode: handleThemeToggle }}
    >
      <ThemeProvider theme={muiTheme}>
      <CatalogPreferencesProvider>
      <WorkbenchModalsProvider>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        bgcolor: currentTheme.background,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        transition: (t) =>
          t.transitions.create('background-color', {
            duration: 280,
            easing: t.transitions.easing.easeInOut,
          }),
      }}>
        <CssBaseline />
        
        <NavigationDrawer
          mobileOpen={mobileOpen}
          onDrawerToggle={handleDrawerToggle}
          isDrawerCollapsed={isDrawerCollapsed}
          onDrawerCollapse={handleDrawerCollapse}
          menuData={menuData}
          avatarColor={avatarColor}
          sidebarVisibilityMode={sidebarVisibilityMode}
          onSidebarVisibilityToggle={handleSidebarVisibilityToggle}
        />

        {/* Main: single scroll for the whole column (header bands + page body) */}
        <Box
          component="main"
          ref={mainScrollRef}
          sx={{
            flexGrow: 1,
            minHeight: 0,
            width: '100%',
            alignSelf: 'stretch',
            mt: 0,
            pt: 0,
            pb: 3,
            px: 0,
            ml: 0,
            position: 'relative',
            overflowY: 'auto',
            overflowX: 'clip',
            bgcolor: currentTheme.background,
            transition: (t) =>
              t.transitions.create('background-color', {
                duration: 280,
                easing: t.transitions.easing.easeInOut,
              }),
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              },
            },
          }}
        >
          <MainGlassHeader
            onThemeToggle={handleThemeToggle}
            onOpenSearch={() => setSearchOpen(true)}
            onDrawerToggle={handleDrawerToggle}
            onInfoSidebarToggle={handleInfoSidebarToggle}
            scrollContainerRef={mainScrollRef}
          />
          <Box
            sx={{
              pl: (t) => ({
                xs: t.spacing(3),
                sm: `calc(${floatingRailOffsetPx}px + ${t.spacing(3)})`,
              }),
              pr: (t) => t.spacing(3),
            }}
          >
          <AppRoutes />
          </Box>
        </Box>

        <InfoSidebar
          open={infoSidebarOpen}
          onClose={handleInfoSidebarToggle}
        />

        {/* Global Search Dialog */}
        <GlobalSearch 
          open={searchOpen} 
          onClose={() => setSearchOpen(false)} 
        />

        <WelcomeModal
          open={welcomeOpen}
          onClose={() => setWelcomeOpen(false)}
          theme={currentTheme}
        />
      </Box>
      </WorkbenchModalsProvider>
      </CatalogPreferencesProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

function App() {
  // Add Google Fonts when component mounts
  React.useEffect(() => {
    addGoogleFonts();
  }, []);

  return (
    <BrowserRouter>
      <DocumentTitleProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </DocumentTitleProvider>
    </BrowserRouter>
  );
}

export default App;
