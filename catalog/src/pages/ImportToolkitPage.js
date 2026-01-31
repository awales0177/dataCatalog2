import React, { useState, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  alpha,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowBack as ArrowBackIcon,
  AutoAwesome as AutoAwesomeIcon,
  Code as CodeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { importFunctionsFromLibrary, createToolkitComponent } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ImportToolkitPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [importPackageName, setImportPackageName] = useState('');
  const [importModulePath, setImportModulePath] = useState('');
  const [importPypiUrl, setImportPypiUrl] = useState('');
  const [importBulkMode, setImportBulkMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedFunctions, setImportedFunctions] = useState([]);
  const [importError, setImportError] = useState(null);
  const [importSuggestions, setImportSuggestions] = useState([]);
  const [selectedFunctions, setSelectedFunctions] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  if (!canEdit) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">You don't have permission to import functions.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/toolkit')}
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Back to Toolkit
        </Button>
      </Container>
    );
  }

  const handleImportFromLibrary = async () => {
    if (!importPackageName.trim()) {
      setImportError('Package name is required');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportedFunctions([]);
    setImportSuggestions([]);
    setSelectedFunctions(new Set());

    try {
      const result = await importFunctionsFromLibrary(
        importPackageName.trim(),
        importModulePath.trim() || null,
        importPypiUrl.trim() || null,
        importBulkMode
      );

      if (result.success && result.functions && result.functions.length > 0) {
        setImportedFunctions(result.functions);
        if (result.suggestions && result.suggestions.length > 0) {
          setImportSuggestions(result.suggestions);
        }
      } else {
        setImportError(result.message || 'No functions found in the library');
        if (result.suggestions && result.suggestions.length > 0) {
          setImportSuggestions(result.suggestions);
        }
      }
    } catch (error) {
      setImportError(error.message || 'Failed to import from library');
    } finally {
      setImporting(false);
    }
  };

  const handleToggleFunction = (funcId) => {
    const newSelected = new Set(selectedFunctions);
    if (newSelected.has(funcId)) {
      newSelected.delete(funcId);
    } else {
      newSelected.add(funcId);
    }
    setSelectedFunctions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFunctions.size === importedFunctions.length) {
      setSelectedFunctions(new Set());
    } else {
      setSelectedFunctions(new Set(importedFunctions.map(f => f.id)));
    }
  };

  const handleSaveSelected = async () => {
    if (selectedFunctions.size === 0) {
      setSnackbar({ open: true, message: 'Please select at least one function to import', severity: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const functionsToSave = importedFunctions.filter(f => selectedFunctions.has(f.id));
      let savedCount = 0;
      let errorCount = 0;

      for (const func of functionsToSave) {
        try {
          await createToolkitComponent({
            ...func,
            type: 'functions',
          });
          savedCount++;
        } catch (error) {
          console.error(`Failed to save function ${func.name}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        setSnackbar({ 
          open: true, 
          message: `Successfully imported ${savedCount} function(s)`, 
          severity: 'success' 
        });
        setTimeout(() => {
          navigate('/toolkit');
        }, 1500);
      } else {
        setSnackbar({ 
          open: true, 
          message: `Imported ${savedCount} function(s), ${errorCount} failed`, 
          severity: 'warning' 
        });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to save functions', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/toolkit')}
          variant="outlined"
          sx={{
            borderColor: currentTheme.border,
            color: currentTheme.text,
            '&:hover': {
              borderColor: currentTheme.primary,
              bgcolor: alpha(currentTheme.primary, 0.1),
            },
          }}
        >
          Back to Toolkit
        </Button>
        <Typography variant="h4" sx={{ color: currentTheme.text, flex: 1 }}>
          Import Functions from Library
        </Typography>
      </Box>

      {/* Import Form */}
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
          Import Configuration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Package Name"
              value={importPackageName}
              onChange={(e) => setImportPackageName(e.target.value)}
              placeholder="e.g., pandas, numpy, requests"
              required
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Module Path (Optional)"
              value={importModulePath}
              onChange={(e) => setImportModulePath(e.target.value)}
              placeholder="e.g., pandas.io"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Custom PyPI URL (Optional)"
              value={importPypiUrl}
              onChange={(e) => setImportPypiUrl(e.target.value)}
              placeholder="https://pypi.org/simple"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={importBulkMode}
                  onChange={(e) => setImportBulkMode(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: currentTheme.primary,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: currentTheme.primary,
                    },
                  }}
                />
              }
              label="Bulk Mode (Import from all submodules)"
              sx={{ color: currentTheme.text }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={importing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              onClick={handleImportFromLibrary}
              disabled={importing || !importPackageName.trim()}
              sx={{
                bgcolor: currentTheme.primary,
                color: '#fff',
                '&:hover': {
                  bgcolor: currentTheme.primary,
                  opacity: 0.9,
                },
              }}
            >
              {importing ? 'Importing...' : 'Import Functions'}
            </Button>
          </Grid>
        </Grid>

        {importError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {importError}
          </Alert>
        )}

        {importSuggestions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
              Suggestions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {importSuggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  onClick={() => setImportPackageName(suggestion)}
                  sx={{
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Imported Functions List */}
      {importedFunctions.length > 0 && (
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: currentTheme.text }}>
              Imported Functions ({importedFunctions.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                size="small"
                onClick={handleSelectAll}
                sx={{ color: currentTheme.primary }}
              >
                {selectedFunctions.size === importedFunctions.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} /> : <DownloadIcon />}
                onClick={handleSaveSelected}
                disabled={saving || selectedFunctions.size === 0}
                sx={{
                  bgcolor: currentTheme.primary,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: currentTheme.primary,
                    opacity: 0.9,
                  },
                }}
              >
                {saving ? 'Saving...' : `Import Selected (${selectedFunctions.size})`}
              </Button>
            </Box>
          </Box>

          <List>
            {importedFunctions.map((func, index) => (
              <React.Fragment key={func.id || index}>
                <ListItem
                  secondaryAction={
                    <Checkbox
                      checked={selectedFunctions.has(func.id)}
                      onChange={() => handleToggleFunction(func.id)}
                      sx={{
                        color: currentTheme.primary,
                        '&.Mui-checked': {
                          color: currentTheme.primary,
                        },
                      }}
                    />
                  }
                  sx={{
                    bgcolor: selectedFunctions.has(func.id) 
                      ? alpha(currentTheme.primary, 0.1) 
                      : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemButton onClick={() => handleToggleFunction(func.id)}>
                    <CodeIcon sx={{ mr: 2, color: currentTheme.primary }} />
                    <ListItemText
                      primary={func.displayName || func.name}
                      secondary={func.description || 'No description available'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItemButton>
                </ListItem>
                {index < importedFunctions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

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

export default ImportToolkitPage;

