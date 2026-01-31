import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  alpha,
  Autocomplete,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, updateToolkitPackage, importFunctionsFromLibrary, createToolkitComponent } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EditToolkitPackagePage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [packageData, setPackageData] = useState(null);
  const [editedPackage, setEditedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const isNewPackage = !packageId || packageId === 'new';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [maintainerInput, setMaintainerInput] = useState('');
  const [allAvailableFunctions, setAllAvailableFunctions] = useState([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPackageName, setImportPackageName] = useState('');
  const [importModulePath, setImportModulePath] = useState('');
  const [importPypiUrl, setImportPypiUrl] = useState('');
  const [importBulkMode, setImportBulkMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedFunctions, setImportedFunctions] = useState([]);
  const [importError, setImportError] = useState(null);
  const [selectedImportFunctions, setSelectedImportFunctions] = useState(new Set());
  const [pendingFunctions, setPendingFunctions] = useState([]); // Functions to be created on save
  const [pendingFunctionMap, setPendingFunctionMap] = useState(new Map()); // Map of temp ID to function object

  useEffect(() => {
    const loadPackageData = async () => {
      try {
        if (isNewPackage) {
          // Create new package template
          const newPackageInfo = {
            name: '',
            functions: [],
            language: 'python',
            description: '',
            version: '',
            latestReleaseDate: '',
            maintainers: [],
            documentation: '',
            githubRepo: '',
            pipInstall: '',
            functionIds: [],
          };
          setPackageData(newPackageInfo);
          setEditedPackage(JSON.parse(JSON.stringify(newPackageInfo)));
          setLoading(false);
          
          // Load functions list in background for autocomplete
          try {
            const data = await fetchData('toolkit');
            const functions = data.toolkit.functions || [];
            setAllAvailableFunctions(functions);
          } catch (err) {
            console.warn('Failed to load functions list:', err);
            setAllAvailableFunctions([]);
          }
        } else {
          setLoading(true);
          setError(null);
          
          try {
        
            const data = await fetchData('toolkit');
            const functions = data.toolkit.functions || [];
            setAllAvailableFunctions(functions);
            
            // Group functions by package
            const getPackageName = (func) => {
              if (func.language !== 'python') return null;
              if (func.source_module) {
                const parts = func.source_module.split('.');
                return parts[0];
              }
              if (func.dependencies && func.dependencies.length > 0) {
                const packageDep = func.dependencies.find(dep => 
                  typeof dep === 'string' && !dep.includes('/') && !dep.includes('http')
                );
                if (packageDep) {
                  return packageDep.split(/[>=<!=]/)[0].trim();
                }
              }
              return null;
            };

            // Check if package metadata exists in toolkit.packages first
            const packages = data.toolkit.packages || [];
            // Try to find by ID first, then fallback to name for backward compatibility
            const existingPackage = packages.find(p => p.id === packageId) || 
                                   packages.find(p => p.name === packageId);
            
            // Get functions associated with this package
            let packageFunctions = [];
            if (existingPackage?.functionIds && existingPackage.functionIds.length > 0) {
              packageFunctions = functions.filter(f => existingPackage.functionIds.includes(f.id));
            } else {
              // Fallback: try to find by name if no functionIds
              const packageName = existingPackage?.name || packageId;
              packageFunctions = functions.filter(func => {
                const pkg = getPackageName(func);
                return pkg === packageName;
              });
            }

            // Show package if it exists in packages array OR has associated functions
            if (existingPackage || packageFunctions.length > 0) {
              const packageName = existingPackage?.name || packageId;
              const packageInfo = {
                id: existingPackage?.id || packageId,
                name: packageName,
                functions: packageFunctions,
                language: packageFunctions.length > 0 ? (packageFunctions[0]?.language || 'python') : (existingPackage?.language || 'python'),
                description: existingPackage?.description || `Python package ${packageName}`,
                version: existingPackage?.version || '',
                latestReleaseDate: existingPackage?.latestReleaseDate || '',
                maintainers: existingPackage?.maintainers || [],
                documentation: existingPackage?.documentation || '',
                githubRepo: existingPackage?.githubRepo || '',
                pipInstall: existingPackage?.pipInstall || `pip install ${packageName}`,
                functionIds: existingPackage?.functionIds || packageFunctions.map(f => f.id),
              };

              setPackageData(packageInfo);
              setEditedPackage(JSON.parse(JSON.stringify(packageInfo)));
            } else {
              setError('Package not found');
            }
          } catch (err) {
            console.error('Error loading package data:', err);
            setError('Failed to load package data');
          } finally {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error in loadPackageData:', err);
        setError('Failed to load package data');
        setLoading(false);
      }
    };

    loadPackageData();
  }, [packageId, isNewPackage]);

  const handleFieldChange = (field, value) => {
    setEditedPackage(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddMaintainer = () => {
    if (maintainerInput.trim() && !editedPackage.maintainers.includes(maintainerInput.trim())) {
      handleFieldChange('maintainers', [...editedPackage.maintainers, maintainerInput.trim()]);
      setMaintainerInput('');
    }
  };

  const handleRemoveMaintainer = (maintainer) => {
    handleFieldChange('maintainers', editedPackage.maintainers.filter(m => m !== maintainer));
  };

  const handleSave = async () => {
    if (!editedPackage.name || !editedPackage.name.trim()) {
      setSnackbar({ open: true, message: 'Package name is required', severity: 'error' });
      return;
    }
    
    setSaving(true);
    try {
      // First, create any pending functions that don't exist yet
      const tempIdsToReplace = new Map(); // Map of temp ID to real ID
      
      if (pendingFunctionMap.size > 0) {
        // Get all existing functions to check for duplicates
        const data = await fetchData('toolkit');
        const existingFunctions = data.toolkit.functions || [];
        const existingNames = new Set(existingFunctions.map(f => f.name));
        
        // Process each pending function
        for (const [tempId, func] of pendingFunctionMap.entries()) {
          // Check if this temp ID is in the functionIds (user might have removed it)
          if (!(editedPackage?.functionIds || []).includes(tempId)) {
            continue; // Skip if not in functionIds
          }
          
          // Skip if function with this name already exists
          if (existingNames.has(func.name)) {
            // Find the existing function's ID
            const existingFunc = existingFunctions.find(f => f.name === func.name);
            if (existingFunc && existingFunc.id) {
              tempIdsToReplace.set(tempId, existingFunc.id);
            }
            continue;
          }
          
          try {
            const result = await createToolkitComponent({
              ...func,
              type: 'functions',
            });
            if (result && result.id) {
              tempIdsToReplace.set(tempId, result.id);
            }
          } catch (error) {
            console.error(`Failed to create function ${func.name}:`, error);
            // If it's a duplicate name error, try to find the existing function
            if (error.message && error.message.includes('already exists')) {
              const refreshData = await fetchData('toolkit');
              const existingFunc = refreshData.toolkit.functions?.find(f => f.name === func.name);
              if (existingFunc && existingFunc.id) {
                tempIdsToReplace.set(tempId, existingFunc.id);
              }
            }
          }
        }
        
        // Refresh available functions list after creating new ones
        const refreshData = await fetchData('toolkit');
        setAllAvailableFunctions(refreshData.toolkit.functions || []);
      }
      
      // Replace temp IDs with real IDs in functionIds
      const currentFunctionIds = editedPackage.functionIds || [];
      const finalFunctionIds = currentFunctionIds.map(id => {
        if (id.startsWith('pending_') && tempIdsToReplace.has(id)) {
          return tempIdsToReplace.get(id);
        }
        return id;
      }).filter(id => !id.startsWith('pending_')); // Remove any temp IDs that weren't replaced
      
      // Remove duplicates
      const uniqueFunctionIds = [...new Set(finalFunctionIds)];
      
      const packageIdToUse = isNewPackage ? 'new' : (editedPackage.id || editedPackage.name);
      const result = await updateToolkitPackage(packageIdToUse, {
        name: editedPackage.name, // Include name in the request
        description: editedPackage.description,
        version: editedPackage.version,
        latestReleaseDate: editedPackage.latestReleaseDate,
        maintainers: editedPackage.maintainers,
        documentation: editedPackage.documentation,
        githubRepo: editedPackage.githubRepo,
        pipInstall: editedPackage.pipInstall || `pip install ${editedPackage.name}`,
        functionIds: uniqueFunctionIds,
      });
      
      // Clear pending functions after successful save
      setPendingFunctions([]);
      setPendingFunctionMap(new Map());
      
      // Get the package ID from the response or use the existing one
      const savedPackageId = result?.package?.id || editedPackage.id;
      setSnackbar({ open: true, message: 'Package saved successfully', severity: 'success' });
      setTimeout(() => {
        navigate(`/toolkit/package/${encodeURIComponent(savedPackageId)}`);
      }, 1000);
    } catch (err) {
      console.error('Error saving package:', err);
      let errorMessage = 'Failed to save package';
      if (err && err.message) {
        errorMessage = err.message;
        // Remove duplicate prefixes if present
        if (errorMessage.includes('Error updating toolkit component:')) {
          errorMessage = errorMessage.replace(/^Error updating toolkit component:\s*/i, '');
        }
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleImportFromLibrary = async () => {
    if (!importPackageName.trim()) {
      setImportError('Package name is required');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportedFunctions([]);
    setSelectedImportFunctions(new Set());

    try {
      const result = await importFunctionsFromLibrary(
        importPackageName.trim(),
        importModulePath.trim() || null,
        importPypiUrl.trim() || null,
        importBulkMode
      );

      if (result.success && result.functions && result.functions.length > 0) {
        setImportedFunctions(result.functions);
      } else {
        setImportError(result.message || 'No functions found in the library');
      }
    } catch (error) {
      setImportError(error.message || 'Failed to import from library');
    } finally {
      setImporting(false);
    }
  };

  const handleToggleImportFunction = (funcIndex) => {
    setSelectedImportFunctions(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(funcIndex)) {
        newSelected.delete(funcIndex);
      } else {
        newSelected.add(funcIndex);
      }
      return newSelected;
    });
  };

  const handleSelectAllImported = () => {
    if (selectedImportFunctions.size === importedFunctions.length) {
      setSelectedImportFunctions(new Set());
    } else {
      setSelectedImportFunctions(new Set(importedFunctions.map((f, idx) => idx)));
    }
  };

  const handleAddImportedFunctions = () => {
    if (selectedImportFunctions.size === 0) {
      setSnackbar({ open: true, message: 'Please select at least one function to add', severity: 'warning' });
      return;
    }

    const functionsToAdd = importedFunctions.filter((f, idx) => selectedImportFunctions.has(idx));
    
    // Generate temporary IDs for pending functions
    const newPendingMap = new Map(pendingFunctionMap);
    const tempIds = [];
    
    functionsToAdd.forEach(func => {
      // Ensure name field exists
      if (!func.name) {
        console.warn('Function missing name field:', func);
        return; // Skip functions without names
      }
      
      // Check if function with same name already exists in pending
      const existingEntry = Array.from(newPendingMap.entries()).find(([_, f]) => f.name === func.name);
      if (existingEntry) {
        tempIds.push(existingEntry[0]); // Use existing temp ID
      } else {
        // Create new temp ID using the function name
        const tempId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${func.name}`;
        // Ensure all required fields are present
        const funcWithDefaults = {
          name: func.name,
          displayName: func.displayName || func.name.replace("_", " ").title(),
          description: func.description || `Function ${func.name}`,
          language: func.language || 'python',
          code: func.code || '',
          parameters: func.parameters || [],
          usage: func.usage || '',
          dependencies: func.dependencies || [],
          category: func.category || 'library-function',
          tags: func.tags || [],
          author: func.author || '',
          version: func.version || '1.0.0',
          ...func // Spread to include any other fields
        };
        newPendingMap.set(tempId, funcWithDefaults);
        tempIds.push(tempId);
      }
    });
    
    // Add functions to pending list
    setPendingFunctions(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const newFunctions = functionsToAdd.filter(f => !existingNames.has(f.name));
      return [...prev, ...newFunctions];
    });
    
    // Update pending function map
    setPendingFunctionMap(newPendingMap);
    
    // Add temp IDs to functionIds so they appear in the selector
    const currentFunctionIds = editedPackage?.functionIds || [];
    const updatedFunctionIds = [...new Set([...currentFunctionIds, ...tempIds])];
    handleFieldChange('functionIds', updatedFunctionIds);

    // Populate package name field if it's empty and we have an import package name
    if (isNewPackage && importPackageName.trim() && (!editedPackage.name || !editedPackage.name.trim())) {
      handleFieldChange('name', importPackageName.trim());
    }

    setSnackbar({ 
      open: true, 
      message: `Added ${functionsToAdd.length} function(s) to package. They will be created when you click Save.`, 
      severity: 'success' 
    });
    
    // Close dialog and reset import state
    setShowImportDialog(false);
    setImportedFunctions([]);
    setSelectedImportFunctions(new Set());
    setImportPackageName('');
    setImportModulePath('');
    setImportPypiUrl('');
  };

  if (!canEdit) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">You don't have permission to edit packages.</Alert>
      </Container>
    );
  }

  // Show loading spinner while loading or if editedPackage is not set yet
  if (loading || !editedPackage) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error only for existing packages that weren't found (not for new)
  if (error && !isNewPackage) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Package not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/toolkit')}
          variant="outlined"
        >
          Back to Toolkit
        </Button>
      </Container>
    );
  }

  // Show error only for existing packages that weren't found
  if (error && packageId !== 'new') {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Package not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/toolkit')}
          variant="outlined"
        >
          Back to Toolkit
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            if (isNewPackage) {
              navigate('/toolkit');
            } else {
              navigate(`/toolkit/package/${encodeURIComponent(editedPackage.id || editedPackage.name)}`);
            }
          }}
          variant="outlined"
          sx={{
            borderColor: currentTheme.border,
            color: currentTheme.text,
            '&:hover': {
              borderColor: currentTheme.primary,
              bgcolor: alpha(currentTheme.primary, 0.1),
            },
          }}
        >
          Cancel
        </Button>
        <Typography variant="h4" sx={{ color: currentTheme.text, flex: 1 }}>
          {isNewPackage ? 'Create New Package' : `Edit Package: ${editedPackage.name}`}
        </Typography>
        <Button
          startIcon={<SaveIcon />}
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{
            bgcolor: currentTheme.primary,
            color: '#fff',
            '&:hover': {
              bgcolor: currentTheme.primary,
              opacity: 0.9,
            },
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {/* Package Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
              Package Information
            </Typography>

            <TextField
              fullWidth
              label="Package Name"
              value={editedPackage.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={!isNewPackage}
              required
              placeholder="e.g., pandas, numpy, requests"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Project Description"
              value={editedPackage.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              multiline
              rows={4}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Version"
                  value={editedPackage.version}
                  onChange={(e) => handleFieldChange('version', e.target.value)}
                  placeholder="e.g., 1.0.0"
                  sx={{ mb: 3 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Latest Release Date"
                  value={editedPackage.latestReleaseDate}
                  onChange={(e) => handleFieldChange('latestReleaseDate', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  sx={{ mb: 3 }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Documentation URL"
              value={editedPackage.documentation}
              onChange={(e) => handleFieldChange('documentation', e.target.value)}
              placeholder="https://..."
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="GitHub Repository"
              value={editedPackage.githubRepo}
              onChange={(e) => handleFieldChange('githubRepo', e.target.value)}
              placeholder="https://github.com/username/repo"
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Pip Install Command"
              value={editedPackage.pipInstall}
              onChange={(e) => handleFieldChange('pipInstall', e.target.value)}
              placeholder="pip install package-name"
              sx={{ mb: 3 }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
              Maintainers
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add maintainer"
                value={maintainerInput}
                onChange={(e) => setMaintainerInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMaintainer();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddMaintainer}
                sx={{
                  borderColor: currentTheme.primary,
                  color: currentTheme.primary,
                }}
              >
                Add
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {editedPackage.maintainers.map((maintainer, index) => (
                <Chip
                  key={index}
                  label={maintainer}
                  onDelete={() => handleRemoveMaintainer(maintainer)}
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                    '& .MuiChip-deleteIcon': {
                      color: currentTheme.primary,
                    },
                  }}
                />
              ))}
            </Box>

            <Divider sx={{ my: 3, borderColor: currentTheme.border }} />

            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              See All Functions
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setShowImportDialog(true)}
              sx={{
                borderColor: currentTheme.primary,
                color: currentTheme.primary,
                '&:hover': {
                  borderColor: currentTheme.primary,
                  bgcolor: alpha(currentTheme.primary, 0.1),
                },
              }}
            >
              Import from Library
            </Button>
          </Paper>

        </Grid>
      </Grid>

      {/* Functions Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
          mt: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
          Functions
        </Typography>

        <Autocomplete
          multiple
          options={[
            ...allAvailableFunctions,
            ...Array.from(pendingFunctionMap.entries()).map(([tempId, func]) => ({
              ...func,
              id: tempId,
              isPending: true,
              name: func.name || 'Unknown',
              displayName: func.displayName || func.name || 'Unknown Function'
            }))
          ]}
          getOptionLabel={(option) => {
            if (!option) return '';
            return option.displayName || option.name || 'Unknown Function';
          }}
          value={[
            ...allAvailableFunctions.filter(f => {
              const functionIds = editedPackage?.functionIds || [];
              return functionIds.includes(f.id) && !f.id.startsWith('pending_');
            }),
            ...Array.from(pendingFunctionMap.entries())
              .filter(([tempId]) => (editedPackage?.functionIds || []).includes(tempId))
              .map(([tempId, func]) => ({
                ...func,
                id: tempId,
                isPending: true
              }))
          ]}
          onChange={(event, newValue) => {
            // Separate real IDs and temp IDs
            const realIds = newValue.filter(f => !f.isPending).map(f => f.id);
            const tempIds = newValue.filter(f => f.isPending).map(f => f.id);
            
            // If a pending function was removed, remove it from pending lists
            const currentTempIds = (editedPackage?.functionIds || []).filter(id => id.startsWith('pending_'));
            const removedTempIds = currentTempIds.filter(id => !tempIds.includes(id));
            
            if (removedTempIds.length > 0) {
              setPendingFunctionMap(prev => {
                const newMap = new Map(prev);
                removedTempIds.forEach(id => newMap.delete(id));
                return newMap;
              });
              
              setPendingFunctions(prev => {
                const removedFuncs = removedTempIds.map(id => prev.find(f => pendingFunctionMap.get(id)?.name === f.name)).filter(Boolean);
                return prev.filter(f => !removedFuncs.some(rf => rf.name === f.name));
              });
            }
            
            handleFieldChange('functionIds', [...realIds, ...tempIds]);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Functions"
              placeholder="Search and select functions to include in this package"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: currentTheme.background,
                  color: currentTheme.text,
                  '& fieldset': {
                    borderColor: currentTheme.border,
                  },
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ color: currentTheme.text }}>
              <CodeIcon sx={{ mr: 1, fontSize: 18, color: currentTheme.textSecondary }} />
              {option.displayName || option.name || 'Unknown Function'}
              {option.isPending && (
                <Chip 
                  label="Pending" 
                  size="small" 
                  sx={{ 
                    ml: 1, 
                    height: 20, 
                    fontSize: '0.7rem',
                    bgcolor: alpha('#ff9800', 0.2),
                    color: '#ff9800'
                  }} 
                />
              )}
            </Box>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={option.displayName || option.name || 'Unknown Function'}
                icon={<CodeIcon />}
                sx={{
                  bgcolor: option.isPending 
                    ? alpha('#ff9800', 0.1) 
                    : alpha(currentTheme.primary, 0.1),
                  color: option.isPending ? '#ff9800' : currentTheme.primary,
                }}
              />
            ))
          }
          PaperComponent={({ children, ...other }) => (
            <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
              {children}
            </Paper>
          )}
        />

        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {allAvailableFunctions
            .filter(f => {
              const functionIds = editedPackage?.functionIds || [];
              return functionIds.includes(f.id) && !f.id.startsWith('pending_');
            })
            .map((func) => (
              <Chip
                key={func.id}
                icon={<CodeIcon />}
                label={func.displayName || func.name}
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                  border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                  '& .MuiChip-icon': {
                    color: currentTheme.primary,
                  },
                }}
              />
            ))}
        </Box>
      </Paper>

      {/* Import Dialog */}
      <Dialog
        open={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          setImportedFunctions([]);
          setSelectedImportFunctions(new Set());
          setImportError(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>
          Import Functions from Library
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Package Name"
                value={importPackageName}
                onChange={(e) => setImportPackageName(e.target.value)}
                placeholder="e.g., pandas, numpy, requests"
                required
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Module Path (Optional)"
                value={importModulePath}
                onChange={(e) => setImportModulePath(e.target.value)}
                placeholder="e.g., pandas.io"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Custom PyPI URL (Optional)"
                value={importPypiUrl}
                onChange={(e) => setImportPypiUrl(e.target.value)}
                placeholder="https://pypi.org/simple"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={importBulkMode}
                    onChange={(e) => setImportBulkMode(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: currentTheme.primary,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: currentTheme.primary,
                      },
                    }}
                  />
                }
                label="Recursively see functions from submodules"
                sx={{ color: currentTheme.text }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={importing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                onClick={handleImportFromLibrary}
                disabled={importing || !importPackageName.trim()}
                fullWidth
                sx={{
                  bgcolor: currentTheme.primary,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: currentTheme.primary,
                    opacity: 0.9,
                  },
                }}
              >
                {importing ? 'Loading...' : 'See All Functions'}
              </Button>
            </Grid>
          </Grid>

          {importError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {importError}
            </Alert>
          )}

          {importedFunctions.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ color: currentTheme.text }}>
                  Imported Functions ({importedFunctions.length})
                </Typography>
                <Button
                  size="small"
                  onClick={handleSelectAllImported}
                  sx={{ color: currentTheme.primary }}
                >
                  {selectedImportFunctions.size === importedFunctions.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {importedFunctions.map((func, index) => {
                  const uniqueKey = func.id || `${func.name}_${func.source_module || ''}_${index}`;
                  const isSelected = selectedImportFunctions.has(index);
                  return (
                    <React.Fragment key={uniqueKey}>
                      <ListItem
                        secondaryAction={
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleImportFunction(index);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              color: currentTheme.primary,
                              '&.Mui-checked': {
                                color: currentTheme.primary,
                              },
                            }}
                          />
                        }
                        sx={{
                          bgcolor: isSelected 
                            ? alpha(currentTheme.primary, 0.1) 
                            : 'transparent',
                          borderRadius: 1,
                          mb: 1,
                          cursor: 'pointer',
                        }}
                      >
                        <ListItemButton
                          onClick={(e) => {
                            // Don't toggle if clicking on checkbox or its container
                            const target = e.target;
                            if (target.type === 'checkbox' || 
                                target.closest('input[type="checkbox"]') ||
                                target.closest('[role="checkbox"]')) {
                              return;
                            }
                            e.stopPropagation();
                            handleToggleImportFunction(index);
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <CodeIcon sx={{ mr: 2, color: currentTheme.primary }} />
                          <ListItemText
                            primary={func.displayName || func.name}
                            secondary={func.description || 'No description available'}
                            primaryTypographyProps={{ color: currentTheme.text }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < importedFunctions.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${currentTheme.border}` }}>
          <Button
            onClick={() => {
              setShowImportDialog(false);
              setImportedFunctions([]);
              setSelectedImportFunctions(new Set());
              setImportError(null);
            }}
            sx={{ color: currentTheme.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddImportedFunctions}
            disabled={saving || selectedImportFunctions.size === 0}
            variant="contained"
            sx={{
              bgcolor: currentTheme.primary,
              color: '#fff',
              '&:hover': {
                bgcolor: currentTheme.primary,
                opacity: 0.9,
              },
            }}
          >
            {saving ? 'Adding...' : `Add Selected (${selectedImportFunctions.size})`}
          </Button>
        </DialogActions>
      </Dialog>

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

export default EditToolkitPackagePage;

