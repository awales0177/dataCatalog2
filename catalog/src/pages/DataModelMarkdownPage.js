import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Alert } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, updateModel } from '../services/api';
import { normalizeModelMarkdowns } from '../utils/modelMarkdowns';
import { findCatalogModel, modelApiRef } from '../utils/catalogModelLookup';
import MarkdownEditorScreen from '../components/MarkdownEditorScreen';
import { useSyncDocumentTitle } from '../contexts/DocumentTitleContext';

const DataModelMarkdownPage = () => {
  const { modelId: modelIdParam, tabId: tabIdParam } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [markdown, setMarkdown] = useState('');
  const [originalMarkdown, setOriginalMarkdown] = useState('');
  const [model, setModel] = useState(null);
  const [tabMeta, setTabMeta] = useState({ id: '', title: '' });
  const [showPreview, setShowPreview] = useState(false);

  const routeModelKey = modelIdParam ? decodeURIComponent(modelIdParam) : '';
  const tabId = tabIdParam ? decodeURIComponent(tabIdParam) : '';

  const docTitle =
    model?.name && tabMeta?.title
      ? `${model.name} (${tabMeta.title})`
      : model?.name;
  useSyncDocumentTitle(docTitle);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchData('models', { forceRefresh: true });
        const models = data.models || [];
        const found = findCatalogModel(models, routeModelKey);
        if (!found) {
          setSnackbar({ open: true, message: `Model "${routeModelKey}" not found`, severity: 'error' });
          navigate('/models');
          return;
        }
        const tabs = normalizeModelMarkdowns(found.markdowns);
        const tab = tabs.find((t) => t.id === tabId);
        if (!tab) {
          setSnackbar({ open: true, message: 'Documentation tab not found', severity: 'error' });
          navigate(`/models/${encodeURIComponent(modelApiRef(found))}`);
          return;
        }
        setModel(found);
        setTabMeta({ id: tab.id, title: tab.title });
        const content = tab.content || '';
        setMarkdown(content);
        setOriginalMarkdown(content);
      } catch (e) {
        console.error(e);
        setSnackbar({ open: true, message: 'Failed to load model', severity: 'error' });
        navigate('/models');
      } finally {
        setLoading(false);
      }
    };
    if (routeModelKey && tabId) load();
  }, [routeModelKey, tabId, navigate]);

  const hasChanges = () => markdown !== originalMarkdown;

  const handleSave = async () => {
    if (!model) return;
    setSaving(true);
    try {
      const tabs = normalizeModelMarkdowns(model.markdowns);
      const idx = tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) {
        throw new Error('Tab no longer exists');
      }
      const next = [...tabs];
      next[idx] = { ...next[idx], content: markdown };
      await updateModel(modelApiRef(model), { markdowns: next }, { updateAssociatedLinks: false });
      setSnackbar({ open: true, message: 'Documentation saved', severity: 'success' });
      setOriginalMarkdown(markdown);
      setTimeout(() => {
        navigate(`/models/${encodeURIComponent(modelApiRef(model))}`);
      }, 400);
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save',
        severity: 'error',
      });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (model) {
      navigate(`/models/${encodeURIComponent(modelApiRef(model))}`);
    } else {
      navigate('/models');
    }
  };

  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  return (
    <MarkdownEditorScreen
      loading={loading}
      error={!model}
      errorChildren={
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Model not found
        </Alert>
      }
      snackbar={snackbar}
      onSnackbarClose={closeSnackbar}
      layout={{
        backButtonLabel: 'Back to model',
        onBack: handleCancel,
        title: `Edit documentation — ${model?.name || model?.shortName || ''}`,
        subtitle: model ? (
          <>
            Tab: <strong style={{ color: currentTheme.text }}>{tabMeta.title || tabMeta.id}</strong>
            {' · '}
            Add or remove tabs in{' '}
            <Button
              variant="text"
              size="small"
              onClick={() => navigate(`/models/${encodeURIComponent(modelApiRef(model))}/edit`)}
              sx={{
                color: currentTheme.primary,
                textTransform: 'none',
                p: 0,
                minWidth: 0,
                verticalAlign: 'baseline',
              }}
            >
              model edit
            </Button>
            .
          </>
        ) : null,
        editorToolbarLabel: 'Markdown',
        previewToolbarLabel: 'Preview',
        showPreview,
        onTogglePreview: () => setShowPreview(!showPreview),
        markdown,
        onMarkdownChange: setMarkdown,
        placeholder: 'Enter markdown…',
        saving,
        hasChanges: hasChanges(),
        onSave: handleSave,
        onCancel: handleCancel,
        saveLabel: 'Save',
        savingLabel: 'Saving…',
      }}
    />
  );
};

export default DataModelMarkdownPage;
