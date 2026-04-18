import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AgoraModal } from '../pages/agora';
import { ModelingModal } from '../pages/modeling';
import { RuleBuilderModal } from '../pages/rulebuilder';
import ReferenceDataHubModal from '../components/ReferenceDataHubModal';

const WorkbenchModalsContext = createContext(null);

export function WorkbenchModalsProvider({ children, currentTheme, darkMode }) {
  const [agoraOpen, setAgoraOpen] = useState(false);
  const [modelingOpen, setModelingOpen] = useState(false);
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false);
  const [referenceHubOpen, setReferenceHubOpen] = useState(false);

  const splitAgoraAndModeling = Boolean(agoraOpen && modelingOpen);

  const openAgora = useCallback(() => {
    setAgoraOpen(true);
  }, []);

  const openModeling = useCallback(() => {
    setModelingOpen(true);
  }, []);

  const openStudio = useCallback(() => {
    setAgoraOpen(true);
    setModelingOpen(true);
  }, []);

  const openRuleBuilder = useCallback(() => {
    setRuleBuilderOpen(true);
  }, []);

  const openReferenceHub = useCallback(() => {
    setReferenceHubOpen(true);
  }, []);

  const closeAgora = useCallback(() => {
    setAgoraOpen(false);
  }, []);

  const closeModeling = useCallback(() => {
    setModelingOpen(false);
  }, []);

  const closeRuleBuilder = useCallback(() => {
    setRuleBuilderOpen(false);
  }, []);

  const closeReferenceHub = useCallback(() => {
    setReferenceHubOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      agoraOpen,
      modelingOpen,
      ruleBuilderOpen,
      referenceHubOpen,
      openAgora,
      openModeling,
      openStudio,
      openRuleBuilder,
      openReferenceHub,
      closeAgora,
      closeModeling,
      closeRuleBuilder,
      closeReferenceHub,
    }),
    [
      agoraOpen,
      modelingOpen,
      ruleBuilderOpen,
      referenceHubOpen,
      openAgora,
      openModeling,
      openStudio,
      openRuleBuilder,
      openReferenceHub,
      closeAgora,
      closeModeling,
      closeRuleBuilder,
      closeReferenceHub,
    ],
  );

  return (
    <WorkbenchModalsContext.Provider value={value}>
      {children}
      <AgoraModal
        open={agoraOpen}
        onClose={closeAgora}
        currentTheme={currentTheme}
        darkMode={darkMode}
        splitMode={splitAgoraAndModeling}
        onOpenModeling={openModeling}
        modelingOpen={modelingOpen}
      />
      <ModelingModal
        open={modelingOpen}
        onClose={closeModeling}
        currentTheme={currentTheme}
        darkMode={darkMode}
        splitMode={splitAgoraAndModeling}
        onOpenAgora={openAgora}
        agoraOpen={agoraOpen}
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
