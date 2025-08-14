import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  ExpandMore as ExpandMoreIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../App';
import { fetchData, createAgreement, updateAgreement, deleteAgreement } from '../services/api';

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
  const [newLocationKey, setNewLocationKey] = useState('');
  const [newLocationValue, setNewLocationValue] = useState('');
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
          setEditedAgreement(migratedNewAgreement);
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
              setEditedAgreement(migratedAgreement);
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
      return editedAgreement.name && editedAgreement.description && editedAgreement.id;
    }
    
    console.log('Checking for changes:');
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
      const newAgreement = { ...prev };
      const pathArray = path.split('.');
      let current = newAgreement;
      
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!(pathArray[i] in current)) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }
      
      const lastPart = pathArray[pathArray.length - 1];
      if (lastPart.includes('[') && lastPart.includes(']')) {
        const key = lastPart.split('[')[0];
        const index = parseInt(lastPart.split('[')[1].split(']')[0]);
        if (!Array.isArray(current[key])) {
          current[key] = [];
        }
        current[key][index] = value;
      } else {
        current[lastPart] = value;
      }
      
      return newAgreement;
    });
  };

  const handleArrayFieldChange = (path, index, value) => {
    setEditedAgreement(prev => {
      const newAgreement = { ...prev };
      const pathArray = path.split('.');
      let current = newAgreement;
      
      for (let i = 0; i < pathArray.length; i++) {
        current = current[pathArray[i]];
      }
      
      if (Array.isArray(current)) {
        current[index] = value;
      }
      
      return newAgreement;
    });
  };

  const addArrayItem = (path) => {
    setEditedAgreement(prev => {
      const newAgreement = { ...prev };
      const pathArray = path.split('.');
      let current = newAgreement;
      
      for (let i = 0; i < pathArray.length; i++) {
        current = current[pathArray[i]];
      }
      
      if (Array.isArray(current)) {
        current.push('');
      }
      
      return newAgreement;
    });
  };

  const confirmDeleteArrayItem = (path, index, label) => {
    setDeleteArrayItem({ path, index, label });
    setShowDeleteArrayDialog(true);
  };

  const handleDeleteArrayItemConfirmed = () => {
    setEditedAgreement(prev => {
      const newAgreement = { ...prev };
      const pathArray = deleteArrayItem.path.split('.');
      let current = newAgreement;
      
      for (let i = 0; i < pathArray.length; i++) {
        current = current[pathArray[i]];
      }
      
      if (Array.isArray(current)) {
        current.splice(deleteArrayItem.index, 1);
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
    const handleAddLocationItem = () => {
      if (newLocationKey.trim() && newLocationValue.trim()) {
        setEditedAgreement(prev => {
          const newAgreement = { ...prev };
          const pathArray = path.split('.');
          let current = newAgreement;
          
          for (let i = 0; i < pathArray.length; i++) {
            current = current[pathArray[i]];
          }
          
          if (typeof current === 'object' && current !== null) {
            current[newLocationKey.trim()] = newLocationValue.trim();
          }
          
          return newAgreement;
        });
        
        setNewLocationKey('');
        setNewLocationValue('');
      }
    };

    const handleKeyChange = (oldKey, newKey) => {
      if (oldKey === newKey || !newKey.trim()) return;
      
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }
        
        if (typeof current === 'object' && current !== null) {
          const value = current[oldKey];
          delete current[oldKey];
          current[newKey.trim()] = value;
        }
        
        return newAgreement;
      });
    };

    const handleValueChange = (key, newValue) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }
        
        if (typeof current === 'object' && current !== null) {
          current[key] = newValue;
        }
        
        return newAgreement;
      });
    };

    const handleDeleteLocationItem = (keyToDelete) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }
        
        if (typeof current === 'object' && current !== null) {
          delete current[keyToDelete];
        }
        
        return newAgreement;
      });
    };

    return (
      <Box key={path} sx={{ 
        mb: 2,
        p: 2,
        bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)',
        borderRadius: 1,
        border: `1px solid ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)'}`,
        borderLeft: `4px solid ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.4)' : 'rgba(33, 150, 243, 0.3)'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ 
            color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.9)' : 'rgba(33, 150, 243, 0.8)', 
            fontWeight: 700,
            fontSize: '1rem'
          }}>
            {label}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.7)' : 'rgba(33, 150, 243, 0.6)',
            fontStyle: 'italic',
            ml: 'auto'
          }}>
            Key-Value Pairs
          </Typography>
        </Box>

        {/* Existing location items */}
        {Object.entries(value || {}).map(([key, val]) => (
          <Box key={key} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1.5,
            p: 1.5,
            bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.04)' : 'rgba(33, 150, 243, 0.03)',
            borderRadius: 1,
            border: `1px solid ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.12)'}`,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.06)' : 'rgba(33, 150, 243, 0.05)',
              borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.25)' : 'rgba(33, 150, 243, 0.2)'
            }
          }}>
            <TextField
              size="small"
              label="Bucket"
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value)}
              sx={{ 
                flex: 1,
                '& .MuiInputLabel-root': { 
                  color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)',
                  fontWeight: 600
                },
                '& .MuiOutlinedInput-root': { 
                  color: currentTheme.text,
                  bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)',
                  '& fieldset': { 
                    borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)',
                    borderWidth: '1.5px'
                  },
                  '&:hover fieldset': { 
                    borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.25)'
                  },
                  '&.Mui-focused fieldset': { 
                    borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.4)'
                  }
                },
                '& .MuiInputBase-input': { color: currentTheme.text },
                '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
              }}
              placeholder="Location bucket"
            />
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mx: 1 }}>
              :
            </Typography>
            <TextField
              size="small"
              label="Description"
              value={val}
              onChange={(e) => handleValueChange(key, e.target.value)}
              sx={{ 
                flex: 1,
                '& .MuiInputLabel-root': { 
                  color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)',
                  fontWeight: 600
                },
                '& .MuiOutlinedInput-root': { 
                  color: currentTheme.text,
                  bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)',
                  '& fieldset': { 
                    borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)',
                    borderWidth: '1.5px'
                  },
                  '&:hover fieldset': { 
                    borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.25)'
                  },
                  '&.Mui-focused fieldset': { 
                    borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.4)'
                  }
                },
                '& .MuiInputBase-input': { color: currentTheme.text },
                '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
              }}
              placeholder="Location description"
            />
            <IconButton
              size="small"
              onClick={() => handleDeleteLocationItem(key)}
              sx={{ 
                color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.7)' : 'rgba(33, 150, 243, 0.6)',
                '&:hover': {
                  bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)'
                }
              }}
              title="Delete location item"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        {/* Add new location item */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mt: 2,
          p: 2,
          bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.06)' : 'rgba(33, 150, 243, 0.04)',
          borderRadius: 1,
          border: `2px dashed ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)'}`,
          borderStyle: 'dashed'
        }}>
                                <TextField
             size="small"
             label="New Bucket"
             value={newLocationKey}
             onChange={(e) => setNewLocationKey(e.target.value)}
             sx={{ 
               flex: 1,
               '& .MuiInputLabel-root': { 
                 color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)',
                 fontWeight: 600
               },
               '& .MuiOutlinedInput-root': { 
                 color: currentTheme.text,
                 bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)',
                 '& fieldset': { 
                   borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)',
                   borderWidth: '1.5px'
                 },
                 '&:hover fieldset': { 
                   borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.25)'
                 },
                 '&.Mui-focused fieldset': { 
                   borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.4)'
                 }
               },
               '& .MuiInputBase-input': { color: currentTheme.text },
               '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
             }}
             placeholder="Enter bucket"
           />
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mx: 1 }}>
            :
          </Typography>
                                <TextField
             size="small"
             label="New Description"
             value={newLocationValue}
             onChange={(e) => setNewLocationValue(e.target.value)}
             sx={{ 
               flex: 1,
               '& .MuiInputLabel-root': { 
                 color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)',
                 fontWeight: 600
               },
               '& .MuiOutlinedInput-root': { 
                 color: currentTheme.text,
                 bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)',
                 '& fieldset': { 
                   borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)',
                   borderWidth: '1.5px'
                 },
                 '&:hover fieldset': { 
                   borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.25)'
                 },
                 '&.Mui-focused fieldset': { 
                   borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.4)'
                 }
               },
               '& .MuiInputBase-input': { color: currentTheme.text },
               '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
             }}
             placeholder="Enter description"
           />
          <IconButton
            size="small"
            onClick={handleAddLocationItem}
            disabled={!newLocationKey.trim() || !newLocationValue.trim()}
            sx={{ 
              color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)',
              '&:hover': {
                bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)'
              },
              '&:disabled': {
                color: currentTheme.textSecondary,
                opacity: 0.5
              }
            }}
            title="Add new location item"
          >
            <AddIcon />
          </IconButton>
        </Box>
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

  const renderChangelogField = (path, value, label) => {
    console.log('renderChangelogField called with:', { path, value, label });

    const handleVersionChange = (index, newVersion) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }
        
        if (Array.isArray(current) && current[index]) {
          current[index].version = newVersion;
        }
        
        return newAgreement;
      });
    };



    const handleChangesChange = (index, newChanges) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }
        
        if (Array.isArray(current) && current[index]) {
          current[index].changes = [newChanges];
        }
        
        return newAgreement;
      });
    };

    const handleDeleteChangelogItem = (indexToDelete) => {
      setEditedAgreement(prev => {
        const newAgreement = { ...prev };
        const pathArray = path.split('.');
        let current = newAgreement;
        
        for (let i = 0; i < pathArray.length; i++) {
          current = current[pathArray[i]];
        }
        
        if (Array.isArray(current)) {
          current.splice(indexToDelete, 1);
        }
        
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

        {/* Existing changelog items */}
        {(value || []).map((item, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 1, 
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                label="Version"
                value={item.version || ''}
                onChange={(e) => handleVersionChange(index, e.target.value)}
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
                placeholder="Version number"
              />
              <Tooltip title="Date when this changelog entry was created (cannot be edited)" arrow>
                <TextField
                  size="small"
                  label="Date"
                  value={item.date || ''}
                  InputProps={{
                    readOnly: true
                  }}
                  sx={{ 
                    flex: 1,
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiOutlinedInput-root': { 
                      color: currentTheme.textSecondary,
                      '& fieldset': { borderColor: currentTheme.border }
                    },
                    '& .MuiInputBase-input': { 
                      color: currentTheme.textSecondary,
                      WebkitTextFillColor: currentTheme.textSecondary
                    },
                    '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
                  }}
                placeholder="YYYY-MM-DD or ISO date"
              />
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => handleDeleteChangelogItem(index)}
                sx={{ 
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'white'
                  }
                }}
                title="Delete changelog item"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            <TextField
              size="small"
              label="Changes"
              value={Array.isArray(item.changes) ? item.changes.join(', ') : item.changes || ''}
              onChange={(e) => handleChangesChange(index, e.target.value)}
              multiline
              rows={2}
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
              placeholder="Describe the changes made in this version"
            />
          </Box>
        ))}

        {/* Add new changelog item */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 1, 
          mt: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              label="New Version"
              value={newChangelogVersion}
              onChange={(e) => setNewChangelogVersion(e.target.value)}
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
              placeholder="Enter version number"
            />
            <Box sx={{ 
              flex: 1, 
              p: 1.5, 
              bgcolor: currentTheme.card,
              borderRadius: 1,
              border: `1px solid ${currentTheme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography variant="body2" sx={{ 
                color: currentTheme.textSecondary,
                fontWeight: 600,
                textAlign: 'center'
              }}>
                Date will be set automatically
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => handleAddChangelogItem(path)}
              disabled={!newChangelogVersion.trim() || !newChangelogChanges.trim()}
              sx={{ 
                color: currentTheme.primary,
                '&:hover': {
                  bgcolor: currentTheme.primary,
                  color: 'white'
                },
                '&:disabled': {
                  color: currentTheme.textSecondary,
                  opacity: 0.5
                }
              }}
              title="Add new changelog item"
            >
              <AddIcon />
            </IconButton>
          </Box>
          <TextField
            size="small"
            label="New Changes"
            value={newChangelogChanges}
            onChange={(e) => setNewChangelogChanges(e.target.value)}
            multiline
            rows={2}
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
            placeholder="Describe the changes made in this version"
          />
        </Box>
      </Box>
    );
  };

  const renderField = (path, value, label, type = 'text', options = null, isRequired = false, fieldType = null) => {
    console.log('renderField called with:', { path, value, label, type, isRequired });
    
    if (Array.isArray(value)) {
      // Special handling for changelog arrays
      if (path === 'changelog') {
        console.log('Changelog array detected, calling renderChangelogField');
        return renderChangelogField(path, value, label);
      }
      
      // Special handling for dataConsumer arrays
      if (path === 'dataConsumer') {
        return renderDataConsumerField(path, value, label);
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
      // Special handling for location field
      if (path === 'location') {
        return renderLocationField(path, value, label);
      }
      
      // Special styling for todo field
      const isSpecialField = path === 'todo';
      
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
          <Grid item xs={12} md={6}>
            {renderField('id', editedAgreement.id, 'ID', 'text', null, true)}
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
            {renderField('dataProducer', editedAgreement.dataProducer, 'Data Producer')}
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
            {renderField('nextUpdate', editedAgreement.nextUpdate, 'Next Update', 'date')}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderField('restricted', editedAgreement.restricted, 'Restricted', 'switch')}
          </Grid>
          <Grid item xs={12}>
            {renderField('dataConsumer', editedAgreement.dataConsumer, 'Data Consumer', 'text', null, false, 'array')}
          </Grid>
          <Grid item xs={12}>
            {renderField('deliveredVersion', editedAgreement.deliveredVersion, 'Delivered Version')}
          </Grid>
          <Grid item xs={12}>
            {renderField('deliveryFrequency', editedAgreement.deliveryFrequency, 'Delivery Frequency')}
          </Grid>
          <Grid item xs={12}>
            {renderField('location', editedAgreement.location, 'Location')}
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
