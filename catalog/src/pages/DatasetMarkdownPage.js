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
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import datasetsData from '../data/datasets.json';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import MermaidDiagram from '../components/MermaidDiagram';

const DatasetMarkdownPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [markdown, setMarkdown] = useState('');
  const [originalMarkdown, setOriginalMarkdown] = useState('');
  const [dataset, setDataset] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadDataset = () => {
      try {
        const datasets = Array.isArray(datasetsData) ? datasetsData : [];
        const datasetId = parseInt(id);
        const foundDataset = datasets.find(d => d.id === datasetId);
        
        if (foundDataset) {
          setDataset(foundDataset);
          // Check localStorage first for saved readme, then use dataset readme or empty
          const savedReadme = localStorage.getItem(`dataset_readme_${datasetId}`);
          const markdownContent = savedReadme || foundDataset.readme || '';
          setMarkdown(markdownContent);
          setOriginalMarkdown(markdownContent);
        } else {
          setSnackbar({ open: true, message: `Dataset with ID ${id} not found`, severity: 'error' });
          navigate('/data-products');
        }
      } catch (error) {
        console.error('Error loading dataset:', error);
        setSnackbar({ open: true, message: 'Error loading dataset', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadDataset();
  }, [id, navigate]);

  const hasChanges = () => {
    return markdown !== originalMarkdown;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage to persist the readme
      const datasetId = parseInt(id);
      localStorage.setItem(`dataset_readme_${datasetId}`, markdown);
      
      setSnackbar({ open: true, message: 'Markdown saved successfully', severity: 'success' });
      setOriginalMarkdown(markdown);
      // Navigate back to the data product detail page
      setTimeout(() => {
        navigate(-1);
      }, 500);
    } catch (error) {
      console.error('Error saving markdown:', error);
      setSnackbar({ open: true, message: error.message || 'Error saving markdown', severity: 'error' });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
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

  if (!dataset) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Dataset not found
        </Alert>
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
            onClick={handleCancel}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1)
              }
            }}
          >
            Back
          </Button>
        </Box>
        
        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            Edit Markdown - {dataset.name || 'Unknown Dataset'}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            Edit markdown content for this dataset
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkEmoji]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isMermaid = match && match[1] === 'mermaid';
                  
                  if (isMermaid && !inline) {
                    const codeContent = Array.isArray(children)
                      ? children.join('')
                      : String(children);
                    return (
                      <MermaidDiagram className={className}>
                        {codeContent}
                      </MermaidDiagram>
                    );
                  }
                  
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdown || '*No content yet*'}
            </ReactMarkdown>
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

export default DatasetMarkdownPage;
