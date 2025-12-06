import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
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
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  Fab,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Rule as RuleIcon,
  DataObject as DataObjectIcon,
  ViewColumn as ViewColumnIcon,
  Functions as FunctionsIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchModels, 
  getRulesForModel, 
  createRule, 
  updateRule, 
  deleteRule, 
  getRuleCoverage,
  fetchData as fetchToolkit
} from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const RuleBuilderPage = () => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modelParam = searchParams.get('model');
  
  // State management
  const [step, setStep] = useState('typeSelection'); // 'typeSelection', 'selectModel', or 'builder'
  const [ruleType, setRuleType] = useState(null); // 'model' or 'country'
  const [typeSelectionModalOpen, setTypeSelectionModalOpen] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
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
  
  // Available options for tagging (only functions from toolkit)
  const [availableFunctions, setAvailableFunctions] = useState([]);

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Auto-select model from URL parameter
  useEffect(() => {
    if (modelParam && models.length > 0 && !selectedModel) {
      const model = models.find(m => m.shortName.toLowerCase() === modelParam.toLowerCase());
      if (model) {
        setRuleType('model');
        setSelectedModel(model);
        setStep('builder');
        setTypeSelectionModalOpen(false);
      }
    }
  }, [modelParam, models, selectedModel]);

  // Load rules and coverage when model is selected
  useEffect(() => {
    if (selectedModel) {
      loadRules();
      loadCoverage();
      loadAvailableOptions();
    }
  }, [selectedModel]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await fetchModels();
      setModels(data.models || []);
    } catch (error) {
      console.error('Error loading models:', error);
      setSnackbar({ open: true, message: 'Failed to load models', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    if (!selectedModel) return;
    try {
      setLoading(true);
      const data = await getRulesForModel(selectedModel.shortName);
      setRules(data.rules || []);
      setFilteredRules(data.rules || []);
      // Clear any previous error messages on success
      if (snackbar.open && snackbar.message === 'Failed to load rules') {
        setSnackbar({ open: false, message: '', severity: 'success' });
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      const errorMessage = error.message || 'Failed to load rules';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      // Set empty rules array on error so UI doesn't break
      setRules([]);
      setFilteredRules([]);
    } finally {
      setLoading(false);
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

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(rule => {
        // Search in rule name
        if (rule.name?.toLowerCase().includes(query)) return true;
        
        // Search in description
        if (rule.description?.toLowerCase().includes(query)) return true;
        
        // Search in rule type
        if (rule.ruleType?.toLowerCase().includes(query)) return true;
        
        // Search in tagged objects
        if (rule.taggedObjects?.some(obj => obj.toLowerCase().includes(query))) return true;
        
        // Search in tagged columns
        if (rule.taggedColumns?.some(col => col.toLowerCase().includes(query))) return true;
        
        // Search in tagged functions
        if (rule.taggedFunctions?.some(funcId => {
          const func = availableFunctions.find(f => f.id === funcId);
          const funcName = func ? func.name : funcId;
          return funcName.toLowerCase().includes(query);
        })) return true;
        
        return false;
      });
    }

    // Apply object filter
    if (selectedObjectFilter) {
      filtered = filtered.filter(rule => 
        rule.taggedObjects?.includes(selectedObjectFilter)
      );
    }

    // Apply column filter
    if (selectedColumnFilter) {
      filtered = filtered.filter(rule => 
        rule.taggedColumns?.includes(selectedColumnFilter)
      );
    }

    // Apply function filter
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
    // Load toolkit functions
    try {
      const toolkitData = await fetchToolkit('toolkit');
      const functions = toolkitData?.toolkit?.functions || [];
      setAvailableFunctions(functions.map(f => ({ id: f.id, name: f.displayName || f.name })));
    } catch (error) {
      console.error('Error loading toolkit functions:', error);
    }
  };

  const handleTypeSelection = (type) => {
    setRuleType(type);
    if (type === 'model') {
      // Keep modal open, just change the step
      setStep('selectModel');
    } else if (type === 'country') {
      // TODO: Implement country selection
      setSnackbar({ open: true, message: 'Country rules coming soon!', severity: 'info' });
      setTypeSelectionModalOpen(false);
    }
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setTypeSelectionModalOpen(false);
    setStep('builder');
    setRuleForm(prev => ({ ...prev, modelShortName: model.shortName }));
  };

  const handleBackToModelSelect = () => {
    setStep('selectModel');
    setRuleType('model');
    setTypeSelectionModalOpen(true);
    setSelectedModel(null);
    setRules([]);
    setCoverage(null);
    setEditingRule(null);
  };

  const handleBackToTypeSelection = () => {
    setStep('typeSelection');
    setRuleType(null);
    setSelectedModel(null);
    setRules([]);
    setCoverage(null);
    setEditingRule(null);
  };

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
      
      // Prepare rule data - auto-tag "all" if objects/columns are empty
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

  const calculateCoveragePercentage = (tagged, total) => {
    if (!total || total === 0) return 0;
    return Math.round((tagged / total) * 100);
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

  // Render type selection modal
  const renderTypeSelectionModal = () => (
    <Dialog
      open={typeSelectionModalOpen}
      onClose={() => {
        // Don't allow closing without selection - navigate back instead
        navigate(-1);
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: currentTheme?.card,
          color: currentTheme?.text,
          border: `1px solid ${currentTheme?.border}`,
          boxShadow: 'none'
        }
      }}
    >
      <DialogTitle sx={{ color: currentTheme?.text, textAlign: 'center', pb: 2 }}>
        Rule Builder
      </DialogTitle>
      <DialogContent sx={{ color: currentTheme?.text }}>
        {step === 'typeSelection' ? (
          <>
            <Typography variant="body1" sx={{ mb: 3, color: currentTheme?.textSecondary, textAlign: 'center' }}>
              What would you like to build rules for?
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    },
                    bgcolor: currentTheme?.background,
                    border: `2px solid ${currentTheme?.border}`,
                    p: 3,
                    textAlign: 'center',
                    boxShadow: 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: 180
                  }}
                  onClick={() => handleTypeSelection('model')}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <DataObjectIcon sx={{ fontSize: 48, color: currentTheme?.primary }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: currentTheme?.text, mb: 1 }}>
                    Model
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Build rules for data models
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    },
                    bgcolor: currentTheme?.background,
                    border: `2px solid ${currentTheme?.border}`,
                    p: 3,
                    textAlign: 'center',
                    boxShadow: 'none',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: 180
                  }}
                  onClick={() => handleTypeSelection('country')}
                >
                  <Box sx={{ fontSize: 48, color: currentTheme?.primary, mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>🌍</Box>
                  <Typography variant="h6" sx={{ color: currentTheme?.text, mb: 1 }}>
                    Country
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                    Build rules for countries
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </>
        ) : step === 'selectModel' ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton
                onClick={handleBackToTypeSelection}
                size="small"
                sx={{ 
                  mr: 1, 
                  color: currentTheme?.textSecondary,
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                ←
              </IconButton>
              <Typography variant="h6" sx={{ color: currentTheme?.text }}>
                Select Data Model
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 3, color: currentTheme?.textSecondary }}>
              Choose a data model to build rules for.
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: currentTheme?.primary }} />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel 
                  sx={{ 
                    color: currentTheme?.textSecondary,
                    '&.Mui-focused': {
                      color: currentTheme?.primary
                    }
                  }}
                >
                  Select Model
                </InputLabel>
                <Select
                  value={selectedModel?.id || ''}
                  onChange={(e) => {
                    const model = models.find(m => m.id === e.target.value);
                    if (model) {
                      handleModelSelect(model);
                    }
                  }}
                  label="Select Model"
                  sx={{ 
                    bgcolor: currentTheme?.background,
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
                          },
                          '&.Mui-selected': {
                            bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                            '&:hover': {
                              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)'
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  {models.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: currentTheme?.text }}>
                          {model.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
                          {model.shortName}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );

  // Show modal for type selection and model selection
  if (step === 'typeSelection' || step === 'selectModel') {
    return renderTypeSelectionModal();
  }

  // Render rule builder step
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          onClick={handleBackToModelSelect}
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

      {/* Rules List */}
      <Paper elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme?.border}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: currentTheme?.text }}>
              Rules ({filteredRules.length}{hasActiveFilters ? ` of ${rules.length}` : ''})
            </Typography>
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={clearAllFilters}
                sx={{ color: currentTheme?.textSecondary }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search rules by name, description, type, objects, columns, or functions..."
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
                    <CancelIcon fontSize="small" />
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
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
            </Box>
          )}
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: currentTheme?.primary }} />
          </Box>
        ) : filteredRules.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            {hasActiveFilters ? (
              <>
                <Typography variant="body1" sx={{ color: currentTheme?.textSecondary, mb: 2 }}>
                  No rules found matching your filters
                </Typography>
                <Button
                  variant="outlined"
                  onClick={clearAllFilters}
                  sx={{
                    borderColor: currentTheme?.border,
                    color: currentTheme?.text,
                    '&:hover': {
                      borderColor: currentTheme?.primary,
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  Clear All Filters
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ color: currentTheme?.textSecondary, mb: 2 }}>
                  No rules defined for this model yet.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleCreateRule}
                  sx={{
                    borderColor: currentTheme?.border,
                    color: currentTheme?.text,
                    '&:hover': {
                      borderColor: currentTheme?.primary,
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  Create First Rule
                </Button>
              </>
            )}
          </Box>
        ) : (
          <List sx={{ bgcolor: currentTheme?.card }}>
            {filteredRules.map((rule, index) => (
              <React.Fragment key={rule.id}>
                <ListItem
                  sx={{
                    bgcolor: currentTheme?.card,
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <RuleIcon sx={{ mr: 1, color: currentTheme?.primary, fontSize: 20 }} />
                      <Typography variant="subtitle1" sx={{ color: currentTheme?.text, fontWeight: 'bold' }}>
                        {rule.name}
                      </Typography>
                      <Chip
                        label={rule.ruleType}
                        size="small"
                        sx={{ 
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          textTransform: 'capitalize',
                          ...getRuleTypeColor(rule.ruleType)
                        }}
                      />
                      {!rule.enabled && (
                        <Chip
                          label="Disabled"
                          size="small"
                          sx={{ 
                            height: 20,
                            bgcolor: darkMode ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
                            color: currentTheme?.text,
                            border: `1px solid ${currentTheme?.border}`,
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                    {rule.description && (
                      <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, mb: 1 }}>
                        {rule.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                      {rule.taggedObjects && rule.taggedObjects.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <DataObjectIcon sx={{ fontSize: 16, color: currentTheme?.textSecondary }} />
                          <Typography variant="caption" sx={{ color: currentTheme?.textSecondary, fontWeight: 'bold', mr: 0.5 }}>
                            Objects:
                          </Typography>
                          {rule.taggedObjects.map((obj, idx) => (
                            <Chip
                              key={idx}
                              label={obj}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                bgcolor: currentTheme?.background,
                                color: currentTheme?.text,
                                border: `1px solid ${currentTheme?.border}`,
                                '&:hover': {
                                  borderColor: currentTheme?.primary
                                }
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      {rule.taggedColumns && rule.taggedColumns.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <ViewColumnIcon sx={{ fontSize: 16, color: currentTheme?.textSecondary }} />
                          <Typography variant="caption" sx={{ color: currentTheme?.textSecondary, fontWeight: 'bold', mr: 0.5 }}>
                            Columns:
                          </Typography>
                          {rule.taggedColumns.map((col, idx) => (
                            <Chip
                              key={idx}
                              label={col}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                bgcolor: currentTheme?.background,
                                color: currentTheme?.text,
                                border: `1px solid ${currentTheme?.border}`,
                                '&:hover': {
                                  borderColor: currentTheme?.primary
                                }
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      {rule.taggedFunctions && rule.taggedFunctions.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <img src="/python.svg" alt="Python" style={{ width: 16, height: 16 }} />
                          <Typography variant="caption" sx={{ color: currentTheme?.textSecondary, fontWeight: 'bold', mr: 0.5 }}>
                            Functions:
                          </Typography>
                          {rule.taggedFunctions.map((funcId, idx) => {
                            // Try to find the function name from availableFunctions
                            const func = availableFunctions.find(f => f.id === funcId);
                            const funcName = func ? func.name : funcId;
                            return (
                              <Chip
                                key={idx}
                                label={funcName}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.7rem',
                                  bgcolor: currentTheme?.background,
                                  color: currentTheme?.text,
                                  border: `1px solid ${currentTheme?.border}`,
                                  '&:hover': {
                                    borderColor: currentTheme?.primary
                                  }
                                }}
                              />
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditRule(rule)}
                      sx={{ 
                        color: currentTheme?.textSecondary,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                          color: currentTheme?.primary
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
              <InputLabel 
                sx={{ 
                  color: currentTheme?.textSecondary,
                  '&.Mui-focused': {
                    color: currentTheme?.primary
                  }
                }}
              >
                Rule Type
              </InputLabel>
              <Select
                value={ruleForm.ruleType}
                onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                label="Rule Type"
                sx={{ 
                  bgcolor: currentTheme?.background,
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
                      boxShadow: 'none',
                      '& .MuiMenuItem-root': {
                        color: currentTheme?.text,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        },
                        '&.Mui-selected': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                          '&:hover': {
                            bgcolor: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)'
                          }
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem 
                  value="validation"
                  sx={{
                    '&::before': {
                      content: '""',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: darkMode ? '#81c784' : '#4caf50',
                      mr: 1,
                      display: 'inline-block'
                    }
                  }}
                >
                  Validation
                </MenuItem>
                <MenuItem 
                  value="transformation"
                  sx={{
                    '&::before': {
                      content: '""',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: darkMode ? '#64b5f6' : '#2196f3',
                      mr: 1,
                      display: 'inline-block'
                    }
                  }}
                >
                  Transformation
                </MenuItem>
                <MenuItem 
                  value="business"
                  sx={{
                    '&::before': {
                      content: '""',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: darkMode ? '#ba68c8' : '#9c27b0',
                      mr: 1,
                      display: 'inline-block'
                    }
                  }}
                >
                  Business Logic
                </MenuItem>
                <MenuItem 
                  value="quality"
                  sx={{
                    '&::before': {
                      content: '""',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: darkMode ? '#ffb74d' : '#ff9800',
                      mr: 1,
                      display: 'inline-block'
                    }
                  }}
                >
                  Data Quality
                </MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Tag Objects"
                  placeholder="Enter object name"
                  helperText="Leave empty to apply to all objects"
                  value={ruleForm.newObjectInput || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, newObjectInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && ruleForm.newObjectInput?.trim()) {
                      e.preventDefault();
                      const newObjects = [...(ruleForm.taggedObjects || []), ruleForm.newObjectInput.trim()];
                      setRuleForm({ ...ruleForm, taggedObjects: newObjects, newObjectInput: '' });
                    }
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
                <Button
                  variant="contained"
                  onClick={() => {
                    if (ruleForm.newObjectInput?.trim()) {
                      const newObjects = [...(ruleForm.taggedObjects || []), ruleForm.newObjectInput.trim()];
                      setRuleForm({ ...ruleForm, taggedObjects: newObjects, newObjectInput: '' });
                    }
                  }}
                  disabled={!ruleForm.newObjectInput?.trim()}
                  sx={{
                    bgcolor: currentTheme?.primary,
                    color: '#fff',
                    minWidth: 100,
                    '&:hover': {
                      bgcolor: currentTheme?.primary,
                      opacity: 0.9
                    },
                    '&:disabled': {
                      bgcolor: currentTheme?.border,
                      color: currentTheme?.textSecondary
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
              {ruleForm.taggedObjects && ruleForm.taggedObjects.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {ruleForm.taggedObjects.map((obj, index) => (
                    <Chip
                      key={index}
                      label={obj}
                      icon={<DataObjectIcon />}
                      onDelete={() => {
                        const newObjects = ruleForm.taggedObjects.filter((_, i) => i !== index);
                        setRuleForm({ ...ruleForm, taggedObjects: newObjects });
                      }}
                      sx={{
                        bgcolor: currentTheme?.background,
                        color: currentTheme?.text,
                        border: `1px solid ${currentTheme?.border}`,
                        '& .MuiChip-deleteIcon': {
                          color: currentTheme?.textSecondary,
                          '&:hover': {
                            color: currentTheme?.text
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Tag Columns"
                  placeholder="Enter column name"
                  helperText="Leave empty to apply to all columns"
                  value={ruleForm.newColumnInput || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, newColumnInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && ruleForm.newColumnInput?.trim()) {
                      e.preventDefault();
                      const newColumns = [...(ruleForm.taggedColumns || []), ruleForm.newColumnInput.trim()];
                      setRuleForm({ ...ruleForm, taggedColumns: newColumns, newColumnInput: '' });
                    }
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
                <Button
                  variant="contained"
                  onClick={() => {
                    if (ruleForm.newColumnInput?.trim()) {
                      const newColumns = [...(ruleForm.taggedColumns || []), ruleForm.newColumnInput.trim()];
                      setRuleForm({ ...ruleForm, taggedColumns: newColumns, newColumnInput: '' });
                    }
                  }}
                  disabled={!ruleForm.newColumnInput?.trim()}
                  sx={{
                    bgcolor: currentTheme?.primary,
                    color: '#fff',
                    minWidth: 100,
                    '&:hover': {
                      bgcolor: currentTheme?.primary,
                      opacity: 0.9
                    },
                    '&:disabled': {
                      bgcolor: currentTheme?.border,
                      color: currentTheme?.textSecondary
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
              {ruleForm.taggedColumns && ruleForm.taggedColumns.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {ruleForm.taggedColumns.map((col, index) => (
                    <Chip
                      key={index}
                      label={col}
                      icon={<ViewColumnIcon />}
                      onDelete={() => {
                        const newColumns = ruleForm.taggedColumns.filter((_, i) => i !== index);
                        setRuleForm({ ...ruleForm, taggedColumns: newColumns });
                      }}
                      sx={{
                        bgcolor: currentTheme?.background,
                        color: currentTheme?.text,
                        border: `1px solid ${currentTheme?.border}`,
                        '& .MuiChip-deleteIcon': {
                          color: currentTheme?.textSecondary,
                          '&:hover': {
                            color: currentTheme?.text
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            <Autocomplete
              multiple
              options={availableFunctions}
              getOptionLabel={(option) => option.name || option}
              value={ruleForm.taggedFunctions.map(func => 
                typeof func === 'string' ? availableFunctions.find(f => f.id === func || f.name === func) || func : func
              )}
              onChange={(event, newValue) => {
                setRuleForm({ ...ruleForm, taggedFunctions: newValue.map(v => v.id || v) });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tag Functions (from Toolkit)"
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
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id || option}
                    label={option.name || option}
                    icon={<img src="/python.svg" alt="Python" style={{ width: 16, height: 16 }} />}
                    sx={{
                      bgcolor: currentTheme?.background,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                      '& .MuiChip-deleteIcon': {
                        color: currentTheme?.textSecondary,
                        '&:hover': {
                          color: currentTheme?.text
                        }
                      }
                    }}
                  />
                ))
              }
              PaperComponent={({ children, ...other }) => (
                <Paper
                  {...other}
                  sx={{
                    bgcolor: currentTheme?.card,
                    color: currentTheme?.text,
                    border: `1px solid ${currentTheme?.border}`,
                    '& .MuiAutocomplete-option': {
                      color: currentTheme?.text,
                      '&:hover': {
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                      },
                      '&[aria-selected="true"]': {
                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                      }
                    }
                  }}
                >
                  {children}
                </Paper>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${currentTheme?.border}` }}>
          <Button
            onClick={() => setRuleDialogOpen(false)}
            sx={{ 
              color: currentTheme?.textSecondary,
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
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
                bgcolor: currentTheme?.border,
                color: currentTheme?.textSecondary
              }
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create rule"
        onClick={handleCreateRule}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: currentTheme?.primary,
          color: '#fff',
          '&:hover': {
            bgcolor: currentTheme?.primary,
            opacity: 0.9,
            transform: 'scale(1.05)'
          },
          transition: 'transform 0.2s, opacity 0.2s',
          zIndex: 1000,
          boxShadow: 'none'
        }}
      >
        <AddIcon />
      </Fab>

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

export default RuleBuilderPage;

