import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ProtectedRoute from '../components/ProtectedRoute';
import PoliciesToStandardsRedirect from './PoliciesToStandardsRedirect';

const HomePage = lazy(() => import('../pages/HomePage'));
const DataModelsPage = lazy(() => import('../pages/DataModelsPage'));
const ProductAgreementsPage = lazy(() => import('../pages/ProductAgreementsPage'));
const DataDomainsPage = lazy(() => import('../pages/DataDomainsPage'));
const WorkspacesPage = lazy(() => import('../pages/WorkspacesPage'));
const ApplicationsPage = lazy(() => import('../pages/ApplicationsPage'));
const EditApplicationPage = lazy(() => import('../pages/EditApplicationPage'));
const DataModelDetailPage = lazy(() => import('../pages/DataModelDetailPage'));
const GlossaryPage = lazy(() => import('../pages/GlossaryPage'));
const EditGlossaryPage = lazy(() => import('../pages/EditGlossaryPage'));
const GlossaryMarkdownPage = lazy(() => import('../pages/GlossaryMarkdownPage'));
const ToolkitTechnologyMarkdownPage = lazy(() => import('../pages/ToolkitTechnologyMarkdownPage'));
const EditToolkitTechnologyPage = lazy(() => import('../pages/EditToolkitTechnologyPage'));
const EditToolkitPage = lazy(() => import('../pages/EditToolkitPage'));
const EditDataModelDetailPage = lazy(() => import('../pages/EditDataModelDetailPage'));
const DataModelMarkdownPage = lazy(() => import('../pages/DataModelMarkdownPage'));
const ProductAgreementDetailPage = lazy(() => import('../pages/ProductAgreementDetailPage'));
const EditAgreementPage = lazy(() => import('../pages/EditAgreementPage'));
const ToolkitPage = lazy(() => import('../pages/ToolkitPage'));
const ToolkitFunctionDetailPage = lazy(() => import('../pages/ToolkitFunctionDetailPage'));
const ToolkitSopDetailPage = lazy(() => import('../pages/ToolkitSopDetailPage'));
const ToolkitDetailPage = lazy(() => import('../pages/ToolkitDetailPage'));
const ToolkitPackageDetailPage = lazy(() => import('../pages/ToolkitPackageDetailPage'));
const ToolkitContainerDetailPage = lazy(() => import('../pages/ToolkitContainerDetailPage'));
const ToolkitInfrastructureDetailPage = lazy(() => import('../pages/ToolkitInfrastructureDetailPage'));
const EditToolkitFunctionPage = lazy(() => import('../pages/EditToolkitFunctionPage'));
const EditToolkitPackagePage = lazy(() => import('../pages/EditToolkitPackagePage'));
const EditToolkitContainerPage = lazy(() => import('../pages/EditToolkitContainerPage'));
const EditToolkitInfrastructurePage = lazy(() => import('../pages/EditToolkitInfrastructurePage'));
const ImportToolkitPage = lazy(() => import('../pages/ImportToolkitPage'));
const DataPoliciesPage = lazy(() => import('../pages/DataPoliciesPage'));
const EditDataPolicyPage = lazy(() => import('../pages/EditDataPolicyPage'));
const RolePage = lazy(() => import('../pages/RolePage'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const UserManagementPage = lazy(() => import('../pages/UserManagementPage'));
const StatisticsPage = lazy(() => import('../pages/StatisticsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const RuleBuilderPage = lazy(() => import('../pages/RuleBuilderPage'));
const ToolkitLegacyWorkbenchRedirect = lazy(() => import('./ToolkitLegacyWorkbenchRedirect'));

export default function AppRoutes() {
  const theme = useTheme();

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '45vh',
            width: '100%',
            py: 6,
          }}
        >
          <CircularProgress sx={{ color: theme.palette.primary.main }} />
        </Box>
      }
    >
      <Routes>
        <Route path="/role" element={<RolePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces"
          element={
            <ProtectedRoute>
              <WorkspacesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workbench/query"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workbench/modeling"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workbench/studio"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workbench/rule-builder"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workbench/reference-data"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/models"
          element={
            <ProtectedRoute>
              <DataModelsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agreements"
          element={
            <ProtectedRoute>
              <ProductAgreementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/domains"
          element={
            <ProtectedRoute>
              <DataDomainsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit"
          element={
            <ProtectedRoute>
              <ToolkitPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/standards"
          element={
            <ProtectedRoute>
              <DataPoliciesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/glossary"
          element={
            <ProtectedRoute>
              <GlossaryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute requiredRole="admin">
              <StatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications/create"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditApplicationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/edit/:id"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditApplicationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/function/new"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitFunctionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/function/:functionId/edit"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitFunctionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/function/:functionId"
          element={
            <ProtectedRoute>
              <ToolkitFunctionDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/sop/:sopId"
          element={
            <ProtectedRoute>
              <ToolkitSopDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/create"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitPage />
            </ProtectedRoute>
          }
        />
        <Route path="/toolkit/workbench/:toolkitId/*" element={<ToolkitLegacyWorkbenchRedirect />} />
        <Route path="/toolkit/toolkit/:toolkitId/*" element={<ToolkitLegacyWorkbenchRedirect />} />
        <Route
          path="/toolkit/package/new"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitPackagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/package/:packageId"
          element={
            <ProtectedRoute>
              <ToolkitPackageDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/package/:packageId/edit"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitPackagePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/import"
          element={
            <ProtectedRoute requiredRole="editor">
              <ImportToolkitPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/container/new"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitContainerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/container/:containerId/edit"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitContainerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/container/:containerId"
          element={
            <ProtectedRoute>
              <ToolkitContainerDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/infrastructure/new"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitInfrastructurePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/infrastructure/:infrastructureId/edit"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitInfrastructurePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/infrastructure/:infrastructureId"
          element={
            <ProtectedRoute>
              <ToolkitInfrastructureDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/standards/create"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditDataPolicyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/standards/edit/:id"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditDataPolicyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/policies/*" element={<PoliciesToStandardsRedirect />} />
        <Route
          path="/glossary/create"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditGlossaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/glossary/:id/edit"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditGlossaryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/glossary/:id/markdown"
          element={
            <ProtectedRoute>
              <GlossaryMarkdownPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/:toolkitId/technology/:technologyId/readme/:readmeType"
          element={
            <ProtectedRoute requiredRole="editor">
              <ToolkitTechnologyMarkdownPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/:toolkitId/technology/:technologyId/edit"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitTechnologyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/:toolkitId/technology/create"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitTechnologyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/:toolkitId/technology/:technologyId"
          element={
            <ProtectedRoute>
              <ToolkitDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/:toolkitId/edit"
          element={
            <ProtectedRoute requiredRole="editor">
              <EditToolkitPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/toolkit/:toolkitId"
          element={
            <ProtectedRoute>
              <ToolkitDetailPage />
            </ProtectedRoute>
          }
        />
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
    </Suspense>
  );
}
