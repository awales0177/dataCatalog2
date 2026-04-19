import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, CircularProgress, Snackbar, Alert } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, updateGlossaryTerm } from '../services/api';
import { findGlossaryTerm, glossaryTermApiRef } from '../utils/catalogModelLookup';
import MarkdownEditorLayout from '../components/MarkdownEditorLayout';

const GlossaryMarkdownPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [markdown, setMarkdown] = useState('');
  const [originalMarkdown, setOriginalMarkdown] = useState('');
  const [term, setTerm] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress sx={{ color: currentTheme.primary }} />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <MarkdownEditorLayout
        currentTheme={currentTheme}
        darkMode={darkMode}
        backButtonLabel="Back to Glossary"
        onBack={() => navigate('/glossary')}
        title={`Edit Markdown - ${term?.term || 'Unknown Term'}`}
        subtitle="Edit markdown content for this glossary term"
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        markdown={markdown}
        onMarkdownChange={setMarkdown}
        placeholder="Enter markdown content here..."
        saving={saving}
        hasChanges={hasChanges()}
        onSave={handleSave}
        onCancel={handleCancel}
        saveLabel="Save"
        savingLabel="Saving..."
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', bgcolor: currentTheme.card, color: currentTheme.text }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GlossaryMarkdownPage;
