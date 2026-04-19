import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QueryModal } from '../pages/query';
import { ModelingModal } from '../pages/modeling';
import { RuleBuilderModal } from '../pages/rulebuilder';
import ReferenceDataHubModal from '../components/ReferenceDataHubModal';
import {
  WORKBENCH_PATHS,
  buildWorkbenchEnterState,
  getWorkbenchExitPath,
  workbenchModalFlagsFromPath,
} from '../constants/workbenchPaths';
import { ThemeContext } from './ThemeContext';

const WorkbenchModalsContext = createContext(null);

export function WorkbenchModalsProvider({ children }) {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [queryOpen, setQueryOpen] = useState(false);
  const [modelingOpen, setModelingOpen] = useState(false);
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);
  const [referenceHubOpen, setReferenceHubOpen] = useState(false);

  useLayoutEffect(() => {
    const flags = workbenchModalFlagsFromPath(location.pathname);
    setQueryOpen(flags.queryOpen);
    setModelingOpen(flags.modelingOpen);
    setRuleBuilderOpen(flags.ruleBuilderOpen);
    setReferenceHubOpen(flags.referenceHubOpen);
  }, [location.pathname]);

  const splitQueryAndModeling = Boolean(queryOpen && modelingOpen);

  const openQuery = useCallback(() => {
    if (location.pathname === WORKBENCH_PATHS.query) return;
    navigate(WORKBENCH_PATHS.query, { state: buildWorkbenchEnterState(location) });
  }, [navigate, location]);

  const openModeling = useCallback(() => {
    if (location.pathname === WORKBENCH_PATHS.modeling) return;
    navigate(WORKBENCH_PATHS.modeling, { state: buildWorkbenchEnterState(location) });
  }, [navigate, location]);

  const openStudio = useCallback(() => {
    if (location.pathname === WORKBENCH_PATHS.studio) return;
    navigate(WORKBENCH_PATHS.studio, { state: buildWorkbenchEnterState(location) });
  }, [navigate, location]);

  const openRuleBuilder = useCallback(() => {
    if (location.pathname === WORKBENCH_PATHS.ruleBuilder) return;
    navigate(WORKBENCH_PATHS.ruleBuilder, { state: buildWorkbenchEnterState(location) });
  }, [navigate, location]);

  const openReferenceHub = useCallback(() => {
    if (location.pathname === WORKBENCH_PATHS.referenceData) return;
    navigate(WORKBENCH_PATHS.referenceData, { state: buildWorkbenchEnterState(location) });
  }, [navigate, location]);

  const closeQuery = useCallback(() => {
    if (location.pathname === WORKBENCH_PATHS.studio) {
      navigate(WORKBENCH_PATHS.modeling, { replace: true, state: location.state });
      return;
    }
    navigate(getWorkbenchExitPath(location), { replace: true });
  }, [location, navigate]);

  const closeModeling = useCallback(() => {
    if (location.pathname === WORKBENCH_PATHS.studio) {
      navigate(WORKBENCH_PATHS.query, { replace: true, state: location.state });
      return;
    }
    navigate(getWorkbenchExitPath(location), { replace: true });
  }, [location, navigate]);

  const closeRuleBuilder = useCallback(() => {
    navigate(getWorkbenchExitPath(location), { replace: true });
  }, [location, navigate]);

  const closeReferenceHub = useCallback(() => {
    navigate(getWorkbenchExitPath(location), { replace: true });
  }, [location, navigate]);

  const value = useMemo(
    () => ({
      queryOpen,
      modelingOpen,
      ruleBuilderOpen,
      referenceHubOpen,
      openQuery,
      openModeling,
      openStudio,
      openRuleBuilder,
      openReferenceHub,
      closeQuery,
      closeModeling,
      closeRuleBuilder,
      closeReferenceHub,
    }),
    [
      queryOpen,
      modelingOpen,
      ruleBuilderOpen,
      referenceHubOpen,
      openQuery,
      openModeling,
      openStudio,
      openRuleBuilder,
      openReferenceHub,
      closeQuery,
      closeModeling,
      closeRuleBuilder,
      closeReferenceHub,
    ],
  );

  return (
    <WorkbenchModalsContext.Provider value={value}>
      {children}
      <QueryModal
        open={queryOpen}
        onClose={closeQuery}
        currentTheme={currentTheme}
        darkMode={darkMode}
        splitMode={splitQueryAndModeling}
        onOpenModeling={openStudio}
        modelingOpen={modelingOpen}
      />
      <ModelingModal
        open={modelingOpen}
        onClose={closeModeling}
        currentTheme={currentTheme}
        darkMode={darkMode}
        splitMode={splitQueryAndModeling}
        onOpenQuery={openStudio}
        queryOpen={queryOpen}
      />
      <RuleBuilderModal
        open={Boolean(ruleBuilderOpen)}
        onClose={closeRuleBuilder}
        currentTheme={currentTheme}
        darkMode={darkMode}
      />
      <ReferenceDataHubModal open={referenceHubOpen} onClose={closeReferenceHub} />
    </WorkbenchModalsContext.Provider>
  );
}

export function useWorkbenchModals() {
  const ctx = useContext(WorkbenchModalsContext);
  if (!ctx) {
    throw new Error('useWorkbenchModals must be used within WorkbenchModalsProvider');
  }
  return ctx;
}
