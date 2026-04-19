import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ToolkitLegacyWorkbenchRedirect from './routes/ToolkitLegacyWorkbenchRedirect';
import {
  Box,
  CssBaseline,
  CircularProgress,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import components
import DataModelsPage from './pages/DataModelsPage';
import ProductAgreementsPage from './pages/ProductAgreementsPage';
import DataDomainsPage from './pages/DataDomainsPage';
import HomePage from './pages/HomePage';
import WorkspacesPage from './pages/WorkspacesPage';
import ApplicationsPage from './pages/ApplicationsPage';
import EditApplicationPage from './pages/EditApplicationPage';
import DataModelDetailPage from './pages/DataModelDetailPage';
import GlossaryPage from './pages/GlossaryPage';
import EditGlossaryPage from './pages/EditGlossaryPage';
import GlossaryMarkdownPage from './pages/GlossaryMarkdownPage';
import ToolkitTechnologyMarkdownPage from './pages/ToolkitTechnologyMarkdownPage';
import EditToolkitTechnologyPage from './pages/EditToolkitTechnologyPage';
import EditToolkitPage from './pages/EditToolkitPage';
import EditDataModelDetailPage from './pages/EditDataModelDetailPage';
import DataModelMarkdownPage from './pages/DataModelMarkdownPage';
import ProductAgreementDetailPage from './pages/ProductAgreementDetailPage';
import EditAgreementPage from './pages/EditAgreementPage';
import ToolkitPage from './pages/ToolkitPage';
import ToolkitFunctionDetailPage from './pages/ToolkitFunctionDetailPage';
import ToolkitSopDetailPage from './pages/ToolkitSopDetailPage';
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
import SettingsPage from './pages/SettingsPage';
import RuleBuilderPage from './pages/RuleBuilderPage';
import NavigationDrawer from './components/NavigationDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalSearch from './components/GlobalSearch';
import MainGlassHeader from './components/MainGlassHeader';
import InfoSidebar from './components/InfoSidebar';

// Import theme and hooks
import { theme, addGoogleFonts } from './theme/theme';
import { catalogMuiCardOverrides } from './theme/catalogSurfaces';
import { useAppState } from './hooks/useAppState';
import { getRandomColor } from './utils/common';
import {
  collapsedDrawerWidth,
  drawerWidth,
  sidebarFloatInset,
  sidebarContentGap,
} from './constants/navigation';
import { ThemeContext } from './contexts/ThemeContext';
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
      },
      components: {
        ...catalogMuiCardOverrides(),
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
    <ThemeContext.Provider value={{ currentTheme, darkMode, setDarkMode: () => {} }}>
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
          <Routes>
            <Route path="/role" element={<RolePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/workspaces" element={
              <ProtectedRoute>
                <WorkspacesPage />
              </ProtectedRoute>
            } />
            <Route path="/workbench/query" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/workbench/modeling" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/workbench/studio" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/workbench/rule-builder" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/workbench/reference-data" element={
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
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
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
            <Route path="/toolkit/sop/:sopId" element={
              <ProtectedRoute>
                <ToolkitSopDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/workbench/:toolkitId/*" element={<ToolkitLegacyWorkbenchRedirect />} />
            <Route path="/toolkit/toolkit/:toolkitId/*" element={<ToolkitLegacyWorkbenchRedirect />} />
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
            <Route path="/toolkit/:toolkitId/technology/:technologyId/readme/:readmeType" element={
              <ProtectedRoute requiredRole="editor">
                <ToolkitTechnologyMarkdownPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/:toolkitId/technology/:technologyId" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitTechnologyPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/:toolkitId/technology/create" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitTechnologyPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/:toolkitId/edit" element={
              <ProtectedRoute requiredRole="editor">
                <EditToolkitPage />
              </ProtectedRoute>
            } />
            <Route path="/toolkit/:toolkitId" element={
              <ProtectedRoute>
                <ToolkitDetailPage />
              </ProtectedRoute>
            } />
            <Route 
              path="/models/:modelId" 
              element={
                <ProtectedRoute>
                  <DataModelDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/models/:modelId/edit" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <EditDataModelDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/models/:modelId/markdown/:tabId"
              element={
                <ProtectedRoute requiredRole="editor">
                  <DataModelMarkdownPage />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/agreements/create" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <EditAgreementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agreements/:id" 
              element={
                <ProtectedRoute>
                  <ProductAgreementDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/agreements/:id/edit" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <EditAgreementPage />
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
