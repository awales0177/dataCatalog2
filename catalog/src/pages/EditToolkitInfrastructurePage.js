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
  Cloud as CloudIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, createToolkitComponent, updateToolkitComponent, deleteToolkitComponent } from '../services/api';

const EditToolkitInfrastructurePage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { infrastructureId } = useParams();
  const navigate = useNavigate();
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [editedInfrastructure, setEditedInfrastructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newDependency, setNewDependency] = useState('');
  const [newExample, setNewExample] = useState('');

  const isNewInfrastructure = !infrastructureId || infrastructureId === 'new';

  useEffect(() => {
    const loadInfrastructureData = async () => {
      try {
        if (isNewInfrastructure) {
          // Create new infrastructure template
          const newInfrastructure = {
            id: '',
            name: '',
            description: '',
            provider: 'aws',
            category: '',
            tags: [],
            mainTf: '',
            variablesTf: '',
            outputsTf: '',
            author: '',
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            usage: '',
            dependencies: [],
            examples: [],
            rating: 5.0,
            downloads: 0
          };
          setInfrastructureData(newInfrastructure);
          setEditedInfrastructure(JSON.parse(JSON.stringify(newInfrastructure)));
          setLoading(false);
        } else {
          // Load existing infrastructure
          const data = await fetchData('toolkit');
          const infrastructure = data.toolkit.infrastructure || [];
          const foundInfrastructure = infrastructure.find(i => i.id === infrastructureId);
          
          if (foundInfrastructure) {
            setInfrastructureData(foundInfrastructure);
            setEditedInfrastructure(JSON.parse(JSON.stringify(foundInfrastructure)));
          } else {
            setError('Infrastructure not found');
          }
        }
      } catch (err) {
        setError('Failed to load infrastructure data');
      } finally {
        setLoading(false);
      }
    };

    loadInfrastructureData();
  }, [infrastructureId, isNewInfrastructure]);

  const handleFieldChange = (field, value) => {
    setEditedInfrastructure(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!editedInfrastructure.name?.trim()) {
      setSnackbar({
        open: true,
        message: 'Infrastructure name is required',
        severity: 'error'
      });
      return;
    }

    if (!editedInfrastructure.description?.trim()) {
      setSnackbar({
        open: true,
        message: 'Description is required',
        severity: 'error'
      });
      return;
    }

    if (!editedInfrastructure.mainTf?.trim()) {
      setSnackbar({
        open: true,
        message: 'main.tf is required',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const infrastructureToSave = {
        ...editedInfrastructure,
        lastUpdated: new Date().toISOString()
      };

      if (isNewInfrastructure) {
        // Remove ID from payload - API will auto-generate it
        const { id, ...infrastructureWithoutId } = infrastructureToSave;
        
        const result = await createToolkitComponent({
          ...infrastructureWithoutId,
          type: 'terraform'
        });
        
        // Use the ID returned from the API
        const finalId = result?.id;
        
        if (!finalId) {
          throw new Error('Infrastructure created but no ID returned from server');
        }
        
        setSnackbar({
          open: true,
          message: 'Infrastructure created successfully!',
          severity: 'success'
        });
        setTimeout(() => navigate(`/toolkit/infrastructure/${finalId}`), 1500);
      } else {
        await updateToolkitComponent('terraform', infrastructureId, infrastructureToSave);
        setSnackbar({
          open: true,
          message: 'Infrastructure updated successfully!',
          severity: 'success'
        });
        setTimeout(() => navigate(`/toolkit/infrastructure/${infrastructureId}`), 1500);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${isNewInfrastructure ? 'creating' : 'updating'} infrastructure: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteToolkitComponent('terraform', infrastructureId);
      setSnackbar({
        open: true,
        message: 'Infrastructure deleted successfully!',
        severity: 'success'
      });
      setTimeout(() => navigate('/toolkit'), 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting infrastructure: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const goBack = () => {
    if (isNewInfrastructure) {
      navigate('/toolkit');
    } else {
      navigate(-1);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editedInfrastructure.tags.includes(newTag.trim())) {
      handleFieldChange('tags', [...editedInfrastructure.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    handleFieldChange('tags', editedInfrastructure.tags.filter(tag => tag !== tagToRemove));
  };

  const addDependency = () => {
    if (newDependency.trim() && !editedInfrastructure.dependencies.includes(newDependency.trim())) {
      handleFieldChange('dependencies', [...editedInfrastructure.dependencies, newDependency.trim()]);
      setNewDependency('');
    }
  };

  const removeDependency = (depToRemove) => {
    handleFieldChange('dependencies', editedInfrastructure.dependencies.filter(dep => dep !== depToRemove));
  };

  const addExample = () => {
    if (newExample.trim() && !editedInfrastructure.examples.includes(newExample.trim())) {
      handleFieldChange('examples', [...editedInfrastructure.examples, newExample.trim()]);
      setNewExample('');
    }
  };

  const removeExample = (exampleToRemove) => {
    handleFieldChange('examples', editedInfrastructure.examples.filter(example => example !== exampleToRemove));
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={goBack}>
          Back to Toolkit
        </Button>
      </Container>
    );
  }

  const providerOptions = [
    { value: 'aws', label: 'AWS' },
    { value: 'gcp', label: 'Google Cloud Platform' },
    { value: 'azure', label: 'Azure' },
    { value: 'terraform', label: 'Terraform (Generic)' },
  ];

  const categoryOptions = [
    { value: 'networking', label: 'Networking' },
    { value: 'kubernetes', label: 'Kubernetes' },
    { value: 'compute', label: 'Compute' },
    { value: 'storage', label: 'Storage' },
    { value: 'security', label: 'Security' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
            <CloudIcon sx={{ fontSize: 32 }} />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
              {isNewInfrastructure ? 'Create New Infrastructure' : `Edit ${editedInfrastructure?.name || 'Infrastructure'}`}
            </Typography>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
              {isNewInfrastructure ? 'Add a new infrastructure configuration to the toolkit' : 'Modify infrastructure details and configuration'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          {/* Basic Information */}
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
                  label="Infrastructure Name *"
                  value={editedInfrastructure?.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., AWS VPC with Private Subnets"
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
                  label="Description *"
                  value={editedInfrastructure?.description || ''}
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
                  <InputLabel sx={{ color: currentTheme.textSecondary }}>
                    Provider
                  </InputLabel>
                  <Select
                    value={editedInfrastructure?.provider || 'aws'}
                    onChange={(e) => handleFieldChange('provider', e.target.value)}
                    label="Provider"
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
                            '&:hover': { bgcolor: alpha(currentTheme.primary, 0.2) },
                            '&.Mui-selected': { bgcolor: alpha(currentTheme.primary, 0.4) }
                          }
                        }
                      }
                    }}
                  >
                    {providerOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: currentTheme.textSecondary }}>
                    Category
                  </InputLabel>
                  <Select
                    value={editedInfrastructure?.category || ''}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    label="Category"
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
                            '&:hover': { bgcolor: alpha(currentTheme.primary, 0.2) },
                            '&.Mui-selected': { bgcolor: alpha(currentTheme.primary, 0.4) }
                          }
                        }
                      }
                    }}
                  >
                    {categoryOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TeamSelector
                  selectedTeams={editedInfrastructure?.author ? [editedInfrastructure.author] : []}
                  onTeamsChange={(teams) => {
                    handleFieldChange('author', teams.length > 0 ? teams[0] : '');
                  }}
                  currentTheme={currentTheme}
                  label="Author"
                  showLabel={true}
                  maxSelections={1}
                  placeholder="No author selected"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Version"
                  value={editedInfrastructure?.version || '1.0.0'}
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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Usage Instructions"
                  value={editedInfrastructure?.usage || ''}
                  onChange={(e) => handleFieldChange('usage', e.target.value)}
                  placeholder="Describe how to use this infrastructure"
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

          {/* Main Terraform Section */}
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
              main.tf *
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={12}
              label="Main Terraform Configuration *"
              value={editedInfrastructure?.mainTf || ''}
              onChange={(e) => handleFieldChange('mainTf', e.target.value)}
              placeholder={`resource "aws_vpc" "main" {\n  cidr_block = var.vpc_cidr\n}`}
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

          {/* Variables Terraform Section */}
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
              variables.tf (Optional)
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={10}
              label="Variable Definitions"
              value={editedInfrastructure?.variablesTf || ''}
              onChange={(e) => handleFieldChange('variablesTf', e.target.value)}
              placeholder={`variable "vpc_cidr" {\n  description = "CIDR block for VPC"\n  type = string\n}`}
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

          {/* Outputs Terraform Section */}
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
              outputs.tf (Optional)
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={10}
              label="Output Definitions"
              value={editedInfrastructure?.outputsTf || ''}
              onChange={(e) => handleFieldChange('outputsTf', e.target.value)}
              placeholder={`output "vpc_id" {\n  value = aws_vpc.main.id\n}`}
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
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {editedInfrastructure?.tags?.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => removeTag(tag)}
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                    '& .MuiChip-deleteIcon': {
                      color: currentTheme.primary,
                      '&:hover': { color: currentTheme.primary }
                    }
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                sx={{
                  flex: 1,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border }
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={addTag}
                sx={{
                  color: currentTheme.primary,
                  borderColor: currentTheme.primary,
                  '&:hover': { borderColor: currentTheme.primary, bgcolor: alpha(currentTheme.primary, 0.1) }
                }}
              >
                Add
              </Button>
            </Box>
          </Paper>

          {/* Dependencies Section */}
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
              Dependencies
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {editedInfrastructure?.dependencies?.map((dep, index) => (
                <Chip
                  key={index}
                  label={dep}
                  onDelete={() => removeDependency(dep)}
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                    '& .MuiChip-deleteIcon': {
                      color: currentTheme.primary,
                      '&:hover': { color: currentTheme.primary }
                    }
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add a dependency"
                value={newDependency}
                onChange={(e) => setNewDependency(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDependency();
                  }
                }}
                sx={{
                  flex: 1,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border }
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={addDependency}
                sx={{
                  color: currentTheme.primary,
                  borderColor: currentTheme.primary,
                  '&:hover': { borderColor: currentTheme.primary, bgcolor: alpha(currentTheme.primary, 0.1) }
                }}
              >
                Add
              </Button>
            </Box>
          </Paper>

          {/* Examples Section */}
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
              Use Cases & Examples
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {editedInfrastructure?.examples?.map((example, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={example}
                    onDelete={() => removeExample(example)}
                    sx={{
                      flex: 1,
                      justifyContent: 'flex-start',
                      bgcolor: alpha(currentTheme.primary, 0.1),
                      color: currentTheme.primary,
                      '& .MuiChip-deleteIcon': {
                        color: currentTheme.primary,
                        '&:hover': { color: currentTheme.primary }
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add an example use case"
                value={newExample}
                onChange={(e) => setNewExample(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExample();
                  }
                }}
                sx={{
                  flex: 1,
                  '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                  '& .MuiOutlinedInput-root': { 
                    color: currentTheme.text,
                    '& fieldset': { borderColor: currentTheme.border }
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={addExample}
                sx={{
                  color: currentTheme.primary,
                  borderColor: currentTheme.primary,
                  '&:hover': { borderColor: currentTheme.primary, bgcolor: alpha(currentTheme.primary, 0.1) }
                }}
              >
                Add
              </Button>
            </Box>
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
              position: 'sticky',
              top: 100
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
                  color: currentTheme.background,
                  '&:hover': { bgcolor: currentTheme.primaryDark || currentTheme.primary }
                }}
              >
                {saving ? 'Saving...' : 'Save Infrastructure'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={goBack}
                sx={{
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                  '&:hover': { borderColor: currentTheme.primary, bgcolor: alpha(currentTheme.primary, 0.1) }
                }}
              >
                Cancel
              </Button>
              {!isNewInfrastructure && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowDeleteModal(true)}
                  sx={{
                    borderColor: '#f44336',
                    color: '#f44336',
                    '&:hover': { borderColor: '#f44336', bgcolor: alpha('#f44336', 0.1) }
                  }}
                >
                  Delete Infrastructure
                </Button>
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
        title="Delete Infrastructure"
        itemName={editedInfrastructure?.name}
        itemType="infrastructure"
        theme={currentTheme}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
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

export default EditToolkitInfrastructurePage;

