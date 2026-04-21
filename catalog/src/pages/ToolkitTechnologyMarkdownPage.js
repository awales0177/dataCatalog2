import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import {
  findWorkbenchToolkit,
  findWorkbenchTechnology,
  workbenchPath,
  workbenchTechnologyPath,
} from '../utils/toolkitWorkbench';
import MarkdownEditorScreen from '../components/MarkdownEditorScreen';
import { useSyncDocumentTitle } from '../contexts/DocumentTitleContext';

const ToolkitTechnologyMarkdownPage = () => {
  const { toolkitId, technologyId, readmeType } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [markdown, setMarkdown] = useState('');
  const [originalMarkdown, setOriginalMarkdown] = useState('');
  const [technology, setTechnology] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [canonicalTkId, setCanonicalTkId] = useState(null);
  const [canonicalTechId, setCanonicalTechId] = useState(null);

  const techReadmeTitle =
    technology?.name && readmeType
      ? `${technology.name} (${decodeURIComponent(readmeType || '')})`
      : technology?.name;
  useSyncDocumentTitle(techReadmeTitle);

  useEffect(() => {
    const loadTechnology = async () => {
      try {
        const data = await fetchData('toolkit');
        const toolkits = data.toolkit?.toolkits || [];
        const resolvedTk = findWorkbenchToolkit(toolkits, toolkitId);
        const foundToolkit = resolvedTk?.toolkit ?? null;
        const tkCan = resolvedTk?.canonicalId;

        if (foundToolkit && tkCan) {
          if (String(toolkitId) !== String(tkCan)) {
            const resTech = findWorkbenchTechnology(foundToolkit, technologyId);
            if (resTech) {
              navigate(
                `${workbenchTechnologyPath(tkCan, resTech.canonicalId)}/readme/${encodeURIComponent(readmeType || '')}`,
                { replace: true },
              );
              return;
            }
          }
          const resTech = findWorkbenchTechnology(foundToolkit, technologyId);
          const foundTech = resTech?.technology ?? null;
          const techCan = resTech?.canonicalId;

          if (foundTech && techCan) {
            if (String(technologyId) !== String(techCan)) {
              navigate(
                `${workbenchTechnologyPath(tkCan, techCan)}/readme/${encodeURIComponent(readmeType || '')}`,
                { replace: true },
              );
              return;
            }
            setTechnology(foundTech);
            setCanonicalTkId(tkCan);
            setCanonicalTechId(techCan);
            const storageKey = `toolkit_${tkCan}_tech_${techCan}_${readmeType}`;
            const savedReadme = localStorage.getItem(storageKey);
            const markdownContent = savedReadme || foundTech[readmeType] || '';
            setMarkdown(markdownContent);
            setOriginalMarkdown(markdownContent);
          } else {
            setSnackbar({ open: true, message: `Technology with ID ${technologyId} not found`, severity: 'error' });
            navigate(workbenchPath(tkCan));
          }
        } else {
          setSnackbar({ open: true, message: `Toolkit with ID ${toolkitId} not found`, severity: 'error' });
          navigate('/toolkit');
        }
      } catch (error) {
        console.error('Error loading technology:', error);
        setSnackbar({ open: true, message: 'Error loading technology', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadTechnology();
  }, [toolkitId, technologyId, readmeType, navigate]);

  const hasChanges = () => markdown !== originalMarkdown;

  const handleSave = async () => {
    setSaving(true);
    try {
      const tkRef = canonicalTkId || toolkitId;
      const techRef = canonicalTechId || technologyId;
      const storageKey = `toolkit_${tkRef}_tech_${techRef}_${readmeType}`;
      localStorage.setItem(storageKey, markdown);

      setSnackbar({ open: true, message: 'README saved successfully!', severity: 'success' });
      setOriginalMarkdown(markdown);
      setTimeout(() => {
        navigate(workbenchPath(tkRef));
      }, 500);
    } catch (error) {
      console.error('Error saving markdown:', error);
      setSnackbar({ open: true, message: error.message || 'Error saving markdown', severity: 'error' });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(workbenchPath(canonicalTkId || toolkitId));
  };

  const getReadmeTypeLabel = () => {
    return readmeType ? readmeType.charAt(0).toUpperCase() + readmeType.slice(1) : 'README';
  };

  const readmeLabel = getReadmeTypeLabel();
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  return (
    <MarkdownEditorScreen
      loading={loading}
      error={!technology}
      errorChildren={
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Technology not found
        </Alert>
      }
      snackbar={snackbar}
      onSnackbarClose={closeSnackbar}
      layout={{
        backButtonLabel: 'Back to Toolkit',
        onBack: handleCancel,
        title: `Edit ${readmeLabel} - ${technology?.name || 'Unknown Technology'}`,
        subtitle: `Edit ${readmeLabel.toLowerCase()} markdown content for this technology`,
        showPreview,
        onTogglePreview: () => setShowPreview(!showPreview),
        markdown,
        onMarkdownChange: setMarkdown,
        placeholder: 'Enter markdown content here...',
        saving,
        hasChanges: hasChanges(),
        onSave: handleSave,
        onCancel: handleCancel,
        saveLabel: 'Save',
        savingLabel: 'Saving...',
      }}
    />
  );
};

export default ToolkitTechnologyMarkdownPage;
