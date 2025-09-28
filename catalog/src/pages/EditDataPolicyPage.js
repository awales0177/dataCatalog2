import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  alpha,
  InputAdornment,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, createDataPolicy, updateDataPolicy, deleteDataPolicy } from '../services/api';
import DeleteModal from '../components/DeleteModal';

const EditDataPolicyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editedPolicy, setEditedPolicy] = useState(null);
  const [originalPolicy, setOriginalPolicy] = useState(null);

  const isNewPolicy = !id || id === 'create';

  const statuses = [
    { value: 'draft', label: 'Draft', color: '#ff9800' },
    { value: 'active', label: 'Active', color: '#4caf50' },
    { value: 'review', label: 'Under Review', color: '#2196f3' },
    { value: 'expired', label: 'Expired', color: '#f44336' }
  ];

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        if (isNewPolicy) {
          const newPolicy = {
            id: '',
            name: '',
            description: '',
            status: 'draft',
            owner: '',
            externalLink: '',
            tags: []
          };
          setEditedPolicy(newPolicy);
          setOriginalPolicy({ ...newPolicy });
        } else {
          const response = await fetchData('policies');
          console.log('Fetched response:', response);
          const policies = response.policies || response || [];
          console.log('Policies array:', policies);
          console.log('Looking for policy with ID:', id);
          console.log('Available policy IDs:', policies.map(p => p.id));
          
          const policy = policies.find(p => p.id === id);
          console.log('Found policy:', policy);
          
          if (policy) {
            setEditedPolicy({ ...policy });
            setOriginalPolicy({ ...policy });
          } else {
            console.error('Policy not found. Available policies:', policies);
            setSnackbar({ open: true, message: `Policy with ID ${id} not found`, severity: 'error' });
            navigate('/policies');
          }
        }
      } catch (error) {
        console.error('Error loading policy:', error);
        setSnackbar({ open: true, message: 'Error loading policy', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, [id, isNewPolicy, navigate]);

  const handleFieldChange = (field, value) => {
    setEditedPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const hasChanges = () => {
    if (!originalPolicy || !editedPolicy) return false;
    return JSON.stringify(originalPolicy) !== JSON.stringify(editedPolicy);
  };

  const handleSave = async () => {
    if (!editedPolicy.name.trim() || !editedPolicy.description.trim()) {
      setSnackbar({ open: true, message: 'Name and description are required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (isNewPolicy) {
        await createDataPolicy(editedPolicy);
        setSnackbar({ open: true, message: 'Policy created successfully', severity: 'success' });
      } else {
        await updateDataPolicy(editedPolicy.id, editedPolicy);
        setSnackbar({ open: true, message: 'Policy updated successfully', severity: 'success' });
      }
      navigate('/policies');
    } catch (error) {
      console.error('Error saving policy:', error);
      setSnackbar({ open: true, message: 'Error saving policy', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDataPolicy(editedPolicy.id);
      setSnackbar({ open: true, message: 'Policy deleted successfully', severity: 'success' });
      navigate('/policies');
    } catch (error) {
      console.error('Error deleting policy:', error);
      setSnackbar({ open: true, message: 'Error deleting policy', severity: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancel = () => {
    navigate('/policies');
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : '#9e9e9e';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress sx={{ color: currentTheme.primary }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/policies')}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1)
              }
            }}
          >
            Back to Policies
          </Button>
        </Box>
        
        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            {isNewPolicy ? 'Create Data Policy' : 'Edit Data Policy'}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {isNewPolicy ? 'Define a new data governance policy' : 'Modify policy settings'}
          </Typography>
        </Box>
      </Box>

      {/* Main Form */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
              Policy Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Policy Name *"
                  value={editedPolicy?.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
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
                <FormControl fullWidth>
                  <InputLabel sx={{ color: currentTheme.textSecondary }}>Status</InputLabel>
                  <Select
                    value={editedPolicy?.status || 'draft'}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    label="Status"
                    sx={{
                      color: currentTheme.text,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                      '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                    }}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
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
                  value={editedPolicy?.description || ''}
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
                  label="Owner"
                  value={editedPolicy?.owner || ''}
                  onChange={(e) => handleFieldChange('owner', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: currentTheme.textSecondary, fontSize: 20 }} />
                      </InputAdornment>
                    ),
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
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="External Link"
                  value={editedPolicy?.externalLink || ''}
                  onChange={(e) => handleFieldChange('externalLink', e.target.value)}
                  placeholder="https://company.com/policies/..."
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

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={editedPolicy?.tags || []}
                  onChange={(event, newValue) => {
                    handleFieldChange('tags', newValue);
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option}
                        {...getTagProps({ index })}
                        key={index}
                        sx={{
                          borderColor: currentTheme.border,
                          color: currentTheme.text,
                          '& .MuiChip-deleteIcon': {
                            color: currentTheme.textSecondary,
                            '&:hover': {
                              color: currentTheme.error
                            }
                          }
                        }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Type and press Enter to add tags"
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
                  )}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isNewPolicy && (
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={() => setShowDeleteModal(true)}
              sx={{
                borderColor: currentTheme.error,
                color: currentTheme.error,
                '&:hover': {
                  borderColor: currentTheme.error,
                  bgcolor: alpha(currentTheme.error, 0.1)
                }
              }}
            >
              Delete Policy
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1)
              }
            }}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              '&:hover': { bgcolor: alpha(currentTheme.primary, 0.8) },
              '&:disabled': { 
                bgcolor: currentTheme.border, 
                color: currentTheme.textSecondary 
              }
            }}
          >
            {saving ? 'Saving...' : (isNewPolicy ? 'Create Policy' : 'Save Changes')}
          </Button>
        </Box>
      </Box>

      {/* Delete Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Data Policy"
        itemName={editedPolicy?.name}
        itemType="data policy"
        theme={currentTheme}
      >
        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
          This will permanently delete the policy. This action cannot be undone.
        </Typography>
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
          sx={{ 
            bgcolor: currentTheme.card, 
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditDataPolicyPage;