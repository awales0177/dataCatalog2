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
} from '@mui/material';
import DeleteModal from '../components/DeleteModal';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, createApplication, updateApplication, deleteApplication } from '../services/api';
import { findApplication, applicationApiRef } from '../utils/catalogModelLookup';
import DomainSelector from '../components/DomainSelector';
import RoleSelector from '../components/RoleSelector';
import { useSyncDocumentTitle } from '../contexts/DocumentTitleContext';

const EditApplicationPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isNewApplication = !id || id === 'new';
  
  
  // State management
  const [, setApplication] = useState(null);
  const [editedApplication, setEditedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useSyncDocumentTitle(editedApplication?.name);

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
            email: '',
            roles: [],
            image: null,
            lastUpdated: new Date().toISOString().slice(0, 19).replace('T', ' ')
          };
          setApplication(newApp);
          setEditedApplication(deepClone(newApp));
        } else {
          // Load existing application
          const data = await fetchData('applications');
          const app = findApplication(data.applications, id);
          if (!app) {
            setSnackbar({ open: true, message: 'Application not found', severity: 'error' });
            navigate('/applications');
            return;
          }
          setApplication(app);
          setEditedApplication(deepClone(app));
        }
      } catch {
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
      // Update the lastUpdated field to current timestamp
      const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS format
      
      // Create updated application with new timestamp
      const updatedApplication = {
        ...editedApplication,
        lastUpdated: currentTimestamp
      };

      if (isNewApplication) {
        await createApplication(updatedApplication);
        setSnackbar({ open: true, message: 'Application created successfully', severity: 'success' });
      } else {
        await updateApplication(updatedApplication.id, updatedApplication);
        setSnackbar({ open: true, message: `Application updated successfully! Last updated: ${currentTimestamp}`, severity: 'success' });
      }
      
      // Navigate back to applications page after a short delay
      setTimeout(() => {
        navigate('/applications');
      }, 1500);
    } catch {
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
      await deleteApplication(applicationApiRef(editedApplication));
      setSnackbar({ open: true, message: 'Application deleted successfully', severity: 'success' });
      
      // Navigate back to applications page after a short delay
      setTimeout(() => {
        navigate('/applications');
      }, 1500);
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete application', severity: 'error' });
    }
  };

  const handleOpenDeleteDialog = () => {
    setShowDeleteModal(true);
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
            <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
              Team image
            </Typography>
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
              Shown on the Enterprise Data Teams cards. JPEG/PNG/WebP, max 1.5&nbsp;MB.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <Button variant="outlined" component="label" disabled={saving}>
                {editedApplication?.image ? 'Replace image' : 'Upload image'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    const max = 1.5 * 1024 * 1024;
                    if (f.size > max) {
                      setSnackbar({
                        open: true,
                        message: 'Image must be 1.5 MB or smaller.',
                        severity: 'error',
                      });
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result;
                      if (typeof dataUrl === 'string') {
                        setEditedApplication((prev) => ({ ...prev, image: dataUrl }));
                      }
                    };
                    reader.readAsDataURL(f);
                  }}
                />
              </Button>
              {editedApplication?.image ? (
                <>
                  <Box
                    component="img"
                    src={editedApplication.image}
                    alt=""
                    sx={{
                      width: 96,
                      height: 96,
                      objectFit: 'cover',
                      borderRadius: 1,
                      border: `1px solid ${currentTheme.border}`,
                    }}
                  />
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={() => setEditedApplication((prev) => ({ ...prev, image: null }))}
                  >
                    Remove image
                  </Button>
                </>
              ) : null}
            </Box>
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
            <TextField
              fullWidth
              label="Contact Email"
              value={editedApplication?.email || ''}
              onChange={(e) => setEditedApplication(prev => ({ ...prev, email: e.target.value }))}
              placeholder="team@example.com"
              type="email"
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
            <RoleSelector
              selectedRoles={editedApplication?.roles || []}
              onRolesChange={(roles) => setEditedApplication(prev => ({ ...prev, roles }))}
              label="Roles"
              showLabel={true}
              placeholder="No roles selected"
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

      {/* Delete Application Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Application"
        itemName={editedApplication?.name}
        itemType="application"
      >
        <Typography sx={{ mb: 2 }}>
          This will:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
          <Typography component="li">Permanently delete the application "{editedApplication?.name}"</Typography>
          <Typography component="li">Remove all application data and configurations</Typography>
          <Typography component="li">Break any existing agreements that reference this application</Typography>
          <Typography component="li">Require manual cleanup of external references</Typography>
        </Box>
      </DeleteModal>

    </Container>
  );
};

export default EditApplicationPage;
