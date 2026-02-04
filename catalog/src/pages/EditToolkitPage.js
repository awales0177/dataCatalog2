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
  Snackbar,
  Alert,
  CircularProgress,
  alpha,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EditToolkitPage = () => {
  const { toolkitId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const { canEdit } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [editedToolkit, setEditedToolkit] = useState(null);
  const [originalToolkit, setOriginalToolkit] = useState(null);
  const [tagInput, setTagInput] = useState('');

  const isNewToolkit = !toolkitId || toolkitId === 'create';

  useEffect(() => {
    if (!canEdit()) {
      setSnackbar({ open: true, message: 'You do not have permission to edit toolkits', severity: 'error' });
      navigate('/toolkit');
      return;
    }

    const loadData = async () => {
      try {
        if (isNewToolkit) {
          const newToolkit = {
            id: `toolkit-${Date.now()}`,
            name: '',
            displayName: '',
            description: '',
            category: '',
            tags: [],
            technologies: [],
          };
          setEditedToolkit(newToolkit);
          setOriginalToolkit({ ...newToolkit });
        } else {
          const data = await fetchData('toolkit');
          const toolkits = data.toolkit?.toolkits || [];
          const toolkit = toolkits.find(t => t.id === toolkitId);
          
          if (toolkit) {
            // Load from localStorage if available
            const storageKey = `toolkit_${toolkitId}`;
            const savedToolkit = localStorage.getItem(storageKey);
            const toolkitData = savedToolkit ? JSON.parse(savedToolkit) : toolkit;
            
            setEditedToolkit(toolkitData);
            setOriginalToolkit(toolkitData);
          } else {
            setSnackbar({ open: true, message: `Toolkit with ID ${toolkitId} not found`, severity: 'error' });
            navigate('/toolkit');
          }
        }
      } catch (error) {
        console.error('Error loading toolkit:', error);
        setSnackbar({ open: true, message: 'Error loading toolkit', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toolkitId, isNewToolkit, navigate, canEdit]);

  const handleFieldChange = (field, value) => {
    setEditedToolkit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !editedToolkit.tags.includes(tagInput.trim())) {
      setEditedToolkit(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedToolkit(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const hasChanges = () => {
    return JSON.stringify(editedToolkit) !== JSON.stringify(originalToolkit);
  };

  const handleSave = async () => {
    if (!editedToolkit.name || !editedToolkit.description) {
      setSnackbar({ open: true, message: 'Name and description are required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      // Save toolkit data to localStorage
      const storageKey = `toolkit_${editedToolkit.id}`;
      localStorage.setItem(storageKey, JSON.stringify(editedToolkit));

      setSnackbar({ open: true, message: isNewToolkit ? 'Toolkit created successfully!' : 'Toolkit updated successfully!', severity: 'success' });
      setOriginalToolkit({ ...editedToolkit });
      
      setTimeout(() => {
        navigate('/toolkit');
      }, 500);
    } catch (error) {
      console.error('Error saving toolkit:', error);
      setSnackbar({ open: true, message: error.message || 'Error saving toolkit', severity: 'error' });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/toolkit');
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

  if (!editedToolkit) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Toolkit not found
        </Alert>
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
            Back to Toolkits
          </Button>
        </Box>
        
        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            {isNewToolkit ? 'Create Toolkit' : `Edit Toolkit - ${editedToolkit.displayName || editedToolkit.name}`}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {isNewToolkit ? 'Create a new toolkit' : 'Edit toolkit details'}
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name *"
              value={editedToolkit.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
              placeholder="e.g., ocr-toolkit"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Display Name"
              value={editedToolkit.displayName || ''}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
              placeholder="e.g., OCR Toolkit"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description *"
              value={editedToolkit.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Category"
              value={editedToolkit.category || ''}
              onChange={(e) => handleFieldChange('category', e.target.value)}
              placeholder="e.g., text-extraction"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary }
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Add Tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Press Enter to add"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {editedToolkit.tags?.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
              ))}
              {(!editedToolkit.tags || editedToolkit.tags.length === 0) && (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                  No tags added yet
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: `1px solid ${currentTheme.border}` }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={saving}
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
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              '&:hover': {
                bgcolor: currentTheme.primaryHover || currentTheme.primary,
              },
              '&:disabled': {
                bgcolor: alpha(currentTheme.primary, 0.3),
              }
            }}
          >
            {saving ? 'Saving...' : isNewToolkit ? 'Create Toolkit' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', bgcolor: currentTheme.card, color: currentTheme.text }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditToolkitPage;
