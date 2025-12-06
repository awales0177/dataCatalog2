import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Autocomplete,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Divider,
  LinearProgress,
  Tooltip,
  Fab,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DataObject as DataObjectIcon,
  ViewColumn as ViewColumnIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { 
  getRulesForModel, 
  createRule, 
  updateRule, 
  deleteRule, 
  getRuleCoverage,
  fetchData as fetchToolkit
} from '../services/api';

const ModelRuleBuilder = ({ selectedModel, onBack }) => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  
  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedObjectFilter, setSelectedObjectFilter] = useState(null);
  const [selectedColumnFilter, setSelectedColumnFilter] = useState(null);
  const [selectedFunctionFilter, setSelectedFunctionFilter] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableFunctions, setAvailableFunctions] = useState([]);
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    modelShortName: '',
    taggedObjects: [],
    taggedColumns: [],
    taggedFunctions: [],
    ruleType: 'validation',
    enabled: true,
    newObjectInput: '',
    newColumnInput: ''
  });

  // Load rules and coverage when model is selected
  useEffect(() => {
    if (selectedModel) {
      loadRules();
      loadCoverage();
      loadAvailableOptions();
    }
  }, [selectedModel]);

  const loadRules = async () => {
    if (!selectedModel) return;
    try {
      setLoading(true);
      const data = await getRulesForModel(selectedModel.shortName);
      setRules(data.rules || []);
      setFilteredRules(data.rules || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      const errorMessage = error.message || 'Failed to load rules';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setRules([]);
      setFilteredRules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCoverage = async () => {
    if (!selectedModel) return;
    try {
      const data = await getRuleCoverage(selectedModel.shortName);
      setCoverage(data);
    } catch (error) {
      console.error('Error loading coverage:', error);
    }
  };

  const loadAvailableOptions = async () => {
    try {
      const toolkitData = await fetchToolkit('toolkit');
      const functions = toolkitData?.toolkit?.functions || [];
      setAvailableFunctions(functions.map(f => ({ id: f.id, name: f.displayName || f.name })));
    } catch (error) {
      console.error('Error loading toolkit functions:', error);
    }
  };

  // Get unique objects, columns, and functions from all rules for filter options
  const getFilterOptions = () => {
    const objects = new Set();
    const columns = new Set();
    const functions = new Set();

    rules.forEach(rule => {
      rule.taggedObjects?.forEach(obj => objects.add(obj));
      rule.taggedColumns?.forEach(col => columns.add(col));
      rule.taggedFunctions?.forEach(funcId => functions.add(funcId));
    });

    return {
      objects: Array.from(objects).sort(),
      columns: Array.from(columns).sort(),
      functions: Array.from(functions).map(funcId => {
        const func = availableFunctions.find(f => f.id === funcId);
        return {
          id: funcId,
          name: func ? func.name : funcId
        };
      }).sort((a, b) => a.name.localeCompare(b.name))
    };
  };

  // Filter rules based on search query and filters
  useEffect(() => {
    let filtered = [...rules];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(rule => {
        if (rule.name?.toLowerCase().includes(query)) return true;
        if (rule.description?.toLowerCase().includes(query)) return true;
        if (rule.ruleType?.toLowerCase().includes(query)) return true;
        if (rule.taggedObjects?.some(obj => obj.toLowerCase().includes(query))) return true;
        if (rule.taggedColumns?.some(col => col.toLowerCase().includes(query))) return true;
        if (rule.taggedFunctions?.some(funcId => {
          const func = availableFunctions.find(f => f.id === funcId);
          const funcName = func ? func.name : funcId;
          return funcName.toLowerCase().includes(query);
        })) return true;
        return false;
      });
    }

    if (selectedObjectFilter) {
      filtered = filtered.filter(rule => 
        rule.taggedObjects?.includes(selectedObjectFilter)
      );
    }

    if (selectedColumnFilter) {
      filtered = filtered.filter(rule => 
        rule.taggedColumns?.includes(selectedColumnFilter)
      );
    }

    if (selectedFunctionFilter) {
      filtered = filtered.filter(rule => 
        rule.taggedFunctions?.includes(selectedFunctionFilter)
      );
    }
    
    setFilteredRules(filtered);
  }, [searchQuery, selectedObjectFilter, selectedColumnFilter, selectedFunctionFilter, rules, availableFunctions]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedObjectFilter(null);
    setSelectedColumnFilter(null);
    setSelectedFunctionFilter(null);
  };

  const hasActiveFilters = searchQuery || selectedObjectFilter || selectedColumnFilter || selectedFunctionFilter;

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      modelShortName: selectedModel.shortName,
      taggedObjects: [],
      taggedColumns: [],
      taggedFunctions: [],
      ruleType: 'validation',
      enabled: true,
      newObjectInput: '',
      newColumnInput: ''
    });
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name || '',
      description: rule.description || '',
      modelShortName: rule.modelShortName || selectedModel.shortName,
      taggedObjects: rule.taggedObjects || [],
      taggedColumns: rule.taggedColumns || [],
      taggedFunctions: rule.taggedFunctions || [],
      ruleType: rule.ruleType || 'validation',
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      newObjectInput: '',
      newColumnInput: ''
    });
    setRuleDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      setLoading(true);
      await deleteRule(ruleId);
      setSnackbar({ open: true, message: 'Rule deleted successfully', severity: 'success' });
      loadRules();
      loadCoverage();
    } catch (error) {
      console.error('Error deleting rule:', error);
      setSnackbar({ open: true, message: 'Failed to delete rule', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      setLoading(true);
      
      const ruleData = {
        ...ruleForm,
        taggedObjects: ruleForm.taggedObjects && ruleForm.taggedObjects.length > 0 
          ? ruleForm.taggedObjects 
          : ['all'],
        taggedColumns: ruleForm.taggedColumns && ruleForm.taggedColumns.length > 0 
          ? ruleForm.taggedColumns 
          : ['all']
      };
      
      if (editingRule) {
        await updateRule(editingRule.id, ruleData);
        setSnackbar({ open: true, message: 'Rule updated successfully', severity: 'success' });
      } else {
        await createRule(ruleData);
        setSnackbar({ open: true, message: 'Rule created successfully', severity: 'success' });
      }
      setRuleDialogOpen(false);
      loadRules();
      loadCoverage();
    } catch (error) {
      console.error('Error saving rule:', error);
      setSnackbar({ open: true, message: 'Failed to save rule', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getRuleTypeColor = (ruleType) => {
    const colorMap = {
      'validation': {
        bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        color: darkMode ? '#81c784' : '#2e7d32',
        border: darkMode ? 'rgba(76, 175, 80, 0.5)' : '#4caf50'
      },
      'transformation': {
        bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
        color: darkMode ? '#64b5f6' : '#1565c0',
        border: darkMode ? 'rgba(33, 150, 243, 0.5)' : '#2196f3'
      },
      'business': {
        bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
        color: darkMode ? '#ba68c8' : '#6a1b9a',
        border: darkMode ? 'rgba(156, 39, 176, 0.5)' : '#9c27b0'
      },
      'quality': {
        bgcolor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        color: darkMode ? '#ffb74d' : '#e65100',
        border: darkMode ? 'rgba(255, 152, 0, 0.5)' : '#ff9800'
      }
    };
    return colorMap[ruleType] || {
      bgcolor: currentTheme?.background,
      color: currentTheme?.text,
      border: currentTheme?.border
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          onClick={onBack}
          sx={{ mb: 1, color: currentTheme?.textSecondary }}
        >
          ← Back to Model Selection
        </Button>
        <Typography variant="h4" sx={{ color: currentTheme?.text }}>
          Rule Builder: {selectedModel?.name}
        </Typography>
        <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
          {selectedModel?.shortName}
        </Typography>
      </Box>

      {/* Coverage Visualization */}
      {coverage && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
          <Typography variant="h6" sx={{ mb: 2, color: currentTheme?.text, display: 'flex', alignItems: 'center' }}>
            <BarChartIcon sx={{ mr: 1 }} />
            Rule Coverage
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Objects Tagged
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: currentTheme?.text }}>
                    {coverage.objectCoverage}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" sx={{ color: currentTheme?.textSecondary, mt: 0.5, display: 'block' }}>
                  {coverage.taggedObjects?.length > 0 ? coverage.taggedObjects.join(', ') : 'None'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Columns Tagged
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: currentTheme?.text }}>
                    {coverage.columnCoverage}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" sx={{ color: currentTheme?.textSecondary, mt: 0.5, display: 'block' }}>
                  {coverage.taggedColumns?.length > 0 ? coverage.taggedColumns.join(', ') : 'None'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Functions Tagged
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: currentTheme?.text }}>
                    {coverage.functionCoverage}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, (coverage.functionCoverage / Math.max(1, availableFunctions.length)) * 100)}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${currentTheme?.border}` }}>
            <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
              Total Rules: <strong style={{ color: currentTheme?.text }}>{coverage.totalRules}</strong>
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Search and Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme?.text }}>
          Search & Filter Rules
        </Typography>
        
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search rules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme?.textSecondary }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{ color: currentTheme?.textSecondary }}
                >
                  ×
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: currentTheme?.text,
              bgcolor: currentTheme?.background,
              '& fieldset': {
                borderColor: currentTheme?.border
              },
              '&:hover fieldset': {
                borderColor: currentTheme?.primary
              },
              '&.Mui-focused fieldset': {
                borderColor: currentTheme?.primary
              }
            },
            '& .MuiInputBase-input::placeholder': {
              color: currentTheme?.textSecondary,
              opacity: 1
            }
          }}
        />

        {/* Filter Controls */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={getFilterOptions().objects}
              value={selectedObjectFilter}
              onChange={(event, newValue) => setSelectedObjectFilter(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Object"
                  placeholder="Select object..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme?.text,
                      bgcolor: currentTheme?.background,
                      '& fieldset': {
                        borderColor: currentTheme?.border
                      },
                      '&:hover fieldset': {
                        borderColor: currentTheme?.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: currentTheme?.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: currentTheme?.textSecondary
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: currentTheme?.textSecondary,
                      opacity: 1
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ color: currentTheme?.text }}>
                  <DataObjectIcon sx={{ mr: 1, fontSize: 18, color: currentTheme?.textSecondary }} />
                  {option}
                </Box>
              )}
              sx={{
                '& .MuiAutocomplete-popupIndicator': {
                  color: currentTheme?.textSecondary
                },
                '& .MuiAutocomplete-clearIndicator': {
                  color: currentTheme?.textSecondary
                }
              }}
              PaperComponent={({ children, ...other }) => (
                <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                  {children}
                </Paper>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={getFilterOptions().columns}
              value={selectedColumnFilter}
              onChange={(event, newValue) => setSelectedColumnFilter(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Column"
                  placeholder="Select column..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme?.text,
                      bgcolor: currentTheme?.background,
                      '& fieldset': {
                        borderColor: currentTheme?.border
                      },
                      '&:hover fieldset': {
                        borderColor: currentTheme?.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: currentTheme?.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: currentTheme?.textSecondary
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: currentTheme?.textSecondary,
                      opacity: 1
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ color: currentTheme?.text }}>
                  <ViewColumnIcon sx={{ mr: 1, fontSize: 18, color: currentTheme?.textSecondary }} />
                  {option}
                </Box>
              )}
              sx={{
                '& .MuiAutocomplete-popupIndicator': {
                  color: currentTheme?.textSecondary
                },
                '& .MuiAutocomplete-clearIndicator': {
                  color: currentTheme?.textSecondary
                }
              }}
              PaperComponent={({ children, ...other }) => (
                <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                  {children}
                </Paper>
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={getFilterOptions().functions}
              getOptionLabel={(option) => option.name}
              value={selectedFunctionFilter ? getFilterOptions().functions.find(f => f.id === selectedFunctionFilter) : null}
              onChange={(event, newValue) => setSelectedFunctionFilter(newValue ? newValue.id : null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Function"
                  placeholder="Select function..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme?.text,
                      bgcolor: currentTheme?.background,
                      '& fieldset': {
                        borderColor: currentTheme?.border
                      },
                      '&:hover fieldset': {
                        borderColor: currentTheme?.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: currentTheme?.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: currentTheme?.textSecondary
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: currentTheme?.textSecondary,
                      opacity: 1
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ color: currentTheme?.text, display: 'flex', alignItems: 'center' }}>
                  <img src="/python.svg" alt="Python" style={{ width: 18, height: 18, marginRight: 8 }} />
                  {option.name}
                </Box>
              )}
              sx={{
                '& .MuiAutocomplete-popupIndicator': {
                  color: currentTheme?.textSecondary
                },
                '& .MuiAutocomplete-clearIndicator': {
                  color: currentTheme?.textSecondary
                }
              }}
              PaperComponent={({ children, ...other }) => (
                <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                  {children}
                </Paper>
              )}
            />
          </Grid>
        </Grid>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            {selectedObjectFilter && (
              <Chip
                icon={<DataObjectIcon />}
                label={`Object: ${selectedObjectFilter}`}
                onDelete={() => setSelectedObjectFilter(null)}
                sx={{
                  bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                  color: currentTheme?.text,
                  '& .MuiChip-deleteIcon': {
                    color: currentTheme?.textSecondary
                  }
                }}
              />
            )}
            {selectedColumnFilter && (
              <Chip
                icon={<ViewColumnIcon />}
                label={`Column: ${selectedColumnFilter}`}
                onDelete={() => setSelectedColumnFilter(null)}
                sx={{
                  bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                  color: currentTheme?.text,
                  '& .MuiChip-deleteIcon': {
                    color: currentTheme?.textSecondary
                  }
                }}
              />
            )}
            {selectedFunctionFilter && (
              <Chip
                icon={<img src="/python.svg" alt="Python" style={{ width: 16, height: 16 }} />}
                label={`Function: ${getFilterOptions().functions.find(f => f.id === selectedFunctionFilter)?.name || selectedFunctionFilter}`}
                onDelete={() => setSelectedFunctionFilter(null)}
                sx={{
                  bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                  color: currentTheme?.text,
                  '& .MuiChip-deleteIcon': {
                    color: currentTheme?.textSecondary
                  }
                }}
              />
            )}
            <Button
              size="small"
              onClick={clearAllFilters}
              sx={{ color: currentTheme?.textSecondary }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {/* Rules List */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme?.text }}>
          Rules ({filteredRules.length})
        </Typography>
        {loading && filteredRules.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredRules.length === 0 ? (
          <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, textAlign: 'center', p: 3 }}>
            No rules found. Create your first rule!
          </Typography>
        ) : (
          <List>
            {filteredRules.map((rule, index) => (
              <React.Fragment key={rule.id}>
                <ListItem
                  sx={{
                    bgcolor: currentTheme?.background,
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ color: currentTheme?.text }}>
                          {rule.name}
                        </Typography>
                        <Chip
                          label={rule.ruleType}
                          size="small"
                          sx={{
                            ...getRuleTypeColor(rule.ruleType),
                            textTransform: 'capitalize'
                          }}
                        />
                        {!rule.enabled && (
                          <Chip
                            label="Disabled"
                            size="small"
                            sx={{
                              bgcolor: darkMode ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)',
                              color: currentTheme?.textSecondary
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, mb: 1 }}>
                          {rule.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          {rule.taggedObjects?.slice(0, 5).map((obj, idx) => (
                            <Tooltip key={idx} title={obj}>
                              <Chip
                                icon={<DataObjectIcon />}
                                label={obj}
                                size="small"
                                sx={{
                                  bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                                  color: currentTheme?.text,
                                  maxWidth: 150
                                }}
                              />
                            </Tooltip>
                          ))}
                          {rule.taggedObjects?.length > 5 && (
                            <Chip
                              label={`+${rule.taggedObjects.length - 5} more`}
                              size="small"
                              sx={{
                                bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                                color: currentTheme?.text
                              }}
                            />
                          )}
                          {rule.taggedColumns?.slice(0, 5).map((col, idx) => (
                            <Tooltip key={idx} title={col}>
                              <Chip
                                icon={<ViewColumnIcon />}
                                label={col}
                                size="small"
                                sx={{
                                  bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                                  color: currentTheme?.text,
                                  maxWidth: 150
                                }}
                              />
                            </Tooltip>
                          ))}
                          {rule.taggedColumns?.length > 5 && (
                            <Chip
                              label={`+${rule.taggedColumns.length - 5} more`}
                              size="small"
                              sx={{
                                bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                                color: currentTheme?.text
                              }}
                            />
                          )}
                          {rule.taggedFunctions?.slice(0, 3).map((funcId, idx) => {
                            const func = availableFunctions.find(f => f.id === funcId);
                            return (
                              <Tooltip key={idx} title={func ? func.name : funcId}>
                                <Chip
                                  icon={<img src="/python.svg" alt="Python" style={{ width: 14, height: 14 }} />}
                                  label={func ? func.name : funcId}
                                  size="small"
                                  sx={{
                                    bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                                    color: currentTheme?.text,
                                    maxWidth: 150
                                  }}
                                />
                              </Tooltip>
                            );
                          })}
                          {rule.taggedFunctions?.length > 3 && (
                            <Chip
                              label={`+${rule.taggedFunctions.length - 3} more`}
                              size="small"
                              sx={{
                                bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                                color: currentTheme?.text
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditRule(rule)}
                      sx={{ 
                        color: currentTheme?.textSecondary,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                          color: darkMode ? '#64b5f6' : '#1565c0'
                        }
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteRule(rule.id)}
                      sx={{ 
                        color: currentTheme?.textSecondary,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
                          color: darkMode ? '#ff6b6b' : '#d32f2f'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredRules.length - 1 && (
                  <Divider 
                    sx={{ 
                      borderColor: currentTheme?.border,
                      opacity: 0.5
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Rule Editor Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme?.card,
            color: currentTheme?.text,
            border: `1px solid ${currentTheme?.border}`
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme?.text, borderBottom: `1px solid ${currentTheme?.border}`, pb: 2 }}>
          {editingRule ? 'Edit Rule' : 'Create New Rule'}
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme?.text }}>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Rule Name"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: currentTheme?.text,
                  '& fieldset': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme?.primary
                  }
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme?.textSecondary,
                  '&.Mui-focused': {
                    color: currentTheme?.primary
                  }
                }
              }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={ruleForm.description}
              onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              multiline
              rows={3}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: currentTheme?.text,
                  '& fieldset': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme?.primary
                  }
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme?.textSecondary,
                  '&.Mui-focused': {
                    color: currentTheme?.primary
                  }
                }
              }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                Rule Type
              </InputLabel>
              <Select
                value={ruleForm.ruleType}
                onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                label="Rule Type"
                sx={{
                  color: currentTheme?.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '& .MuiSvgIcon-root': {
                    color: currentTheme?.textSecondary
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme?.card,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                      '& .MuiMenuItem-root': {
                        color: currentTheme?.text,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="validation" sx={{ color: darkMode ? '#81c784' : '#2e7d32' }}>
                  Validation
                </MenuItem>
                <MenuItem value="transformation" sx={{ color: darkMode ? '#64b5f6' : '#1565c0' }}>
                  Transformation
                </MenuItem>
                <MenuItem value="business" sx={{ color: darkMode ? '#ba68c8' : '#6a1b9a' }}>
                  Business Logic
                </MenuItem>
                <MenuItem value="quality" sx={{ color: darkMode ? '#ffb74d' : '#e65100' }}>
                  Data Quality
                </MenuItem>
              </Select>
            </FormControl>

            {/* Tag Objects */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Tag Objects"
                placeholder="Enter object name"
                helperText="Leave empty to apply to all objects"
                value={ruleForm.newObjectInput || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, newObjectInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && ruleForm.newObjectInput.trim()) {
                    setRuleForm({
                      ...ruleForm,
                      taggedObjects: [...ruleForm.taggedObjects, ruleForm.newObjectInput.trim()],
                      newObjectInput: ''
                    });
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          if (ruleForm.newObjectInput.trim()) {
                            setRuleForm({
                              ...ruleForm,
                              taggedObjects: [...ruleForm.taggedObjects, ruleForm.newObjectInput.trim()],
                              newObjectInput: ''
                            });
                          }
                        }}
                        sx={{ color: currentTheme?.primary }}
                      >
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: currentTheme?.text,
                    '& fieldset': {
                      borderColor: currentTheme?.border
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme?.primary
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: currentTheme?.textSecondary,
                    '&.Mui-focused': {
                      color: currentTheme?.primary
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: currentTheme?.textSecondary
                  }
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {ruleForm.taggedObjects.map((obj, idx) => (
                  <Chip
                    key={idx}
                    label={obj}
                    onDelete={() => {
                      setRuleForm({
                        ...ruleForm,
                        taggedObjects: ruleForm.taggedObjects.filter((_, i) => i !== idx)
                      });
                    }}
                    icon={<DataObjectIcon />}
                    sx={{
                      bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                      color: currentTheme?.text
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Tag Columns */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Tag Columns"
                placeholder="Enter column name"
                helperText="Leave empty to apply to all columns"
                value={ruleForm.newColumnInput || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, newColumnInput: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && ruleForm.newColumnInput.trim()) {
                    setRuleForm({
                      ...ruleForm,
                      taggedColumns: [...ruleForm.taggedColumns, ruleForm.newColumnInput.trim()],
                      newColumnInput: ''
                    });
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          if (ruleForm.newColumnInput.trim()) {
                            setRuleForm({
                              ...ruleForm,
                              taggedColumns: [...ruleForm.taggedColumns, ruleForm.newColumnInput.trim()],
                              newColumnInput: ''
                            });
                          }
                        }}
                        sx={{ color: currentTheme?.primary }}
                      >
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: currentTheme?.text,
                    '& fieldset': {
                      borderColor: currentTheme?.border
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme?.primary
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: currentTheme?.textSecondary,
                    '&.Mui-focused': {
                      color: currentTheme?.primary
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: currentTheme?.textSecondary
                  }
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {ruleForm.taggedColumns.map((col, idx) => (
                  <Chip
                    key={idx}
                    label={col}
                    onDelete={() => {
                      setRuleForm({
                        ...ruleForm,
                        taggedColumns: ruleForm.taggedColumns.filter((_, i) => i !== idx)
                      });
                    }}
                    icon={<ViewColumnIcon />}
                    sx={{
                      bgcolor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                      color: currentTheme?.text
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Tag Functions */}
            <Autocomplete
              multiple
              options={availableFunctions}
              getOptionLabel={(option) => option.name}
              value={ruleForm.taggedFunctions.map(funcId => availableFunctions.find(f => f.id === funcId)).filter(Boolean)}
              onChange={(event, newValue) => {
                setRuleForm({
                  ...ruleForm,
                  taggedFunctions: newValue.map(f => f.id)
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tag Functions"
                  placeholder="Select functions from toolkit"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme?.text,
                      '& fieldset': {
                        borderColor: currentTheme?.border
                      },
                      '&:hover fieldset': {
                        borderColor: currentTheme?.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: currentTheme?.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: currentTheme?.textSecondary,
                      '&.Mui-focused': {
                        color: currentTheme?.primary
                      }
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ color: currentTheme?.text, display: 'flex', alignItems: 'center' }}>
                  <img src="/python.svg" alt="Python" style={{ width: 18, height: 18, marginRight: 8 }} />
                  {option.name}
                </Box>
              )}
              renderTags={(taggedValues, getTagProps) =>
                taggedValues.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    icon={<img src="/python.svg" alt="Python" style={{ width: 16, height: 16 }} />}
                    sx={{
                      bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
                      color: currentTheme?.text
                    }}
                  />
                ))
              }
              sx={{
                mb: 2,
                '& .MuiAutocomplete-popupIndicator': {
                  color: currentTheme?.textSecondary
                },
                '& .MuiAutocomplete-clearIndicator': {
                  color: currentTheme?.textSecondary
                }
              }}
              PaperComponent={({ children, ...other }) => (
                <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                  {children}
                </Paper>
              )}
            />

            {/* Enabled Switch */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Switch
                checked={ruleForm.enabled}
                onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: currentTheme?.primary
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: currentTheme?.primary
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                Enabled
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${currentTheme?.border}`, p: 2 }}>
          <Button
            onClick={() => setRuleDialogOpen(false)}
            sx={{ color: currentTheme?.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRule}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!ruleForm.name || loading}
            sx={{ 
              bgcolor: currentTheme?.primary,
              color: '#fff',
              '&:hover': {
                bgcolor: currentTheme?.primary,
                opacity: 0.9
              },
              '&:disabled': {
                bgcolor: currentTheme?.textSecondary,
                color: currentTheme?.text
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleCreateRule}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: currentTheme?.primary,
          boxShadow: 'none',
          '&:hover': {
            bgcolor: currentTheme?.primary,
            opacity: 0.9
          }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ModelRuleBuilder;

