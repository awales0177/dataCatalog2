import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  Alert,
  Snackbar,
} from '@mui/material';
import {
  UnsavedChangesDialog,
  ShortNameChangeDialog,
  SelectionDialog,
  ToolkitToolPickerDialog,
  DeleteFieldModal,
  DeleteModelModal as DeleteModelModalDialog,
} from './EditModelDialogs';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
  ExpandMore as ExpandMoreIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { fetchData, updateModel, createModel, deleteModel } from '../services/api';
import cacheService from '../services/cache';
import ChangelogEditor from '../components/ChangelogEditor';
import DomainSelector from '../components/DomainSelector';
import TeamSelector from '../components/TeamSelector';
import ReferenceDataSelector from '../components/ReferenceDataSelector';
import { useAuth } from '../contexts/AuthContext';
import { modelFieldsConfig } from '../config/modelFields';
import { normalizeModelMarkdowns } from '../utils/modelMarkdowns';
import {
  flattenToolkitTechnologyOptions,
  uniqueToolResourceKey,
} from '../utils/modelToolkitTools';
import { findCatalogModel, modelApiRef } from '../utils/catalogModelLookup';
import { ThemeContext } from '../contexts/ThemeContext';
import { useSyncDocumentTitle } from '../contexts/DocumentTitleContext';

const EditDataModelDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [model, setModel] = useState(null);
  const [editedModel, setEditedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState({
    open: false,
    path: '',
    index: -1,
    label: '',
    displayName: '',
    toolName: '',
    isTool: false,
  });
  const [showShortNameChangeDialog, setShowShortNameChangeDialog] = useState(false);
  const [updateAssociatedLinks, setUpdateAssociatedLinks] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [shortNameError, setShortNameError] = useState('');
  const [checkingShortName, setCheckingShortName] = useState(false);
  const shortNameTimeoutRef = useRef(null);
  const [showDeleteModelModal, setShowDeleteModelModal] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectionPath, setSelectionPath] = useState('');
  const [availableOptions, setAvailableOptions] = useState([]);
  const [toolkitTechOptions, setToolkitTechOptions] = useState([]);
  const [toolkitCatalogLoading, setToolkitCatalogLoading] = useState(true);
  const [toolkitToolPickerOpen, setToolkitToolPickerOpen] = useState(false);
  const [toolkitToolSearch, setToolkitToolSearch] = useState('');

  useSyncDocumentTitle(editedModel?.name || model?.name);

  // Simple back function that goes back one level in the URL path
  const goToViewMode = () => {
    if (modelId === 'new') {
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
        
        // Check if this is a new model creation
        if (modelId === 'new') {
          const newModelTemplate = localStorage.getItem('newModelTemplate');
          if (newModelTemplate) {
            const newModel = JSON.parse(newModelTemplate);
            newModel.markdowns = normalizeModelMarkdowns(newModel.markdowns);
            setModel(newModel);
            setEditedModel(JSON.parse(JSON.stringify(newModel))); // Deep copy
            setLoading(false);
            return;
          } else {
            // If no template found, redirect to models page
            navigate('/models', { replace: true });
            return;
          }
        }
        
        const modelData = await fetchData('models');
        const foundModel = findCatalogModel(modelData.models, modelId);
        
        if (foundModel) {
          foundModel.markdowns = normalizeModelMarkdowns(foundModel.markdowns);
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
      } catch {
        setError('Failed to load model');
      } finally {
        setLoading(false);
      }
    };

    loadModel();


    // No need to manipulate browser history - we'll handle navigation differently
  }, [modelId, navigate]);

  // Handle browser back button to go back one step
  useEffect(() => {
    const handlePopState = () => {
      if (modelId === 'new') {
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
  }, [navigate, model, editedModel, modelId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (shortNameTimeoutRef.current) {
        clearTimeout(shortNameTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchData('toolkit');
        const toolkits = data.toolkit?.toolkits || [];
        if (!cancelled) {
          setToolkitTechOptions(flattenToolkitTechnologyOptions(toolkits));
        }
      } catch {
        if (!cancelled) setToolkitTechOptions([]);
      } finally {
        if (!cancelled) setToolkitCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredToolkitTechOptions = useMemo(() => {
    const q = toolkitToolSearch.trim().toLowerCase();
    if (!q) return toolkitTechOptions;
    return toolkitTechOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.techName.toLowerCase().includes(q) ||
        o.toolkitName.toLowerCase().includes(q),
    );
  }, [toolkitTechOptions, toolkitToolSearch]);

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
    if (path === 'shortName' && value && modelId === 'new') {
      // Clear any existing timeout
      if (shortNameTimeoutRef.current) {
        clearTimeout(shortNameTimeoutRef.current);
      }
      
      // Set a new timeout to check after user stops typing
      shortNameTimeoutRef.current = setTimeout(() => {
        checkShortNameAvailability(value);
      }, 500); // Wait 500ms after user stops typing
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
    } catch {
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

  const confirmDeleteArrayItem = (path, index, label, itemValue) => {
    const displayName =
      String(itemValue ?? '').trim() || `Row ${index + 1}`;
    setShowDeleteDialog({
      open: true,
      path,
      index,
      label,
      displayName,
      toolName: '',
      isTool: false,
    });
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

  const addToolkitToolFromCatalog = (option) => {
    setEditedModel((prev) => {
      const newModel = JSON.parse(JSON.stringify(prev));
      if (!newModel.resources) newModel.resources = {};
      if (!newModel.resources.tools || typeof newModel.resources.tools !== 'object') {
        newModel.resources.tools = {};
      }
      const tools = newModel.resources.tools;
      const key = uniqueToolResourceKey(
        tools,
        option.techName,
        option.toolkitName,
        option.technologyId,
      );
      tools[key] = option.url;
      return newModel;
    });
    setToolkitToolPickerOpen(false);
    setToolkitToolSearch('');
    setSnackbar({
      open: true,
      message: `Linked tool from toolkit: ${option.label}`,
      severity: 'success',
    });
  };

  const confirmDeleteTool = (path, toolName, label) => {
    setShowDeleteDialog({
      open: true,
      path,
      index: -1,
      label,
      displayName: toolName,
      toolName,
      isTool: true,
    });
  };

  const handleDeleteConfirmed = () => {
    const snapshot = showDeleteDialog;
    const { path, index, toolName, isTool } = snapshot;
    const deletedLabel = snapshot.label;

    if (isTool) {
      setEditedModel(prev => {
        const newModel = JSON.parse(JSON.stringify(prev));
        const pathArray = path.split('.');
        let current = newModel;

        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }

        delete current[toolName];

        return newModel;
      });
    } else {
      removeArrayItem(path, index);
    }

    setShowDeleteDialog({
      open: false,
      path: '',
      index: -1,
      label: '',
      displayName: '',
      toolName: '',
      isTool: false,
    });

    setSnackbar({
      open: true,
      message: `${deletedLabel} deleted successfully`,
      severity: 'success'
    });
  };

  const handleDeleteCanceled = () => {
    setShowDeleteDialog({
      open: false,
      path: '',
      index: -1,
      label: '',
      displayName: '',
      toolName: '',
      isTool: false,
    });
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
    const isShortNameChanging = editedModel.shortName !== model?.shortName;
    
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
      if (modelId !== 'new') {
        // Invalidate models cache
        cacheService.invalidateByPrefix('models');
        
        const modelData = await fetchData('models', {}, { forceRefresh: true });
        const foundModel = findCatalogModel(modelData.models, modelId);
        if (foundModel) {
          setModel(foundModel);
          setEditedModel(JSON.parse(JSON.stringify(foundModel)));
        }
      }
    } catch {
      /* ignore refresh errors */
    }
  };

  // Function to generate version history entry
  const generateVersionHistoryEntry = (originalModel, updatedModel, changeType = 'update') => {
    const fieldChanges = [];
    
    // Compare fields and identify changes
    const fieldsToCheck = [
      'name', 'shortName', 'description', 'extendedDescription', 'version',
      'domain', 'referenceData', 'users', 'meta.tier', 'meta.verified', 
      'resources.code', 'resources.documentation', 'resources.rules', 
      'resources.tools', 'resources.git', 'resources.validation',
      modelFieldsConfig.field1.jsonKey
    ];
    
    // Check specMaintainer separately since it's handled by TeamSelector
    // Normalize values for comparison (treat null, undefined, and empty string as equivalent)
    const normalizeValue = (val) => {
      if (val === null || val === undefined || val === '') {
        return null;
      }
      return val;
    };
    
    const originalSpecMaintainer = normalizeValue(originalModel.specMaintainer);
    const updatedSpecMaintainer = normalizeValue(updatedModel.specMaintainer);
    if (originalSpecMaintainer !== updatedSpecMaintainer) {
      fieldChanges.push({
        field: 'specMaintainer',
        oldValue: formatValueForDisplay(originalModel.specMaintainer),
        newValue: formatValueForDisplay(updatedModel.specMaintainer)
      });
    }
    
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
    // Handle empty strings
    if (typeof value === 'string' && value.trim() === '') {
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
      if (modelId !== 'new' && model) {
        versionHistoryEntry = generateVersionHistoryEntry(model, editedModel);
      } else if (modelId === 'new') {
        versionHistoryEntry = generateVersionHistoryEntry({}, editedModel, 'create');
      }
      
      // Include the shortName in the update since it's now editable
      const updatedModel = {
        ...editedModel,
        lastUpdated: currentTimestamp
      };
      delete updatedModel.owner;
      
      // Add version history entry if there are changes
      if (versionHistoryEntry && versionHistoryEntry.fieldChanges.length > 0) {
        updatedModel.versionHistory = [
          ...(editedModel.versionHistory || []),
          versionHistoryEntry
        ];
      }
      
      // Check if this is a new model creation
      const isNewModel = modelId === 'new';
      
      // Check if shortName is being changed (for existing models)
      const isShortNameChanging = !isNewModel && editedModel.shortName !== model?.shortName;
      
      
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
          const key = encodeURIComponent(result.uuid || modelApiRef(updatedModel));
          navigate(`/models/${key}`, { replace: true });
        }, 1500);
      } else {
        // Update existing model
        await updateModel(modelApiRef(model), updatedModel, { updateAssociatedLinks });
        
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
            navigate(`/models/${encodeURIComponent(modelApiRef(updatedModel))}`);
          } else {
            // Otherwise, go back to view mode
            goToViewMode();
          }
        }, 1500);
      }
      
    } catch (error) {
      // Handle error silently
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
      if (modelId === 'new') {
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
      await deleteModel(modelApiRef(model));

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
      // Handle error silently
      setSnackbar({
        open: true,
        message: `Failed to delete model: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Generic render function for configurable model fields
  const renderConfigurableField = (fieldConfig, path, value, label) => {
    const options = fieldConfig.options || [];
    const isFreeText = options.length === 0;

    const handleChange = (index, newValue) => {
      setEditedModel(prev => {
        const newModel = { ...prev };
        const pathArray = path.split('.');
        let current = newModel;
        
        for (let i = 0; i < pathArray.length - 1; i++) {
          if (!current[pathArray[i]]) {
            current[pathArray[i]] = {};
          }
          current = current[pathArray[i]];
        }
        
        const lastKey = pathArray[pathArray.length - 1];
        if (!Array.isArray(current[lastKey])) {
          current[lastKey] = [];
        }
        
        // Create a new array with the updated item
        const newArray = [...current[lastKey]];
        newArray[index] = newValue;
        current[lastKey] = newArray;
        
        return newModel;
      });
    };

    const handleDelete = (indexToDelete) => {
      setEditedModel(prev => {
        const newModel = { ...prev };
        const pathArray = path.split('.');
        let current = newModel;
        
        for (let i = 0; i < pathArray.length - 1; i++) {
          if (!current[pathArray[i]]) {
            current[pathArray[i]] = {};
          }
          current = current[pathArray[i]];
        }
        
        const lastKey = pathArray[pathArray.length - 1];
        if (!Array.isArray(current[lastKey])) {
          current[lastKey] = [];
        }
        
        // Create a new array without the deleted item
        const newArray = current[lastKey].filter((_, index) => index !== indexToDelete);
        current[lastKey] = newArray;
        
        return newModel;
      });
    };

    const addItem = () => {
      setEditedModel(prev => {
        const newModel = { ...prev };
        const pathArray = path.split('.');
        let current = newModel;
        
        for (let i = 0; i < pathArray.length - 1; i++) {
          if (!current[pathArray[i]]) {
            current[pathArray[i]] = {};
          }
          current = current[pathArray[i]];
        }
        
        const lastKey = pathArray[pathArray.length - 1];
        if (!Array.isArray(current[lastKey])) {
          current[lastKey] = [];
        }
        
        // Create a new array with the additional item (empty string for free text)
        current[lastKey] = [...current[lastKey], ''];
        
        return newModel;
      });
    };

    return (
      <Box key={path} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ 
            color: currentTheme.text, 
            fontWeight: 600
          }}>
            {label}
          </Typography>
        </Box>

        {/* Existing items */}
        {(value || []).map((item, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1.5
          }}>
            {isFreeText ? (
              <TextField
                size="small"
                value={item || ''}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
                sx={{ 
                  flex: 1,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
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
            ) : (
              <Select
                size="small"
                value={item}
                onChange={(e) => handleChange(index, e.target.value)}
                sx={{ 
                  flex: 1,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border },
                    '&:hover fieldset': { borderColor: currentTheme.primary },
                    '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                  },
                  '& .MuiInputBase-input': { color: currentTheme.text },
                  '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme.card,
                      color: currentTheme.text,
                      border: `1px solid ${currentTheme.border}`,
                      '& .MuiMenuItem-root': {
                        color: currentTheme.text,
                        '&:hover': {
                          bgcolor: alpha(currentTheme.primary, 0.1),
                          color: currentTheme.text,
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(currentTheme.primary, 0.2),
                          color: currentTheme.text,
                          '&:hover': {
                            bgcolor: alpha(currentTheme.primary, 0.3),
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        bgcolor: option.color 
                      }} />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            )}
            <IconButton
              size="small"
              onClick={() => handleDelete(index)}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white'
                }
              }}
              title={`Delete ${fieldConfig.name.toLowerCase()}`}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {/* Add new item button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 2
        }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addItem}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white'
              }
            }}
          >
            Add {fieldConfig.name}
          </Button>
        </Box>
      </Box>
    );
  };

  const renderField = (path, value, label, type = 'text', options = null, isRequired = false) => {
    // Tools: toolkit catalog only (no free-text name/URL)
    if (path === 'resources.tools' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const entries = Object.entries(value);
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
            <Tooltip
              title={
                toolkitCatalogLoading
                  ? 'Loading toolkit catalog…'
                  : toolkitTechOptions.length === 0
                    ? 'No toolkit technologies available'
                    : 'Add link from toolkit workbench (technology)'
              }
            >
              <span>
                <IconButton
                  size="small"
                  onClick={() => setToolkitToolPickerOpen(true)}
                  sx={{ color: currentTheme.primary }}
                  disabled={toolkitCatalogLoading || toolkitTechOptions.length === 0}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
            Link technologies from the toolkit workbench only. Remove a link with the trash control.
          </Typography>
          {entries.length === 0 ? (
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
              No toolkit tools linked.
            </Typography>
          ) : (
            entries.map(([toolName, toolUrl], index) => (
              <Box
                key={`${path}.${toolName}.${index}`}
                sx={{ mb: 2, p: 2, border: `1px solid ${currentTheme.border}`, borderRadius: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                      {toolName}
                    </Typography>
                    <Typography
                      variant="caption"
                      component="div"
                      sx={{
                        color: currentTheme.textSecondary,
                        mt: 0.5,
                        wordBreak: 'break-all',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      }}
                    >
                      {typeof toolUrl === 'string' ? toolUrl : ''}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => confirmDeleteTool(path, toolName, `Tool: ${toolName}`)}
                    sx={{ color: 'error.main', flexShrink: 0 }}
                    aria-label={`Remove ${toolName}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))
          )}
        </Box>
      );
    }

    if (Array.isArray(value)) {
      // Special handling for configurable fields (field1)
      // Check if this path matches any configured field's jsonKey
      const field1Config = modelFieldsConfig.field1;
      
      if (path === field1Config.jsonKey) {
        return renderConfigurableField(field1Config, path, value, label);
      }

      // Special handling for users field - use TeamSelector
      if (path === 'users') {
        return (
          <Box key={path} sx={{ mb: 2 }}>
            <TeamSelector
              selectedTeams={value || []}
              onTeamsChange={(newUsers) => {
                setEditedModel(prev => ({
                  ...prev,
                  users: newUsers
                }));
              }}
              label="Users"
              showLabel={true}
              placeholder="No users selected"
            />
          </Box>
        );
      }

      // Special handling for referenceData field - use ReferenceDataSelector
      if (path === 'referenceData') {
        return (
          <Box key={path} sx={{ mb: 2 }}>
            <ReferenceDataSelector
              selectedReferenceData={value || []}
              onReferenceDataChange={(newReferenceData) => {
                setEditedModel(prev => ({
                  ...prev,
                  referenceData: newReferenceData
                }));
              }}
              label="Reference Data"
              showLabel={true}
            />
          </Box>
        );
      }

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
                placeholder={`Enter ${label.toLowerCase()}`}
              />
              <IconButton
                size="small"
                onClick={() => confirmDeleteArrayItem(path, index, label, item)}
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
  const hasChanges = modelId === 'new' 
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
            {modelId === 'new' ? 'Create New Model' : `Edit: ${model.name}`}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: currentTheme.textSecondary }}>
            {modelId === 'new' ? 'Fill in the details below' : model.shortName}
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
          {modelId !== 'new' && (
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
            startIcon={saving ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : <SaveIcon />}
            sx={{
              bgcolor: currentTheme.primary,
              '&:hover': { bgcolor: currentTheme.primaryHover },
            }}
          >
            {saving ? 'Saving...' : modelId === 'new' ? 'Create Model' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* Edit Form */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        {modelId === 'new' && (
                      <Box sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: currentTheme.darkMode ? 'rgba(55, 171, 191, 0.1)' : 'rgba(55, 171, 191, 0.08)', 
              borderRadius: 1, 
              border: '1px solid', 
              borderColor: currentTheme.darkMode ? 'rgba(55, 171, 191, 0.3)' : 'rgba(55, 171, 191, 0.2)',
              backdropFilter: currentTheme.darkMode ? 'blur(10px)' : 'blur(5px)'
            }}>
            <Typography variant="body2" sx={{ 
              color: currentTheme.darkMode ? 'rgba(55, 171, 191, 0.9)' : 'info.dark', 
              fontWeight: 'bold' 
            }}>
              ℹ️ Required Fields
            </Typography>
            <Typography variant="caption" sx={{ 
              color: currentTheme.darkMode ? 'rgba(55, 171, 191, 0.8)' : 'info.dark', 
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
            {renderField('name', editedModel.name, 'Name', 'text', null, modelId === 'new')}
            {/* Short Name - Editable */}
            {renderField('shortName', editedModel.shortName, 'Short Name', 'text', null, modelId === 'new')}
            
            {/* Spec Maintainer - Team Selector */}
            <Box sx={{ mb: 4 }}>
              <TeamSelector
                selectedTeams={editedModel.specMaintainer ? [editedModel.specMaintainer] : []}
                onTeamsChange={(teams) => {
                  setEditedModel(prev => ({
                    ...prev,
                    specMaintainer: teams.length > 0 ? teams[0] : ''
                  }));
                }}
                label="Spec Maintainer"
                showLabel={true}
                maxSelections={1}
                placeholder="No spec maintainer selected"
              />
            </Box>
            {/* ShortName Error Display */}
            {modelId === 'new' && (
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
            {renderField('description', editedModel.description, 'Description', 'textarea', null, modelId === 'new')}
            {renderField('extendedDescription', editedModel.extendedDescription, 'Extended Description', 'textarea')}
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
            {renderField(
              modelFieldsConfig.field1.jsonKey, 
              editedModel[modelFieldsConfig.field1.jsonKey], 
              modelFieldsConfig.field1.name
            )}
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
        />

        {/* Markdown documentation (multi-tab, GFM + mermaid in view mode) */}
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MenuBookIcon sx={{ color: currentTheme.primary }} />
            <Typography variant="h6" sx={{ color: currentTheme.text }}>
              Markdown documentation
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
            Add or remove documentation tabs here. Tab titles appear on the model page. Edit markdown on the model
            detail view (same idea as toolkit README): open the model, choose a tab, then use Edit documentation.
          </Typography>
          {(normalizeModelMarkdowns(editedModel.markdowns)).map((tab, index) => (
            <Paper
              key={tab.id}
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: currentTheme.background,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Tab title"
                  value={tab.title}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditedModel((prev) => {
                      const tabs = normalizeModelMarkdowns(prev.markdowns);
                      const next = [...tabs];
                      next[index] = { ...next[index], title: v };
                      return { ...prev, markdowns: next };
                    });
                  }}
                  sx={{ flex: 1, minWidth: 200, '& .MuiInputBase-input': { color: currentTheme.text } }}
                />
                <IconButton
                  aria-label="Remove tab"
                  onClick={() => {
                    setEditedModel((prev) => {
                      const tabs = normalizeModelMarkdowns(prev.markdowns);
                      return { ...prev, markdowns: tabs.filter((_, i) => i !== index) };
                    });
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => {
              setEditedModel((prev) => {
                const tabs = normalizeModelMarkdowns(prev.markdowns);
                return {
                  ...prev,
                  markdowns: [...tabs, { id: `md_${Date.now()}`, title: 'New tab', content: '' }],
                };
              });
            }}
            sx={{ color: currentTheme.primary, borderColor: currentTheme.primary }}
          >
            Add markdown tab
          </Button>
        </Box>

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
              {renderField('resources.tools', editedModel.resources?.tools ?? {}, 'Tools')}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <UnsavedChangesDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onDiscard={goToViewMode}
      />

      <DeleteFieldModal
        open={showDeleteDialog.open}
        onClose={handleDeleteCanceled}
        onConfirm={handleDeleteConfirmed}
        label={showDeleteDialog.label}
        displayName={showDeleteDialog.displayName}
        isTool={showDeleteDialog.isTool}
        toolName={showDeleteDialog.toolName}
      />

      <ShortNameChangeDialog
        open={showShortNameChangeDialog}
        onClose={() => setShowShortNameChangeDialog(false)}
        model={model}
        editedModel={editedModel}
        updateAssociatedLinks={updateAssociatedLinks}
        onUpdateAssociatedLinksChange={setUpdateAssociatedLinks}
        onConfirm={handleShortNameChangeConfirmed}
      />

      <SelectionDialog
        open={showSelectionDialog}
        onClose={() => setShowSelectionDialog(false)}
        availableOptions={availableOptions}
        onSelect={handleSelectionConfirm}
      />

      <ToolkitToolPickerDialog
        open={toolkitToolPickerOpen}
        onClose={() => { setToolkitToolPickerOpen(false); setToolkitToolSearch(''); }}
        search={toolkitToolSearch}
        onSearchChange={setToolkitToolSearch}
        filteredOptions={filteredToolkitTechOptions}
        allOptions={toolkitTechOptions}
        onSelect={addToolkitToolFromCatalog}
      />

      <DeleteModelModalDialog
        open={showDeleteModelModal}
        onClose={() => setShowDeleteModelModal(false)}
        onConfirm={confirmDeleteModel}
        modelName={model?.name}
      />

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
