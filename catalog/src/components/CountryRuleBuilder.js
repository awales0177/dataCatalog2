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
  ComposableMap,
  Geographies,
  Geography
} from 'react-simple-maps';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { 
  getAllCountryRules,
  getRulesForCountry,
  createCountryRule,
  updateCountryRule,
  deleteCountryRule,
  fetchData as fetchToolkit
} from '../services/api';

// Normalize country names - map variations to standard names
const normalizeCountryName = (name) => {
  if (!name) return name;
  
  const normalized = name.trim();
  const nameMap = {
    'United States of America': 'United States',
    'USA': 'United States',
    'US': 'United States',
    'U.S.A.': 'United States',
    'U.S.': 'United States',
    'South Korea': 'South Korea',
    'Korea, South': 'South Korea',
    'Republic of Korea': 'South Korea',
    'United Arab Emirates': 'United Arab Emirates',
    'UAE': 'United Arab Emirates',
    'United Kingdom': 'United Kingdom',
    'UK': 'United Kingdom',
    'U.K.': 'United Kingdom',
    'Great Britain': 'United Kingdom',
    'Russia': 'Russia',
    'Russian Federation': 'Russia',
    'Czech Republic': 'Czechia',
    'Czechia': 'Czechia',
    'Myanmar': 'Myanmar',
    'Burma': 'Myanmar',
    'Macedonia': 'North Macedonia',
    'North Macedonia': 'North Macedonia',
    'Ivory Coast': 'Côte d\'Ivoire',
    'Côte d\'Ivoire': 'Côte d\'Ivoire',
    'Cote d\'Ivoire': 'Côte d\'Ivoire',
  };
  
  // Check exact match first
  if (nameMap[normalized]) {
    return nameMap[normalized];
  }
  
  // Check case-insensitive match
  const lowerNormalized = normalized.toLowerCase();
  for (const [key, value] of Object.entries(nameMap)) {
    if (key.toLowerCase() === lowerNormalized) {
      return value;
    }
  }
  
  // Return original name if no mapping found
  return normalized;
};

// World map topojson URL - using local file for reliability
const geoUrl = "/world-countries.json";

const CountryRuleBuilder = ({ onBack }) => {
  console.log('CountryRuleBuilder rendering');
  
  const themeContext = useContext(ThemeContext);
  const { currentTheme: themeCurrentTheme, darkMode: themeDarkMode } = themeContext || {};
  
  // Provide defaults if theme is not available
  const currentTheme = themeCurrentTheme || { 
    text: '#000', 
    background: '#fff', 
    card: '#f5f5f5', 
    border: '#ddd', 
    primary: '#2196f3', 
    textSecondary: '#666' 
  };
  const darkMode = themeDarkMode || false;
  
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [rules, setRules] = useState([]);
  const [filteredRules, setFilteredRules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunctionFilter, setSelectedFunctionFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [countryRuleCounts, setCountryRuleCounts] = useState({});
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [useDropdown, setUseDropdown] = useState(false); // User preference for dropdown vs map
  const [mapKey, setMapKey] = useState(0); // Key to force remount of map
  const [allCountries, setAllCountries] = useState([]); // All countries from map data
  const [tooltip, setTooltip] = useState({ open: false, country: '', x: 0, y: 0, ruleCount: 0 }); // Tooltip state for map
  
  // Debug logging
  useEffect(() => {
    console.log('Map state:', { mapError, useDropdown, mapLoading, showDropdown: mapError || useDropdown });
  }, [mapError, useDropdown, mapLoading]);
  
  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    country: '',
    taggedFunctions: [],
    ruleType: 'validation',
    enabled: true
  });

  // Load all country rules for heat map
  useEffect(() => {
    const loadCountryRuleCounts = async () => {
      try {
        const allRulesData = await getAllCountryRules();
        const allRules = allRulesData?.rules || [];
        
        // Count rules for all countries (using normalized names)
        const counts = {};
        allRules.forEach(rule => {
          if (rule?.country) {
            const normalized = normalizeCountryName(rule.country);
            counts[normalized] = (counts[normalized] || 0) + 1;
          }
        });
        
        setCountryRuleCounts(counts);
      } catch (error) {
        console.error('Error loading country rule counts:', error);
        setCountryRuleCounts({});
      }
    };
    loadCountryRuleCounts();
  }, []);

  // Set timeout to stop loading spinner if map doesn't load
  useEffect(() => {
    if (useDropdown) return;
    
    const timer = setTimeout(() => {
      if (mapLoading) {
        console.warn('Map loading timeout - stopping spinner');
        setMapLoading(false);
        setMapError(true);
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timer);
  }, [mapLoading, useDropdown]);

  // Load toolkit functions on component mount
  useEffect(() => {
    loadAvailableOptions();
  }, []);

  // Load rules when country is selected
  useEffect(() => {
    if (selectedCountry) {
      loadRules();
    }
  }, [selectedCountry]);

  const loadRules = async () => {
    if (!selectedCountry) return;
    try {
      setLoading(true);
      const data = await getRulesForCountry(selectedCountry);
      setRules(data.rules || []);
      setFilteredRules(data.rules || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      setSnackbar({ open: true, message: 'Failed to load rules', severity: 'error' });
      setRules([]);
      setFilteredRules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOptions = async () => {
    try {
      const toolkitData = await fetchToolkit('toolkit');
      console.log('Toolkit data received:', toolkitData);
      // The API returns { toolkit: { functions: [...] } }
      const functions = toolkitData?.toolkit?.functions || toolkitData?.functions || [];
      console.log('Functions extracted:', functions.length);
      setAvailableFunctions(functions);
    } catch (error) {
      console.error('Error loading toolkit functions:', error);
      setSnackbar({ open: true, message: 'Failed to load toolkit functions', severity: 'error' });
    }
  };

  const getFilterOptions = () => {
    const functions = new Set();
    
    rules.forEach(rule => {
      rule.taggedFunctions?.forEach(funcId => functions.add(funcId));
    });
    
    return {
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
        if (rule.taggedFunctions?.some(funcId => {
          const func = availableFunctions.find(f => f.id === funcId);
          const funcName = func ? func.name : funcId;
          return funcName.toLowerCase().includes(query);
        })) return true;
        return false;
      });
    }

    if (selectedFunctionFilter) {
      filtered = filtered.filter(rule => 
        rule.taggedFunctions?.includes(selectedFunctionFilter)
      );
    }

    setFilteredRules(filtered);
  }, [rules, searchQuery, selectedFunctionFilter, availableFunctions]);

  const handleCreateRule = () => {
    setRuleForm({
      name: '',
      description: '',
      country: selectedCountry || '',
      taggedFunctions: [],
      ruleType: 'validation',
      enabled: true
    });
    setEditingRule(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule) => {
    setRuleForm({
      name: rule.name || '',
      description: rule.description || '',
      country: rule.country || selectedCountry || '',
      taggedFunctions: rule.taggedFunctions || [],
      ruleType: rule.ruleType || 'validation',
      enabled: rule.enabled !== undefined ? rule.enabled : true
    });
    setEditingRule(rule);
    setRuleDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      setLoading(true);
      await deleteCountryRule(ruleId);
      setSnackbar({ open: true, message: 'Country rule deleted successfully', severity: 'success' });
      loadRules();
      // Reload country counts for heat map
      const allRulesData = await getAllCountryRules();
      const allRules = allRulesData?.rules || [];
      const counts = {};
      allRules.forEach(rule => {
        if (rule?.country) {
          const normalized = normalizeCountryName(rule.country);
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
      setCountryRuleCounts(counts);
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
        ...ruleForm
      };
      
      if (editingRule) {
        await updateCountryRule(editingRule.id, ruleData);
        setSnackbar({ open: true, message: 'Country rule updated successfully', severity: 'success' });
      } else {
        await createCountryRule(ruleData);
        setSnackbar({ open: true, message: 'Country rule created successfully', severity: 'success' });
      }
      setRuleDialogOpen(false);
      loadRules();
      // Reload country counts for heat map
      const allRulesData = await getAllCountryRules();
      const allRules = allRulesData?.rules || [];
      const counts = {};
      allRules.forEach(rule => {
        if (rule?.country) {
          const normalized = normalizeCountryName(rule.country);
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
      setCountryRuleCounts(counts);
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

  const filterOptions = getFilterOptions();
  const maxCount = Math.max(...Object.values(countryRuleCounts), 1);

  console.log('CountryRuleBuilder: About to render JSX', { currentTheme, darkMode, selectedCountry });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          onClick={onBack}
          sx={{ mb: 1, color: currentTheme?.textSecondary }}
        >
          ← Back to Type Selection
        </Button>
        <Typography variant="h4" sx={{ color: currentTheme?.text }}>
          Rule Builder: Country Rules
        </Typography>
        <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
          {selectedCountry || 'Select a country from the map'}
        </Typography>
      </Box>

      {/* Country Map/Selector */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
        <Typography variant="h6" sx={{ color: currentTheme?.text, display: 'flex', alignItems: 'center', fontSize: '1.1rem', mb: 1 }}>
          <Box sx={{ fontSize: 20, mr: 1 }}>🌍</Box>
          Select Country
        </Typography>
        
        {useDropdown ? (
          // Fallback: Country dropdown selector
          <Box>
            <FormControl fullWidth>
              <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                Select Country
              </InputLabel>
              <Select
                value={selectedCountry || ''}
                onChange={(e) => setSelectedCountry(e.target.value)}
                label="Select Country"
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
                  },
                  '& .MuiSelect-select': {
                    color: currentTheme?.text
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme?.card,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                      maxHeight: 400,
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
                {allCountries.map((country) => (
                    <MenuItem key={country} value={country}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography>{country}</Typography>
                        {countryRuleCounts[country] > 0 && (
                          <Chip
                            label={countryRuleCounts[country]}
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: currentTheme?.primary,
                              color: '#fff',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {mapError && (
              <Typography variant="body2" sx={{ mt: 1, color: currentTheme?.textSecondary, fontStyle: 'italic' }}>
                Map failed to load. Using dropdown selector instead.
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: '650px', position: 'relative', bgcolor: currentTheme?.background, minHeight: '650px', overflow: 'hidden' }}>
            <ComposableMap
              key={mapKey}
              projectionConfig={{
                scale: 200,
                center: [0, 10]
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) => {
                  // Mark as loaded when we get geographies and extract all countries
                  if (geographies && geographies.length > 0) {
                    if (mapLoading) {
                      setMapLoading(false);
                      setMapError(false);
                      
                      // Extract all unique country names from map data and normalize them
                      const uniqueCountries = new Set();
                      geographies.forEach(geo => {
                        const countryName = geo.properties.name || geo.properties.NAME || geo.properties.NAME_LONG || '';
                        if (countryName) {
                          const normalized = normalizeCountryName(countryName);
                          uniqueCountries.add(normalized);
                        }
                      });
                      const sortedCountries = Array.from(uniqueCountries).sort();
                      setAllCountries(sortedCountries);
                    }
                  }
                  
                  if (!geographies || geographies.length === 0) {
                    // Only show loading if we're still in loading state
                    if (mapLoading) {
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 2 }}>
                          <CircularProgress sx={{ color: currentTheme?.primary }} />
                          <Typography sx={{ color: currentTheme?.textSecondary }}>
                            Loading map data...
                          </Typography>
                        </Box>
                      );
                    }
                    // If loading is done but no data, show error message
                    return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: 2 }}>
                        <Typography sx={{ color: currentTheme?.textSecondary }}>
                          Map failed to load. Use the country dropdown to select a country.
                        </Typography>
                      </Box>
                    );
                  }
                  
                  return geographies.map((geo) => {
                    const countryName = geo.properties.name || geo.properties.NAME || geo.properties.NAME_LONG || '';
                    // Normalize the country name
                    const normalizedCountry = normalizeCountryName(countryName);
                    
                    // All countries are now selectable
                    const isSelectable = !!countryName;
                    const ruleCount = normalizedCountry ? (countryRuleCounts[normalizedCountry] || 0) : 0;
                    const isSelected = selectedCountry && normalizedCountry && 
                      selectedCountry.toLowerCase() === normalizedCountry.toLowerCase();
                    const intensity = maxCount > 0 ? ruleCount / maxCount : 0;
                    
                    const getHeatMapColor = (intensity) => {
                      if (intensity === 0) {
                        return darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
                      }
                      
                      const primaryHex = currentTheme?.primary || '#2196f3';
                      const r = parseInt(primaryHex.slice(1, 3), 16);
                      const g = parseInt(primaryHex.slice(3, 5), 16);
                      const b = parseInt(primaryHex.slice(5, 7), 16);
                      
                      if (darkMode) {
                        const opacity = 0.2 + (intensity * 0.6);
                        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                      } else {
                        const opacity = 0.3 + (intensity * 0.7);
                        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
                      }
                    };

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={(e) => {
                          if (normalizedCountry) {
                            const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                            if (rect) {
                              setTooltip({
                                open: true,
                                country: normalizedCountry,
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                ruleCount: ruleCount
                              });
                            }
                          }
                        }}
                        onMouseMove={(e) => {
                          if (normalizedCountry && tooltip.open) {
                            const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                            if (rect) {
                              setTooltip(prev => ({
                                ...prev,
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top
                              }));
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          setTooltip({ open: false, country: '', x: 0, y: 0, ruleCount: 0 });
                        }}
                        onClick={() => {
                          if (isSelectable && normalizedCountry) {
                            setSelectedCountry(normalizedCountry);
                          }
                        }}
                        style={{
                          default: {
                            fill: isSelected 
                              ? currentTheme?.primary 
                              : isSelectable 
                                ? getHeatMapColor(intensity)
                                : darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                            stroke: isSelected 
                              ? currentTheme?.primary 
                              : darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            strokeWidth: isSelected ? 2 : 0.5,
                            outline: 'none',
                            cursor: isSelectable ? 'pointer' : 'default'
                          },
                          hover: {
                            fill: isSelectable 
                              ? (isSelected ? currentTheme?.primary : getHeatMapColor(Math.min(intensity + 0.2, 1)))
                              : darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            stroke: isSelectable ? currentTheme?.primary : darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            strokeWidth: 1.5,
                            outline: 'none',
                            cursor: isSelectable ? 'pointer' : 'default',
                            transition: 'all 0.2s'
                          },
                          pressed: {
                            fill: isSelectable ? currentTheme?.primary : darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            stroke: isSelectable ? currentTheme?.primary : darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                            strokeWidth: 2,
                            outline: 'none'
                          }
                        }}
                      />
                    );
                  });
                }}
              </Geographies>
            </ComposableMap>
            {/* Tooltip for country names */}
            {tooltip.open && (
              <Box
                sx={{
                  position: 'absolute',
                  left: tooltip.x + 10,
                  top: tooltip.y - 10,
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.text,
                  border: `1px solid ${currentTheme?.border}`,
                  borderRadius: 1,
                  p: 1,
                  pointerEvents: 'none',
                  zIndex: 1000,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  maxWidth: 200
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {tooltip.country}
                </Typography>
                {tooltip.ruleCount > 0 && (
                  <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                    {tooltip.ruleCount} rule{tooltip.ruleCount !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Search and Filters */}
      {selectedCountry && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
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
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: currentTheme?.background,
                    color: currentTheme?.text,
                    '& fieldset': {
                      borderColor: currentTheme?.border
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '& input::placeholder': {
                      color: currentTheme?.textSecondary,
                      opacity: 1
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={filterOptions.functions}
                getOptionLabel={(option) => option.name || option.id}
                value={selectedFunctionFilter ? filterOptions.functions.find(f => f.id === selectedFunctionFilter) : null}
                onChange={(event, newValue) => setSelectedFunctionFilter(newValue ? newValue.id : null)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Filter by Function"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: currentTheme?.background,
                        color: currentTheme?.text,
                        '& fieldset': {
                          borderColor: currentTheme?.border
                        },
                        '&:hover fieldset': {
                          borderColor: currentTheme?.primary
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: currentTheme?.primary
                        },
                        '& input::placeholder': {
                          color: currentTheme?.textSecondary,
                          opacity: 1
                        }
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ color: currentTheme?.text }}>
                    <img src="/python.svg" alt="Python" style={{ width: 18, height: 18, marginRight: 8 }} />
                    {option.name}
                  </Box>
                )}
                sx={{ width: '100%' }}
                PaperComponent={({ children, ...other }) => (
                  <Paper {...other} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                    {children}
                  </Paper>
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                  Country
                </InputLabel>
                <Select
                  value={selectedCountry || ''}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  label="Country"
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
                    },
                    '& .MuiSelect-select': {
                      color: currentTheme?.text
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: currentTheme?.card,
                        color: currentTheme?.text,
                        border: `1px solid ${currentTheme?.border}`,
                        maxHeight: 400,
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
                  {allCountries.map((country) => (
                    <MenuItem key={country} value={country}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography>{country}</Typography>
                        {countryRuleCounts[country] > 0 && (
                          <Chip
                            label={countryRuleCounts[country]}
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: currentTheme?.primary,
                              color: '#fff',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Active Filters */}
          {selectedFunctionFilter && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`Function: ${filterOptions.functions.find(f => f.id === selectedFunctionFilter)?.name || selectedFunctionFilter}`}
                onDelete={() => setSelectedFunctionFilter(null)}
                icon={<img src="/python.svg" alt="Python" style={{ width: 14, height: 14 }} />}
                sx={{ bgcolor: currentTheme?.background, color: currentTheme?.text }}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Rules List */}
      {selectedCountry && (
        <Paper elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme?.border}` }}>
            <Typography variant="h6" sx={{ color: currentTheme?.text }}>
              Rules ({filteredRules.length})
            </Typography>
          </Box>
          {loading ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: currentTheme?.primary }} />
            </Box>
          ) : filteredRules.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography sx={{ color: currentTheme?.textSecondary }}>
                {searchQuery || selectedFunctionFilter
                  ? 'No rules match your filters'
                  : 'No rules defined for this country'}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredRules.map((rule, index) => {
                const ruleTypeColor = getRuleTypeColor(rule.ruleType);
                return (
                  <React.Fragment key={rule.id || index}>
                    <ListItem
                      sx={{
                        bgcolor: currentTheme?.background,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ color: currentTheme?.text, fontWeight: 600 }}>
                              {rule.name}
                            </Typography>
                            <Chip
                              label={rule.ruleType}
                              size="small"
                              sx={{
                                ...ruleTypeColor,
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                            {!rule.enabled && (
                              <Chip
                                label="Disabled"
                                size="small"
                                sx={{
                                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                  color: currentTheme?.textSecondary,
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {rule.description && (
                              <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, mb: 1 }}>
                                {rule.description}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {rule.taggedFunctions?.map((funcId, idx) => {
                                const func = availableFunctions.find(f => f.id === funcId);
                                return (
                                  <Chip
                                    key={idx}
                                    label={func ? func.name : funcId}
                                    size="small"
                                    icon={<img src="/python.svg" alt="Python" style={{ width: 14, height: 14 }} />}
                                    sx={{
                                      bgcolor: currentTheme?.background,
                                      color: currentTheme?.text,
                                      fontSize: '0.7rem',
                                      height: 20
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              edge="end"
                              onClick={() => handleEditRule(rule)}
                              sx={{ color: currentTheme?.textSecondary }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteRule(rule.id)}
                              sx={{ color: currentTheme?.textSecondary }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredRules.length - 1 && <Divider component="li" sx={{ borderColor: currentTheme?.border }} />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      )}

      {/* Create Rule FAB */}
      {selectedCountry && (
        <Fab
          color="primary"
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
      )}

      {/* Rule Editor Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme?.card,
            border: `1px solid ${currentTheme?.border}`,
            boxShadow: 'none'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: currentTheme?.text, 
          borderBottom: `1px solid ${currentTheme?.border}`,
          pr: 6,
          overflow: 'visible',
          whiteSpace: 'normal',
          wordBreak: 'break-word'
        }}>
          {editingRule ? 'Edit Country Rule' : 'Create Country Rule'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, overflow: 'visible' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: currentTheme?.background,
                    color: currentTheme?.text,
                    '& fieldset': {
                      borderColor: currentTheme?.border
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '& input::placeholder': {
                      color: currentTheme?.textSecondary,
                      opacity: 1
                    },
                    '& input': {
                      minWidth: 0,
                      width: '100%',
                      overflow: 'visible',
                      textOverflow: 'ellipsis'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: currentTheme?.textSecondary,
                    whiteSpace: 'nowrap',
                    overflow: 'visible !important',
                    textOverflow: 'clip',
                    maxWidth: 'none !important',
                    width: 'auto !important',
                    '&.Mui-focused': {
                      color: currentTheme?.primary
                    },
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -9px) scale(0.75) !important',
                      maxWidth: 'none !important',
                      width: 'auto !important',
                      overflow: 'visible !important',
                      textOverflow: 'clip',
                      whiteSpace: 'nowrap'
                    }
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    '& legend': {
                      maxWidth: 'none !important',
                      width: 'auto !important'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={ruleForm.description}
                onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: currentTheme?.background,
                    color: currentTheme?.text,
                    '& fieldset': {
                      borderColor: currentTheme?.border
                    },
                    '&:hover fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: currentTheme?.primary
                    },
                    '& input::placeholder': {
                      color: currentTheme?.textSecondary,
                      opacity: 1
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
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                  Country
                </InputLabel>
                <Select
                  value={ruleForm.country || selectedCountry || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, country: e.target.value })}
                  label="Country"
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
                    '& .MuiSelect-select': {
                      color: currentTheme?.text
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
                        maxHeight: 400,
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
                  {allCountries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>Rule Type</InputLabel>
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
                    '& .MuiSelect-select': {
                      color: currentTheme?.text
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
                  {['validation', 'transformation', 'business', 'quality'].map((type) => {
                    const typeColor = getRuleTypeColor(type);
                    return (
                      <MenuItem
                        key={type}
                        value={type}
                        sx={{
                          ...typeColor,
                          '&:hover': {
                            bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                          }
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: currentTheme?.background, borderRadius: 1 }}>
                <Typography sx={{ color: currentTheme?.text }}>Enabled</Typography>
                <Switch
                  checked={ruleForm.enabled}
                  onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: currentTheme?.primary
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      bgcolor: currentTheme?.primary
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={availableFunctions}
                getOptionLabel={(option) => option.name || option.id}
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
                    label="Tagged Functions"
                    placeholder="Select functions from toolkit"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: currentTheme?.background,
                        color: currentTheme?.text,
                        '& fieldset': {
                          borderColor: currentTheme?.border
                        },
                        '&:hover fieldset': {
                          borderColor: currentTheme?.primary
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: currentTheme?.primary
                        },
                        '& input::placeholder': {
                          color: currentTheme?.textSecondary,
                          opacity: 1
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
                PaperComponent={({ children, ...other }) => (
                  <Paper {...other} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                    {children}
                  </Paper>
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ color: currentTheme?.text }}>
                    <img src="/python.svg" alt="Python" style={{ width: 18, height: 18, marginRight: 8 }} />
                    {option.name}
                  </Box>
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      icon={<img src="/python.svg" alt="Python" style={{ width: 14, height: 14 }} />}
                      sx={{
                        bgcolor: currentTheme?.background,
                        color: currentTheme?.text
                      }}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${currentTheme?.border}` }}>
          <Button
            onClick={() => setRuleDialogOpen(false)}
            sx={{ color: currentTheme?.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRule}
            variant="contained"
            disabled={loading || !ruleForm.name.trim()}
            sx={{
              bgcolor: currentTheme?.primary,
              '&:hover': {
                bgcolor: currentTheme?.primary,
                opacity: 0.9
              },
              '&:disabled': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: currentTheme?.textSecondary
              }
            }}
          >
            {loading ? <CircularProgress size={20} /> : editingRule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default CountryRuleBuilder;
