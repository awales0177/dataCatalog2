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
import HomePage from './pages/HomePage';
import ApplicationsPage from './pages/ApplicationsPage';
import EditApplicationPage from './pages/EditApplicationPage';
import ReferenceDataPage from './pages/ReferenceDataPage';
import EditReferenceDataPage from './pages/EditReferenceDataPage';
import PipelinesPage from './pages/PipelinesPage';
import DataProductsPage from './pages/DataProductsPage';
import PriorityQueuePage from './pages/PriorityQueuePage';
import DataProductDetailPage from './pages/DataProductDetailPage';
import DatasetDetail from './components/datasets/DatasetDetail';
import DataModelDetailPage from './pages/DataModelDetailPage';
import GlossaryPage from './pages/GlossaryPage';
import EditGlossaryPage from './pages/EditGlossaryPage';
import GlossaryMarkdownPage from './pages/GlossaryMarkdownPage';
import DataProductMarkdownPage from './pages/DataProductMarkdownPage';
import DatasetMarkdownPage from './pages/DatasetMarkdownPage';
import ToolkitTechnologyMarkdownPage from './pages/ToolkitTechnologyMarkdownPage';
import EditToolkitTechnologyPage from './pages/EditToolkitTechnologyPage';
import EditToolkitPage from './pages/EditToolkitPage';
import EditDataModelDetailPage from './pages/EditDataModelDetailPage';
import ProductAgreementDetailPage from './pages/ProductAgreementDetailPage';
import EditAgreementPage from './pages/EditAgreementPage';
import ReferenceDataDetailPage from './pages/ReferenceDataDetailPage';
import ToolkitPage from './pages/ToolkitPage';
import ToolkitFunctionDetailPage from './pages/ToolkitFunctionDetailPage';
import ToolkitDetailPage from './pages/ToolkitDetailPage';
import ToolkitPackageDetailPage from './pages/ToolkitPackageDetailPage';
import ToolkitContainerDetailPage from './pages/ToolkitContainerDetailPage';
import ToolkitInfrastructureDetailPage from './pages/ToolkitInfrastructureDetailPage';
import EditToolkitFunctionPage from './pages/EditToolkitFunctionPage';
import EditToolkitPackagePage from './pages/EditToolkitPackagePage';
import EditToolkitContainerPage from './pages/EditToolkitContainerPage';
import EditToolkitInfrastructurePage from './pages/EditToolkitInfrastructurePage';
import ImportToolkitPage from './pages/ImportToolkitPage';
import DataPoliciesPage from './pages/DataPoliciesPage';
import EditDataPolicyPage from './pages/EditDataPolicyPage';
import RolePage from './pages/RolePage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UserManagementPage from './pages/UserManagementPage';
import StatisticsPage from './pages/StatisticsPage';
import RuleBuilderPage from './pages/RuleBuilderPage';
import InfoSidebar from './components/InfoSidebar';
import AppHeader from './components/AppHeader';
import NavigationDrawer from './components/NavigationDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalSearch from './components/GlobalSearch';

// Import theme and hooks
import { theme, addGoogleFonts } from './theme/theme';
import { useAppState } from './hooks/useAppState';
import { getRandomColor } from './utils/common';
import { drawerWidth, collapsedDrawerWidth } from './constants/navigation';
import { ThemeContext } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

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
    sidebarVisibilityMode,
    handleDrawerToggle,
    handleMenuClose,
    handleThemeToggle,
    handleDrawerCollapse,
    handleInfoSidebarToggle,
    handleSidebarVisibilityToggle,
  } = useAppState();
  
  const [searchOpen, setSearchOpen] = React.useState(false);

  const [avatarColor] = React.useState(getRandomColor());

  // Check if we're on the splash page (deprecated - keeping for backward compatibility)
  const isSplashPage = false;

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
        bgcolor: currentTheme.card,
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
          onInfoSidebarToggle={handleInfoSidebarToggle}
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
            sidebarVisibilityMode={sidebarVisibilityMode}
            onSidebarVisibilityToggle={handleSidebarVisibilityToggle}
          />
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
            mt: '84px',
            ml: { sm: `${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
            transition: 'margin-left 0.2s ease-in-out, width 0.2s ease-in-out',
            position: 'relative',
            height: 'calc(100vh - 84px)',
            overflow: 'hidden',
            bgcolor: currentTheme.card,
          }}
        >
          {/* Curved Content Container */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: currentTheme.background,
              borderRadius: '24px',
              border: `1px solid ${currentTheme.border}`,
              overflow: 'hidden',
              boxShadow: 'none',
            }}
          >
            {/* Scrollable Content Area */}
            <Box
              sx={{
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                p: 3,
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
              <Routes>
            <Route path="/role" element={<RolePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/models" element={
              <ProtectedRoute>
                <DataModelsPage />
              </ProtectedRoute>
            } />
            <Route path="/agreements" element={
              <ProtectedRoute>
                <ProductAgreementsPage />
              </ProtectedRoute>
            } />
            <Route path="/domains" element={
              <ProtectedRoute>
                <DataDomainsPage />
              </ProtectedRoute>
            } />
            <Route path="/applications" element={
              <ProtectedRoute>
                <ApplicationsPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit" element={
              <ProtectedRoute>
                <ToolkitPage />
              </ProtectedRoute>
            } />
            <Route path="/policies" element={
              <ProtectedRoute>
                <DataPoliciesPage />
              </ProtectedRoute>
            } />
            <Route path="/reference" element={
              <ProtectedRoute>
                <ReferenceDataPage />
              </ProtectedRoute>
            } />
            <Route path="/priority-queue" element={
              <ProtectedRoute>
                <PriorityQueuePage />
              </ProtectedRoute>
            } />
            <Route path="/pipelines" element={
              <ProtectedRoute>
                <PipelinesPage />
              </ProtectedRoute>
            } />
            <Route path="/pipelines/datasets/:id" element={
              <ProtectedRoute>
                <DatasetDetail />
              </ProtectedRoute>
            } />
            <Route path="/data-products" element={
              <ProtectedRoute>
                <DataProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/data-products/:id" element={
              <ProtectedRoute>
                <DataProductDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/glossary" element={
              <ProtectedRoute>
                <GlossaryPage />
              </ProtectedRoute>
            } />
            
            {/* Admin-only routes */}
            <Route path="/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/statistics" element={
              <ProtectedRoute requiredRole="admin">
                <StatisticsPage />
              </ProtectedRoute>
            } />
            
            {/* Editor-only routes */}
            <Route path="/applications/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditApplicationPage />
              </ProtectedRoute>
            } />
            <Route path="/applications/edit/:id" element={
              <ProtectedRoute requiredRole="editor">
                <EditApplicationPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/function/new" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitFunctionPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/function/:functionId/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitFunctionPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/function/:functionId" element={
              <ProtectedRoute>
                <ToolkitFunctionDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/toolkit/:toolkitId" element={
              <ProtectedRoute>
                <ToolkitDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/toolkit/:toolkitId/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/package/new" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitPackagePage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/package/:packageId" element={
              <ProtectedRoute>
                <ToolkitPackageDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/package/:packageId/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitPackagePage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/import" element={
              <ProtectedRoute requiredRole="editor">
                <ImportToolkitPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/container/new" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitContainerPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/container/:containerId/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitContainerPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/container/:containerId" element={
              <ProtectedRoute>
                <ToolkitContainerDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/infrastructure/new" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitInfrastructurePage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/infrastructure/:infrastructureId/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitInfrastructurePage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/infrastructure/:infrastructureId" element={
              <ProtectedRoute>
                <ToolkitInfrastructureDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/policies/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditDataPolicyPage />
              </ProtectedRoute>
            } />
            <Route path="/policies/edit/:id" element={
              <ProtectedRoute requiredRole="editor">
                <EditDataPolicyPage />
              </ProtectedRoute>
            } />
            <Route path="/reference/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditReferenceDataPage currentTheme={currentTheme} />
              </ProtectedRoute>
            } />
            <Route path="/reference/:id/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditReferenceDataPage currentTheme={currentTheme} />
              </ProtectedRoute>
            } />
            <Route path="/glossary/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditGlossaryPage />
              </ProtectedRoute>
            } />
            <Route path="/glossary/:id/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditGlossaryPage />
              </ProtectedRoute>
            } />
            <Route path="/glossary/:id/markdown" element={
              <ProtectedRoute>
                <GlossaryMarkdownPage />
              </ProtectedRoute>
            } />
            <Route path="/data-products/:id/markdown" element={
              <ProtectedRoute>
                <DataProductMarkdownPage />
              </ProtectedRoute>
            } />
            <Route path="/datasets/:id/markdown" element={
              <ProtectedRoute>
                <DatasetMarkdownPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/toolkit/:toolkitId/technology/:technologyId/readme/:readmeType" element={
              <ProtectedRoute requiredRole="editor">
                <ToolkitTechnologyMarkdownPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/toolkit/:toolkitId/technology/:technologyId" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitTechnologyPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/toolkit/:toolkitId/technology/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitTechnologyPage />
              </ProtectedRoute>
            } />
            <Route path="/reference/:id" element={
              <ProtectedRoute>
                <ReferenceDataDetailPage currentTheme={currentTheme} />
              </ProtectedRoute>
            } />
            <Route 
              path="/models/:shortName" 
              element={
                <ProtectedRoute>
                  <DataModelDetailPage 
                    currentTheme={currentTheme}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/models/:shortName/edit" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <EditDataModelDetailPage 
                    currentTheme={currentTheme}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agreements/create" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <EditAgreementPage 
                    currentTheme={currentTheme}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agreements/:id" 
              element={
                <ProtectedRoute>
                  <ProductAgreementDetailPage 
                    currentTheme={currentTheme}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agreements/:id/edit" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <EditAgreementPage 
                    currentTheme={currentTheme}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rules" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <RuleBuilderPage />
                </ProtectedRoute>
              } 
            />
              </Routes>
            </Box>
          </Box>
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
          onClose={handleInfoSidebarToggle}
          currentTheme={currentTheme}
        />
        
        {/* Global Search Dialog */}
        <GlobalSearch 
          open={searchOpen} 
          onClose={() => setSearchOpen(false)} 
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
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
