import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../App';
import { fetchData, createApplication, updateApplication, deleteApplication } from '../services/api';
import DomainSelector from '../components/DomainSelector';

const EditApplicationPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isNewApplication = !id || id === 'new';
  
  // State management
  const [application, setApplication] = useState(null);
  const [editedApplication, setEditedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [canDelete, setCanDelete] = useState(false);


  // Helper function for deep cloning
  const deepClone = (obj) => {
    if (window.structuredClone) {
      return structuredClone(obj);
    }
    return JSON.parse(JSON.stringify(obj));
  };

  useEffect(() => {
    const loadApplication = async () => {
      try {
        if (isNewApplication) {
          // Create new application template
          const newApp = {
            id: `temp_${Date.now()}`,
            name: '',
            description: '',
            domains: [],
            link: '',
            lastUpdated: new Date().toISOString().slice(0, 19).replace('T', ' ')
          };
          setApplication(newApp);
          setEditedApplication(deepClone(newApp));
        } else {
          // Load existing application
          const data = await fetchData('applications');
          const app = data.applications.find(a => a.id.toString() === id);
          if (!app) {
            setSnackbar({ open: true, message: 'Application not found', severity: 'error' });
            navigate('/applications');
            return;
          }
          setApplication(app);
          setEditedApplication(deepClone(app));
        }
      } catch (error) {
        console.error('Error loading application:', error);
        setSnackbar({ open: true, message: 'Failed to load application', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id, isNewApplication, navigate]);

  const handleSave = async () => {
    if (!editedApplication.name.trim()) {
      setSnackbar({ open: true, message: 'Application name is required', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (isNewApplication) {
        await createApplication(editedApplication);
        setSnackbar({ open: true, message: 'Application created successfully', severity: 'success' });
      } else {
        await updateApplication(editedApplication.id, editedApplication);
        setSnackbar({ open: true, message: 'Application updated successfully', severity: 'success' });
      }
      
      // Navigate back to applications page after a short delay
      setTimeout(() => {
        navigate('/applications');
      }, 1500);
    } catch (error) {
      console.error('Error saving application:', error);
      setSnackbar({ open: true, message: 'Failed to save application', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/applications');
  };

  const handleDelete = async () => {
    try {
      await deleteApplication(editedApplication.id);
      setSnackbar({ open: true, message: 'Application deleted successfully', severity: 'success' });
      
      // Navigate back to applications page after a short delay
      setTimeout(() => {
        navigate('/applications');
      }, 1500);
    } catch (error) {
      console.error('Error deleting application:', error);
      setSnackbar({ open: true, message: 'Failed to delete application', severity: 'error' });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteConfirmationChange = (value) => {
    setDeleteConfirmation(value);
    setCanDelete(value.trim() === `delete ${editedApplication?.name}`);
  };

  const handleOpenDeleteDialog = () => {
    setShowDeleteDialog(true);
    setDeleteConfirmation('');
    setCanDelete(false);
  };





  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleCancel}
            sx={{ color: currentTheme.text, mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ color: currentTheme.text }}>
            {isNewApplication ? 'Create New Application' : 'Edit Application'}
          </Typography>
        </Box>
        
        {!isNewApplication && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleOpenDeleteDialog}
            sx={{
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                borderColor: '#d32f2f',
                bgcolor: '#f44336',
                color: 'white',
              },
            }}
          >
            Delete Application
          </Button>
        )}
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
              label="Application Name"
              value={editedApplication?.name || ''}
              onChange={(e) => setEditedApplication(prev => ({ ...prev, name: e.target.value }))}
              required
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputBase-input': { color: currentTheme.text },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={editedApplication?.description || ''}
              onChange={(e) => setEditedApplication(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputBase-input': { color: currentTheme.text },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Link"
              value={editedApplication?.link || ''}
              onChange={(e) => setEditedApplication(prev => ({ ...prev, link: e.target.value }))}
              placeholder="https://example.com"
              sx={{
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
                '& .MuiOutlinedInput-root': {
                  color: currentTheme.text,
                  '& fieldset': { borderColor: currentTheme.border },
                  '&:hover fieldset': { borderColor: currentTheme.primary },
                  '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
                },
                '& .MuiInputBase-input': { color: currentTheme.text },
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <DomainSelector
              selectedDomains={editedApplication?.domains || []}
              onDomainsChange={(newDomains) => {
                setEditedApplication(prev => ({
                  ...prev,
                  domains: newDomains
                }));
              }}
              currentTheme={currentTheme}
              label="Domains"
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            sx={{
              color: currentTheme.text,
              borderColor: currentTheme.border,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            startIcon={<SaveIcon />}
            disabled={saving}
            sx={{
              bgcolor: currentTheme.primary,
              color: 'white',
              '&:hover': {
                bgcolor: currentTheme.primaryHover || currentTheme.primary,
              },
            }}
          >
            {saving ? 'Saving...' : (isNewApplication ? 'Create' : 'Save')}
          </Button>
        </Box>
      </Paper>

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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteConfirmation('');
          setCanDelete(false);
        }}
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
          🗑️ Delete Application
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}>
            <Typography variant="subtitle2" sx={{ color: 'error.dark', fontWeight: 'bold', mb: 1 }}>
              ⚠️ This action cannot be undone!
            </Typography>
            <Typography variant="body2" sx={{ color: 'error.dark' }}>
              Deleting this application will permanently remove it and all associated data.
            </Typography>
          </Box>
          
          <Typography sx={{ mb: 2 }}>
            You are about to delete the application: <strong>"{editedApplication?.name}"</strong>
          </Typography>
          
          <Typography sx={{ mb: 3 }}>
            This will:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 3 }}>
            <Typography component="li">Permanently delete the application "{editedApplication?.name}"</Typography>
            <Typography component="li">Remove all application data and configurations</Typography>
            <Typography component="li">Break any existing agreements that reference this application</Typography>
            <Typography component="li">Require manual cleanup of external references</Typography>
          </Box>
          
          <Typography sx={{ mb: 2, fontWeight: 'bold' }}>
            To confirm deletion, type exactly: <strong>delete {editedApplication?.name}</strong>
          </Typography>
          
          <TextField
            fullWidth
            value={deleteConfirmation}
            placeholder={`delete ${editedApplication?.name}`}
            onChange={(e) => handleDeleteConfirmationChange(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
              '& .MuiOutlinedInput-root': {
                color: currentTheme.text,
                '& fieldset': { borderColor: currentTheme.border },
                '&:hover fieldset': { borderColor: currentTheme.primary },
                '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
              },
              '& .MuiInputBase-input': { color: currentTheme.text },
            }}
          />
          
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {canDelete ? (
              <Typography variant="body2" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                ✓ Confirmation text matches
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Type exactly: <strong>delete {editedApplication?.name}</strong>
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmation('');
              setCanDelete(false);
            }} 
            sx={{ color: currentTheme.text }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={!canDelete}
            sx={{
              bgcolor: '#f44336',
              color: 'white',
              '&:hover': {
                bgcolor: '#d32f2f',
              },
              '&:disabled': {
                bgcolor: '#ccc',
                color: '#666',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default EditApplicationPage;
