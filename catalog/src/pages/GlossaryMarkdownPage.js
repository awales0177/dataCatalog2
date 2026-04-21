import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchData, updateGlossaryTerm } from '../services/api';
import { findGlossaryTerm, glossaryTermApiRef } from '../utils/catalogModelLookup';
import MarkdownEditorScreen from '../components/MarkdownEditorScreen';
import { useSyncDocumentTitle } from '../contexts/DocumentTitleContext';

const GlossaryMarkdownPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [markdown, setMarkdown] = useState('');
  const [originalMarkdown, setOriginalMarkdown] = useState('');
  const [term, setTerm] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useSyncDocumentTitle(term?.term);

  useEffect(() => {
    const loadTerm = async () => {
      try {
        const glossaryData = await fetchData('glossary');
        const terms = glossaryData.terms || [];
        const foundTerm = findGlossaryTerm(terms, id);

        if (foundTerm) {
          setTerm(foundTerm);
          const markdownContent = foundTerm.markdown || '';
          setMarkdown(markdownContent);
          setOriginalMarkdown(markdownContent);
        } else {
          setSnackbar({ open: true, message: `Glossary term with ID ${id} not found`, severity: 'error' });
          navigate('/glossary');
        }
      } catch (error) {
        console.error('Error loading glossary term:', error);
        setSnackbar({ open: true, message: 'Error loading glossary term', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadTerm();
  }, [id, navigate]);

  const hasChanges = () => markdown !== originalMarkdown;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedTerm = {
        ...term,
        markdown,
      };
      await updateGlossaryTerm(glossaryTermApiRef(term), updatedTerm);
      setSnackbar({ open: true, message: 'Markdown saved successfully', severity: 'success' });
      setOriginalMarkdown(markdown);
      setTimeout(() => {
        navigate('/glossary');
      }, 500);
    } catch (error) {
      console.error('Error saving markdown:', error);
      setSnackbar({ open: true, message: error.message || 'Error saving markdown', severity: 'error' });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/glossary');
  };

  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  return (
    <MarkdownEditorScreen
      loading={loading}
      snackbar={snackbar}
      onSnackbarClose={closeSnackbar}
      layout={{
        backButtonLabel: 'Back to Glossary',
        onBack: () => navigate('/glossary'),
        title: `Edit Markdown - ${term?.term || 'Unknown Term'}`,
        subtitle: 'Edit markdown content for this glossary term',
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

export default GlossaryMarkdownPage;
