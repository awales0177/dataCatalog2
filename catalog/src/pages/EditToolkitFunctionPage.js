import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  alpha,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DeleteModal from '../components/DeleteModal';
import TeamSelector from '../components/TeamSelector';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, createToolkitComponent, updateToolkitComponent, deleteToolkitComponent } from '../services/api';

const EditToolkitFunctionPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { functionId } = useParams();
  const navigate = useNavigate();
  const [functionData, setFunctionData] = useState(null);
  const [editedFunction, setEditedFunction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isNewFunction = !functionId || functionId === 'new';

  useEffect(() => {
    const loadFunctionData = async () => {
      try {
        if (isNewFunction) {
          // Create new function template
          const newFunction = {
            id: '', // This will be set to the function name when saving
            name: '',
            displayName: '',
            description: '',
            language: 'python',
            category: '',
            tags: [],
            code: '',
            author: '',
            version: '1.0.0',
            usage: '',
            dependencies: [],
            examples: [],
            parameters: [],
            git: '',
            rating: 5.0,
            downloads: 0
          };
          setFunctionData(newFunction);
          setEditedFunction(JSON.parse(JSON.stringify(newFunction)));
          setLoading(false);
        } else {
          // Load existing function
          const data = await fetchData('toolkit');
          const functions = data.toolkit.functions || [];
          const foundFunction = functions.find(f => f.id === functionId);
          
          if (foundFunction) {
            setFunctionData(foundFunction);
            setEditedFunction(JSON.parse(JSON.stringify(foundFunction)));
          } else {
            setError('Function not found');
          }
        }
      } catch (err) {
        setError('Failed to load function data');
        // Handle error silently
      } finally {
        setLoading(false);
      }
    };

    loadFunctionData();
  }, [functionId, isNewFunction]);

  const handleFieldChange = (path, value) => {
    setEditedFunction(prev => {
      const newFunction = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newFunction;
      
      // Navigate to the parent of the target field
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }
      
      // Set the value
      current[pathArray[pathArray.length - 1]] = value;
      return newFunction;
    });
  };

  const handleArrayFieldChange = (path, index, value) => {
    setEditedFunction(prev => {
      const newFunction = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newFunction;
      
      // Navigate to the array
      for (let i = 0; i < pathArray.length; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = [];
        }
        current = current[pathArray[i]];
      }
      
      // Update the array item
      if (Array.isArray(current)) {
        current[index] = value;
      }
      return newFunction;
    });
  };

  const addArrayItem = (path) => {
    setEditedFunction(prev => {
      const newFunction = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newFunction;
      
      // Navigate to the array
      for (let i = 0; i < pathArray.length; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = [];
        }
        current = current[pathArray[i]];
      }
      
      // Add new item based on path
      if (Array.isArray(current)) {
        if (path === 'parameters') {
          current.push({
            name: '',
            type: 'string',
            description: '',
            required: true,
            default: undefined,
            allowedValues: [],
            min: undefined,
            max: undefined,
            pattern: '',
            example: ''
          });
        } else {
          current.push('');
        }
      }
      return newFunction;
    });
  };

  const removeArrayItem = (path, index) => {
    setEditedFunction(prev => {
      const newFunction = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newFunction;
      
      // Navigate to the array
      for (let i = 0; i < pathArray.length; i++) {
        current = current[pathArray[i]];
      }
      
      // Remove item
      if (Array.isArray(current)) {
        current.splice(index, 1);
      }
      return newFunction;
    });
  };

  const validateFunctionName = (name) => {
    // Function name should be lowercase, no spaces, alphanumeric + underscores only
    const functionNameRegex = /^[a-z][a-z0-9_]*$/;
    return functionNameRegex.test(name);
  };

  const formatFunctionName = (name) => {
    // Convert to lowercase, replace spaces and special chars with underscores
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleSave = async () => {
    // Validation
    if (!editedFunction.displayName?.trim()) {
      setSnackbar({
        open: true,
        message: 'Display name is required',
        severity: 'error'
      });
      return;
    }

    if (!editedFunction.name?.trim()) {
      setSnackbar({
        open: true,
        message: 'Function name (ID) is required',
        severity: 'error'
      });
      return;
    }

    if (!validateFunctionName(editedFunction.name)) {
      setSnackbar({
        open: true,
        message: 'Function name must be lowercase, start with a letter, and contain only letters, numbers, and underscores',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      if (isNewFunction) {
        await createToolkitComponent({
          ...editedFunction,
          type: 'functions',
          id: editedFunction.name // Use function name as ID
        });
        setSnackbar({
          open: true,
          message: 'Function created successfully!',
          severity: 'success'
        });
        setTimeout(() => navigate('/toolkit'), 1500);
      } else {
        await updateToolkitComponent('functions', functionId, editedFunction);
        setSnackbar({
          open: true,
          message: 'Function updated successfully!',
          severity: 'success'
        });
        setTimeout(() => navigate(-1), 1500);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${isNewFunction ? 'creating' : 'updating'} function: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteToolkitComponent('functions', functionId);
      setSnackbar({
        open: true,
        message: 'Function deleted successfully!',
        severity: 'success'
      });
      setTimeout(() => navigate('/toolkit'), 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting function: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const goBack = () => {
    if (isNewFunction) {
      navigate('/toolkit');
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack}>
          Back to Toolkit
        </Button>
      </Box>
    );
  }

  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'scala', label: 'Scala' },
    { value: 'r', label: 'R' },
    { value: 'sql', label: 'SQL' },
    { value: 'bash', label: 'Bash' },
    { value: 'yaml', label: 'YAML' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' }
  ];

  const typeOptions = [
    { value: 'string', label: 'String' },
    { value: 'integer', label: 'Integer' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'array', label: 'Array' },
    { value: 'object', label: 'Object' },
    { value: 'any', label: 'Any' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          sx={{ mb: 2, color: currentTheme.textSecondary }}
        >
          Back to Toolkit
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CodeIcon sx={{ fontSize: 32 }} />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
              {isNewFunction ? 'Create New Function' : `Edit ${editedFunction?.displayName || editedFunction?.name || 'Function'}`}
            </Typography>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
              {isNewFunction ? 'Add a new reusable function to the toolkit' : 'Modify function details and parameters'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Form */}
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
              Basic Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Display Name *"
                  value={editedFunction?.displayName || ''}
                  onChange={(e) => handleFieldChange('displayName', e.target.value)}
                  placeholder="User-friendly name shown on cards"
                  sx={{
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                    '& .MuiOutlinedInput-root': { 
                      color: currentTheme.text,
                      '& fieldset': { borderColor: currentTheme.border },
                      '&:hover fieldset': { borderColor: currentTheme.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                    },
                    '& .MuiInputBase-input': { color: currentTheme.text }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    label="Function Name (ID) *"
                    value={editedFunction?.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Technical identifier (no spaces, lowercase)"
                    sx={{
                      '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                      '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                      '& .MuiOutlinedInput-root': { 
                        color: currentTheme.text,
                        '& fieldset': { borderColor: currentTheme.border },
                        '&:hover fieldset': { borderColor: currentTheme.primary },
                        '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                      },
                      '& .MuiInputBase-input': { color: currentTheme.text }
                    }}
                  />
                  {editedFunction?.displayName && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const suggestedName = formatFunctionName(editedFunction.displayName);
                        handleFieldChange('name', suggestedName);
                      }}
                      sx={{
                        mt: 1,
                        minWidth: 'auto',
                        px: 1,
                        color: currentTheme.primary,
                        borderColor: currentTheme.primary,
                        '&:hover': { 
                          borderColor: currentTheme.primary, 
                          bgcolor: alpha(currentTheme.primary, 0.1) 
                        }
                      }}
                      title="Generate function name from display name"
                    >
                      Generate
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mt: 0.5, display: 'block' }}>
                  Use lowercase letters, numbers, and underscores only. Must start with a letter.
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: currentTheme.textSecondary }}>
                    Programming Language *
                  </InputLabel>
                  <Select
                    value={editedFunction?.language || 'python'}
                    onChange={(e) => handleFieldChange('language', e.target.value)}
                    label="Programming Language *"
                    sx={{
                      color: currentTheme.text,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                      '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: currentTheme.card,
                          border: `1px solid ${currentTheme.border}`,
                          '& .MuiMenuItem-root': {
                            color: currentTheme.text,
                            '&:hover': { bgcolor: currentTheme.primary + '20' },
                            '&.Mui-selected': { bgcolor: currentTheme.primary + '40' }
                          }
                        }
                      }
                    }}
                  >
                    {languageOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description *"
                  value={editedFunction?.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  sx={{
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                    '& .MuiOutlinedInput-root': { 
                      color: currentTheme.text,
                      '& fieldset': { borderColor: currentTheme.border },
                      '&:hover fieldset': { borderColor: currentTheme.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                    },
                    '& .MuiInputBase-input': { color: currentTheme.text }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={editedFunction?.category || ''}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  sx={{
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                    '& .MuiOutlinedInput-root': { 
                      color: currentTheme.text,
                      '& fieldset': { borderColor: currentTheme.border },
                      '&:hover fieldset': { borderColor: currentTheme.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                    },
                    '& .MuiInputBase-input': { color: currentTheme.text }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TeamSelector
                  selectedTeams={editedFunction?.author ? [editedFunction.author] : []}
                  onTeamsChange={(teams) => {
                    handleFieldChange('author', teams.length > 0 ? teams[0] : '');
                  }}
                  currentTheme={currentTheme}
                  label="Maintainer"
                  showLabel={true}
                  maxSelections={1}
                  placeholder="No maintainer selected"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Version"
                  value={editedFunction?.version || '1.0.0'}
                  onChange={(e) => handleFieldChange('version', e.target.value)}
                  sx={{
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                    '& .MuiOutlinedInput-root': { 
                      color: currentTheme.text,
                      '& fieldset': { borderColor: currentTheme.border },
                      '&:hover fieldset': { borderColor: currentTheme.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                    },
                    '& .MuiInputBase-input': { color: currentTheme.text }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GitHub Repository"
                  value={editedFunction?.git || ''}
                  onChange={(e) => handleFieldChange('git', e.target.value)}
                  placeholder="https://github.com/username/repo"
                  sx={{
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                    '& .MuiOutlinedInput-root': { 
                      color: currentTheme.text,
                      '& fieldset': { borderColor: currentTheme.border },
                      '&:hover fieldset': { borderColor: currentTheme.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                    },
                    '& .MuiInputBase-input': { color: currentTheme.text }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Code Section */}
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
              Function Code
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={8}
              label="Function Code *"
              value={editedFunction?.code || ''}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              placeholder="def my_function(param1, param2):\n    # Your code here\n    return result"
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                '& .MuiOutlinedInput-root': { 
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputBase-input': { 
                  color: currentTheme.text,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }
              }}
            />
          </Paper>

          {/* Parameters Section */}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text }}>
                Parameters
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => addArrayItem('parameters')}
                variant="outlined"
                size="small"
                sx={{
                  color: currentTheme.primary,
                  borderColor: currentTheme.primary,
                  '&:hover': { borderColor: currentTheme.primary, bgcolor: alpha(currentTheme.primary, 0.1) }
                }}
              >
                Add Parameter
              </Button>
            </Box>

            {editedFunction?.parameters?.map((param, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: currentTheme.background,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                      Parameter {index + 1}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => removeArrayItem('parameters', index)}
                    sx={{ color: '#f44336' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Parameter Name *"
                      value={param.name || ''}
                      onChange={(e) => handleArrayFieldChange('parameters', index, { ...param, name: e.target.value })}
                      size="small"
                      sx={{
                        '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                        '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                        '& .MuiOutlinedInput-root': { 
                          color: currentTheme.text,
                          '& fieldset': { borderColor: currentTheme.border },
                          '&:hover fieldset': { borderColor: currentTheme.primary },
                          '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                        },
                        '& .MuiInputBase-input': { color: currentTheme.text }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: currentTheme.textSecondary }}>
                        Type *
                      </InputLabel>
                      <Select
                        value={param.type || 'string'}
                        onChange={(e) => handleArrayFieldChange('parameters', index, { ...param, type: e.target.value })}
                        label="Type *"
                        sx={{
                          color: currentTheme.text,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                          '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              bgcolor: currentTheme.card,
                              border: `1px solid ${currentTheme.border}`,
                              '& .MuiMenuItem-root': {
                                color: currentTheme.text,
                                '&:hover': { bgcolor: currentTheme.primary + '20' },
                                '&.Mui-selected': { bgcolor: currentTheme.primary + '40' }
                              }
                            }
                          }
                        }}
                      >
                        {typeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description *"
                      value={param.description || ''}
                      onChange={(e) => handleArrayFieldChange('parameters', index, { ...param, description: e.target.value })}
                      size="small"
                      sx={{
                        '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                        '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                        '& .MuiOutlinedInput-root': { 
                          color: currentTheme.text,
                          '& fieldset': { borderColor: currentTheme.border },
                          '&:hover fieldset': { borderColor: currentTheme.primary },
                          '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                        },
                        '& .MuiInputBase-input': { color: currentTheme.text }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={param.required !== false}
                          onChange={(e) => handleArrayFieldChange('parameters', index, { ...param, required: e.target.checked })}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: currentTheme.text }}>
                            Required Parameter
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: param.required !== false ? '#f44336' : '#4caf50',
                              fontWeight: 500
                            }}
                          >
                            {param.required !== false ? '●' : '○'}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        '& .MuiFormControlLabel-label': { color: currentTheme.text },
                        '& .MuiSwitch-root': {
                          '& .MuiSwitch-switchBase': {
                            color: currentTheme.border,
                          },
                          '& .MuiSwitch-track': {
                            backgroundColor: currentTheme.border,
                          },
                          '& .Mui-checked': {
                            color: currentTheme.primary,
                            '& + .MuiSwitch-track': {
                              backgroundColor: currentTheme.primary,
                            },
                          },
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={param.required !== false ? "Default Value (Optional)" : "Default Value (Recommended)"}
                      value={param.default !== undefined ? param.default : ''}
                      onChange={(e) => handleArrayFieldChange('parameters', index, { ...param, default: e.target.value || undefined })}
                      placeholder={param.required !== false ? "Leave empty if no default" : "Provide a default value"}
                      size="small"
                      sx={{
                        '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                        '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                        '& .MuiOutlinedInput-root': { 
                          color: currentTheme.text,
                          '& fieldset': { borderColor: currentTheme.border },
                          '&:hover fieldset': { borderColor: currentTheme.primary },
                          '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                        },
                        '& .MuiInputBase-input': { color: currentTheme.text }
                      }}
                    />
                    {param.required !== false && (
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary || '#666', mt: 0.5, display: 'block' }}>
                        Required parameters should typically not have default values
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Example Value"
                      value={param.example || ''}
                      onChange={(e) => handleArrayFieldChange('parameters', index, { ...param, example: e.target.value })}
                      size="small"
                      sx={{
                        '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                        '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                        '& .MuiOutlinedInput-root': { 
                          color: currentTheme.text,
                          '& fieldset': { borderColor: currentTheme.border },
                          '&:hover fieldset': { borderColor: currentTheme.primary },
                          '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                        },
                        '& .MuiInputBase-input': { color: currentTheme.text }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {(!editedFunction?.parameters || editedFunction.parameters.length === 0) && (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                No parameters defined. Click "Add Parameter" to get started.
              </Typography>
            )}
          </Paper>

          {/* Tags Section */}
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
              Tags
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {editedFunction?.tags?.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => {
                    const newTags = [...(editedFunction.tags || [])];
                    newTags.splice(index, 1);
                    handleFieldChange('tags', newTags);
                  }}
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                    '& .MuiChip-deleteIcon': { color: currentTheme.primary }
                  }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              label="Add Tag"
              placeholder="Type a tag and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newTags = [...(editedFunction.tags || []), e.target.value.trim()];
                  handleFieldChange('tags', newTags);
                  e.target.value = '';
                }
              }}
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                '& .MuiOutlinedInput-root': { 
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputBase-input': { color: currentTheme.text }
              }}
            />
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Actions */}
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
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  bgcolor: currentTheme.primary,
                  '&:hover': { bgcolor: currentTheme.primary, opacity: 0.9 },
                  '&:disabled': { bgcolor: currentTheme.textSecondary }
                }}
              >
                {saving ? <CircularProgress size={20} /> : (isNewFunction ? 'Create Function' : 'Save Changes')}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={goBack}
                sx={{
                  color: currentTheme.textSecondary,
                  borderColor: currentTheme.border,
                  '&:hover': { borderColor: currentTheme.primary, bgcolor: alpha(currentTheme.primary, 0.1) }
                }}
              >
                Cancel
              </Button>

              {!isNewFunction && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowDeleteModal(true)}
                  sx={{
                    color: '#f44336',
                    borderColor: '#f44336',
                    '&:hover': { borderColor: '#f44336', bgcolor: alpha('#f44336', 0.1) }
                  }}
                >
                  Delete Function
                </Button>
              )}
            </Box>
          </Paper>

          {/* Usage Instructions */}
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
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Usage Instructions
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="How to use this function"
              value={editedFunction?.usage || ''}
              onChange={(e) => handleFieldChange('usage', e.target.value)}
              placeholder="Describe how developers should use this function..."
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                '& .MuiOutlinedInput-root': { 
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputBase-input': { color: currentTheme.text }
              }}
            />
          </Paper>

          {/* Dependencies */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Dependencies
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {editedFunction?.dependencies?.map((dep, index) => (
                <Chip
                  key={index}
                  label={dep}
                  onDelete={() => {
                    const newDeps = [...(editedFunction.dependencies || [])];
                    newDeps.splice(index, 1);
                    handleFieldChange('dependencies', newDeps);
                  }}
                  sx={{
                    bgcolor: alpha(currentTheme.secondary || '#9c27b0', 0.1),
                    color: currentTheme.secondary || '#9c27b0',
                    '& .MuiChip-deleteIcon': { color: currentTheme.secondary || '#9c27b0' }
                  }}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              label="Add Dependency"
              placeholder="Type a dependency and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newDeps = [...(editedFunction.dependencies || []), e.target.value.trim()];
                  handleFieldChange('dependencies', newDeps);
                  e.target.value = '';
                }
              }}
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                '& .MuiOutlinedInput-root': { 
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputBase-input': { color: currentTheme.text }
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Function"
        itemName={editedFunction?.displayName || editedFunction?.name}
        itemType="function"
        theme={currentTheme}
      >
        <Typography sx={{ mb: 2 }}>
          This will:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
          <Typography component="li">Permanently delete the function "{editedFunction?.displayName || editedFunction?.name}"</Typography>
          <Typography component="li">Remove all function data and configurations</Typography>
          <Typography component="li">Break any existing references to this function</Typography>
          <Typography component="li">Require manual cleanup of external references</Typography>
        </Box>
      </DeleteModal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditToolkitFunctionPage;
