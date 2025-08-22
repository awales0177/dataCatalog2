import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../App';
import { fetchData, createAgreement, updateAgreement, deleteAgreement } from '../services/api';
import cacheService from '../services/cache';
import ChangelogEditor from '../components/ChangelogEditor';

const EditAgreementPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Extract ID from URL as fallback
  const urlPath = window.location.pathname;
  const urlId = urlPath.includes('/edit') ? urlPath.split('/')[2] : null;
  const finalAgreementId = id || urlId;
  
  const isNewAgreement = !finalAgreementId || finalAgreementId === 'new';
  
  console.log('EditAgreementPage rendered with:');
  console.log('  id from useParams:', id);
  console.log('  urlPath:', urlPath);
  console.log('  urlId from URL:', urlId);
  console.log('  finalAgreementId:', finalAgreementId);
  console.log('  isNewAgreement:', isNewAgreement);

  // Helper function for deep cloning
  const deepClone = (obj) => {
    if (window.structuredClone) {
      return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
  };

  // State management
  const [agreement, setAgreement] = useState(null);
  const [editedAgreement, setEditedAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteArrayDialog, setShowDeleteArrayDialog] = useState(false);
  const [deleteArrayItem, setDeleteArrayItem] = useState({ path: '', index: -1, label: '' });

  const [newChangelogVersion, setNewChangelogVersion] = useState('');
  const [newChangelogChanges, setNewChangelogChanges] = useState('');
  



  const handleAddChangelogItem = (path) => {
    console.log('handleAddChangelogItem called with path:', path);
    console.log('newChangelogVersion:', newChangelogVersion);
    console.log('newChangelogChanges:', newChangelogChanges);
    
    if (newChangelogVersion.trim() && newChangelogChanges.trim()) {
      // Generate current timestamp in ISO format
      const currentDate = new Date().toISOString();
      
      console.log('Adding changelog item:');
      console.log('  Version:', newChangelogVersion.trim());
      console.log('  Date:', currentDate);
      console.log('  Changes:', newChangelogChanges.trim());
      console.log('  Path:', path);
      
      setEditedAgreement(prev => {
        console.log('Previous editedAgreement:', prev);
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
        console.log('Path array:', pathArray);
        console.log('Initial current:', current);
        
        for (let i = 0; i < pathArray.length; i++) {
          if (!current[pathArray[i]]) {
            current[pathArray[i]] = [];
          }
          current = current[pathArray[i]];
          console.log(`After step ${i}, current:`, current);
        }
        
        if (Array.isArray(current)) {
          current.push({
            version: newChangelogVersion.trim(),
            date: currentDate,
            changes: [newChangelogChanges.trim()]
          });
          console.log('Added item to array, current now:', current);
        } else {
          console.error('Current is not an array:', current);
        }
        
        console.log('Final newAgreement:', newAgreement);
        return newAgreement;
      });
      
      setNewChangelogVersion('');
      setNewChangelogChanges('');
    } else {
      console.log('Validation failed:');
      console.log('  Version trimmed:', newChangelogVersion.trim());
      console.log('  Changes trimmed:', newChangelogChanges.trim());
    }
  };

  // Load agreement data
  useEffect(() => {
    const loadAgreement = async () => {
      console.log('Loading agreement with ID:', finalAgreementId, 'isNewAgreement:', isNewAgreement);
      
      // Wait for route parameters to be loaded
      if (finalAgreementId === undefined) {
        console.log('Route parameters not yet loaded, waiting...');
        return;
      }
      
      if (isNewAgreement) {
        // Load template for new agreement
        const template = localStorage.getItem('newAgreementTemplate');
        console.log('Template from localStorage:', template);
        
        if (template) {
          const newAgreement = JSON.parse(template);
          console.log('Parsed new agreement:', newAgreement);
          
          // Ensure dataConsumer is always an array
          const migratedNewAgreement = {
            ...newAgreement,
            dataConsumer: Array.isArray(newAgreement.dataConsumer) 
              ? newAgreement.dataConsumer 
              : []
          };
          
          setAgreement(migratedNewAgreement);
          setEditedAgreement(deepClone(migratedNewAgreement));
        } else {
          // Redirect if no template found
          console.log('No template found, redirecting to /agreements');
          navigate('/agreements', { replace: true });
          return;
        }
        setLoading(false);
        } else {
          // Load existing agreement
          try {
            console.log('Fetching agreements data for ID:', finalAgreementId);
            const agreementsData = await fetchData('dataAgreements');
            console.log('Fetched agreements data:', agreementsData);
            
            if (!agreementsData || !agreementsData.agreements) {
              console.error('Invalid agreements data structure:', agreementsData);
              throw new Error('Invalid agreements data structure');
            }
            
            console.log('Available agreement IDs:', agreementsData.agreements.map(a => a.id));
            
            const foundAgreement = agreementsData.agreements.find(
              a => a.id.toLowerCase() === finalAgreementId.toLowerCase()
            );
            console.log('Found agreement:', foundAgreement);
            console.log('Search comparison:', {
              searchFor: finalAgreementId,
              searchForLower: finalAgreementId?.toLowerCase(),
              availableIds: agreementsData.agreements.map(a => ({ id: a.id, idLower: a.id.toLowerCase() }))
            });
            
            if (foundAgreement) {
              // Ensure dataConsumer is always an array for backward compatibility
              const migratedAgreement = {
                ...foundAgreement,
                dataConsumer: Array.isArray(foundAgreement.dataConsumer) 
                  ? foundAgreement.dataConsumer 
                  : foundAgreement.dataConsumer 
                    ? [foundAgreement.dataConsumer] 
                    : []
              };
              
              setAgreement(migratedAgreement);
              setEditedAgreement(deepClone(migratedAgreement));
            } else {
              console.log('Agreement not found, showing error');
              setSnackbar({
                open: true,
                message: 'Agreement not found',
                severity: 'error'
              });
              navigate('/agreements');
            }
          } catch (error) {
            console.error('Error loading agreement:', error);
            setSnackbar({
              open: true,
              message: 'Failed to load agreement',
              severity: 'error'
            });
          } finally {
            setLoading(false);
          }
        }
    };

    loadAgreement();
  }, [finalAgreementId, isNewAgreement, navigate]);

  // Normalize location to array format [{ bucket, description }, ...] - only run once on initial load
  useEffect(() => {
    if (!editedAgreement || !editedAgreement.location) return;
    
    // Only normalize if the location is not already in the correct array format
    const loc = editedAgreement.location;
    const needsUpdate = 
      !Array.isArray(loc) || 
      !loc.every(item => typeof item === 'object' && item.bucket !== undefined && item.description !== undefined);

    if (needsUpdate) {
      console.log('Normalizing location to array format');
      
      let normalized = [];
      
      // Convert from old object format { bucket: description }
      if (typeof loc === 'object' && !Array.isArray(loc)) {
        if (loc.items && Array.isArray(loc.items)) {
          // Already has items array, convert to new format
          normalized = loc.items.map(item => ({
            bucket: item.bucket || '',
            description: item.description || ''
          }));
        } else {
          // Convert { bucket: description } to array format
          normalized = Object.entries(loc).map(([bucket, description]) => ({
            bucket: bucket || '',
            description: String(description || '')
          }));
        }
      }
      
      // Convert from plain array of strings
      if (Array.isArray(loc) && loc.some(item => typeof item === 'string')) {
        normalized = loc.map(item => ({
          bucket: '',
          description: typeof item === 'string' ? item : String(item || '')
        }));
      }
      
      // Ensure we have at least one empty item if location is empty
      if (normalized.length === 0) {
        normalized = [{ bucket: '', description: '' }];
      }
      
      setEditedAgreement((prev) => ({
        ...prev,
        location: normalized,
      }));
    }
  }, [editedAgreement?.id]); // Only run when agreement ID changes, not on every location change

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (isNewAgreement) {
        navigate('/agreements', { replace: true });
      } else {
        navigate(`/agreements/${finalAgreementId}`, { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isNewAgreement, navigate, finalAgreementId]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  const hasChanges = () => {
    if (!agreement || !editedAgreement) return false;
    if (isNewAgreement) {
      return editedAgreement.name && editedAgreement.description;
    }
    
    console.log('Checking for changes:');
    console.log('Original agreement location:', agreement.location);
    console.log('Edited agreement location:', editedAgreement.location);
    console.log('Original agreement dataConsumer:', agreement.dataConsumer);
    console.log('Edited agreement dataConsumer:', editedAgreement.dataConsumer);
    
    // Simple but effective comparison
    const originalStr = JSON.stringify(agreement);
    const editedStr = JSON.stringify(editedAgreement);
    const hasChanged = originalStr !== editedStr;
    
    console.log('Change detected:', hasChanged);
    if (hasChanged) {
      console.log('Original length:', originalStr.length);
      console.log('Edited length:', editedStr.length);
    }
    
    return hasChanged;
  };

  const handleFieldChange = (path, value) => {
    setEditedAgreement(prev => {
      const pathArray = path.split('.');
      
      // Clone the path we're about to modify
      const newAgreement = { ...prev };
      let current = newAgreement;
      
      // Clone each level of the path
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!(pathArray[i] in current)) {
          current[pathArray[i]] = {};
        } else {
          current[pathArray[i]] = { ...current[pathArray[i]] };
        }
        current = current[pathArray[i]];
      }
      
      const lastPart = pathArray[pathArray.length - 1];
      if (lastPart.includes('[') && lastPart.includes(']')) {
        const key = lastPart.split('[')[0];
        const index = parseInt(lastPart.split('[')[1].split(']')[0]);
        if (!Array.isArray(current[key])) {
          current[key] = [];
        } else {
          // Clone the array before modifying
          current[key] = [...current[key]];
        }
        current[key][index] = value;
      } else {
        current[lastPart] = value;
      }
      
      // Auto-update todo date when todo items are modified
      if (path.startsWith('todo.items')) {
        if (newAgreement.todo && typeof newAgreement.todo === 'object') {
          // Clone todo object before modifying
          newAgreement.todo = { ...newAgreement.todo };
          newAgreement.todo.date = new Date().toISOString();
        }
      }
      
      return newAgreement;
    });
  };

  const handleArrayFieldChange = (path, index, field, value) => {
    console.log('handleArrayFieldChange called with:', { path, index, field, value });
    setEditedAgreement(prev => {
      const pathArray = path.split('.');
      
      // Clone the path we're about to modify
      const newAgreement = { ...prev };
      let current = newAgreement;
      
      // Clone each level of the path
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        } else {
          current[pathArray[i]] = { ...current[pathArray[i]] };
        }
        current = current[pathArray[i]];
      }
      
      const lastKey = pathArray[pathArray.length - 1];
      if (!Array.isArray(current[lastKey])) {
        current[lastKey] = [];
      } else {
        // Clone the array before modifying
        current[lastKey] = [...current[lastKey]];
      }
      
      // Handle both simple values and object fields
      if (typeof field === 'string') {
        // Object field update (e.g., todo.items[index].date)
        if (!current[lastKey][index]) {
          current[lastKey][index] = {};
        } else {
          // Clone the object at this index
          current[lastKey][index] = { ...current[lastKey][index] };
        }
        current[lastKey][index][field] = value;
        console.log('Updated object field:', { path, index, field, value, result: current[lastKey][index] });
      } else {
        // Simple value update (e.g., dataConsumer[index])
        current[lastKey][index] = value;
        console.log('Updated simple value:', { path, index, value, result: current[lastKey][index] });
      }
      
      return newAgreement;
    });
  };

  const handleLocationFieldChange = (index, field, value) => {
    console.log('handleLocationFieldChange called with:', { index, field, value });
    setEditedAgreement(prev => {
      if (!prev.location || !Array.isArray(prev.location)) return prev;
      if (index < 0 || index >= prev.location.length) return prev;

      // Clone the location array
      const location = [...prev.location];
      
      // Update the specific field at the index
      location[index] = {
        ...location[index],
        [field]: value
      };

      return { ...prev, location };
    });
  };

  const handleAddLocationItem = () => {
    console.log('handleAddLocationItem called');
    setEditedAgreement(prev => {
      // Clone the location array
      const location = [...(prev.location || [])];
      
      // Add new empty item
      location.push({ bucket: '', description: '' });
      
      return { ...prev, location };
    });
  };

  const handleDeleteLocationItem = (index) => {
    console.log('handleDeleteLocationItem called with index:', index);
    setEditedAgreement(prev => {
      if (!prev.location || !Array.isArray(prev.location)) return prev;
      if (index < 0 || index >= prev.location.length) return prev;
      
      // Clone the location array
      const location = [...prev.location];
      
      // Remove the item at the specified index
      location.splice(index, 1);
      
      // Ensure we always have at least one item
      if (location.length === 0) {
        location.push({ bucket: '', description: '' });
      }
      
      return { ...prev, location };
    });
  };

  const addArrayItem = (path) => {
    console.log('addArrayItem called with path:', path);
    setEditedAgreement(prev => {
      console.log('Previous editedAgreement:', prev);
      const pathArray = path.split('.');
      
      // Clone the path we're about to modify
      const newAgreement = { ...prev };
      let current = newAgreement;
      
      // Clone each level of the path
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        } else {
          current[pathArray[i]] = { ...current[pathArray[i]] };
        }
        current = current[pathArray[i]];
      }
      
      const lastKey = pathArray[pathArray.length - 1];
      if (!Array.isArray(current[lastKey])) {
        current[lastKey] = [];
      } else {
        // Clone the array before modifying
        current[lastKey] = [...current[lastKey]];
      }
      
      // Handle different types of array items
      if (path === 'todo.items') {
        // Todo items are simple strings
        current[lastKey].push('');
        // Auto-update todo date when todo items are added
        if (newAgreement.todo && typeof newAgreement.todo === 'object') {
          // Clone todo object before modifying
          newAgreement.todo = { ...newAgreement.todo };
          newAgreement.todo.date = new Date().toISOString();
        }
      } else {
        // Default: simple string items
        current[lastKey].push('');
      }
      
      console.log('New agreement after adding item:', newAgreement);
      return newAgreement;
    });
  };

  const confirmDeleteArrayItem = (path, index, label) => {
    setDeleteArrayItem({ path, index, label });
    setShowDeleteArrayDialog(true);
  };

  const handleDeleteArrayItemConfirmed = () => {
    setEditedAgreement(prev => {
      const pathArray = deleteArrayItem.path.split('.');
      
      // Clone the path we're about to modify
      const newAgreement = { ...prev };
      let current = newAgreement;
      
      // Clone each level of the path
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        } else {
          current[pathArray[i]] = { ...current[pathArray[i]] };
        }
        current = current[pathArray[i]];
      }
      
      const lastKey = pathArray[pathArray.length - 1];
      if (Array.isArray(current[lastKey])) {
        // Clone the array before modifying
        current[lastKey] = [...current[lastKey]];
        current[lastKey].splice(deleteArrayItem.index, 1);
      }
      
      // Auto-update todo date when todo items are deleted
      if (deleteArrayItem.path === 'todo.items') {
        if (newAgreement.todo && typeof newAgreement.todo === 'object') {
          // Clone todo object before modifying
          newAgreement.todo = { ...newAgreement.todo };
          newAgreement.todo.date = new Date().toISOString();
        }
      }
      
      return newAgreement;
    });
    
    setShowDeleteArrayDialog(false);
    setDeleteArrayItem({ path: '', index: -1, label: '' });
  };

  const handleSave = async () => {
    if (!editedAgreement.name || !editedAgreement.description) {
      setSnackbar({
        open: true,
        message: 'Name and Description are required',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      // Update the lastUpdated field to current timestamp
      const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS format
      
      // Create updated agreement with new timestamp
      const updatedAgreement = {
        ...editedAgreement,
        lastUpdated: currentTimestamp
      };
      
      if (isNewAgreement) {
        // Create new agreement
        const result = await createAgreement(updatedAgreement);
        
        // Clear template from localStorage
        localStorage.removeItem('newAgreementTemplate');
        
        setSnackbar({
          open: true,
          message: 'New agreement created successfully!',
          severity: 'success'
        });
        
        // Navigate to the new agreement's view page
        setTimeout(() => {
          navigate(`/agreements/${updatedAgreement.id}`, { replace: true });
        }, 1500);
      } else {
        // Update existing agreement
        const result = await updateAgreement(finalAgreementId, updatedAgreement);
        
        // Update local agreement
        setAgreement(updatedAgreement);
        
        setSnackbar({
          open: true,
          message: `Agreement updated successfully! Last updated: ${currentTimestamp}`,
          severity: 'success'
        });
        
        // Navigate back to view mode
        setTimeout(() => {
          navigate(`/agreements/${finalAgreementId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving agreement:', error);
      setSnackbar({
        open: true,
        message: `Failed to save agreement: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isNewAgreement) {
      navigate('/agreements', { replace: true });
    } else {
      navigate(`/agreements/${finalAgreementId}`);
    }
  };

  const handleBackArrow = () => {
    console.log('Back arrow clicked');
    console.log('  isNewAgreement:', isNewAgreement);
    console.log('  finalAgreementId:', finalAgreementId);
    console.log('  agreement:', agreement);
    
    if (isNewAgreement) {
      console.log('Navigating to agreements list');
      navigate('/agreements', { replace: true });
    } else if (finalAgreementId && finalAgreementId !== 'undefined' && finalAgreementId !== 'null') {
      console.log('Navigating to view page:', `/agreements/${finalAgreementId}`);
      navigate(`/agreements/${finalAgreementId}`, { replace: true });
    } else {
      console.log('No valid ID, navigating to agreements list');
      navigate('/agreements', { replace: true });
    }
  };

  const handleDeleteAgreement = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteAgreement = async () => {
    if (deleteConfirmation !== `delete ${agreement.name}`) {
      setSnackbar({
        open: true,
        message: 'Please type the exact confirmation text',
        severity: 'error'
      });
      return;
    }

    try {
      await deleteAgreement(finalAgreementId);
      setSnackbar({
        open: true,
        message: 'Agreement deleted successfully',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/agreements');
      }, 1500);
    } catch (error) {
      console.error('Error deleting agreement:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete agreement: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const renderLocationField = (path, value, label) => {
    console.log('renderLocationField called with:', { path, value, label, valueType: typeof value, isArray: Array.isArray(value) });
    console.log('Raw value:', value);
    
    // Ensure we always have a valid location structure
    let locationArray = value;
    
    // If value is null/undefined, create empty structure
    if (!locationArray) {
      locationArray = [{ bucket: '', description: '' }];
    }
    
    // If value is not an array, convert it
    if (!Array.isArray(locationArray)) {
      if (typeof locationArray === 'object' && locationArray.items && Array.isArray(locationArray.items)) {
        // Has items array, use it
        locationArray = locationArray.items;
      } else if (typeof locationArray === 'object') {
        // Convert { bucket: description } to array format
        locationArray = Object.entries(locationArray).map(([bucket, description]) => ({
          bucket: bucket || '',
          description: String(description || '')
        }));
      } else {
        // Fallback to empty array
        locationArray = [{ bucket: '', description: '' }];
      }
    }
    
    // Ensure all items have the correct structure
    const normalizedArray = locationArray.map(item => {
      if (typeof item === 'string') {
        return { bucket: '', description: item };
      }
      if (typeof item === 'object' && item !== null) {
        return {
          bucket: item.bucket || '',
          description: item.description || ''
        };
      }
      return { bucket: '', description: '' };
    });
    
    // Ensure we have at least one item
    if (normalizedArray.length === 0) {
      normalizedArray.push({ bucket: '', description: '' });
    }
    
    console.log('Final normalizedArray:', normalizedArray);
    console.log('Location array type:', typeof normalizedArray);
    console.log('Location array isArray:', Array.isArray(normalizedArray));

    return (
      <Box key={path} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ 
            color: currentTheme.text, 
            fontWeight: 600
          }}>
            {label}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleAddLocationItem()}
            sx={{ color: currentTheme.primary }}
            title="Add new location item"
          >
            <AddIcon />
          </IconButton>
        </Box>
        {normalizedArray.map((item, index) => {
          // Safety check: ensure item is a valid object
          if (!item || typeof item !== 'object') {
            console.error('Invalid location item:', item);
            return null;
          }
          
          return (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 1
            }}>
              <TextField
                size="small"
                label="Bucket"
                value={String(item.bucket || '')}
                onChange={(e) => handleLocationFieldChange(index, 'bucket', e.target.value)}
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
                placeholder="Enter bucket name"
              />
              <TextField
                size="small"
                label="Description"
                value={String(item.description || '')}
                onChange={(e) => handleLocationFieldChange(index, 'description', e.target.value)}
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
                placeholder="Enter description"
              />
              <IconButton
                size="small"
                onClick={() => handleDeleteLocationItem(index)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          );
        })}
      </Box>
    );
  };

  

  const renderDataConsumerField = (path, value, label) => {
    console.log('renderDataConsumerField called with:', { path, value, label });

    const handleConsumerChange = (index, newValue) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const handleDeleteConsumer = (indexToDelete) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const addConsumer = () => {
      console.log('Adding consumer, current editedAgreement:', editedAgreement);
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        // Create a new array with the additional item
        current[lastKey] = [...current[lastKey], ''];
        console.log('Added empty consumer, new array:', current[lastKey]);
        
        console.log('New agreement after adding consumer:', newAgreement);
        return newAgreement;
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

        {/* Existing consumers */}
        {(value || []).map((consumer, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1.5
          }}>
            <TextField
              size="small"
              label={`Consumer ${index + 1}`}
              value={consumer}
              onChange={(e) => handleConsumerChange(index, e.target.value)}
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
              placeholder="Enter consumer service name"
            />
            <IconButton
              size="small"
              onClick={() => handleDeleteConsumer(index)}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white'
                }
              }}
              title="Delete consumer"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {/* Add new consumer button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 2
        }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addConsumer}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white'
              }
            }}
          >
            Add Consumer Service
          </Button>
        </Box>
      </Box>
    );
  };

  const renderDataProducerField = (path, value, label) => {
    console.log('renderDataProducerField called with:', { path, value, label });

    const handleProducerChange = (index, newValue) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const handleDeleteProducer = (indexToDelete) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const addProducer = () => {
      console.log('Adding producer, current editedAgreement:', editedAgreement);
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        // Create a new array with the additional item
        current[lastKey] = [...current[lastKey], ''];
        console.log('Added empty producer, new array:', current[lastKey]);
        
        console.log('New agreement after adding producer:', newAgreement);
        return newAgreement;
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

        {/* Existing producers */}
        {(value || []).map((producer, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1.5
          }}>
            <TextField
              size="small"
              label={`Producer ${index + 1}`}
              value={producer}
              onChange={(e) => handleProducerChange(index, e.target.value)}
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
              placeholder="Enter producer service name"
            />
            <IconButton
              size="small"
              onClick={() => handleDeleteProducer(index)}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white'
                }
              }}
              title="Delete producer"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {/* Add new producer button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 2
        }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addProducer}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white'
              }
            }}
          >
            Add Producer Service
          </Button>
        </Box>
      </Box>
    );
  };

  const renderNetworkField = (path, value, label) => {
    console.log('renderNetworkField called with:', { path, value, label });

    const networkOptions = [
      { value: 'internet', label: 'Internet', color: '#4caf50' },
      { value: 'intranet', label: 'Intranet', color: '#2196f3' }
    ];

    const handleNetworkChange = (index, newValue) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const handleDeleteNetwork = (indexToDelete) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const addNetwork = () => {
      console.log('Adding network, current editedAgreement:', editedAgreement);
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        // Create a new array with the additional item
        current[lastKey] = [...current[lastKey], 'internet'];
        console.log('Added internet network, new array:', current[lastKey]);
        
        console.log('New agreement after adding network:', newAgreement);
        return newAgreement;
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

        {/* Existing networks */}
        {(value || []).map((network, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1.5
          }}>
            <Select
              size="small"
              value={network}
              onChange={(e) => handleNetworkChange(index, e.target.value)}
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
              }}
            >
              {networkOptions.map((option) => (
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
            <IconButton
              size="small"
              onClick={() => handleDeleteNetwork(index)}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white'
                }
              }}
              title="Delete network"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {/* Add new network button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 2
        }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addNetwork}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white'
              }
            }}
          >
            Add Network
          </Button>
        </Box>
      </Box>
    );
  };

  const renderSensitivityLevelField = (path, value, label) => {
    console.log('renderSensitivityLevelField called with:', { path, value, label });

    const sensitivityOptions = [
      { value: 'public', label: 'Public', color: '#4caf50' },
      { value: 'internal', label: 'Internal', color: '#ff9800' },
      { value: 'confidential', label: 'Confidential', color: '#f44336' },
      { value: 'highly_sensitive', label: 'Highly Sensitive', color: '#9c27b0' }
    ];

    const handleSensitivityChange = (index, newValue) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const handleDeleteSensitivity = (indexToDelete) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        return newAgreement;
      });
    };

    const addSensitivity = () => {
      console.log('Adding sensitivity level, current editedAgreement:', editedAgreement);
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
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
        
        // Create a new array with the additional item
        current[lastKey] = [...current[lastKey], 'public'];
        console.log('Added public sensitivity level, new array:', current[lastKey]);
        
        console.log('New agreement after adding sensitivity level:', newAgreement);
        return newAgreement;
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

        {/* Existing sensitivity levels */}
        {(value || []).map((sensitivity, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1.5
          }}>
            <Select
              size="small"
              value={sensitivity}
              onChange={(e) => handleSensitivityChange(index, e.target.value)}
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
              }}
            >
              {sensitivityOptions.map((option) => (
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
            <IconButton
              size="small"
              onClick={() => handleDeleteSensitivity(index)}
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'white'
                }
              }}
              title="Delete sensitivity level"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {/* Add new sensitivity level button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 2
        }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addSensitivity}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white'
              }
            }}
          >
            Add Sensitivity Level
          </Button>
        </Box>
      </Box>
    );
  };

  const renderField = (path, value, label, type = 'text', options = null, isRequired = false, fieldType = null) => {
    console.log('renderField called with:', { path, value, label, type, isRequired });
    
    // ALWAYS handle location fields with renderLocationField, regardless of data type
    if (path === 'location' || path.startsWith('location.')) {
      console.log('Location field detected, forcing renderLocationField usage');
      return renderLocationField('location', editedAgreement.location, label);
    }
    
    if (Array.isArray(value)) {
      // If the array contains objects, skip the generic primitive renderer
      const containsObjects = value.some((v) => v && typeof v === 'object');
      if (containsObjects) {
        // Either return null or add a JSON editor if you want. For now, avoid the crash.
        return null;
      }

      console.log('renderField handling array:', { path, value, label, valueLength: value.length });
      
      // Special handling for changelog arrays
      if (path === 'changelog') {
        console.log('Changelog array detected, using ChangelogEditor component');
        return (
          <ChangelogEditor
            value={value}
            onChange={(newChangelog) => {
              setEditedAgreement(prev => ({
                ...prev,
                changelog: newChangelog
              }));
            }}
            currentTheme={currentTheme}
          />
        );
      }
      
      // Special handling for dataConsumer arrays
      if (path === 'dataConsumer') {
        return renderDataConsumerField(path, value, label);
      }
      
      // Special handling for dataProducer arrays
      if (path === 'dataProducer') {
        return renderDataProducerField(path, value, label);
      }
      
      // Special handling for network arrays
      if (path === 'network') {
        return renderNetworkField(path, value, label);
      }
      
      // Special handling for sensitivity level arrays
      if (path === 'sensitivityLevel') {
        return renderSensitivityLevelField(path, value, label);
      }
      
      return (
        <Box key={path} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ 
              color: currentTheme.text, 
              fontWeight: 600
            }}>
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
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 1
            }}>
              <TextField
                size="small"
                value={item}
                onChange={(e) => handleArrayFieldChange(path, index, null, e.target.value)}
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
                placeholder={`Enter ${label.toLowerCase()}`}
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
      console.log('renderField handling object:', { path, value, label });
      
      // Special handling for changelog field
      if (path === 'changelog') {
        return (
          <ChangelogEditor
            value={value}
            onChange={(newChangelog) => {
              setEditedAgreement(prev => ({
                ...prev,
                changelog: newChangelog
              }));
            }}
            currentTheme={currentTheme}
          />
        );
      }
      
      // Special styling for todo field
      const isSpecialField = path === 'todo';
      
      console.log('Fallback object handling for:', path, 'with value:', value);
      
      // Skip location fields - they should be handled by renderLocationField
      if (path === 'location' || path.startsWith('location.')) {
        console.log('Skipping location field in fallback handling:', path);
        console.log('This should not happen - location fields should be caught earlier!');
        return null;
      }
      
      // Additional safety check: if this is the location object itself, don't process it
      if (path === 'location') {
        console.log('Location object detected in object renderer, skipping to prevent recursion');
        return null;
      }
      
      return (
        <Box key={path} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            {label}
          </Typography>
          <Box sx={{ pl: 2 }}>
            {Object.entries(value).map(([key, val]) => {
              console.log('Processing object entry:', { key, val, path: `${path}.${key}` });
              // Skip the date field for todo - it will be auto-updated
              if (path === 'todo' && key === 'date') {
                return null;
              }
              // Skip location-related fields completely
              if (path === 'location' || path.startsWith('location.') || key === 'location') {
                console.log('Skipping location field in object entry processing:', `${path}.${key}`);
                return null;
              }
              return (
                <Box key={`${path}.${key}`}>
                  {renderField(`${path}.${key}`, val, key.charAt(0).toUpperCase() + key.slice(1))}
                </Box>
              );
            })}
          </Box>
        </Box>
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

    if (type === 'date') {
      return (
        <TextField
          key={path}
          fullWidth
          label={label}
          type="date"
          value={value || ''}
          onChange={(e) => handleFieldChange(path, e.target.value)}
          variant="outlined"
          InputLabelProps={{
            shrink: true,
          }}
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

    if (type === 'switch') {
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
          label={label}
          sx={{ mb: 2, color: currentTheme.text }}
        />
      );
    }

    return (
      <TextField
        key={path}
        fullWidth
        label={label}
        value={value || ''}
        onChange={(e) => handleFieldChange(path, e.target.value)}
        variant="outlined"
        InputProps={{
          readOnly: path === 'lastUpdated'
        }}
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
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" sx={{ color: currentTheme.text }}>
          Loading agreement...
        </Typography>
      </Box>
    );
  }

  if (!editedAgreement) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" sx={{ color: currentTheme.text }}>
          Agreement not found
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleBackArrow} sx={{ color: currentTheme.text }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text }}>
                {isNewAgreement ? 'Create New Agreement' : 'Edit Agreement'}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: currentTheme.textSecondary }}>
                {isNewAgreement ? 'Fill in the details below' : agreement?.name || 'Agreement Details'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isNewAgreement && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={handleDeleteAgreement}
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'white',
                  }
                }}
              >
                Delete Agreement
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              sx={{ color: currentTheme.text, borderColor: currentTheme.border }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ bgcolor: currentTheme.primary }}
            >
              {saving ? 'Saving...' : (isNewAgreement ? 'Create Agreement' : 'Save Changes')}
            </Button>
          </Box>
        </Box>

        {isNewAgreement && (
          <Box sx={{ 
            mb: 3, p: 2, 
            bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)', 
            borderRadius: 1, border: '1px solid', 
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
              display: 'block', mt: 0.5 
            }}>
              Fields marked with * are required to create the agreement. Fill in at least the Name and Description to proceed.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Form */}
      <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        {/* Last Updated Display */}
        {!isNewAgreement && editedAgreement.lastUpdated ? (
          <Box sx={{ 
            mb: 3, p: 2, 
            bgcolor: currentTheme.darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.08)', 
            borderRadius: 1, border: '1px solid', 
            borderColor: currentTheme.darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)',
            backdropFilter: currentTheme.darkMode ? 'blur(10px)' : 'blur(5px)'
          }}>
            <Typography variant="body2" sx={{ 
              color: currentTheme.darkMode ? 'rgba(76, 175, 80, 0.9)' : 'success.dark', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              🕒 Last Updated: {editedAgreement.lastUpdated}
            </Typography>
          </Box>
        ) : isNewAgreement && (
          <Box sx={{ 
            mb: 3, p: 2, 
            bgcolor: currentTheme.darkMode ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.08)', 
            borderRadius: 1, border: '1px solid', 
            borderColor: currentTheme.darkMode ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 193, 7, 0.2)',
            backdropFilter: currentTheme.darkMode ? 'blur(10px)' : 'blur(5px)'
          }}>
            <Typography variant="body2" sx={{ 
              color: currentTheme.darkMode ? 'rgba(255, 193, 7, 0.9)' : 'warning.dark', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              ⏰ Will be created with current timestamp when saved
            </Typography>
          </Box>
        )}
        
        <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
          Agreement Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderField('name', editedAgreement.name, 'Name', 'text', null, true)}
          </Grid>
          <Grid item xs={12}>
            {renderField('description', editedAgreement.description, 'Description', 'text', null, true)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('status', editedAgreement.status, 'Status', 'select', [
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'in_review', label: 'In Review' },
              { value: 'expired', label: 'Expired' }
            ])}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('contractVersion', editedAgreement.contractVersion, 'Contract Version')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('specificationMaintainer', editedAgreement.specificationMaintainer, 'Specification Maintainer')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('parentSystem', editedAgreement.parentSystem, 'Parent System')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('dataProducer', editedAgreement.dataProducer, 'Data Producer', 'text', null, false, 'array')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('dataConsumer', editedAgreement.dataConsumer, 'Data Consumer', 'text', null, false, 'array')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('dataValidator', editedAgreement.dataValidator, 'Data Validator')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('modelShortName', editedAgreement.modelShortName, 'Model Short Name')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('fileFormat', editedAgreement.fileFormat, 'File Format')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('startDate', editedAgreement.startDate, 'Start Date', 'date')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('endDate', editedAgreement.endDate, 'End Date', 'date')}
          </Grid>

          <Grid item xs={12} md={6}>
            {renderField('restricted', editedAgreement.restricted, 'Restricted', 'switch')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('network', editedAgreement.network, 'Network', 'text', null, false, 'array')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('sensitivityLevel', editedAgreement.sensitivityLevel, 'Sensitivity Level', 'text', null, false, 'array')}
          </Grid>
          <Grid item xs={12}>
            {renderField('deliveredVersion', editedAgreement.deliveredVersion, 'Delivered Version')}
          </Grid>
          <Grid item xs={12}>
            {renderField('deliveryFrequency', editedAgreement.deliveryFrequency, 'Delivery Frequency')}
          </Grid>
          <Grid item xs={12}>
            {(() => {
              console.log('Rendering location field in form, value:', editedAgreement.location);
              console.log('Location value type:', typeof editedAgreement.location);
              console.log('Location value isArray:', Array.isArray(editedAgreement.location));
              console.log('Location value keys:', editedAgreement.location ? Object.keys(editedAgreement.location) : 'null');
              
              // Direct rendering of location field to avoid complex renderField logic
              return renderLocationField('location', editedAgreement.location, 'Location');
            })()}
          </Grid>
          <Grid item xs={12}>
            {renderField('todo', editedAgreement.todo, 'Todo')}
          </Grid>
          <Grid item xs={12}>
            {renderField('changelog', editedAgreement.changelog, 'Changelog')}
          </Grid>
        </Grid>
      </Paper>

      {/* Delete Array Item Confirmation Dialog */}
      <Dialog
        open={showDeleteArrayDialog}
        onClose={() => setShowDeleteArrayDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Typography>
            Are you sure you want to delete this {deleteArrayItem.label}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteArrayDialog(false)} sx={{ color: currentTheme.text }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteArrayItemConfirmed} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Agreement Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
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
        <DialogTitle sx={{ color: currentTheme.text }}>
          Delete Agreement
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Typography sx={{ mb: 2 }}>
            This action cannot be undone. This will permanently delete the agreement:
          </Typography>
          <Box sx={{ p: 2, bgcolor: currentTheme.darkMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)', borderRadius: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'error.main', mb: 1 }}>
              {agreement?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              ID: {agreement?.id}
            </Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            To confirm deletion, type <strong>"delete {agreement?.name}"</strong> below:
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type the confirmation text"
            sx={{
              '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
              '& .MuiOutlinedInput-root': { 
                color: currentTheme.text,
                '& fieldset': { borderColor: currentTheme.border }
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} sx={{ color: currentTheme.text }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteAgreement}
            color="error"
            variant="contained"
            disabled={deleteConfirmation !== `delete ${agreement?.name}`}
          >
            Delete Agreement
          </Button>
        </DialogActions>
      </Dialog>

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
    </Container>
  );
};

export default EditAgreementPage;
