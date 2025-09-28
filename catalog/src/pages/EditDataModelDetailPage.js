import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Grid,
  Divider,
  alpha,
  Tooltip,
  CircularProgress,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteModal from '../components/DeleteModal';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import { GoVerified } from "react-icons/go";
import { fetchData, updateModel, createModel, deleteModel } from '../services/api';
import { formatDate } from '../utils/themeUtils';
import cacheService from '../services/cache';
import ChangelogEditor from '../components/ChangelogEditor';
import DomainSelector from '../components/DomainSelector';
import { useAuth } from '../contexts/AuthContext';

const EditDataModelDetailPage = ({ currentTheme }) => {
  const { shortName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [model, setModel] = useState(null);
  const [editedModel, setEditedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState({ open: false, path: '', index: -1, label: '' });
  const [showShortNameChangeDialog, setShowShortNameChangeDialog] = useState(false);
  const [updateAssociatedLinks, setUpdateAssociatedLinks] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [shortNameError, setShortNameError] = useState('');
  const [checkingShortName, setCheckingShortName] = useState(false);
  const [shortNameTimeout, setShortNameTimeout] = useState(null);
  const [showDeleteModelModal, setShowDeleteModelModal] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectionPath, setSelectionPath] = useState('');
  const [availableOptions, setAvailableOptions] = useState([]);
  const [referenceData, setReferenceData] = useState([]);

  // Simple back function that goes back one level in the URL path
  const goToViewMode = () => {
    if (shortName === 'new') {
      // For new models, go directly to models page
      navigate('/models', { replace: true });
    } else {
      // Just go back one step in the URL path
      navigate(-1);
    }
  };

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('Loading model with URL shortName:', shortName);
        
        // Check if this is a new model creation
        if (shortName === 'new') {
          const newModelTemplate = localStorage.getItem('newModelTemplate');
          if (newModelTemplate) {
            const newModel = JSON.parse(newModelTemplate);
            setModel(newModel);
            setEditedModel(JSON.parse(JSON.stringify(newModel))); // Deep copy
            setLoading(false);
            return;
          } else {
            // If no template found, redirect to models page
            console.log('No new model template found, redirecting to models page');
            navigate('/models', { replace: true });
            return;
          }
        }
        
        const modelData = await fetchData('models');
        console.log('Available models:', modelData.models.map(m => ({ id: m.id, shortName: m.shortName, name: m.name })));
        
        const foundModel = modelData.models.find(m => m.shortName.toLowerCase() === shortName.toLowerCase());
        console.log('Found model:', foundModel);
        
        if (foundModel) {
          // Ensure versionHistory exists
          if (!foundModel.versionHistory) {
            foundModel.versionHistory = [
              {
                version: foundModel.version || '1.0.0',
                timestamp: foundModel.lastUpdated || new Date().toISOString(),
                updatedBy: 'System',
                changeDescription: 'Initial model load',
                changedFields: []
              }
            ];
          }
          setModel(foundModel);
          setEditedModel(JSON.parse(JSON.stringify(foundModel))); // Deep copy
        } else {
          setError('Model not found');
        }
      } catch (error) {
        console.error('Error fetching model:', error);
        setError('Failed to load model');
      } finally {
        setLoading(false);
      }
    };

    loadModel();

    // Load reference data for selection
    const loadSelectionData = async () => {
      try {
        const referenceResponse = await fetchData('reference');
        setReferenceData(referenceResponse.items || []);
      } catch (error) {
        console.error('Error loading reference data:', error);
      }
    };

    loadSelectionData();

    // No need to manipulate browser history - we'll handle navigation differently
  }, [shortName]);

  // Handle browser back button to go back one step
  useEffect(() => {
    const handlePopState = () => {
      if (shortName === 'new') {
        // For new models, go directly to models page
        navigate('/models', { replace: true });
      } else {
        // When browser back button is pressed, just go back one step
        navigate(-1);
      }
    };

    const handleBeforeUnload = (e) => {
      if (JSON.stringify(model) !== JSON.stringify(editedModel)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate, model, editedModel]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (shortNameTimeout) {
        clearTimeout(shortNameTimeout);
      }
    };
  }, [shortNameTimeout]);

  const handleFieldChange = (path, value) => {
    setEditedModel(prev => {
      const newModel = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newModel;
      
      // Navigate to the parent of the target field
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }
      
      // Set the value
      current[pathArray[pathArray.length - 1]] = value;
      return newModel;
    });

    // Check for duplicate shortName if this is the shortName field
    if (path === 'shortName' && value && shortName === 'new') {
      // Clear any existing timeout
      if (shortNameTimeout) {
        clearTimeout(shortNameTimeout);
      }
      
      // Set a new timeout to check after user stops typing
      const timeout = setTimeout(() => {
        checkShortNameAvailability(value);
      }, 500); // Wait 500ms after user stops typing
      
      setShortNameTimeout(timeout);
    }
  };

  const checkShortNameAvailability = async (shortNameValue) => {
    if (!shortNameValue || shortNameValue.trim() === '') {
      setShortNameError('');
      return;
    }

    setCheckingShortName(true);
    setShortNameError('');

    try {
      // Fetch all models to check for duplicates
      const modelData = await fetchData('models');
      const existingModel = modelData.models.find(m => 
        m.shortName.toLowerCase() === shortNameValue.toLowerCase()
      );

      if (existingModel) {
        setShortNameError(`Short name "${shortNameValue}" is already taken by "${existingModel.name}"`);
      } else {
        setShortNameError('');
      }
    } catch (error) {
      console.error('Error checking shortName availability:', error);
      setShortNameError('Error checking availability');
    } finally {
      setCheckingShortName(false);
    }
  };

  const handleArrayFieldChange = (path, index, value) => {
    setEditedModel(prev => {
      const newModel = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newModel;
      
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
      return newModel;
    });
  };

  const addArrayItem = (path) => {
    // For reference data, show selection dialog
    if (path === 'referenceData') {
      let options = referenceData.map(item => ({
        value: item.name || item.shortName || item.id,
        label: item.name || item.shortName || item.id
      }));
      
      // Filter out already selected items
      const currentValues = editedModel[path] || [];
      const filteredOptions = options.filter(option => !currentValues.includes(option.value));
      
      if (filteredOptions.length === 0) {
        setSnackbar({
          open: true,
          message: 'All available reference data items are already added',
          severity: 'info'
        });
        return;
      }
      
      setAvailableOptions(filteredOptions);
      setSelectionPath(path);
      setShowSelectionDialog(true);
      return;
    }

    // For other arrays, add empty string as before
    setEditedModel(prev => {
      const newModel = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newModel;
      
      // Navigate to the array
      for (let i = 0; i < pathArray.length; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = [];
        }
        current = current[pathArray[i]];
      }
      
      // Add new item
      if (Array.isArray(current)) {
        current.push('');
      }
      return newModel;
    });
  };

  const removeArrayItem = (path, index) => {
    setEditedModel(prev => {
      const newModel = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newModel;
      
      // Navigate to the array
      for (let i = 0; i < pathArray.length; i++) {
        current = current[pathArray[i]];
      }
      
      // Remove item
      if (Array.isArray(current)) {
        current.splice(index, 1);
      }
      return newModel;
    });
  };

  const confirmDeleteArrayItem = (path, index, label) => {
    setShowDeleteDialog({ open: true, path, index, label });
  };

  const handleSelectionConfirm = (selectedValue) => {
    if (!selectedValue) return;
    
    setEditedModel(prev => {
      const newModel = JSON.parse(JSON.stringify(prev));
      const pathArray = selectionPath.split('.');
      let current = newModel;
      
      // Navigate to the array
      for (let i = 0; i < pathArray.length; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = [];
        }
        current = current[pathArray[i]];
      }
      
      // Check if item already exists
      if (Array.isArray(current) && current.includes(selectedValue)) {
        setSnackbar({
          open: true,
          message: `${selectionPath === 'domain' ? 'Domain' : 'Reference data'} "${selectedValue}" is already added`,
          severity: 'warning'
        });
        return newModel;
      }
      
      // Add the selected item
      if (Array.isArray(current)) {
        current.push(selectedValue);
      }
      
      return newModel;
    });
    
    setShowSelectionDialog(false);
    setSelectionPath('');
    setAvailableOptions([]);
  };

  // Tool-specific functions
  const addToolItem = (path) => {
    setEditedModel(prev => {
      const newModel = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newModel;
      
      // Navigate to the tools object
      for (let i = 0; i < pathArray.length; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }
      
      // Add new tool with a default name and URL
      const newToolName = `tool${Object.keys(current).length + 1}`;
      current[newToolName] = 'https://docs.example.com/new-tool';
      
      return newModel;
    });
  };

  const handleToolNameChange = (path, oldToolName, newToolName) => {
    if (oldToolName === newToolName) return; // No change
    
    setEditedModel(prev => {
      const newModel = JSON.parse(JSON.stringify(prev));
      const pathArray = path.split('.');
      let current = newModel;
      
      // Navigate to the tools object
      for (let i = 0; i < pathArray.length; i++) {
        current = current[pathArray[i]];
      }
      
      // Get the old tool URL
      const toolUrl = current[oldToolName];
      
      // Create a new tools object preserving order
      const newTools = {};
      const toolEntries = Object.entries(current);
      
      for (const [key, value] of toolEntries) {
        if (key === oldToolName) {
          // Replace the old tool name with the new one
          newTools[newToolName] = toolUrl;
        } else {
          // Keep other tools as they are
          newTools[key] = value;
        }
      }
      
      // Replace the tools object
      Object.keys(current).forEach(key => delete current[key]);
      Object.assign(current, newTools);
      
      return newModel;
    });
  };

  const confirmDeleteTool = (path, toolName, label) => {
    setShowDeleteDialog({ 
      open: true, 
      path: path, 
      index: -1, 
      label: label,
      toolName: toolName,
      isTool: true 
    });
  };

  const handleDeleteConfirmed = () => {
    const { path, index, toolName, isTool } = showDeleteDialog;
    
    if (isTool) {
      // Handle tool deletion
      setEditedModel(prev => {
        const newModel = JSON.parse(JSON.stringify(prev));
        const pathArray = path.split('.');
        let current = newModel;
        
        // Navigate to the tools object
        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }
        
        // Remove the tool
        delete current[toolName];
        
        return newModel;
      });
    } else {
      // Handle array item deletion
      removeArrayItem(path, index);
    }
    
    setShowDeleteDialog({ open: false, path: '', index: -1, label: '' });
    
    setSnackbar({
      open: true,
      message: `${showDeleteDialog.label} deleted successfully`,
      severity: 'success'
    });
  };

  const handleDeleteCanceled = () => {
    setShowDeleteDialog({ open: false, path: '', index: -1, label: '' });
  };

  const handleShortNameChangeConfirmed = async () => {
    setShowShortNameChangeDialog(false);
    await performSave();
  };

  const handleSave = async () => {
    // Validate shortName
    if (!editedModel.shortName || editedModel.shortName.trim() === '') {
      setSnackbar({
        open: true,
        message: 'ShortName cannot be empty',
        severity: 'error'
      });
      return;
    }
    
    // Check if shortName is being changed
    const isShortNameChanging = editedModel.shortName !== shortName;
    
    if (isShortNameChanging) {
      // Reset the updateAssociatedLinks option to default (true)
      setUpdateAssociatedLinks(true);
      // Show warning dialog for shortName changes
      setShowShortNameChangeDialog(true);
      return;
    }
    
    // Proceed with normal save
    await performSave();
  };

  const refreshModelData = async () => {
    try {
      if (shortName !== 'new') {
        // Invalidate models cache
        cacheService.invalidateByPrefix('models');
        
        const modelData = await fetchData('models', {}, { forceRefresh: true });
        const foundModel = modelData.models.find(m => m.shortName.toLowerCase() === shortName.toLowerCase());
        if (foundModel) {
          setModel(foundModel);
          setEditedModel(JSON.parse(JSON.stringify(foundModel)));
        }
      }
    } catch (error) {
      console.error('Error refreshing model data:', error);
    }
  };

  // Function to generate version history entry
  const generateVersionHistoryEntry = (originalModel, updatedModel, changeType = 'update') => {
    const fieldChanges = [];
    
    // Compare fields and identify changes
    const fieldsToCheck = [
      'name', 'shortName', 'description', 'extendedDescription', 'version',
      'owner', 'specMaintainer', 'maintainerEmail', 'domain', 'referenceData',
      'users', 'meta.tier', 'meta.verified', 'resources.code', 'resources.documentation',
      'resources.rules', 'resources.tools', 'resources.git', 'resources.validation'
    ];
    
    fieldsToCheck.forEach(field => {
      const fieldPath = field.split('.');
      let originalValue, updatedValue;
      
      // Get original value
      if (fieldPath.length === 1) {
        originalValue = originalModel[fieldPath[0]];
        updatedValue = updatedModel[fieldPath[0]];
      } else if (fieldPath.length === 2) {
        originalValue = originalModel[fieldPath[0]]?.[fieldPath[1]];
        updatedValue = updatedModel[fieldPath[0]]?.[fieldPath[1]];
      }
      
      // Compare values (handle arrays and objects)
      if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
        fieldChanges.push({
          field: field,
          oldValue: formatValueForDisplay(originalValue),
          newValue: formatValueForDisplay(updatedValue)
        });
      }
    });
    
    // Generate change description
    let changeDescription = '';
    if (changeType === 'create') {
      changeDescription = 'Model created';
    } else if (fieldChanges.length === 0) {
      changeDescription = 'No changes detected';
    } else if (fieldChanges.length === 1) {
      changeDescription = `Updated ${fieldChanges[0].field}`;
    } else if (fieldChanges.length <= 3) {
      changeDescription = `Updated ${fieldChanges.map(f => f.field).join(', ')}`;
    } else {
      changeDescription = `Updated ${fieldChanges.length} fields`;
    }
    
    return {
      version: updatedModel.version || '1.0.0',
      timestamp: new Date().toISOString(),
      updatedBy: user?.username || user?.full_name || 'Unknown User',
      changeDescription,
      fieldChanges
    };
  };

  // Helper function to format values for display
  const formatValueForDisplay = (value) => {
    if (value === null || value === undefined) {
      return 'empty';
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'empty array';
      }
      return `[${value.join(', ')}]`;
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return 'empty object';
      }
      return `{${keys.join(', ')}}`;
    }
    if (typeof value === 'string' && value.length > 50) {
      return `"${value.substring(0, 47)}..."`;
    }
    return value.toString();
  };

  const performSave = async () => {
    setSaving(true);
    try {
      // Update the lastUpdated field to current timestamp
      const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS format
      
      // Generate version history entry for changes
      let versionHistoryEntry = null;
      if (shortName !== 'new' && model) {
        versionHistoryEntry = generateVersionHistoryEntry(model, editedModel);
      } else if (shortName === 'new') {
        versionHistoryEntry = generateVersionHistoryEntry({}, editedModel, 'create');
      }
      
      // Include the shortName in the update since it's now editable
      const updatedModel = {
        ...editedModel,
        lastUpdated: currentTimestamp
      };
      
      // Add version history entry if there are changes
      if (versionHistoryEntry && versionHistoryEntry.fieldChanges.length > 0) {
        updatedModel.versionHistory = [
          ...(editedModel.versionHistory || []),
          versionHistoryEntry
        ];
      }
      
      // Check if this is a new model creation
      const isNewModel = shortName === 'new';
      
      // Check if shortName is being changed (for existing models)
      const isShortNameChanging = !isNewModel && editedModel.shortName !== shortName;
      
      // Debug: Log what we're about to send
      console.log('Saving model with:', {
        urlShortName: shortName,
        modelShortName: editedModel.shortName,
        updatedModel: updatedModel,
        isNewModel: isNewModel,
        isShortNameChanging: isShortNameChanging
      });
      
      // Update the edited model with new lastUpdated
      setEditedModel(updatedModel);
      
      if (isNewModel) {
        // Create new model
        const result = await createModel(updatedModel);
        
        // Clear the template from localStorage
        localStorage.removeItem('newModelTemplate');
        
        setSnackbar({
          open: true,
          message: `New model created successfully!`,
          severity: 'success'
        });
        
        // Navigate to the new model's view page and replace the edit page in history
        setTimeout(() => {
          navigate(`/models/${updatedModel.shortName}`, { replace: true });
        }, 1500);
      } else {
        // Update existing model
        const result = await updateModel(shortName, updatedModel, { updateAssociatedLinks });
        
        // Refresh the UI with updated data
        await refreshModelData();
        
        setSnackbar({
          open: true,
          message: `Model updated successfully! Last updated: ${currentTimestamp}`,
          severity: 'success'
        });
        
        // Navigate back to view mode
        setTimeout(() => {
          if (isShortNameChanging) {
            // If shortName changed, navigate to the new model URL
            navigate(`/models/${updatedModel.shortName}`);
          } else {
            // Otherwise, go back to view mode
            goToViewMode();
          }
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving model:', error);
      setSnackbar({
        open: true,
        message: `Failed to save model: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
      setShowSaveDialog(false);
    }
  };

  const handleCancel = () => {
    if (JSON.stringify(model) !== JSON.stringify(editedModel)) {
      setShowSaveDialog(true);
    } else {
      if (shortName === 'new') {
        // For new models, go directly to models page
        navigate('/models', { replace: true });
      } else {
        goToViewMode();
      }
    }
  };

  const handleDeleteModel = () => {
    setShowDeleteModelModal(true);
  };

  const confirmDeleteModel = async () => {
    try {
      // Call the delete API
      await deleteModel(model.shortName);

      setSnackbar({
        open: true,
        message: `Model "${model.name}" deleted successfully`,
        severity: 'success'
      });

      // Navigate back to models page
      setTimeout(() => {
        navigate('/models');
      }, 1500);

    } catch (error) {
      console.error('Error deleting model:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete model: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const renderField = (path, value, label, type = 'text', options = null, isRequired = false) => {
    // Special handling for tools section to make tool names editable
    if (path === 'resources.tools' && typeof value === 'object' && value !== null) {
      return (
        <Box key={path} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
              {label}
              {isRequired && (
                <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                  *
                </Typography>
              )}
            </Typography>
            <IconButton
              size="small"
              onClick={() => addToolItem(path)}
              sx={{ color: currentTheme.primary }}
            >
              <AddIcon />
            </IconButton>
          </Box>
          {Object.entries(value).map(([toolName, toolUrl], index) => (
            <Box key={`${path}.${index}`} sx={{ mb: 2, p: 2, border: `1px solid ${currentTheme.border}`, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <TextField
                size="small"
                value={toolName}
                onChange={(e) => handleToolNameChange(path, toolName, e.target.value)}
                label="Tool Name"
                sx={{ 
                  flex: 1,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border },
                    '&:hover fieldset': { borderColor: currentTheme.primary },
                    '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                  },
                  '& .MuiInputBase-input': { color: currentTheme.text },
                  '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
                }}
                placeholder="Enter tool name"
              />
                <IconButton
                  size="small"
                  onClick={() => confirmDeleteTool(path, toolName, `Tool: ${toolName}`)}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                size="small"
                value={toolUrl}
                onChange={(e) => handleFieldChange(`${path}.${toolName}`, e.target.value)}
                label="Tool URL"
                fullWidth
                sx={{ 
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border },
                    '&:hover fieldset': { borderColor: currentTheme.primary },
                    '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                  },
                  '& .MuiInputBase-input': { color: currentTheme.text },
                  '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
                }}
                placeholder="Enter tool URL"
              />
            </Box>
          ))}
        </Box>
      );
    }

    if (Array.isArray(value)) {
      return (
        <Box key={path} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
              {label}
              {isRequired && (
                <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                  *
                </Typography>
              )}
            </Typography>
            <IconButton
              size="small"
              onClick={() => addArrayItem(path)}
              sx={{ color: currentTheme.primary }}
              title="Add new item"
            >
              <AddIcon />
            </IconButton>
          </Box>
          {value.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                value={item}
                onChange={(e) => handleArrayFieldChange(path, index, e.target.value)}
                disabled={path === 'referenceData'}
                sx={{ 
                  flex: 1,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border },
                    '&:hover fieldset': { borderColor: currentTheme.primary },
                    '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                  },
                  '& .MuiInputBase-input': { color: currentTheme.text },
                  '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 },
                  '&.Mui-disabled': {
                    bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    '& .MuiInputBase-input': { 
                      color: currentTheme.text,
                      WebkitTextFillColor: currentTheme.text
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: currentTheme.border
                    }
                  },
                  '&.Mui-disabled .MuiInputBase-input': {
                    color: currentTheme.text,
                    WebkitTextFillColor: currentTheme.text
                  },
                  '&.Mui-disabled .MuiOutlinedInput-root': {
                    '& .MuiInputBase-input': {
                      color: currentTheme.text,
                      WebkitTextFillColor: currentTheme.text
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: currentTheme.border
                    }
                  },
                  // Target the disabled state at multiple levels
                  '& .MuiOutlinedInput-root.Mui-disabled': {
                    '& .MuiInputBase-input': {
                      color: currentTheme.text,
                      WebkitTextFillColor: currentTheme.text
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: currentTheme.border
                    }
                  },
                  '& .MuiInputBase-root.Mui-disabled': {
                    '& .MuiInputBase-input': {
                      color: currentTheme.text,
                      WebkitTextFillColor: currentTheme.text
                    }
                  }
                }}
                placeholder={path === 'referenceData' ? 'Selected from dropdown' : `Enter ${label.toLowerCase()}`}
              />
              <IconButton
                size="small"
                onClick={() => confirmDeleteArrayItem(path, index, label)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <Accordion key={path} sx={{ 
          mb: 2, 
          bgcolor: 'transparent', 
          boxShadow: 'none',
          '& .MuiAccordionSummary-root': {
            '&:hover': { bgcolor: currentTheme.border + '20' }
          },
          '& .MuiAccordionDetails-root': {
            bgcolor: 'transparent'
          }
        }}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
            sx={{ color: currentTheme.text }}
          >
            <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
              {label}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: 2 }}>
              {Object.entries(value).map(([key, val]) => (
                <Box key={`${path}.${key}`}>
                  {renderField(`${path}.${key}`, val, key.charAt(0).toUpperCase() + key.slice(1))}
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      );
    }

    if (type === 'select' && options) {
      return (
        <FormControl key={path} fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: currentTheme.textSecondary }}>
            {label}
            {isRequired && (
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                *
              </Typography>
            )}
          </InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => handleFieldChange(path, e.target.value)}
            label={label}
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
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (type === 'boolean') {
      return (
        <FormControlLabel
          key={path}
          control={
            <Switch
              checked={value || false}
              onChange={(e) => handleFieldChange(path, e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: currentTheme.primary,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: currentTheme.primary + '80',
                },
              }}
            />
          }
          label={
            <Typography sx={{ color: currentTheme.text }}>
              {label}
              {isRequired && (
                <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                  *
                </Typography>
              )}
            </Typography>
          }
          sx={{ mb: 2 }}
        />
      );
    }

    if (type === 'textarea') {
      return (
        <TextField
          key={path}
          fullWidth
          multiline
          rows={4}
          label={isRequired ? `${label} *` : label}
          value={value || ''}
          onChange={(e) => handleFieldChange(path, e.target.value)}
          sx={{ 
            mb: 2,
            '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
            '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
            '& .MuiOutlinedInput-root': { 
              color: currentTheme.text,
              '& fieldset': { borderColor: currentTheme.border },
              '&:hover fieldset': { borderColor: currentTheme.primary },
              '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
            },
            '& .MuiInputBase-input': { color: currentTheme.text },
            '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
          }}
        />
      );
    }

    return (
      <TextField
        key={path}
        fullWidth
        label={isRequired ? `${label} *` : label}
        value={value || ''}
        onChange={(e) => handleFieldChange(path, e.target.value)}
        sx={{ 
          mb: 2,
          '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
          '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
          '& .MuiOutlinedInput-root': { 
            color: currentTheme.text,
            '& fieldset': { borderColor: currentTheme.border },
            '&:hover fieldset': { borderColor: currentTheme.primary },
            '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
          },
          '& .MuiInputBase-input': { color: currentTheme.text },
          '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ color: currentTheme.text }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!model || !editedModel) {
    return null;
  }

  // For new models, check if required fields are filled and no shortName errors
  // For existing models, check if there are changes
  const hasChanges = shortName === 'new' 
    ? (editedModel.shortName && editedModel.name && editedModel.description && !shortNameError) // Required fields + no errors
    : JSON.stringify(model) !== JSON.stringify(editedModel); // Changes for existing models

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => handleCancel()}>
          <ArrowBackIcon sx={{ color: currentTheme.text }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ color: currentTheme.text }}>
            {shortName === 'new' ? 'Create New Model' : `Edit: ${model.name}`}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: currentTheme.textSecondary }}>
            {shortName === 'new' ? 'Fill in the details below' : model.shortName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            sx={{ color: currentTheme.text, borderColor: currentTheme.border }}
          >
            Cancel
          </Button>
          {/* Delete button - only show for existing models */}
          {shortName !== 'new' && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteModel}
              startIcon={<DeleteForeverIcon />}
              sx={{ 
                color: 'error.main', 
                borderColor: 'error.main',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white',
                }
              }}
            >
              Delete Model
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ bgcolor: currentTheme.primary }}
          >
            {saving ? 'Saving...' : shortName === 'new' ? 'Create Model' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Edit Form */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        {shortName === 'new' && (
                      <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)', 
              borderRadius: 1, 
              border: '1px solid', 
              borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)',
              backdropFilter: currentTheme.darkMode ? 'blur(10px)' : 'blur(5px)'
            }}>
            <Typography variant="body2" sx={{ 
              color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.9)' : 'info.dark', 
              fontWeight: 'bold' 
            }}>
              ℹ️ Required Fields
            </Typography>
            <Typography variant="caption" sx={{ 
              color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'info.dark', 
              display: 'block', 
              mt: 0.5 
            }}>
              Fields marked with * are required to create the model. Fill in at least the Name, Short Name, and Description to proceed.
            </Typography>
          </Box>
        )}
        <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
          Model Details
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderField('name', editedModel.name, 'Name', 'text', null, shortName === 'new')}
            {/* Short Name - Editable */}
            {renderField('shortName', editedModel.shortName, 'Short Name', 'text', null, shortName === 'new')}
            {/* ShortName Error Display */}
            {shortName === 'new' && (
              <Box sx={{ mb: 2 }}>
                {checkingShortName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CircularProgress size={16} sx={{ color: currentTheme.primary }} />
                    <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                      Checking availability...
                    </Typography>
                  </Box>
                )}
                {shortNameError && (
                  <Typography variant="caption" sx={{ color: 'error.main', display: 'block', mt: 0.5 }}>
                    ⚠️ {shortNameError}
                  </Typography>
                )}
              </Box>
            )}
            {renderField('version', editedModel.version, 'Version')}
            {renderField('description', editedModel.description, 'Description', 'textarea', null, shortName === 'new')}
            {renderField('extendedDescription', editedModel.extendedDescription, 'Extended Description', 'textarea')}
            {renderField('owner', editedModel.owner, 'Owner')}
            {renderField('specMaintainer', editedModel.specMaintainer, 'Spec Maintainer')}
            {renderField('maintainerEmail', editedModel.maintainerEmail, 'Maintainer Email')}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {/* Last Updated - Read Only */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                Last Updated
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.text, fontStyle: 'italic' }}>
                {editedModel.lastUpdated || 'Not specified'}
              </Typography>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                This field is automatically updated when you save changes
              </Typography>
              {hasChanges && (
                <Typography variant="caption" sx={{ color: currentTheme.primary, display: 'block', mt: 0.5 }}>
                  ⏰ Will be updated to today's date when saved
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <DomainSelector
                selectedDomains={editedModel.domain || []}
                onDomainsChange={(newDomains) => {
                  setEditedModel(prev => ({
                    ...prev,
                    domain: newDomains
                  }));
                }}
                currentTheme={currentTheme}
                label="Domains"
              />
            </Box>
            {renderField('referenceData', editedModel.referenceData, 'Reference Data')}
            {renderField('users', editedModel.users, 'Users')}
            
            {/* Meta section */}
            <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600, mt: 2, mb: 1 }}>
              Metadata
            </Typography>
            {renderField('meta.tier', editedModel.meta?.tier, 'Tier', 'select', [
              { value: 'gold', label: 'Gold' },
              { value: 'silver', label: 'Silver' },
              { value: 'bronze', label: 'Bronze' }
            ])}
            {renderField('meta.verified', editedModel.meta?.verified, 'Verified', 'boolean')}
          </Grid>
        </Grid>

        {/* Changelog */}
        <ChangelogEditor
          value={editedModel.changelog}
          onChange={(newChangelog) => {
            setEditedModel(prev => ({
              ...prev,
              changelog: newChangelog
            }));
          }}
          currentTheme={currentTheme}
        />

        {/* Resources */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
            Resources
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {renderField('resources.code', editedModel.resources?.code, 'Code Repository')}
              {renderField('resources.documentation', editedModel.resources?.documentation, 'Documentation URL')}
              {renderField('resources.git', editedModel.resources?.git, 'Git Repository')}
              {renderField('resources.validation', editedModel.resources?.validation, 'Validation')}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderField('resources.tools', editedModel.resources?.tools, 'Tools')}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Save Confirmation Dialog */}
      <Dialog 
        open={showSaveDialog} 
        onClose={() => setShowSaveDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>Unsaved Changes</DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Typography sx={{ color: currentTheme.text }}>
            You have unsaved changes. Are you sure you want to discard them?
          </Typography>
        </DialogContent>
                  <DialogActions>
            <Button onClick={() => setShowSaveDialog(false)} sx={{ color: currentTheme.text }}>
              Continue Editing
            </Button>
            <Button onClick={goToViewMode} color="error">
              Discard Changes
            </Button>
          </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={showDeleteDialog.open} 
        onClose={handleDeleteCanceled}
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>Confirm Deletion</DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Typography sx={{ color: currentTheme.text }}>
            Are you sure you want to delete this {showDeleteDialog.label.toLowerCase()}? This action cannot be undone.
          </Typography>
        </DialogContent>
                  <DialogActions>
            <Button onClick={handleDeleteCanceled} sx={{ color: currentTheme.text }}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirmed} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
      </Dialog>

              {/* ShortName Change Confirmation Dialog */}
        <Dialog
          open={showShortNameChangeDialog}
          onClose={() => setShowShortNameChangeDialog(false)}
          aria-labelledby="shortname-change-dialog-title"
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: currentTheme.card,
              color: currentTheme.text,
              border: `1px solid ${currentTheme.border}`
            }
          }}
        >
          <DialogTitle id="shortname-change-dialog-title" sx={{ color: currentTheme.text }}>
            Confirm ShortName Change
          </DialogTitle>
          <DialogContent sx={{ color: currentTheme.text }}>
            <Typography sx={{ mb: 2 }}>
              You are about to change the shortName from <strong>"{shortName}"</strong> to <strong>"{editedModel.shortName}"</strong>.
            </Typography>
            
            <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'warning.dark', mb: 1, fontWeight: 'bold' }}>
                ⚠️ Important: Choose how to handle existing agreements
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={updateAssociatedLinks}
                    onChange={(e) => setUpdateAssociatedLinks(e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Update associated agreements
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      All existing agreements will be updated to reference the new shortName
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1 }}
              />
              
              {!updateAssociatedLinks && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: 'info.dark', fontWeight: 'bold' }}>
                    ℹ️ Note: Existing agreements will continue to reference "{shortName}"
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'info.dark', display: 'block', mt: 0.5 }}>
                    This creates a redirect scenario where both old and new shortNames work
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Typography sx={{ mb: 2 }}>
              This will:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                              <Typography component="li">Change the URL for this model to /models/{editedModel.shortName}</Typography>
              {updateAssociatedLinks && (
                <Typography component="li">Update all agreements that reference this model</Typography>
              )}
              <Typography component="li">Require updating any external references to use the new shortName</Typography>
            </Box>
            <Typography sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              Are you sure you want to proceed?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowShortNameChangeDialog(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleShortNameChangeConfirmed} color="warning" variant="contained">
              {updateAssociatedLinks ? 'Yes, Change ShortName & Update Links' : 'Yes, Change ShortName Only'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Selection Dialog for Domains and Reference Data */}
        <Dialog
          open={showSelectionDialog}
          onClose={() => setShowSelectionDialog(false)}
          aria-labelledby="selection-dialog-title"
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: currentTheme.card,
              color: currentTheme.text,
              border: `1px solid ${currentTheme.border}`
            }
          }}
        >
          <DialogTitle id="selection-dialog-title" sx={{ color: currentTheme.text }}>
            📚 Select Reference Data
          </DialogTitle>
          <DialogContent sx={{ color: currentTheme.text }}>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
                ℹ️ <strong>Note:</strong> Selected items will be read-only and cannot be manually edited. 
                Use the delete button to remove items if needed.
              </Typography>
            </Box>
            <Typography sx={{ mb: 2 }}>
              Choose from available reference data items:
            </Typography>
            
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {availableOptions.map((option, index) => (
                <Button
                  key={index}
                  fullWidth
                  variant="outlined"
                  onClick={() => handleSelectionConfirm(option.value)}
                  sx={{
                    mb: 1,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                    '&:hover': {
                      bgcolor: currentTheme.primary,
                      color: currentTheme.background,
                      borderColor: currentTheme.primary,
                    }
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSelectionDialog(false)} sx={{ color: currentTheme.text }}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Model Modal */}
        <DeleteModal
          open={showDeleteModelModal}
          onClose={() => setShowDeleteModelModal(false)}
          onConfirm={confirmDeleteModel}
          title="Delete Model"
          itemName={model?.name}
          itemType="model"
          theme={currentTheme}
        >
          <Typography sx={{ mb: 2 }}>
            This will:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 3 }}>
            <Typography component="li">Permanently delete the model "{model?.name}"</Typography>
            <Typography component="li">Remove all model data and configurations</Typography>
            <Typography component="li">Break any existing agreements that reference this model</Typography>
            <Typography component="li">Require manual cleanup of external references</Typography>
          </Box>
        </DeleteModal>

      {/* Snackbar for notifications */}
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

export default EditDataModelDetailPage;
