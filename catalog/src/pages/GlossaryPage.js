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
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Tooltip,
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

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
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
                  ×
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            mb: 2,
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

        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Autocomplete
            options={getFilterOptions().categories}
            value={selectedCategoryFilter}
            onChange={(event, newValue) => setSelectedCategoryFilter(newValue)}
            sx={{ minWidth: 200, flex: 1 }}
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
            sx={{ minWidth: 200, flex: 1 }}
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
        </Box>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', width: '100%' }}>
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
            <Button
              size="small"
              onClick={clearAllFilters}
              sx={{ color: currentTheme.textSecondary }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Box>

      {/* Terms List */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
          Terms ({filteredData.length}{hasActiveFilters ? ` of ${originalData.length}` : ''})
        </Typography>

        {loading && filteredData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredData.length === 0 ? (
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, textAlign: 'center', p: 3 }}>
            {hasActiveFilters ? 'No terms found matching your filters' : 'No glossary terms available yet. Create your first term!'}
          </Typography>
        ) : (
          <List>
            {filteredData.map((term, index) => (
              <React.Fragment key={term.id || term.term}>
                <ListItem
                  sx={{
                    bgcolor: currentTheme.card,
                    borderRadius: 1,
                    mb: 1,
                    border: `1px solid ${currentTheme.border}`,
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <ListItemText
                    sx={{
                      pr: canCreate ? (term.documentation ? 16 : 8) : 0
                    }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ color: currentTheme.text }}>
                          {term.term || 'Unnamed Term'}
                        </Typography>
                        {term.category && (
                          <Chip
                            label={term.category}
                            size="small"
                            sx={{
                              bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                              color: darkMode ? '#ba68c8' : '#9c27b0',
                              border: `1px solid ${darkMode ? 'rgba(156, 39, 176, 0.5)' : '#9c27b0'}`,
                              textTransform: 'capitalize'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {term.definition && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: currentTheme.textSecondary, 
                              mb: 1,
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word'
                            }}
                          >
                            {term.definition}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          {term.taggedModels?.slice(0, 5).map((modelShortName, idx) => {
                            const model = dataModels.find(m => m.shortName === modelShortName);
                            return (
                              <Tooltip key={idx} title={model ? `${model.shortName} - ${model.name}` : modelShortName}>
                                <Chip
                                  icon={<DataObjectIcon />}
                                  label={model ? model.shortName : modelShortName}
                                  size="small"
                                  onClick={() => model && navigate(`/models/${model.shortName}`)}
                                  sx={{
                                    bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                                    color: currentTheme.text,
                                    maxWidth: 150,
                                    cursor: model ? 'pointer' : 'default',
                                    '&:hover': model ? {
                                      borderColor: currentTheme.primary
                                    } : {}
                                  }}
                                />
                              </Tooltip>
                            );
                          })}
                          {term.taggedModels?.length > 5 && (
                            <Chip
                              label={`+${term.taggedModels.length - 5} more`}
                              size="small"
                              sx={{
                                bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                                color: currentTheme.text
                              }}
                            />
                          )}
                        </Box>
                        {term.lastUpdated && (
                          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                            Last Updated: {new Date(term.lastUpdated).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {canCreate && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/glossary/${term.id || term.term}/edit`)}
                          sx={{
                            color: currentTheme.textSecondary,
                            '&:hover': {
                              bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                              color: darkMode ? '#64b5f6' : '#1565c0'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        {term.documentation && (
                          <IconButton
                            edge="end"
                            onClick={() => window.open(term.documentation, '_blank')}
                            sx={{
                              color: currentTheme.textSecondary,
                              '&:hover': {
                                bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                                color: darkMode ? '#64b5f6' : '#1565c0'
                              }
                            }}
                          >
                            <DescriptionIcon />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </ListItemSecondaryAction>
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
      </Box>

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
