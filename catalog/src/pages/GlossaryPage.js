import React, { useState, useContext, useEffect, useMemo } from 'react';
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
  Grid,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MenuBook as MenuBookIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon,
  Cancel as CancelIcon,
  DataObject as DataObjectIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GlossaryPage = () => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const { canCreate } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
  const [selectedModelFilter, setSelectedModelFilter] = useState(null);
  const [dataModels, setDataModels] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTerms = originalData.length;
    const categories = new Set(originalData.map(t => t.category).filter(Boolean));
    const taggedModels = new Set();
    originalData.forEach(term => {
      if (term.taggedModels) {
        term.taggedModels.forEach(m => taggedModels.add(m));
      }
    });

    return {
      totalTerms,
      totalCategories: categories.size,
      totalTaggedModels: taggedModels.size
    };
  }, [originalData]);

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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: currentTheme.text }}>
            Glossary
          </Typography>
        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            Browse and search glossary terms, definitions, and documentation
          </Typography>
        </Box>

      {/* Statistics Visualization */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text, display: 'flex', alignItems: 'center' }}>
          <BarChartIcon sx={{ mr: 1 }} />
          Glossary Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
        <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Total Terms
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: currentTheme.text }}>
                  {stats.totalTerms}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Categories
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: currentTheme.text }}>
                  {stats.totalCategories}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Tagged Models
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: currentTheme.text }}>
                  {stats.totalTaggedModels}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Glossary Terms List */}
      <Paper elevation={0} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text }}>
              Terms ({filteredData.length}{hasActiveFilters ? ` of ${originalData.length}` : ''})
            </Typography>
            {hasActiveFilters && (
          <Button
                size="small"
                onClick={clearAllFilters}
                sx={{ color: currentTheme.textSecondary }}
              >
                Clear Filters
          </Button>
            )}
      </Box>

          {/* Search Bar */}
        <TextField
          fullWidth
            placeholder="Search terms, definitions, or categories..."
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
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
          }}
          sx={{
              mb: 2,
            '& .MuiOutlinedInput-root': {
                color: currentTheme.text,
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
              '& .MuiInputBase-input::placeholder': {
                color: currentTheme.textSecondary,
                opacity: 1
              }
            }}
          />

          {/* Filter Controls */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={getFilterOptions().categories}
                value={selectedCategoryFilter}
                onChange={(event, newValue) => setSelectedCategoryFilter(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Category"
                    placeholder="Select category..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
            color: currentTheme.text,
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
                      '& .MuiInputLabel-root': {
                        color: currentTheme.textSecondary
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
                        sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    color: currentTheme.textSecondary
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                    color: currentTheme.textSecondary
                  }
                }}
                PaperComponent={({ children, ...other }) => (
                  <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                    {children}
                  </Paper>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={getFilterOptions().models}
                getOptionLabel={(option) => option.name}
                value={selectedModelFilter ? getFilterOptions().models.find(m => m.shortName === selectedModelFilter) : null}
                onChange={(event, newValue) => setSelectedModelFilter(newValue ? newValue.shortName : null)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Model"
                    placeholder="Select model..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: currentTheme.text,
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
                      '& .MuiInputLabel-root': {
                        color: currentTheme.textSecondary
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
                        sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    color: currentTheme.textSecondary
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                    color: currentTheme.textSecondary
                  }
                }}
                PaperComponent={({ children, ...other }) => (
                  <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                    {children}
                  </Paper>
                )}
              />
            </Grid>
          </Grid>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedCategoryFilter && (
                <Chip
                  icon={<MenuBookIcon />}
                  label={`Category: ${selectedCategoryFilter}`}
                  onDelete={() => setSelectedCategoryFilter(null)}
                          sx={{ 
                    bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                            color: currentTheme.text, 
                    '& .MuiChip-deleteIcon': {
                      color: currentTheme.textSecondary
                    }
                  }}
                />
              )}
              {selectedModelFilter && (
                <Chip
                  icon={<DataObjectIcon />}
                  label={`Model: ${getFilterOptions().models.find(m => m.shortName === selectedModelFilter)?.name || selectedModelFilter}`}
                  onDelete={() => setSelectedModelFilter(null)}
                          sx={{ 
                    bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                      color: currentTheme.text, 
                    '& .MuiChip-deleteIcon': {
                      color: currentTheme.textSecondary
                    }
                  }}
                />
              )}
            </Box>
          )}
          </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: currentTheme.primary }} />
          </Box>
        ) : filteredData.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            {hasActiveFilters ? (
              <>
                <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                  No terms found matching your filters
                </Typography>
          <Button
            variant="outlined"
                  onClick={clearAllFilters}
            sx={{
              borderColor: currentTheme.border,
                    color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
            }}
          >
            Clear All Filters
          </Button>
              </>
      ) : (
        <>
                <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                  No glossary terms available yet.
                </Typography>
                {canCreate && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/glossary/create')}
            sx={{
                      borderColor: currentTheme.border,
                      color: currentTheme.text, 
                        '&:hover': {
                        borderColor: currentTheme.primary,
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    Create First Term
                  </Button>
                )}
              </>
            )}
                    </Box>
        ) : (
          <List sx={{ bgcolor: currentTheme.card }}>
            {filteredData.map((term, index) => (
              <React.Fragment key={term.id || term.term}>
                <ListItem
                      sx={{
                    bgcolor: currentTheme.card,
                        '&:hover': {
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                        },
                        transition: 'background-color 0.2s',
                    py: 2,
                    position: 'relative'
                  }}
                >
                  <Box sx={{ flex: 1, width: '100%', pr: 8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 'bold', flex: 1 }}>
                        {term.term || 'Unnamed Term'}
                      </Typography>
                    </Box>
                    {term.definition && (
                      <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                        {term.definition}
                        </Typography>
                      )}
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                      {term.taggedModels && term.taggedModels.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <DataObjectIcon sx={{ fontSize: 16, color: currentTheme.textSecondary }} />
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 'bold', mr: 0.5 }}>
                            Models:
                          </Typography>
                          {term.taggedModels.map((modelShortName, idx) => {
                            const model = dataModels.find(m => m.shortName === modelShortName);
                            return (
                              <Chip
                                key={idx}
                                label={model ? `${model.shortName} - ${model.name}` : modelShortName}
                                size="small"
                                onClick={() => model && navigate(`/models/${model.shortName}`)}
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: currentTheme.background,
                                  color: currentTheme.text,
                                  border: `1px solid ${currentTheme.border}`,
                                  cursor: model ? 'pointer' : 'default',
                                  '&:hover': model ? {
                                    borderColor: currentTheme.primary
                                  } : {}
                                }}
                              />
                            );
                          })}
                        </Box>
                      )}
                      {term.category && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <MenuBookIcon sx={{ fontSize: 16, color: currentTheme.textSecondary }} />
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 'bold', mr: 0.5 }}>
                            Category:
                          </Typography>
                          <Chip
                            label={term.category}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                              color: darkMode ? '#ba68c8' : '#9c27b0',
                              border: `1px solid ${darkMode ? 'rgba(156, 39, 176, 0.5)' : '#9c27b0'}`,
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Right side actions and info */}
                  <Box sx={{ 
                    position: 'absolute', 
                    right: 16, 
                    top: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 1
                  }}>
                    {canCreate && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/glossary/${term.id || term.term}/edit`)}
                            sx={{
                              color: currentTheme.textSecondary,
                              '&:hover': {
                                color: currentTheme.primary,
                              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                            }
                            }}
                          >
                          <EditIcon fontSize="small" />
                          </IconButton>
                        {term.documentation && (
                          <IconButton
                            size="small"
                            onClick={() => window.open(term.documentation, '_blank')}
                            sx={{
                              color: currentTheme.textSecondary,
                              '&:hover': {
                                color: currentTheme.primary,
                                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                              }
                            }}
                          >
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                    {term.lastUpdated && (
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mt: 'auto' }}>
                        Last Updated: {new Date(term.lastUpdated).toLocaleDateString()}
                      </Typography>
                    )}
              </Box>
                </ListItem>
                {index < filteredData.length - 1 && (
                  <Divider 
                    sx={{ 
                      borderColor: currentTheme.border,
                      opacity: 0.5
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

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
