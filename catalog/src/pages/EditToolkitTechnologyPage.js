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
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EditToolkitTechnologyPage = () => {
  const { toolkitId, technologyId } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const { canEdit } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [editedTech, setEditedTech] = useState(null);
  const [originalTech, setOriginalTech] = useState(null);
  const [toolkitData, setToolkitData] = useState(null);

  const isNewTech = !technologyId || technologyId === 'create';

  useEffect(() => {
    if (!canEdit()) {
      setSnackbar({ open: true, message: 'You do not have permission to edit technologies', severity: 'error' });
      navigate(`/toolkit/toolkit/${toolkitId}`);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchData('toolkit');
        const toolkits = data.toolkit?.toolkits || [];
        const foundToolkit = toolkits.find(t => t.id === toolkitId);
        
        if (!foundToolkit) {
          setSnackbar({ open: true, message: `Toolkit with ID ${toolkitId} not found`, severity: 'error' });
          navigate('/toolkit');
          return;
        }

        setToolkitData(foundToolkit);

        if (isNewTech) {
          const newTech = {
            id: `tech-${Date.now()}`,
            name: '',
            description: '',
            rank: (foundToolkit.technologies?.length || 0) + 1,
          };
          setEditedTech(newTech);
          setOriginalTech({ ...newTech });
        } else {
          const tech = foundToolkit.technologies?.find(t => t.id === technologyId);
          
          if (tech) {
            // Load from localStorage if available
            const storageKey = `toolkit_${toolkitId}_tech_${technologyId}`;
            const savedTech = localStorage.getItem(storageKey);
            const techData = savedTech ? JSON.parse(savedTech) : tech;
            
            // Only keep name, description, and rank
            const simplifiedTech = {
              id: techData.id,
              name: techData.name || '',
              description: techData.description || '',
              rank: techData.rank || 1,
            };
            
            setEditedTech(simplifiedTech);
            setOriginalTech(simplifiedTech);
          } else {
            setSnackbar({ open: true, message: `Technology with ID ${technologyId} not found`, severity: 'error' });
            navigate(`/toolkit/toolkit/${toolkitId}`);
          }
        }
      } catch (error) {
        console.error('Error loading technology:', error);
        setSnackbar({ open: true, message: 'Error loading technology', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toolkitId, technologyId, isNewTech, navigate, canEdit]);

  const handleFieldChange = (field, value) => {
    setEditedTech(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const hasChanges = () => {
    return JSON.stringify(editedTech) !== JSON.stringify(originalTech);
  };

  const handleSave = async () => {
    if (!editedTech.name || !editedTech.description) {
      setSnackbar({ open: true, message: 'Name and description are required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      // Save technology data to localStorage (only name, description, rank)
      const storageKey = `toolkit_${toolkitId}_tech_${editedTech.id}`;
      const techToSave = {
        id: editedTech.id,
        name: editedTech.name,
        description: editedTech.description,
        rank: editedTech.rank,
      };
      localStorage.setItem(storageKey, JSON.stringify(techToSave));

      setSnackbar({ open: true, message: isNewTech ? 'Technology created successfully!' : 'Technology updated successfully!', severity: 'success' });
      setOriginalTech({ ...editedTech });
      
      setTimeout(() => {
        navigate(`/toolkit/toolkit/${toolkitId}`);
      }, 500);
    } catch (error) {
      console.error('Error saving technology:', error);
      setSnackbar({ open: true, message: error.message || 'Error saving technology', severity: 'error' });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/toolkit/toolkit/${toolkitId}`);
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

  if (!editedTech) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Technology not found
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
            Back to Toolkit
          </Button>
        </Box>
        
        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            {isNewTech ? 'Create Technology' : `Edit Technology - ${editedTech.name}`}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {isNewTech ? 'Add a new technology to this toolkit' : 'Edit technology details'}
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
              value={editedTech.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
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
              label="Rank"
              type="number"
              value={editedTech.rank || ''}
              onChange={(e) => handleFieldChange('rank', parseInt(e.target.value) || 1)}
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
              value={editedTech.description || ''}
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
            {saving ? 'Saving...' : isNewTech ? 'Create Technology' : 'Save Changes'}
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

export default EditToolkitTechnologyPage;
