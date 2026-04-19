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
import {
  findWorkbenchToolkit,
  findWorkbenchTechnology,
  workbenchPath,
  workbenchCanonicalRef,
  workbenchTechnologyCanonicalRef,
  workbenchTechnologyPath,
  workbenchTechnologyCreatePath,
} from '../utils/toolkitWorkbench';
import { newUuid7String } from '../utils/catalogUuid7';

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
  const [canonicalToolkitId, setCanonicalToolkitId] = useState(null);

  const isNewTech = !technologyId || technologyId === 'create';

  useEffect(() => {
    if (!canEdit()) {
      setSnackbar({ open: true, message: 'You do not have permission to edit technologies', severity: 'error' });
      navigate(workbenchPath(toolkitId));
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchData('toolkit');
        const toolkits = data.toolkit?.toolkits || [];
        const resolvedTk = findWorkbenchToolkit(toolkits, toolkitId);

        if (!resolvedTk?.toolkit) {
          setSnackbar({ open: true, message: `Toolkit with ID ${toolkitId} not found`, severity: 'error' });
          navigate('/toolkit');
          return;
        }

        const foundToolkit = resolvedTk.toolkit;
        const tkCan = resolvedTk.canonicalId;
        setToolkitData(foundToolkit);
        setCanonicalToolkitId(tkCan);

        if (String(toolkitId) !== String(tkCan)) {
          if (isNewTech) {
            navigate(workbenchTechnologyCreatePath(tkCan), { replace: true });
            return;
          }
          const resTech = findWorkbenchTechnology(foundToolkit, technologyId);
          if (resTech) {
            navigate(workbenchTechnologyPath(tkCan, resTech.canonicalId), { replace: true });
            return;
          }
        }

        if (isNewTech) {
          const nid = newUuid7String();
          const newTech = {
            id: `tech-${Date.now()}`,
            uuid: nid,
            name: '',
            description: '',
            rank: (foundToolkit.technologies?.length || 0) + 1,
          };
          setEditedTech(newTech);
          setOriginalTech({ ...newTech });
        } else {
          const resTech = findWorkbenchTechnology(foundToolkit, technologyId);
          if (!resTech?.technology) {
            setSnackbar({ open: true, message: `Technology with ID ${technologyId} not found`, severity: 'error' });
            navigate(workbenchPath(tkCan));
            return;
          }
          const tech = resTech.technology;
          const techCan = resTech.canonicalId;
          if (String(technologyId) !== String(techCan)) {
            navigate(workbenchTechnologyPath(tkCan, techCan), { replace: true });
            return;
          }

          const storageKey = `toolkit_${tkCan}_tech_${techCan}`;
          const savedTech = localStorage.getItem(storageKey);
          const techData = savedTech ? JSON.parse(savedTech) : tech;

          const simplifiedTech = {
            id: techData.id,
            uuid: techData.uuid || tech.uuid,
            name: techData.name || '',
            description: techData.description || '',
            rank: techData.rank || 1,
          };

          setEditedTech(simplifiedTech);
          setOriginalTech(simplifiedTech);
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
    setEditedTech((prev) => ({
      ...prev,
      [field]: value,
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
      const tkRef = canonicalToolkitId || workbenchCanonicalRef(toolkitData);
      const techRef = workbenchTechnologyCanonicalRef(editedTech);
      const storageKey = `toolkit_${tkRef}_tech_${techRef}`;
      const techToSave = {
        id: editedTech.id,
        uuid: editedTech.uuid,
        name: editedTech.name,
        description: editedTech.description,
        rank: editedTech.rank,
      };
      localStorage.setItem(storageKey, JSON.stringify(techToSave));

      setSnackbar({
        open: true,
        message: isNewTech ? 'Technology created successfully!' : 'Technology updated successfully!',
        severity: 'success',
      });
      setOriginalTech({ ...editedTech });

      setTimeout(() => {
        navigate(workbenchPath(tkRef));
      }, 500);
    } catch (error) {
      console.error('Error saving technology:', error);
      setSnackbar({ open: true, message: error.message || 'Error saving technology', severity: 'error' });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const tkRef = canonicalToolkitId || toolkitId;
    navigate(workbenchPath(tkRef));
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
      <Paper elevation={2} sx={{ p: 4, bgcolor: currentTheme.paper, border: `1px solid ${currentTheme.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2, color: currentTheme.text }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600 }}>
            {isNewTech ? 'New technology' : 'Edit technology'}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              value={editedTech?.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { color: currentTheme.text },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              value={editedTech?.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { color: currentTheme.text },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Rank"
              value={editedTech?.rank ?? 1}
              onChange={(e) => handleFieldChange('rank', Number(e.target.value))}
              sx={{
                '& .MuiOutlinedInput-root': { color: currentTheme.text },
                '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !hasChanges()}
            sx={{ bgcolor: currentTheme.primary }}
          >
            Save
          </Button>
          <Button onClick={handleCancel} sx={{ color: currentTheme.textSecondary }}>
            Cancel
          </Button>
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditToolkitTechnologyPage;
