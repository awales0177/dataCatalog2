import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Divider,
  Button,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 25;

const GlossaryPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { canCreate } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'term', direction: 'asc' });
  const [dataModels, setDataModels] = useState([]);

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

  // Filter and sort data
  useEffect(() => {
    let filtered = [...originalData];

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(term =>
        (term.term && term.term.toLowerCase().includes(searchLower)) ||
        (term.definition && term.definition.toLowerCase().includes(searchLower)) ||
        (term.category && term.category.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(term =>
        term.category && selectedCategories.includes(term.category)
      );
    }

    // Model filter
    if (selectedModels.length > 0) {
      filtered = filtered.filter(term =>
        term.taggedModels && term.taggedModels.some(modelShortName => 
          selectedModels.includes(modelShortName)
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key] || '';
      let bValue = b[sortConfig.key] || '';
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredData(filtered);
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedCategories, selectedModels, sortConfig, originalData]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleModelToggle = (modelShortName) => {
    setSelectedModels(prev =>
      prev.includes(modelShortName)
        ? prev.filter(m => m !== modelShortName)
        : [...prev, modelShortName]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedModels([]);
    setSearchQuery('');
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error && originalData.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box p={3}>
          <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
            Glossary
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            Browse and search glossary terms, definitions, and documentation
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDrawerOpen(true)}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: `${currentTheme.primary}10`,
              },
            }}
          >
            Filters
            {(selectedCategories.length > 0 || selectedModels.length > 0) && (
              <Chip
                label={selectedCategories.length + selectedModels.length}
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  minWidth: 20,
                  bgcolor: currentTheme.primary,
                  color: currentTheme.background,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search glossary terms, definitions, or categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
              '&:hover fieldset': {
                borderColor: currentTheme.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: currentTheme.primary,
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
      </Box>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 350,
            bgcolor: currentTheme.card,
            color: currentTheme.text,
          },
        }}
      >
        <Box sx={{ p: 2, pr: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text }}>
              Filters
            </Typography>
            <IconButton
              onClick={() => setFilterDrawerOpen(false)}
              sx={{ color: currentTheme.textSecondary }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2, borderColor: currentTheme.border }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
              Categories
            </Typography>
            <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
              {availableCategories.length > 0 ? (
                availableCategories.map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        sx={{
                          color: currentTheme.primary,
                          '&.Mui-checked': {
                            color: currentTheme.primary,
                          },
                        }}
                      />
                    }
                    label={category}
                    sx={{ color: currentTheme.text, display: 'block', mb: 0.5, mr: 0 }}
                  />
                ))
              ) : (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                  No categories available
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: currentTheme.border }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
              Tagged Models
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
              {dataModels.length > 0 ? (
                dataModels.map((model) => (
                  <FormControlLabel
                    key={model.shortName}
                    control={
                      <Checkbox
                        checked={selectedModels.includes(model.shortName)}
                        onChange={() => handleModelToggle(model.shortName)}
                        sx={{
                          color: currentTheme.primary,
                          '&.Mui-checked': {
                            color: currentTheme.primary,
                          },
                          padding: '4px',
                          marginRight: '4px',
                        }}
                      />
                    }
                    label={
                      <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: currentTheme.text, 
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                          }}
                        >
                          {model.shortName}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: currentTheme.textSecondary,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                            mt: 0.25,
                          }}
                        >
                          {model.name}
                        </Typography>
                      </Box>
                    }
                    sx={{ 
                      color: currentTheme.text, 
                      display: 'flex', 
                      mb: 0.5, 
                      width: '100%',
                      marginLeft: 0,
                      marginRight: 0,
                      alignItems: 'flex-start',
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                  No models available
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: currentTheme.border }} />

          <Button
            fullWidth
            variant="outlined"
            onClick={handleClearFilters}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.textSecondary,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: `${currentTheme.primary}10`,
              },
            }}
          >
            Clear All Filters
          </Button>
        </Box>
      </Drawer>

      {/* Results count */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
          Showing {paginatedData.length} of {filteredData.length} term{filteredData.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Table */}
      {filteredData.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
            {searchQuery || selectedCategories.length > 0 ? 'No glossary terms found' : 'No glossary terms available'}
          </Typography>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            {searchQuery || selectedCategories.length > 0
              ? 'Try adjusting your search or filter criteria'
              : 'Glossary terms will appear here once they are added'}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              bgcolor: currentTheme.card,
              mb: 4,
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: currentTheme.text, fontWeight: 600, minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Term
                      <Tooltip title={`Sort ${sortConfig.key === 'term' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                        <IconButton
                          size="small"
                          onClick={() => handleSort('term')}
                          sx={{ color: currentTheme.textSecondary }}
                        >
                          {sortConfig.key === 'term' ? (
                            sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                          ) : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Definition
                      <Tooltip title={`Sort ${sortConfig.key === 'definition' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                        <IconButton
                          size="small"
                          onClick={() => handleSort('definition')}
                          sx={{ color: currentTheme.textSecondary }}
                        >
                          {sortConfig.key === 'definition' ? (
                            sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                          ) : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: currentTheme.text, fontWeight: 600, minWidth: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Category
                      <Tooltip title={`Sort ${sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending') : 'ascending'}`}>
                        <IconButton
                          size="small"
                          onClick={() => handleSort('category')}
                          sx={{ color: currentTheme.textSecondary }}
                        >
                          {sortConfig.key === 'category' ? (
                            sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                          ) : <ArrowUpwardIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: currentTheme.text, fontWeight: 600, minWidth: 200 }}>
                    Tagged Models
                  </TableCell>
                  <TableCell sx={{ color: currentTheme.text, fontWeight: 600, width: 120 }}>
                    Documentation
                  </TableCell>
                  <TableCell sx={{ color: currentTheme.text, fontWeight: 600, width: 120 }}>
                    Updated
                  </TableCell>
                  {canCreate && (
                    <TableCell sx={{ color: currentTheme.text, fontWeight: 600, width: 80 }}>
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((term) => (
                  <TableRow
                    key={term.id || term.term}
                  >
                    <TableCell sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {term.term || 'Unnamed Term'}
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.textSecondary }}>
                      <Typography
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {term.definition || 'No definition available'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {term.category ? (
                        <Chip
                          label={term.category}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            bgcolor: alpha(currentTheme.primary, 0.1),
                            color: currentTheme.primary,
                            border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                          }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                          No category
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {term.taggedModels && term.taggedModels.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {term.taggedModels.map((modelShortName) => {
                            const model = dataModels.find(m => m.shortName === modelShortName);
                            return (
                              <Chip
                                key={modelShortName}
                                label={model ? `${model.shortName} - ${model.name}` : modelShortName}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (model) {
                                    navigate(`/models/${model.shortName}`);
                                  }
                                }}
                                sx={{
                                  height: 24,
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  bgcolor: alpha(currentTheme.success || '#2ecc71', 0.1),
                                  color: currentTheme.success || '#2ecc71',
                                  border: `1px solid ${alpha(currentTheme.success || '#2ecc71', 0.3)}`,
                                  cursor: model ? 'pointer' : 'default',
                                  '&:hover': model ? {
                                    bgcolor: alpha(currentTheme.success || '#2ecc71', 0.2),
                                  } : {},
                                }}
                              />
                            );
                          })}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                          No models tagged
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {term.documentation ? (
                        <Tooltip title="View Documentation">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(term.documentation, '_blank');
                            }}
                            sx={{
                              color: currentTheme.textSecondary,
                              '&:hover': {
                                color: currentTheme.primary,
                              },
                            }}
                          >
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.textSecondary }}>
                      {term.lastUpdated ? (
                        <Typography variant="caption">
                          {new Date(term.lastUpdated).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                    {canCreate && (
                      <TableCell>
                        <Tooltip title="Edit Glossary Term">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/glossary/${term.id || term.term}/edit`)}
                            sx={{
                              color: currentTheme.textSecondary,
                              '&:hover': {
                                color: currentTheme.primary,
                                bgcolor: alpha(currentTheme.primary, 0.1),
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredData.length > ITEMS_PER_PAGE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  sx={{ color: currentTheme.text }}
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, px: 2 }}>
                  Page {page} of {totalPages}
                </Typography>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  sx={{ color: currentTheme.text }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}

      {canCreate && (
        <Fab
          color="primary"
          aria-label="add glossary term"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: currentTheme.primary,
            '&:hover': {
              bgcolor: currentTheme.primaryHover || currentTheme.primary,
            },
          }}
          onClick={() => navigate('/glossary/create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default GlossaryPage;
