import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

// Import components
import DataModelsPage from './pages/DataModelsPage';
import ProductAgreementsPage from './pages/ProductAgreementsPage';
import DataDomainsPage from './pages/DataDomainsPage';
import SplashPage from './pages/SplashPage';
import ApplicationsPage from './pages/ApplicationsPage';
import EditApplicationPage from './pages/EditApplicationPage';
import ReferenceDataPage from './pages/ReferenceDataPage';
import EditReferenceDataPage from './pages/EditReferenceDataPage';
import DataModelDetailPage from './pages/DataModelDetailPage';
import EditDataModelDetailPage from './pages/EditDataModelDetailPage';
import ProductAgreementDetailPage from './pages/ProductAgreementDetailPage';
import EditAgreementPage from './pages/EditAgreementPage';
import ReferenceDataDetailPage from './pages/ReferenceDataDetailPage';
import ToolkitPage from './pages/ToolkitPage';
import ToolkitFunctionDetailPage from './pages/ToolkitFunctionDetailPage';
import EditToolkitFunctionPage from './pages/EditToolkitFunctionPage';
import DataPoliciesPage from './pages/DataPoliciesPage';
import EditDataPolicyPage from './pages/EditDataPolicyPage';
import InfoSidebar from './components/InfoSidebar';
import AppHeader from './components/AppHeader';
import NavigationDrawer from './components/NavigationDrawer';

// Import theme and hooks
import { theme, addGoogleFonts } from './theme/theme';
import { useAppState } from './hooks/useAppState';
import { getRandomColor } from './utils/common';
import { drawerWidth, collapsedDrawerWidth } from './constants/navigation';
import { ThemeContext } from './contexts/ThemeContext';

function AppContent() {
  const {
    mobileOpen,
    isDrawerCollapsed,
    anchorEl,
    notificationsAnchorEl,
    infoSidebarOpen,
    darkMode,
    themeData,
    menuData,
    loading,
    currentTheme,
    handleDrawerToggle,
    handleMenuClose,
    handleThemeToggle,
    handleDrawerCollapse,
    handleInfoSidebarOpen,
  } = useAppState();

  const [avatarColor] = React.useState(getRandomColor());

  // Check if we're on the splash page
  const isSplashPage = window.location.pathname === '/';

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
    <ThemeContext.Provider value={{ currentTheme, darkMode, setDarkMode: () => {} }}>
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
        overflow: 'auto'
      }}>
        <Box 
          sx={{ 
            bgcolor: '#FFC107',
            color: 'rgba(0, 0, 0, 0.87)',
            py: 0.25,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.8rem',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar + 1
          }}
        >
          New Website
        </Box>

        <AppHeader
          currentTheme={currentTheme}
          darkMode={darkMode}
          onDrawerToggle={handleDrawerToggle}
          onThemeToggle={handleThemeToggle}
          onInfoSidebarToggle={handleInfoSidebarOpen}
          isSplashPage={isSplashPage}
        />

        <CssBaseline />
        
        {/* Sidebar Navigation - Only show if not on splash page */}
        {!isSplashPage && (
          <NavigationDrawer
            currentTheme={currentTheme}
            isDrawerCollapsed={isDrawerCollapsed}
            onDrawerCollapse={handleDrawerCollapse}
            mobileOpen={mobileOpen}
            onDrawerToggle={handleDrawerToggle}
            menuData={menuData}
            avatarColor={avatarColor}
          />
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
            bgcolor: currentTheme.background,
            mt: '84px',
            ml: { sm: `${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
            transition: 'margin-left 0.2s ease-in-out, width 0.2s ease-in-out',
          }}
        >
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/models" element={<DataModelsPage />} />
            <Route path="/agreements" element={<ProductAgreementsPage />} />
            <Route path="/domains" element={<DataDomainsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/applications/create" element={<EditApplicationPage />} />
            <Route path="/applications/edit/:id" element={<EditApplicationPage />} />
            <Route path="/toolkit" element={<ToolkitPage />} />
            <Route path="/toolkit/function/new" element={<EditToolkitFunctionPage />} />
            <Route path="/toolkit/function/:functionId/edit" element={<EditToolkitFunctionPage />} />
            <Route path="/toolkit/function/:functionId" element={<ToolkitFunctionDetailPage />} />
            <Route path="/policies" element={<DataPoliciesPage />} />
            <Route path="/policies/create" element={<EditDataPolicyPage />} />
            <Route path="/policies/edit/:id" element={<EditDataPolicyPage />} />
            <Route path="/reference" element={<ReferenceDataPage />} />
            <Route path="/reference/create" element={<EditReferenceDataPage currentTheme={currentTheme} />} />
            <Route path="/reference/:id/edit" element={<EditReferenceDataPage currentTheme={currentTheme} />} />
            <Route path="/reference/:id" element={<ReferenceDataDetailPage currentTheme={currentTheme} />} />
            <Route 
              path="/models/:shortName" 
              element={
                <DataModelDetailPage 
                  currentTheme={currentTheme}
                />
              } 
            />
            <Route 
              path="/models/:shortName/edit" 
              element={
                <EditDataModelDetailPage 
                  currentTheme={currentTheme}
                />
              } 
            />
            <Route 
              path="/agreements/create" 
              element={
                <EditAgreementPage 
                  currentTheme={currentTheme}
                />
              } 
            />
            <Route 
              path="/agreements/:id" 
              element={
                <ProductAgreementDetailPage 
                  currentTheme={currentTheme}
                />
              } 
            />
            <Route 
              path="/agreements/:id/edit" 
              element={
                <EditAgreementPage 
                  currentTheme={currentTheme}
                />
              } 
            />
          </Routes>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              bgcolor: currentTheme.card,
              color: currentTheme.text,
            },
          }}
        >
          <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
          <MenuItem onClick={handleMenuClose}>My Account</MenuItem>
          <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              bgcolor: currentTheme.card,
              color: currentTheme.text,
            },
          }}
        >
          <MenuItem onClick={handleMenuClose}>New data model added</MenuItem>
          <MenuItem onClick={handleMenuClose}>Contract violation detected</MenuItem>
          <MenuItem onClick={handleMenuClose}>Domain health check failed</MenuItem>
          <MenuItem onClick={handleMenuClose}>System update available</MenuItem>
        </Menu>

        <InfoSidebar
          open={infoSidebarOpen}
          onClose={() => handleInfoSidebarOpen()}
          currentTheme={currentTheme}
        />
      </Box>
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
      <ThemeProvider theme={theme}>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
