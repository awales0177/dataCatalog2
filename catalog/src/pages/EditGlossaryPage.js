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
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, createGlossaryTerm, updateGlossaryTerm, deleteGlossaryTerm } from '../services/api';
import DeleteModal from '../components/DeleteModal';

const EditGlossaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editedTerm, setEditedTerm] = useState(null);
  const [originalTerm, setOriginalTerm] = useState(null);
  const [dataModels, setDataModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState([]);

  const isNewTerm = !id || id === 'create';

  useEffect(() => {
    const loadTerm = async () => {
      try {
        // Load models
        const modelsData = await fetchData('models');
        setDataModels(modelsData.models || []);
        setModelsLoading(false);

        // Load existing terms to get categories
        const glossaryData = await fetchData('glossary');
        const categories = new Set();
        (glossaryData.terms || []).forEach(term => {
          if (term.category) categories.add(term.category);
        });
        setAvailableCategories(Array.from(categories).sort());

        if (isNewTerm) {
          const newTerm = {
            id: '',
            term: '',
            definition: '',
            category: '',
            taggedModels: [],
            documentation: '',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
          setEditedTerm(newTerm);
          setOriginalTerm({ ...newTerm });
        } else {
          const terms = glossaryData.terms || [];
          const term = terms.find(t => t.id === id);
          
          if (term) {
            setEditedTerm({ ...term });
            setOriginalTerm({ ...term });
          } else {
            setSnackbar({ open: true, message: `Glossary term with ID ${id} not found`, severity: 'error' });
            navigate('/glossary');
          }
        }
      } catch (error) {
        console.error('Error loading glossary term:', error);
        setSnackbar({ open: true, message: 'Error loading glossary term', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadTerm();
  }, [id, isNewTerm, navigate]);

  const handleFieldChange = (field, value) => {
    setEditedTerm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTaggedModelsChange = (selectedModels) => {
    // Extract shortNames from selected model objects
    const modelShortNames = selectedModels.map(model => model.shortName || model);
    setEditedTerm(prev => ({
      ...prev,
      taggedModels: modelShortNames || []
    }));
  };

  const hasChanges = () => {
    if (!originalTerm || !editedTerm) return false;
    return JSON.stringify(originalTerm) !== JSON.stringify(editedTerm);
  };

  const handleSave = async () => {
    if (!editedTerm.term.trim() || !editedTerm.definition.trim()) {
      setSnackbar({ open: true, message: 'Term and definition are required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (isNewTerm) {
        await createGlossaryTerm(editedTerm);
        setSnackbar({ open: true, message: 'Glossary term created successfully', severity: 'success' });
      } else {
        await updateGlossaryTerm(editedTerm.id, editedTerm);
        setSnackbar({ open: true, message: 'Glossary term updated successfully', severity: 'success' });
      }
      navigate('/glossary');
    } catch (error) {
      console.error('Error saving glossary term:', error);
      setSnackbar({ open: true, message: error.message || 'Error saving glossary term', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteGlossaryTerm(editedTerm.id);
      setSnackbar({ open: true, message: 'Glossary term deleted successfully', severity: 'success' });
      navigate('/glossary');
    } catch (error) {
      console.error('Error deleting glossary term:', error);
      setSnackbar({ open: true, message: error.message || 'Error deleting glossary term', severity: 'error' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCancel = () => {
    navigate('/glossary');
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
            onClick={() => navigate('/glossary')}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1)
              }
            }}
          >
            Back to Glossary
          </Button>
        </Box>
        
        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            {isNewTerm ? 'Create Glossary Term' : 'Edit Glossary Term'}
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            {isNewTerm ? 'Add a new term to the glossary' : 'Update glossary term information'}
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
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Term *"
              value={editedTerm?.term || ''}
              onChange={(e) => handleFieldChange('term', e.target.value)}
              required
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Definition *"
              value={editedTerm?.definition || ''}
              onChange={(e) => handleFieldChange('definition', e.target.value)}
              required
              multiline
              rows={4}
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={availableCategories}
              value={editedTerm?.category || ''}
              onChange={(event, newValue) => handleFieldChange('category', newValue || '')}
              onInputChange={(event, newInputValue) => handleFieldChange('category', newInputValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  sx={{
                    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme.text,
                      '& fieldset': { borderColor: currentTheme.border },
                      '&:hover fieldset': { borderColor: currentTheme.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ color: currentTheme.text }}>
                  {option}
                </Box>
              )}
              PaperComponent={({ children, ...other }) => (
                <Paper {...other} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                  {children}
                </Paper>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Documentation URL"
              value={editedTerm?.documentation || ''}
              onChange={(e) => handleFieldChange('documentation', e.target.value)}
              placeholder="https://docs.example.com/..."
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={dataModels}
              value={dataModels.filter(model => (editedTerm?.taggedModels || []).includes(model.shortName))}
              onChange={(event, newValue) => {
                handleTaggedModelsChange(newValue);
              }}
              getOptionLabel={(option) => option.shortName ? `${option.shortName} - ${option.name}` : option}
              isOptionEqualToValue={(option, value) => option.shortName === value.shortName}
              loading={modelsLoading}
              disabled={modelsLoading}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={`${option.shortName} - ${option.name}`}
                    {...getTagProps({ index })}
                    key={option.shortName}
                    sx={{
                      borderColor: currentTheme.border,
                      color: currentTheme.text,
                      bgcolor: alpha(currentTheme.primary, 0.1),
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
                  label="Tagged Models"
                  placeholder="Select data models to tag with this glossary term"
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
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ color: currentTheme.text }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {option.shortName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                      {option.name}
                    </Typography>
                  </Box>
                </Box>
              )}
              PaperComponent={({ children, ...other }) => (
                <Paper {...other} sx={{ bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}` }}>
                  {children}
                </Paper>
              )}
              ListboxProps={{
                sx: {
                  '& .MuiAutocomplete-option': {
                    color: currentTheme.text,
                    '&:hover': {
                      bgcolor: alpha(currentTheme.primary, 0.1),
                    },
                    '&[aria-selected="true"]': {
                      bgcolor: alpha(currentTheme.primary, 0.2),
                    },
                  },
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, pt: 3, borderTop: `1px solid ${currentTheme.border}` }}>
          <Box>
            {!isNewTerm && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                sx={{
                  borderColor: currentTheme.error,
                  color: currentTheme.error,
                  '&:hover': {
                    borderColor: currentTheme.error,
                    bgcolor: alpha(currentTheme.error, 0.1)
                  }
                }}
              >
                Delete
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving || deleting}
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
              disabled={saving || deleting || !hasChanges()}
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
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Delete Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Glossary Term"
        itemName={editedTerm?.term}
        itemType="glossary term"
        theme={currentTheme}
      />

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

export default EditGlossaryPage;

