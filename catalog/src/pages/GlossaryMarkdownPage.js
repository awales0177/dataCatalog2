import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  alpha,
  Grid,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, updateGlossaryTerm } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';

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
        const foundTerm = terms.find(t => t.id === id);
        
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

  const hasChanges = () => {
    return markdown !== originalMarkdown;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedTerm = {
        ...term,
        markdown: markdown
      };
      await updateGlossaryTerm(term.id, updatedTerm);
      setSnackbar({ open: true, message: 'Markdown saved successfully', severity: 'success' });
      setOriginalMarkdown(markdown);
      // Navigate back to glossary after a short delay to show success message
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/glossary')}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1)
              }
            }}
          >
            Back to Glossary
          </Button>
        </Box>
        
        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            Edit Markdown - {term?.term || 'Unknown Term'}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            Edit markdown content for this glossary term
          </Typography>
        </Box>
      </Box>

      {/* Editor */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: currentTheme.text }}>
            {showPreview ? 'Preview' : 'Markdown Editor'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => setShowPreview(!showPreview)}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1)
              }
            }}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
        </Box>

        {showPreview ? (
          <Box
            sx={{
              minHeight: '400px',
              p: 3,
              bgcolor: currentTheme.background,
              borderRadius: 1,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: currentTheme.text,
                marginTop: 2,
                marginBottom: 1,
              },
              '& p': {
                color: currentTheme.textSecondary,
                marginBottom: 1.5,
              },
              '& code': {
                bgcolor: darkMode ? alpha(currentTheme.primary, 0.2) : alpha(currentTheme.primary, 0.1),
                color: darkMode ? '#a5d6ff' : currentTheme.primary,
                padding: '2px 6px',
                borderRadius: 1,
                fontSize: '0.9em',
                fontFamily: 'monospace',
              },
              '& pre': {
                bgcolor: darkMode ? '#1e1e1e' : currentTheme.card,
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                border: `1px solid ${currentTheme.border}`,
                '& code': {
                  bgcolor: 'transparent',
                  padding: 0,
                  color: darkMode ? '#d4d4d4' : currentTheme.text,
                }
              },
              '& ul, & ol': {
                color: currentTheme.textSecondary,
                paddingLeft: 3,
              },
              '& a': {
                color: currentTheme.primary,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                }
              },
              '& blockquote': {
                borderLeft: `4px solid ${currentTheme.primary}`,
                paddingLeft: 2,
                marginLeft: 0,
                color: currentTheme.textSecondary,
                fontStyle: 'italic',
                bgcolor: darkMode ? alpha(currentTheme.primary, 0.05) : 'transparent',
                padding: 1,
                borderRadius: '0 4px 4px 0',
              },
              '& hr': {
                borderColor: currentTheme.border,
                borderWidth: '1px 0 0 0',
                marginTop: 2,
                marginBottom: 2,
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
                border: `1px solid ${currentTheme.border}`,
              },
              '& strong': {
                color: currentTheme.text,
                fontWeight: 600,
              },
              '& em': {
                color: currentTheme.textSecondary,
                fontStyle: 'italic',
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: 2,
                marginBottom: 2,
                display: 'table',
                border: `1px solid ${currentTheme.border}`,
                borderRadius: 1,
                overflow: 'hidden',
              },
              '& thead': {
                display: 'table-header-group',
              },
              '& tbody': {
                display: 'table-row-group',
              },
              '& tr': {
                display: 'table-row',
                borderBottom: `1px solid ${currentTheme.border}`,
                '&:last-child': {
                  borderBottom: 'none',
                },
              },
              '& th, & td': {
                display: 'table-cell',
                border: `1px solid ${currentTheme.border}`,
                padding: 1.5,
                textAlign: 'left',
                verticalAlign: 'top',
              },
              '& th': {
                bgcolor: darkMode ? alpha(currentTheme.primary, 0.2) : alpha(currentTheme.primary, 0.1),
                fontWeight: 600,
                color: currentTheme.text,
              },
              '& td': {
                color: currentTheme.textSecondary,
                bgcolor: darkMode ? alpha(currentTheme.background, 0.5) : 'transparent',
              },
              '& tr:nth-of-type(even) td': {
                bgcolor: darkMode ? alpha(currentTheme.background, 0.3) : alpha(currentTheme.primary, 0.02),
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkEmoji]}>{markdown || '*No content yet*'}</ReactMarkdown>
          </Box>
        ) : (
          <TextField
            fullWidth
            multiline
            rows={20}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Enter markdown content here..."
            sx={{
              '& .MuiOutlinedInput-root': {
                color: currentTheme.text,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                '& fieldset': { borderColor: currentTheme.border },
                '&:hover fieldset': { borderColor: currentTheme.primary },
                '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
              },
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
              },
            }}
          />
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: `1px solid ${currentTheme.border}` }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={saving}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1)
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              '&:hover': {
                bgcolor: currentTheme.primaryHover || currentTheme.primary,
              },
              '&:disabled': {
                bgcolor: alpha(currentTheme.primary, 0.3),
              }
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar */}
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
    </Container>
  );
};

export default GlossaryMarkdownPage;

