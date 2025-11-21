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
  Storage as StorageIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, createToolkitComponent, updateToolkitComponent, deleteToolkitComponent } from '../services/api';

const EditToolkitContainerPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { containerId } = useParams();
  const navigate = useNavigate();
  const [containerData, setContainerData] = useState(null);
  const [editedContainer, setEditedContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newDependency, setNewDependency] = useState('');
  const [newExample, setNewExample] = useState('');

  const isNewContainer = !containerId || containerId === 'new';

  useEffect(() => {
    const loadContainerData = async () => {
      try {
        if (isNewContainer) {
          // Create new container template
          const newContainer = {
            id: '',
            name: '',
            description: '',
            type: 'docker',
            category: '',
            tags: [],
            dockerfile: '',
            dockerCompose: '',
            author: '',
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            usage: '',
            dependencies: [],
            examples: [],
            rating: 5.0,
            downloads: 0
          };
          setContainerData(newContainer);
          setEditedContainer(JSON.parse(JSON.stringify(newContainer)));
          setLoading(false);
        } else {
          // Load existing container
          const data = await fetchData('toolkit');
          const containers = data.toolkit.containers || [];
          const foundContainer = containers.find(c => c.id === containerId);
          
          if (foundContainer) {
            setContainerData(foundContainer);
            setEditedContainer(JSON.parse(JSON.stringify(foundContainer)));
          } else {
            setError('Container not found');
          }
        }
      } catch (err) {
        setError('Failed to load container data');
      } finally {
        setLoading(false);
      }
    };

    loadContainerData();
  }, [containerId, isNewContainer]);

  const handleFieldChange = (field, value) => {
    setEditedContainer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!editedContainer.name?.trim()) {
      setSnackbar({
        open: true,
        message: 'Container name is required',
        severity: 'error'
      });
      return;
    }

    if (!editedContainer.description?.trim()) {
      setSnackbar({
        open: true,
        message: 'Description is required',
        severity: 'error'
      });
      return;
    }

    if (!editedContainer.dockerfile?.trim()) {
      setSnackbar({
        open: true,
        message: 'Dockerfile is required',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      const containerToSave = {
        ...editedContainer,
        lastUpdated: new Date().toISOString()
      };

      if (isNewContainer) {
        // Remove ID from payload - API will auto-generate it
        const { id, ...containerWithoutId } = containerToSave;
        
        const result = await createToolkitComponent({
          ...containerWithoutId,
          type: 'containers'
        });
        
        // Use the ID returned from the API
        const finalId = result?.id;
        
        if (!finalId) {
          throw new Error('Container created but no ID returned from server');
        }
        
        setSnackbar({
          open: true,
          message: 'Container created successfully!',
          severity: 'success'
        });
        setTimeout(() => navigate(`/toolkit/container/${finalId}`), 1500);
      } else {
        await updateToolkitComponent('containers', containerId, containerToSave);
        setSnackbar({
          open: true,
          message: 'Container updated successfully!',
          severity: 'success'
        });
        setTimeout(() => navigate(`/toolkit/container/${containerId}`), 1500);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${isNewContainer ? 'creating' : 'updating'} container: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteToolkitComponent('containers', containerId);
      setSnackbar({
        open: true,
        message: 'Container deleted successfully!',
        severity: 'success'
      });
      setTimeout(() => navigate('/toolkit'), 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting container: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const goBack = () => {
    if (isNewContainer) {
      navigate('/toolkit');
    } else {
      navigate(-1);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editedContainer.tags.includes(newTag.trim())) {
      handleFieldChange('tags', [...editedContainer.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    handleFieldChange('tags', editedContainer.tags.filter(tag => tag !== tagToRemove));
  };

  const addDependency = () => {
    if (newDependency.trim() && !editedContainer.dependencies.includes(newDependency.trim())) {
      handleFieldChange('dependencies', [...editedContainer.dependencies, newDependency.trim()]);
      setNewDependency('');
    }
  };

  const removeDependency = (depToRemove) => {
    handleFieldChange('dependencies', editedContainer.dependencies.filter(dep => dep !== depToRemove));
  };

  const addExample = () => {
    if (newExample.trim() && !editedContainer.examples.includes(newExample.trim())) {
      handleFieldChange('examples', [...editedContainer.examples, newExample.trim()]);
      setNewExample('');
    }
  };

  const removeExample = (exampleToRemove) => {
    handleFieldChange('examples', editedContainer.examples.filter(example => example !== exampleToRemove));
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

  const typeOptions = [
    { value: 'docker', label: 'Docker' },
    { value: 'podman', label: 'Podman' },
    { value: 'kubernetes', label: 'Kubernetes' },
  ];

  const categoryOptions = [
    { value: 'database', label: 'Database' },
    { value: 'runtime', label: 'Runtime' },
    { value: 'web-server', label: 'Web Server' },
    { value: 'cache', label: 'Cache' },
    { value: 'message-queue', label: 'Message Queue' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'logging', label: 'Logging' },
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
            <StorageIcon sx={{ fontSize: 32 }} />
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text, mb: 1 }}>
              {isNewContainer ? 'Create New Container' : `Edit ${editedContainer?.name || 'Container'}`}
            </Typography>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
              {isNewContainer ? 'Add a new container configuration to the toolkit' : 'Modify container details and configuration'}
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
                  label="Container Name *"
                  value={editedContainer?.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., PostgreSQL Development Container"
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
                  value={editedContainer?.description || ''}
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
                    Type
                  </InputLabel>
                  <Select
                    value={editedContainer?.type || 'docker'}
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                    label="Type"
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
                    {typeOptions.map((option) => (
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
                    value={editedContainer?.category || ''}
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
                  selectedTeams={editedContainer?.author ? [editedContainer.author] : []}
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
                  value={editedContainer?.version || '1.0.0'}
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
                  value={editedContainer?.usage || ''}
                  onChange={(e) => handleFieldChange('usage', e.target.value)}
                  placeholder="Describe how to use this container"
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

          {/* Dockerfile Section */}
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
              Dockerfile *
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={12}
              label="Dockerfile Content *"
              value={editedContainer?.dockerfile || ''}
              onChange={(e) => handleFieldChange('dockerfile', e.target.value)}
              placeholder="FROM postgres:15&#10;RUN apt-get update && apt-get install -y ..."
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

          {/* Docker Compose Section */}
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
              Docker Compose (Optional)
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={10}
              label="Docker Compose Configuration"
              value={editedContainer?.dockerCompose || ''}
              onChange={(e) => handleFieldChange('dockerCompose', e.target.value)}
              placeholder="version: '3.8'&#10;services:&#10;  app:&#10;    build: ."
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
              {editedContainer?.tags?.map((tag, index) => (
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
              {editedContainer?.dependencies?.map((dep, index) => (
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
              {editedContainer?.examples?.map((example, index) => (
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
                {saving ? 'Saving...' : 'Save Container'}
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
              {!isNewContainer && (
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
                  Delete Container
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
        title="Delete Container"
        itemName={editedContainer?.name}
        itemType="container"
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

export default EditToolkitContainerPage;

