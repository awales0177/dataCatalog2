import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  IconButton,
  Button,
  Fab,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Tooltip,
  Collapse,
  alpha,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MenuBook as MenuBookIcon,
  Description as DescriptionIcon,
  Cancel as CancelIcon,
  DataObject as DataObjectIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import MermaidDiagram from '../components/MermaidDiagram';
import GlossaryCard from '../components/GlossaryCard';

const GlossaryPage = () => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const { canCreate } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [selectedModelFilter, setSelectedModelFilter] = useState(null);
  const [dataModels, setDataModels] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expandedTerms, setExpandedTerms] = useState(new Set());
  const [selectedTerm, setSelectedTerm] = useState(null);

  useEffect(() => {
    const loadGlossary = async () => {
      try {
        const data = await fetchData('glossary');
        setOriginalData(data.terms || []);
        setError(null);
      } catch (err) {
        setError('Failed to load glossary');
        setOriginalData([]);
      } finally {
        setLoading(false);
      }
    };

    const loadModels = async () => {
      try {
        const modelsData = await fetchData('models');
        setDataModels(modelsData.models || []);
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    };

    loadGlossary();
    loadModels();
  }, []);

  // Update search query when URL parameter changes
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams, searchQuery]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = new Set();
    originalData.forEach(term => {
      if (term.category) {
        categories.add(term.category);
      }
    });
    return Array.from(categories).sort();
  }, [originalData]);

  // Get filter options
  const getFilterOptions = () => {
    const categories = new Set();
    const models = new Set();

    originalData.forEach(term => {
      if (term.category) categories.add(term.category);
      if (term.taggedModels) {
        term.taggedModels.forEach(modelShortName => models.add(modelShortName));
      }
    });

    return {
      categories: Array.from(categories).sort(),
      models: Array.from(models).sort().map(shortName => {
        const model = dataModels.find(m => m.shortName === shortName);
        return {
          shortName,
          name: model ? model.name : shortName
        };
      })
    };
  };

  // Filter and search data
  useEffect(() => {
    let filtered = [...originalData];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(term =>
        (term.term?.toLowerCase().includes(query)) ||
        (term.definition?.toLowerCase().includes(query)) ||
        (term.category?.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategoryFilter) {
      filtered = filtered.filter(term => term.category === selectedCategoryFilter);
    }

    // Model filter
    if (selectedModelFilter) {
      filtered = filtered.filter(term =>
        term.taggedModels?.includes(selectedModelFilter)
      );
    }

    setFilteredData(filtered);
  }, [searchQuery, selectedCategoryFilter, selectedModelFilter, originalData, dataModels]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter(null);
    setSelectedModelFilter(null);
  };

  const hasActiveFilters = searchQuery || selectedCategoryFilter || selectedModelFilter;

  const toggleTermExpansion = (termId) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
  };

  const handleTermClick = (term) => {
    setSelectedTerm(term);
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error && originalData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
            {error}
          </Alert>
        </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      width: '100%',
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2, 
      p: 2, 
      overflow: 'hidden',
      minHeight: 0,
      boxSizing: 'border-box',
      position: 'relative',
    }}>
      {/* Header */}
      <Box sx={{ flexShrink: 0 }}>
        <Typography variant="h4" sx={{ color: currentTheme.text, mb: 0.5 }}>
          Glossary
        </Typography>
        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
          Browse and search glossary terms, definitions, and documentation
        </Typography>
      </Box>

      {/* Top Pane: Search and Filters */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          p: 2,
          borderRadius: 3,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search terms, definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: currentTheme.textSecondary }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    sx={{ color: currentTheme.textSecondary }}
                  >
                    ×
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: currentTheme.background,
                '& fieldset': {
                  borderColor: currentTheme.border
                },
                '&:hover fieldset': {
                  borderColor: currentTheme.primary
                },
                '&.Mui-focused fieldset': {
                  borderColor: currentTheme.primary
                }
              },
              '& .MuiInputBase-input': {
                color: currentTheme.text
              },
              '& .MuiInputBase-input::placeholder': {
                color: currentTheme.textSecondary,
                opacity: 1
              }
            }}
          />

          {/* Filter Controls */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Autocomplete
              options={getFilterOptions().categories}
              value={selectedCategoryFilter}
              onChange={(event, newValue) => setSelectedCategoryFilter(newValue)}
              sx={{ minWidth: 180, flex: 1 }}
              size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Filter by Category"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: currentTheme.card,
                    '& fieldset': {
                      borderColor: currentTheme.border
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme.primary
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: currentTheme.text
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: currentTheme.textSecondary,
                    opacity: 1
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ color: currentTheme.text }}>
                <MenuBookIcon sx={{ mr: 1, fontSize: 18, color: currentTheme.textSecondary }} />
                {option}
              </Box>
            )}
            PaperComponent={({ children, ...other }) => (
              <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                {children}
              </Paper>
            )}
          />
            <Autocomplete
              options={getFilterOptions().models}
              getOptionLabel={(option) => option.name}
              value={selectedModelFilter ? getFilterOptions().models.find(m => m.shortName === selectedModelFilter) : null}
              onChange={(event, newValue) => setSelectedModelFilter(newValue ? newValue.shortName : null)}
              sx={{ minWidth: 180, flex: 1 }}
              size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Filter by Model"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: currentTheme.card,
                    '& fieldset': {
                      borderColor: currentTheme.border
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme.primary
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: currentTheme.text
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: currentTheme.textSecondary,
                    opacity: 1
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ color: currentTheme.text }}>
                <DataObjectIcon sx={{ mr: 1, fontSize: 18, color: currentTheme.textSecondary }} />
                {option.name} ({option.shortName})
              </Box>
            )}
            PaperComponent={({ children, ...other }) => (
              <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                {children}
              </Paper>
            )}
          />

            {/* Active Filter Chips and Count */}
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
              {hasActiveFilters && (
                <>
                  {selectedCategoryFilter && (
                    <Chip
                      icon={<MenuBookIcon sx={{ fontSize: 16 }} />}
                      label={selectedCategoryFilter}
                      onDelete={() => setSelectedCategoryFilter(null)}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                        color: currentTheme.text,
                        '& .MuiChip-deleteIcon': {
                          color: currentTheme.textSecondary,
                          fontSize: 16,
                        }
                      }}
                    />
                  )}
                  {selectedModelFilter && (
                    <Chip
                      icon={<DataObjectIcon sx={{ fontSize: 16 }} />}
                      label={getFilterOptions().models.find(m => m.shortName === selectedModelFilter)?.name || selectedModelFilter}
                      onDelete={() => setSelectedModelFilter(null)}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                        color: currentTheme.text,
                        '& .MuiChip-deleteIcon': {
                          color: currentTheme.textSecondary,
                          fontSize: 16,
                        }
                      }}
                    />
                  )}
                  <Button
                    size="small"
                    onClick={clearAllFilters}
                    sx={{ 
                      color: currentTheme.textSecondary,
                      minWidth: 'auto',
                      px: 1,
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  >
                    Clear
                  </Button>
                </>
              )}
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, ml: 'auto', fontSize: '0.75rem' }}>
                {filteredData.length} {filteredData.length === 1 ? 'term' : 'terms'}
                {hasActiveFilters && ` of ${originalData.length}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Bottom 2-Pane Layout */}
      <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden', minHeight: 0, flexShrink: 1, height: 0 }}>
        {/* Left Pane: Cards */}
        <Grid item xs={12} md={5} sx={{ 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          height: '100%',
        }}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              minHeight: 0,
              height: '100%',
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}`, flexShrink: 0 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text }}>
                Terms
              </Typography>
            </Box>
            <Box sx={{ 
              p: 2, 
              overflowY: 'auto', 
              overflowX: 'hidden',
              flex: 1, 
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                },
              },
            }}>

            {loading && filteredData.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredData.length === 0 ? (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, textAlign: 'center', p: 3 }}>
                {hasActiveFilters ? 'No terms found matching your filters' : 'No glossary terms available yet. Create your first term!'}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {filteredData.map((term) => (
                  <Grid item xs={12} key={term.id || term.term}>
                    <Box
                      onClick={() => handleTermClick(term)}
                      sx={{
                        cursor: 'pointer',
                        '& .MuiCard-root': {
                          border: selectedTerm?.id === term.id ? `2px solid ${currentTheme.primary}` : `1px solid ${currentTheme.border}`,
                          transition: 'all 0.2s ease-in-out',
                        }
                      }}
                    >
                      <GlossaryCard term={term} currentTheme={currentTheme} dataModels={dataModels} canEdit={canCreate} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Pane: README */}
        <Grid item xs={12} md={7} sx={{ 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          height: '100%',
        }}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              minHeight: 0,
              height: '100%',
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text }}>
                README
              </Typography>
              {selectedTerm && (
                <Tooltip title="Edit Markdown">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/glossary/${selectedTerm.id}/markdown`)}
                    sx={{
                      color: currentTheme.textSecondary,
                      '&:hover': {
                        color: currentTheme.primary,
                      }
                    }}
                  >
                    <CodeIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{ 
              p: 3, 
              overflowY: 'auto', 
              overflowX: 'hidden',
              flex: 1, 
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                },
              },
            }}>

            {selectedTerm ? (
              <Box
                sx={{
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
                {selectedTerm.markdown ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkEmoji]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isMermaid = match && match[1] === 'mermaid';
                        
                        if (isMermaid && !inline) {
                          // Convert children to string properly
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
                    {selectedTerm.markdown}
                  </ReactMarkdown>
                ) : (
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                    No markdown content available for this term. Click the code icon to add markdown.
                  </Typography>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: currentTheme.textSecondary,
                }}
              >
                <MenuBookIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" sx={{ textAlign: 'center' }}>
                  Select a term to view its markdown content
                </Typography>
              </Box>
            )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {canCreate && (
        <Fab
          color="primary"
          aria-label="add glossary term"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: currentTheme.primary,
            color: '#fff',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: currentTheme.primary,
              opacity: 0.9,
              transform: 'scale(1.05)'
            },
            transition: 'transform 0.2s, opacity 0.2s',
            zIndex: 1000
          }}
          onClick={() => navigate('/glossary/create')}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GlossaryPage;
