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
  const { agreementId } = useParams();
  
  // Extract ID from URL as fallback
  const urlPath = window.location.pathname;
  const urlId = urlPath.includes('/edit') ? urlPath.split('/')[2] : null;
  const finalAgreementId = agreementId || urlId;
  
  const isNewAgreement = !finalAgreementId || finalAgreementId === 'new';
  
  console.log('EditAgreementPage rendered with:');
  console.log('  agreementId from useParams:', agreementId);
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

  // Load agreement data
  useEffect(() => {
    const loadAgreement = async () => {
      console.log('Loading agreement with ID:', agreementId, 'isNewAgreement:', isNewAgreement);
      
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
          setAgreement(newAgreement);
          setEditedAgreement(newAgreement);
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
              setAgreement(foundAgreement);
              setEditedAgreement(foundAgreement);
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
        navigate(-1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isNewAgreement, navigate]);

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
    return JSON.stringify(agreement) !== JSON.stringify(editedAgreement);
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
        const result = await updateAgreement(agreementId, updatedAgreement);
        
        // Update local agreement
        setAgreement(updatedAgreement);
        
        setSnackbar({
          open: true,
          message: `Agreement updated successfully! Last updated: ${currentTimestamp}`,
          severity: 'success'
        });
        
        // Navigate back to view mode
        setTimeout(() => {
          navigate(`/agreements/${agreementId}`);
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
      navigate(`/agreements/${agreementId}`);
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
      await deleteAgreement(agreementId);
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

  const renderField = (path, value, label, type = 'text', options = null, isRequired = false) => {
    if (Array.isArray(value)) {
      // Special styling for arrays within todo and location
      const isSpecialArray = path.includes('todo.') || path.includes('location.');
      
      return (
        <Box key={path} sx={{ 
          mb: 2,
          ...(isSpecialArray && {
            p: 2,
            bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)',
            borderRadius: 1,
            border: `1px solid ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)'}`,
            borderLeft: `4px solid ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.4)' : 'rgba(33, 150, 243, 0.3)'}`
          })
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ 
              color: isSpecialArray ? (currentTheme.darkMode ? 'rgba(33, 150, 243, 0.9)' : 'rgba(33, 150, 243, 0.8)') : currentTheme.text, 
              fontWeight: isSpecialArray ? 700 : 600,
              fontSize: isSpecialArray ? '1rem' : '0.875rem'
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
              sx={{ 
                color: isSpecialArray ? (currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)') : currentTheme.primary,
                '&:hover': {
                  bgcolor: isSpecialArray ? (currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)') : undefined
                }
              }}
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
              mb: 1,
              ...(isSpecialArray && {
                p: 1.5,
                bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.04)' : 'rgba(33, 150, 243, 0.03)',
                borderRadius: 1,
                border: `1px solid ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.12)'}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.06)' : 'rgba(33, 150, 243, 0.05)',
                  borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.25)' : 'rgba(33, 150, 243, 0.2)'
                }
              })
            }}>
              <TextField
                size="small"
                value={item}
                onChange={(e) => handleArrayFieldChange(path, index, e.target.value)}
                sx={{ 
                  flex: 1,
                  ...(isSpecialArray ? {
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
                    }
                  } : {
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiInputLabel-root.Mui-focused': { color: currentTheme.primary },
                    '& .MuiOutlinedInput-root': { 
                      color: currentTheme.text,
                      '& fieldset': { borderColor: currentTheme.border },
                      '&:hover fieldset': { borderColor: currentTheme.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                    }
                  }),
                  '& .MuiInputBase-input': { color: currentTheme.text },
                  '& .MuiInputBase-input::placeholder': { color: currentTheme.textSecondary, opacity: 0.7 }
                }}
                placeholder={`Enter ${label.toLowerCase()}`}
              />
              <IconButton
                size="small"
                onClick={() => confirmDeleteArrayItem(path, index, label)}
                sx={{ 
                  color: isSpecialArray ? (currentTheme.darkMode ? 'rgba(33, 150, 243, 0.7)' : 'rgba(33, 150, 243, 0.6)') : 'error.main',
                  '&:hover': {
                    bgcolor: isSpecialArray ? (currentTheme.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.08)') : undefined
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      );
    }

    if (typeof value === 'object' && value !== null) {
      // Special styling for todo and location fields
      const isSpecialField = path === 'todo' || path === 'location';
      
      return (
        <Accordion key={path} sx={{ 
          mb: 2, 
          background: isSpecialField ? (currentTheme.darkMode 
            ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)' 
            : 'linear-gradient(135deg, rgba(33, 150, 243, 0.03) 0%, rgba(33, 150, 243, 0.01) 100%)'
          ) : 'transparent', 
          boxShadow: isSpecialField ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          borderRadius: isSpecialField ? 2 : 0,
          border: isSpecialField ? `1px solid ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.25)' : 'rgba(33, 150, 243, 0.2)'}` : 'none',
          transition: 'all 0.3s ease-in-out',
          '&:hover': isSpecialField ? {
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)'
          } : {},
          '& .MuiAccordionSummary-root': {
            background: isSpecialField ? (currentTheme.darkMode 
              ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.06) 100%)' 
              : 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.04) 100%)'
            ) : 'transparent',
            borderRadius: isSpecialField ? '8px 8px 0 0' : 0,
            border: 'none',
            '&:hover': { 
              background: isSpecialField ? (currentTheme.darkMode 
                ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.09) 100%)' 
                : 'linear-gradient(135deg, rgba(33, 150, 243, 0.12) 0%, rgba(33, 150, 243, 0.06) 100%)'
              ) : currentTheme.border + '20'
            },
            transition: 'all 0.2s ease-in-out'
          },
          '& .MuiAccordionDetails-root': {
            bgcolor: 'transparent',
            pt: isSpecialField ? 2 : 1
          },
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 1
          }
        }}>
          <AccordionSummary 
            expandIcon={
              <ExpandMoreIcon sx={{ 
                color: isSpecialField ? (currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)') : currentTheme.textSecondary,
                transition: 'transform 0.2s ease-in-out',
                ...(isSpecialField && {
                  '&.Mui-expanded': {
                    transform: 'rotate(180deg)',
                    color: currentTheme.darkMode ? 'rgba(33, 150, 243, 1)' : 'rgba(33, 150, 243, 0.9)'
                  }
                })
              }} />
            }
            sx={{ 
              color: currentTheme.text,
              minHeight: isSpecialField ? '56px' : '48px'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isSpecialField && (
                <Box sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.6)' : 'rgba(33, 150, 243, 0.5)',
                  flexShrink: 0,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: `0 0 0 0 ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0.4)' : 'rgba(33, 150, 243, 0.3)'}`
                    },
                    '70%': {
                      boxShadow: `0 0 0 6px ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0)' : 'rgba(33, 150, 243, 0)'}`
                    },
                    '100%': {
                      boxShadow: `0 0 0 0 ${currentTheme.darkMode ? 'rgba(33, 150, 243, 0)' : 'rgba(33, 150, 243, 0)'}`
                    }
                  }
                }} />
              )}
              <Typography variant="subtitle1" sx={{ 
                color: currentTheme.text, 
                fontWeight: isSpecialField ? 700 : 600,
                fontSize: isSpecialField ? '1.1rem' : '0.875rem'
              }}>
                {label}
              </Typography>
              {isSpecialField && (
                <Typography variant="caption" sx={{ 
                  color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.7)' : 'rgba(33, 150, 243, 0.6)',
                  fontStyle: 'italic',
                  ml: 'auto'
                }}>
                  Click to expand
                </Typography>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ pl: isSpecialField ? 3 : 2 }}>
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
                  '&:hover': { bgcolor: currentTheme.primary + '20' }
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  bgcolor: currentTheme.primary
                }
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
          // Special styling for fields within todo and location
          ...(path.includes('todo.') || path.includes('location.') ? {
            '& .MuiInputLabel-root': { 
              color: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(33, 150, 243, 0.7)',
              fontWeight: 600
            },
            '& .MuiOutlinedInput-root': { 
              color: currentTheme.text,
              bgcolor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.03)' : 'rgba(33, 150, 243, 0.02)',
              '& fieldset': { 
                borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)',
                borderWidth: '2px'
              },
              '&:hover fieldset': { 
                borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.5)' : 'rgba(33, 150, 243, 0.4)'
              },
              '&.Mui-focused fieldset': { 
                borderColor: currentTheme.darkMode ? 'rgba(33, 150, 243, 0.7)' : 'rgba(33, 150, 243, 0.6)'
              }
            }
          } : {
            '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
            '& .MuiOutlinedInput-root': { 
              color: currentTheme.text,
              '& fieldset': { borderColor: currentTheme.border },
              '&:hover fieldset': { borderColor: currentTheme.primary },
              '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
            }
          }),
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
      <Paper sx={{ p: 3, mb: 3, bgcolor: currentTheme.card }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleCancel} sx={{ color: currentTheme.text }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ color: currentTheme.text }}>
              {isNewAgreement ? 'Create New Agreement' : 'Edit Agreement'}
            </Typography>
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
              sx={{
                borderColor: currentTheme.border,
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: currentTheme.border + '20'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges() || saving}
              startIcon={<SaveIcon />}
              sx={{
                bgcolor: currentTheme.primary,
                color: currentTheme.background,
                '&:hover': {
                  bgcolor: currentTheme.primaryDark || currentTheme.primary
                },
                '&:disabled': {
                  bgcolor: currentTheme.border,
                  color: currentTheme.textSecondary
                }
              }}
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
      <Paper sx={{ p: 3, bgcolor: currentTheme.card }}>
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
            {renderField('dataConsumer', editedAgreement.dataConsumer, 'Data Consumer')}
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
