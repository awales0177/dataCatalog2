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
  Chip,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  alpha,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Storage as StorageIcon,
  Policy as PolicyIcon,
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

  const policyTypes = [
    { value: 'retention', label: 'Retention', icon: <StorageIcon />, color: '#2196f3' },
    { value: 'quality', label: 'Quality', icon: <AssessmentIcon />, color: '#4caf50' },
    { value: 'access', label: 'Access', icon: <SecurityIcon />, color: '#ff9800' },
    { value: 'compliance', label: 'Compliance', icon: <PolicyIcon />, color: '#f44336' }
  ];

  const priorities = [
    { value: 'critical', label: 'Critical', color: '#f44336' },
    { value: 'high', label: 'High', color: '#ff9800' },
    { value: 'medium', label: 'Medium', color: '#2196f3' },
    { value: 'low', label: 'Low', color: '#4caf50' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft', color: '#ff9800' },
    { value: 'review', label: 'Review', color: '#2196f3' },
    { value: 'active', label: 'Active', color: '#4caf50' },
    { value: 'expired', label: 'Expired', color: '#f44336' }
  ];

  const categories = [
    'data-governance',
    'data-quality',
    'data-security',
    'data-compliance',
    'data-retention',
    'data-access',
    'data-privacy'
  ];

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        if (isNewPolicy) {
          const newPolicy = {
            id: '',
            name: '',
            type: 'retention',
            description: '',
            status: 'draft',
            priority: 'medium',
            category: 'data-governance',
            owner: '',
            stakeholders: [],
            effectiveDate: new Date().toISOString().split('T')[0],
            reviewDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            version: '1.0.0',
            retentionRules: [],
            qualityStandards: [],
            accessControls: [],
            exceptions: [],
            compliance: [],
            tags: [],
            lastUpdated: new Date().toISOString()
          };
          setEditedPolicy(newPolicy);
          setOriginalPolicy(newPolicy);
        } else {
          const data = await fetchData('policies');
          const policy = data.policies.find(p => p.id === id);
          if (policy) {
            setEditedPolicy({ ...policy });
            setOriginalPolicy({ ...policy });
          } else {
            setSnackbar({ open: true, message: 'Policy not found', severity: 'error' });
            navigate('/policies');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading policy:', error);
        setSnackbar({ open: true, message: 'Failed to load policy', severity: 'error' });
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

  const handleArrayFieldChange = (arrayField, index, updatedItem) => {
    setEditedPolicy(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].map((item, i) => i === index ? updatedItem : item)
    }));
  };

  const addArrayItem = (arrayField, newItem) => {
    setEditedPolicy(prev => ({
      ...prev,
      [arrayField]: [...(prev[arrayField] || []), newItem]
    }));
  };

  const removeArrayItem = (arrayField, index) => {
    setEditedPolicy(prev => ({
      ...prev,
      [arrayField]: prev[arrayField].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!editedPolicy.name.trim()) {
      setSnackbar({ open: true, message: 'Policy name is required', severity: 'error' });
      return;
    }

    if (!editedPolicy.description.trim()) {
      setSnackbar({ open: true, message: 'Policy description is required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (isNewPolicy) {
        const newId = `${editedPolicy.type}_policy_${Date.now()}`;
        const policyToSave = { ...editedPolicy, id: newId };
        await createDataPolicy(policyToSave);
        setSnackbar({ open: true, message: 'Policy created successfully', severity: 'success' });
        navigate(`/policies/edit/${newId}`);
      } else {
        await updateDataPolicy(editedPolicy.id, editedPolicy);
        setSnackbar({ open: true, message: 'Policy updated successfully', severity: 'success' });
        setOriginalPolicy({ ...editedPolicy });
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      setSnackbar({ open: true, message: 'Failed to save policy', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNewPolicy) {
      navigate('/policies');
      return;
    }

    setDeleting(true);
    try {
      await deleteDataPolicy(editedPolicy.id);
      setSnackbar({ open: true, message: 'Policy deleted successfully', severity: 'success' });
      navigate('/policies');
    } catch (error) {
      console.error('Error deleting policy:', error);
      setSnackbar({ open: true, message: 'Failed to delete policy', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const hasChanges = () => {
    if (!originalPolicy || !editedPolicy) return false;
    return JSON.stringify(originalPolicy) !== JSON.stringify(editedPolicy);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton
          onClick={() => navigate('/policies')}
          sx={{ color: currentTheme.textSecondary }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
            {isNewPolicy ? 'Create New Policy' : `Edit Policy: ${editedPolicy?.name}`}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {isNewPolicy ? 'Define a new data governance policy' : 'Modify policy settings and rules'}
          </Typography>
        </Box>
      </Box>

      {/* Main Form */}
      <Grid container spacing={3}>
        {/* Left Column - Basic Info */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
              Basic Information
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
                  <InputLabel sx={{ color: currentTheme.textSecondary }}>Type *</InputLabel>
                  <Select
                    value={editedPolicy?.type || 'retention'}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    label="Type *"
                    sx={{
                      color: currentTheme.text,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                      '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                    }}
                  >
                    {policyTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          {type.label}
                        </Box>
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
                <FormControl fullWidth>
                  <InputLabel sx={{ color: currentTheme.textSecondary }}>Priority</InputLabel>
                  <Select
                    value={editedPolicy?.priority || 'medium'}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    label="Priority"
                    sx={{
                      color: currentTheme.text,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                      '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                    }}
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Owner"
                  value={editedPolicy?.owner || ''}
                  onChange={(e) => handleFieldChange('owner', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: currentTheme.textSecondary }} />
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
                <FormControl fullWidth>
                  <InputLabel sx={{ color: currentTheme.textSecondary }}>Category</InputLabel>
                  <Select
                    value={editedPolicy?.category || 'data-governance'}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    label="Category"
                    sx={{
                      color: currentTheme.text,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                      '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                    }}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Effective Date"
                  value={editedPolicy?.effectiveDate || ''}
                  onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScheduleIcon sx={{ color: currentTheme.textSecondary }} />
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
                  type="date"
                  label="Review Date"
                  value={editedPolicy?.reviewDate || ''}
                  onChange={(e) => handleFieldChange('reviewDate', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScheduleIcon sx={{ color: currentTheme.textSecondary }} />
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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags"
                  value={editedPolicy?.tags?.join(', ') || ''}
                  onChange={(e) => handleFieldChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                  placeholder="Enter tags separated by commas"
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

          {/* Type-specific Rules */}
          {editedPolicy?.type === 'retention' && (
            <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ color: currentTheme.text }}>
                  Retention Rules
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addArrayItem('retentionRules', {
                    dataType: '',
                    retentionPeriod: '',
                    retentionUnit: 'years',
                    retentionValue: 1,
                    action: 'delete',
                    reason: ''
                  })}
                  sx={{
                    color: currentTheme.primary,
                    borderColor: currentTheme.primary,
                    '&:hover': { borderColor: currentTheme.primary, bgcolor: alpha(currentTheme.primary, 0.1) }
                  }}
                  variant="outlined"
                  size="small"
                >
                  Add Rule
                </Button>
              </Box>

              {editedPolicy?.retentionRules?.map((rule, index) => (
                <Card key={index} sx={{ mb: 2, bgcolor: currentTheme.background, border: `1px solid ${currentTheme.border}` }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                        Retention Rule {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeArrayItem('retentionRules', index)}
                        sx={{ color: '#f44336' }}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Data Type"
                          value={rule.dataType || ''}
                          onChange={(e) => handleArrayFieldChange('retentionRules', index, { ...rule, dataType: e.target.value })}
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
                          <InputLabel sx={{ color: currentTheme.textSecondary }}>Action</InputLabel>
                          <Select
                            value={rule.action || 'delete'}
                            onChange={(e) => handleArrayFieldChange('retentionRules', index, { ...rule, action: e.target.value })}
                            label="Action"
                            sx={{
                              color: currentTheme.text,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                              '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                            }}
                          >
                            <MenuItem value="delete">Delete</MenuItem>
                            <MenuItem value="archive">Archive</MenuItem>
                            <MenuItem value="anonymize">Anonymize</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Retention Value"
                          value={rule.retentionValue || ''}
                          onChange={(e) => handleArrayFieldChange('retentionRules', index, { ...rule, retentionValue: parseInt(e.target.value) || 0 })}
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

                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ color: currentTheme.textSecondary }}>Unit</InputLabel>
                          <Select
                            value={rule.retentionUnit || 'years'}
                            onChange={(e) => handleArrayFieldChange('retentionRules', index, { ...rule, retentionUnit: e.target.value })}
                            label="Unit"
                            sx={{
                              color: currentTheme.text,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.border },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme.primary },
                              '& .MuiSelect-icon': { color: currentTheme.textSecondary }
                            }}
                          >
                            <MenuItem value="days">Days</MenuItem>
                            <MenuItem value="months">Months</MenuItem>
                            <MenuItem value="years">Years</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Period"
                          value={rule.retentionPeriod || ''}
                          onChange={(e) => handleArrayFieldChange('retentionRules', index, { ...rule, retentionPeriod: e.target.value })}
                          size="small"
                          placeholder="e.g., 7 years"
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
                        <TextField
                          fullWidth
                          label="Reason"
                          value={rule.reason || ''}
                          onChange={(e) => handleArrayFieldChange('retentionRules', index, { ...rule, reason: e.target.value })}
                          size="small"
                          placeholder="Why this retention period is required"
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
                  </CardContent>
                </Card>
              ))}
            </Paper>
          )}

          {/* Compliance and Exceptions */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
              Compliance & Exceptions
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Compliance Frameworks"
                  value={editedPolicy?.compliance?.join(', ') || ''}
                  onChange={(e) => handleFieldChange('compliance', e.target.value.split(',').map(item => item.trim()).filter(item => item))}
                  placeholder="GDPR, CCPA, SOX, etc."
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
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Exceptions"
                  value={editedPolicy?.exceptions?.join('\n') || ''}
                  onChange={(e) => handleFieldChange('exceptions', e.target.value.split('\n').filter(line => line.trim()))}
                  placeholder="List any exceptions to this policy..."
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
        </Grid>

        {/* Right Column - Actions & Preview */}
        <Grid item xs={12} md={4}>
          {/* Actions */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
              Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || !hasChanges()}
                sx={{
                  bgcolor: currentTheme.primary,
                  color: currentTheme.background,
                  '&:hover': { bgcolor: currentTheme.primaryDark || currentTheme.primary },
                  '&:disabled': { bgcolor: currentTheme.border, color: currentTheme.textSecondary }
                }}
              >
                {saving ? 'Saving...' : (isNewPolicy ? 'Create Policy' : 'Save Changes')}
              </Button>

              {!isNewPolicy && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                  sx={{
                    color: '#f44336',
                    borderColor: '#f44336',
                    '&:hover': { borderColor: '#f44336', bgcolor: alpha('#f44336', 0.1) }
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete Policy'}
                </Button>
              )}
            </Box>
          </Paper>

          {/* Policy Preview */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3 }}>
              Policy Preview
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 1, 
                  bgcolor: alpha(getPolicyTypeColor(editedPolicy?.type), 0.1),
                  color: getPolicyTypeColor(editedPolicy?.type),
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {getPolicyTypeIcon(editedPolicy?.type)}
                </Box>
                <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                  {editedPolicy?.type?.charAt(0).toUpperCase() + editedPolicy?.type?.slice(1)} Policy
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={editedPolicy?.priority || 'medium'}
                  size="small"
                  sx={{
                    bgcolor: alpha(getPriorityColor(editedPolicy?.priority), 0.1),
                    color: getPriorityColor(editedPolicy?.priority),
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                />
                <Chip
                  label={editedPolicy?.status || 'draft'}
                  size="small"
                  sx={{
                    bgcolor: alpha(getStatusColor(editedPolicy?.status), 0.1),
                    color: getStatusColor(editedPolicy?.status),
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                />
              </Box>

              {editedPolicy?.owner && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: currentTheme.textSecondary }} />
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    {editedPolicy.owner}
                  </Typography>
                </Box>
              )}

              {editedPolicy?.effectiveDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: currentTheme.textSecondary }} />
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    Effective: {editedPolicy.effectiveDate}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

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
          This will permanently delete the policy and all associated rules. This action cannot be undone.
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

  function getPolicyTypeIcon(type) {
    switch (type) {
      case 'retention':
        return <StorageIcon />;
      case 'quality':
        return <AssessmentIcon />;
      case 'access':
        return <SecurityIcon />;
      case 'compliance':
        return <PolicyIcon />;
      default:
        return <PolicyIcon />;
    }
  }

  function getPolicyTypeColor(type) {
    switch (type) {
      case 'retention':
        return '#2196f3';
      case 'quality':
        return '#4caf50';
      case 'access':
        return '#ff9800';
      case 'compliance':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }

  function getPriorityColor(priority) {
    switch (priority) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'medium':
        return '#2196f3';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'draft':
        return '#ff9800';
      case 'review':
        return '#2196f3';
      case 'expired':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  }
};

export default EditDataPolicyPage;
