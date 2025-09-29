import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Divider,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteModal from '../components/DeleteModal';
import DomainSelector from '../components/DomainSelector';
import TeamSelector from '../components/TeamSelector';

import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, createReferenceItem, updateReferenceItem, deleteReferenceItem } from '../services/api';
import cacheService from '../services/cache';

const EditReferenceDataPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isNewItem = !id || id === 'create';
  
  // State management
  const [referenceItem, setReferenceItem] = useState(null);
  const [editedItem, setEditedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Form fields
  const [newSourceSystem, setNewSourceSystem] = useState('');
  const [newDatasetId, setNewDatasetId] = useState('');
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newApiLink, setNewApiLink] = useState('');
  const [newUpstreamModel, setNewUpstreamModel] = useState('');
  const [newUpstreamField, setNewUpstreamField] = useState('');
  const [newUpstreamRelationship, setNewUpstreamRelationship] = useState('');
  const [newDownstreamModel, setNewDownstreamModel] = useState('');
  const [newDownstreamField, setNewDownstreamField] = useState('');
  const [newDownstreamRelationship, setNewDownstreamRelationship] = useState('');
  const [newChangeLogVersion, setNewChangeLogVersion] = useState('');
  const [newChangeLogUpdatedBy, setNewChangeLogUpdatedBy] = useState('');
  const [newChangeLogUpdateReason, setNewChangeLogUpdateReason] = useState('');
  const [newChildTableId, setNewChildTableId] = useState('');
  const [newChildTableName, setNewChildTableName] = useState('');
  const [newChildTableDescription, setNewChildTableDescription] = useState('');
  const [newChildTableColumns, setNewChildTableColumns] = useState('');
  const [newChildTableSourceType, setNewChildTableSourceType] = useState('');
  const [newChildTableDerivedFrom, setNewChildTableDerivedFrom] = useState('');
  const [newChildTableTransformations, setNewChildTableTransformations] = useState('');
  const [newChildTableReviewFrequency, setNewChildTableReviewFrequency] = useState('');
  const [newChildTableOwner, setNewChildTableOwner] = useState('');
  
  // Dataframe editing state
  const [editingTableIndex, setEditingTableIndex] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingColumnIndex, setEditingColumnIndex] = useState(null);
  const [editingCellValue, setEditingCellValue] = useState('');
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddRowDialog, setShowAddRowDialog] = useState(false);
  const [newRowData, setNewRowData] = useState({});

  // Helper function for consistent theme styling
  const getTextFieldThemeStyles = () => ({
    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
    '& .MuiOutlinedInput-root': {
      color: currentTheme.text,
      '& fieldset': { borderColor: currentTheme.border },
      '&:hover fieldset': { borderColor: currentTheme.primary },
      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
    },
    '& .MuiInputBase-input': { color: currentTheme.text },
  });

  const getSelectThemeStyles = () => ({
    color: currentTheme.text,
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: currentTheme.border },
      '&:hover fieldset': { borderColor: currentTheme.primary },
      '&.Mui-focused fieldset': { borderColor: currentTheme.primary }
    },
    '& .MuiSelect-icon': { color: currentTheme.textSecondary }
  });

  // Load reference item data
  useEffect(() => {
    const loadReferenceItem = async () => {
      if (isNewItem) {
        // Create template for new item
        const template = {
          name: '',
          domain: [],
          description: '',
          version: '1.0.0',
          status: 'active',
          sourceDatasets: [],
          owner: '',
          upstreamLineage: [],
          downstreamLineage: [],
          changeLog: [],
          childTables: [],
          lastUpdated: new Date().toISOString()
        };
        
        setReferenceItem(template);
        setEditedItem(template);
        setLoading(false);
      } else {
        // Load existing item
        try {
          const data = await fetchData('reference');
          const foundItem = data.items.find(item => item.id === id);
          
          if (foundItem) {
            setReferenceItem(foundItem);
            setEditedItem(foundItem);
          } else {
            setSnackbar({
              open: true,
              message: 'Reference item not found',
              severity: 'error'
            });
            navigate('/reference');
          }
        } catch (err) {
          setSnackbar({
            open: true,
            message: 'Failed to load reference item',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadReferenceItem();
  }, [id, isNewItem, navigate]);

  const refreshReferenceData = async () => {
    try {
      if (!isNewItem) {
        // Invalidate the reference data cache to ensure fresh data
        cacheService.invalidateByPrefix('reference');
        
        const referenceData = await fetchData('reference', {}, { forceRefresh: true });
        const foundItem = referenceData.items.find(item => item.id === id);
        if (foundItem) {
          setReferenceItem(foundItem);
          setEditedItem(foundItem);
        }
      }
    } catch (error) {
      console.error('Error refreshing reference data:', error);
    }
  };

  const handleSave = async () => {
    if (!editedItem.name) {
      setSnackbar({
        open: true,
        message: 'Name is required',
        severity: 'error'
      });
      return;
    }


    if (!editedItem.description) {
      setSnackbar({
        open: true,
        message: 'Description is required',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      if (isNewItem) {
        await createReferenceItem(editedItem);
        setSnackbar({
          open: true,
          message: 'Reference item created successfully',
          severity: 'success'
        });
      } else {
        await updateReferenceItem(id, editedItem);
        
        // Refresh the UI with updated data
        await refreshReferenceData();
        
        setSnackbar({
          open: true,
          message: 'Reference item updated successfully',
          severity: 'success'
        });
      }
      
      setTimeout(() => {
        navigate('/reference');
      }, 1500);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to ${isNewItem ? 'create' : 'update'} reference item: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    if (referenceItem && editedItem && JSON.stringify(referenceItem) !== JSON.stringify(editedItem)) {
      setShowSaveDialog(true);
    } else {
      // No changes, proceed with navigation
      navigate('/reference');
    }
  };

  const goToViewMode = () => {
    navigate('/reference');
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteReferenceItem(id);
      setSnackbar({
        open: true,
        message: 'Reference item deleted successfully',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/reference');
      }, 1500);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to delete reference item: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const addSourceDataset = () => {
    if (newSourceSystem && newDatasetId && newDatasetName) {
      const newDataset = {
        source_system: newSourceSystem,
        datasetId: newDatasetId,
        datasetName: newDatasetName,
        apiLink: newApiLink || undefined
      };
      
      setEditedItem(prev => ({
        ...prev,
        sourceDatasets: [...(prev.sourceDatasets || []), newDataset]
      }));
      
      setNewSourceSystem('');
      setNewDatasetId('');
      setNewDatasetName('');
      setNewApiLink('');
    }
  };

  const removeSourceDataset = (index) => {
    setEditedItem(prev => ({
      ...prev,
      sourceDatasets: prev.sourceDatasets.filter((_, i) => i !== index)
    }));
  };

  const addUpstreamLineage = () => {
    if (newUpstreamModel && newUpstreamField && newUpstreamRelationship) {
      const newUpstream = {
        model: newUpstreamModel,
        field: newUpstreamField,
        relationship: newUpstreamRelationship
      };
      
      setEditedItem(prev => ({
        ...prev,
        lineage: {
          ...prev.lineage,
          upstream: [...(prev.lineage?.upstream || []), newUpstream]
        }
      }));
      
      setNewUpstreamModel('');
      setNewUpstreamField('');
      setNewUpstreamRelationship('');
    }
  };

  const removeUpstreamLineage = (index) => {
    setEditedItem(prev => ({
      ...prev,
      lineage: {
        ...prev.lineage,
        upstream: prev.lineage.upstream.filter((_, i) => i !== index)
      }
    }));
  };

  const addDownstreamLineage = () => {
    if (newDownstreamModel && newDownstreamField && newDownstreamRelationship) {
      const newDownstream = {
        model: newDownstreamModel,
        field: newDownstreamField,
        relationship: newDownstreamRelationship
      };
      
      setEditedItem(prev => ({
        ...prev,
        lineage: {
          ...prev.lineage,
          downstream: [...(prev.lineage?.downstream || []), newDownstream]
        }
      }));
      
      setNewDownstreamModel('');
      setNewDownstreamField('');
      setNewDownstreamRelationship('');
    }
  };

  const removeDownstreamLineage = (index) => {
    setEditedItem(prev => ({
      ...prev,
      lineage: {
        ...prev.lineage,
        downstream: prev.lineage.downstream.filter((_, i) => i !== index)
      }
    }));
  };

  const addChangeLog = () => {
    if (newChangeLogVersion && newChangeLogUpdatedBy && newChangeLogUpdateReason) {
      const newChangeLog = {
        version: newChangeLogVersion,
        updatedBy: newChangeLogUpdatedBy,
        updateReason: newChangeLogUpdateReason,
        timestamp: new Date().toISOString()
      };
      
      setEditedItem(prev => ({
        ...prev,
        changeLog: [...(prev.changeLog || []), newChangeLog]
      }));
      
      setNewChangeLogVersion('');
      setNewChangeLogUpdatedBy('');
      setNewChangeLogUpdateReason('');
    }
  };

  const removeChangeLog = (index) => {
    setEditedItem(prev => ({
      ...prev,
      changeLog: prev.changeLog.filter((_, i) => i !== index)
    }));
  };

  const addChildTable = () => {
    if (newChildTableId && newChildTableName && newChildTableDescription) {
      const columns = newChildTableColumns ? newChildTableColumns.split(',').map(c => c.trim()).filter(c => c) : [];
      
      const newChildTable = {
        id: newChildTableId,
        name: newChildTableName,
        description: newChildTableDescription,
        columns: columns,
        rows: [],
        rowCount: 0,
        sourceType: newChildTableSourceType || 'authoritative',
        derivedFrom: newChildTableDerivedFrom || editedItem.id,
        transformations: newChildTableTransformations ? newChildTableTransformations.split(',').map(t => t.trim()).filter(t => t) : [],
        lastReviewed: new Date().toISOString(),
        reviewFrequency: newChildTableReviewFrequency || 'quarterly',
        owner: newChildTableOwner || editedItem.owner
      };
      
      setEditedItem(prev => ({
        ...prev,
        childTables: [...(prev.childTables || []), newChildTable]
      }));
      
      setNewChildTableId('');
      setNewChildTableName('');
      setNewChildTableDescription('');
      setNewChildTableColumns('');
      setNewChildTableSourceType('');
      setNewChildTableDerivedFrom('');
      setNewChildTableTransformations('');
      setNewChildTableReviewFrequency('');
      setNewChildTableOwner('');
    }
  };

  const removeChildTable = (index) => {
    setEditedItem(prev => ({
      ...prev,
      childTables: prev.childTables.filter((_, i) => i !== index)
    }));
  };

  // Dataframe editing functions
  const startEditingCell = (tableIndex, rowIndex, columnIndex, currentValue) => {
    setEditingTableIndex(tableIndex);
    setEditingRowIndex(rowIndex);
    setEditingColumnIndex(columnIndex);
    setEditingCellValue(currentValue || '');
  };

  const saveCellEdit = () => {
    if (editingTableIndex !== null && editingRowIndex !== null && editingColumnIndex !== null) {
      setEditedItem(prev => {
        const newChildTables = [...prev.childTables];
        const table = { ...newChildTables[editingTableIndex] };
        const newRows = [...table.rows];
        
        // Ensure the row exists
        if (!newRows[editingRowIndex]) {
          newRows[editingRowIndex] = {};
        }
        
        // Create a new row object to avoid mutation
        newRows[editingRowIndex] = { ...newRows[editingRowIndex] };
        
        // Use the tracked column index to get the correct column name
        if (table.columns && table.columns[editingColumnIndex]) {
          const columnName = table.columns[editingColumnIndex];
          newRows[editingRowIndex][columnName] = editingCellValue;
        }
        
        // Update the table with new rows
        table.rows = newRows;
        table.rowCount = newRows.length;
        newChildTables[editingTableIndex] = table;
        
        return {
          ...prev,
          childTables: newChildTables
        };
      });
    }
    
    // Reset editing state
    setEditingTableIndex(null);
    setEditingRowIndex(null);
    setEditingColumnIndex(null);
    setEditingCellValue('');
  };

  const cancelCellEdit = () => {
    setEditingTableIndex(null);
    setEditingRowIndex(null);
    setEditingColumnIndex(null);
    setEditingCellValue('');
  };

  const addColumn = (tableIndex) => {
    if (newColumnName.trim()) {
      setEditedItem(prev => {
        const newChildTables = [...prev.childTables];
        const table = { ...newChildTables[tableIndex] };
        const newColumnNameTrimmed = newColumnName.trim();
        
        // Add the new column to columns array
        table.columns = [...(table.columns || []), newColumnNameTrimmed];
        
        // Add the new column to all existing rows with empty values
        if (table.rows) {
          table.rows = table.rows.map(row => {
            const newRow = { ...row };
            newRow[newColumnNameTrimmed] = '';
            return newRow;
          });
        }
        
        newChildTables[tableIndex] = table;
        return {
          ...prev,
          childTables: newChildTables
        };
      });
      
      setNewColumnName('');
      setShowAddColumnDialog(false);
    }
  };

  const removeColumn = (tableIndex, columnIndex) => {
    setEditedItem(prev => {
      const newChildTables = [...prev.childTables];
      const table = { ...newChildTables[tableIndex] };
      const columnName = table.columns[columnIndex];
      
      // Remove the column from columns array
      table.columns = table.columns.filter((_, i) => i !== columnIndex);
      
      // Remove the column from all rows
      if (table.rows) {
        table.rows = table.rows.map(row => {
          const newRow = { ...row };
          delete newRow[columnName];
          return newRow;
        });
      }
      
      newChildTables[tableIndex] = table;
      return {
        ...prev,
        childTables: newChildTables
      };
    });
  };

  const addRow = (tableIndex) => {
    setEditedItem(prev => {
      const newChildTables = [...prev.childTables];
      const table = { ...newChildTables[tableIndex] };
      const newRow = {};
      
      // Initialize all columns with empty values
      if (table.columns && table.columns.length > 0) {
        table.columns.forEach(column => {
          newRow[column] = '';
        });
      }
      
      // Add the new row
      table.rows = [...(table.rows || []), newRow];
      table.rowCount = table.rows.length;
      newChildTables[tableIndex] = table;
      
      return {
        ...prev,
        childTables: newChildTables
      };
    });
  };

  const removeRow = (tableIndex, rowIndex) => {
    setEditedItem(prev => {
      const newChildTables = [...prev.childTables];
      const table = { ...newChildTables[tableIndex] };
      table.rows = table.rows.filter((_, i) => i !== rowIndex);
      table.rowCount = table.rows.length;
      newChildTables[tableIndex] = table;
      
      return {
        ...prev,
        childTables: newChildTables
      };
    });
  };

  // Helper function to ensure data consistency
  const ensureRowStructure = (row, columns) => {
    if (!row) return {};
    
    const consistentRow = {};
    columns.forEach(column => {
      consistentRow[column] = row[column] || '';
    });
    
    return consistentRow;
  };

  // Helper function to get cell value safely
  const getCellValue = (row, columnName) => {
    if (!row || !columnName) return '';
    return row[columnName] || '';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/reference')}
              sx={{ color: currentTheme.text }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text }}>
                {isNewItem ? 'Create Reference Data' : 'Edit Reference Data'}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: currentTheme.textSecondary }}>
                {isNewItem ? 'Fill in the details below' : referenceItem?.name || 'Reference Data Details'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isNewItem && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDeleteModal(true)}
                startIcon={<DeleteIcon />}
                sx={{
                  borderColor: 'error.main',
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: currentTheme.background,
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
              sx={{ color: currentTheme.text, borderColor: currentTheme.border }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ bgcolor: currentTheme.primary }}
            >
              {saving ? 'Saving...' : (isNewItem ? 'Create Reference Data' : 'Save Changes')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Form */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name *"
              value={editedItem?.name || ''}
              onChange={(e) => setEditedItem(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2, ...getTextFieldThemeStyles() }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DomainSelector
              selectedDomains={editedItem?.domain || []}
              onDomainsChange={(newDomains) => {
                setEditedItem(prev => ({
                  ...prev,
                  domain: newDomains
                }));
              }}
              currentTheme={currentTheme}
              label="Domain"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Version"
              value={editedItem?.version || ''}
              onChange={(e) => setEditedItem(prev => ({ ...prev, version: e.target.value }))}
              sx={{ mb: 2, ...getTextFieldThemeStyles() }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description *"
              value={editedItem?.description || ''}
              onChange={(e) => setEditedItem(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2, ...getTextFieldThemeStyles() }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: currentTheme.textSecondary }}>Status</InputLabel>
              <Select
                value={editedItem?.status || 'active'}
                onChange={(e) => setEditedItem(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
                sx={getSelectThemeStyles()}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TeamSelector
              selectedTeams={editedItem?.owner ? [editedItem.owner] : []}
              onTeamsChange={(teams) => {
                setEditedItem(prev => ({
                  ...prev,
                  owner: teams.length > 0 ? teams[0] : ''
                }));
              }}
              currentTheme={currentTheme}
              label="Owner"
              showLabel={true}
              maxSelections={1}
              placeholder="No owner selected"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Source Datasets */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
          Source Datasets
        </Typography>
        
        {editedItem?.sourceDatasets?.map((dataset, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: currentTheme.background, borderRadius: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: currentTheme.text }}>
                <strong>{dataset.source_system}</strong> - {dataset.datasetName} ({dataset.datasetId})
              </Typography>
              {dataset.apiLink && (
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                  API: {dataset.apiLink}
                </Typography>
              )}
            </Box>
            <IconButton
              onClick={() => removeSourceDataset(index)}
              sx={{ color: currentTheme.textSecondary }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Source System"
            value={newSourceSystem}
            onChange={(e) => setNewSourceSystem(e.target.value)}
            sx={{ flex: 1, ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Dataset ID"
            value={newDatasetId}
            onChange={(e) => setNewDatasetId(e.target.value)}
            sx={{ flex: 1, ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Dataset Name"
            value={newDatasetName}
            onChange={(e) => setNewDatasetName(e.target.value)}
            sx={{ flex: 1, ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="API Link (optional)"
            value={newApiLink}
            onChange={(e) => setNewApiLink(e.target.value)}
            sx={{ flex: 1, ...getTextFieldThemeStyles() }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addSourceDataset}
            disabled={!newSourceSystem || !newDatasetId || !newDatasetName}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1),
              },
            }}
          >
            Add
          </Button>
        </Box>
      </Paper>

      {/* Lineage */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
          Data Lineage
        </Typography>
        
        {/* Upstream */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, color: currentTheme.text }}>
            Upstream Dependencies
          </Typography>
          
          {editedItem?.lineage?.upstream?.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, p: 1, bgcolor: currentTheme.background, borderRadius: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {item.model}.{item.field} ({item.relationship})
                </Typography>
              </Box>
              <IconButton
                onClick={() => removeUpstreamLineage(index)}
                sx={{ color: currentTheme.textSecondary }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Model"
              value={newUpstreamModel}
              onChange={(e) => setNewUpstreamModel(e.target.value)}
              sx={{ flex: 1, ...getTextFieldThemeStyles() }}
            />
            <TextField
              size="small"
              label="Field"
              value={newUpstreamField}
              onChange={(e) => setNewUpstreamField(e.target.value)}
              sx={{ flex: 1, ...getTextFieldThemeStyles() }}
            />
            <TextField
              size="small"
              label="Relationship"
              value={newUpstreamRelationship}
              onChange={(e) => setNewUpstreamRelationship(e.target.value)}
              sx={{ flex: 1, ...getTextFieldThemeStyles() }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addUpstreamLineage}
              disabled={!newUpstreamModel || !newUpstreamField || !newUpstreamRelationship}
              sx={{
                color: currentTheme.primary,
                borderColor: currentTheme.border,
                '&:hover': {
                  borderColor: currentTheme.primary,
                  bgcolor: alpha(currentTheme.primary, 0.1),
                },
              }}
            >
              Add
            </Button>
          </Box>
        </Box>
        
        {/* Downstream */}
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, color: currentTheme.text }}>
            Downstream Dependencies
          </Typography>
          
          {editedItem?.lineage?.downstream?.map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, p: 1, bgcolor: currentTheme.background, borderRadius: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: currentTheme.text }}>
                  {item.model}.{item.field} ({item.relationship})
                </Typography>
              </Box>
              <IconButton
                onClick={() => removeDownstreamLineage(index)}
                sx={{ color: currentTheme.textSecondary }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Model"
              value={newDownstreamModel}
              onChange={(e) => setNewDownstreamModel(e.target.value)}
              sx={{ flex: 1, ...getTextFieldThemeStyles() }}
            />
            <TextField
              size="small"
              label="Field"
              value={newDownstreamField}
              onChange={(e) => setNewDownstreamField(e.target.value)}
              sx={{ flex: 1, ...getTextFieldThemeStyles() }}
            />
            <TextField
              size="small"
              label="Relationship"
              value={newDownstreamRelationship}
              onChange={(e) => setNewDownstreamRelationship(e.target.value)}
              sx={{ flex: 1, ...getTextFieldThemeStyles() }}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addDownstreamLineage}
              disabled={!newDownstreamModel || !newDownstreamField || !newDownstreamRelationship}
              sx={{
                color: currentTheme.primary,
                borderColor: currentTheme.border,
                '&:hover': {
                  borderColor: currentTheme.primary,
                  bgcolor: alpha(currentTheme.primary, 0.1),
                },
              }}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Change Log */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
          Change Log
        </Typography>
        
        {editedItem?.changeLog?.map((change, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: currentTheme.background, borderRadius: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: currentTheme.text }}>
                <strong>v{change.version}</strong> - {change.updatedBy}
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                {change.updateReason}
              </Typography>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                {new Date(change.timestamp).toLocaleDateString()}
              </Typography>
            </Box>
            <IconButton
              onClick={() => removeChangeLog(index)}
              sx={{ color: currentTheme.textSecondary }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Version"
            value={newChangeLogVersion}
            onChange={(e) => setNewChangeLogVersion(e.target.value)}
            sx={{ flex: 1, ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Updated By"
            value={newChangeLogUpdatedBy}
            onChange={(e) => setNewChangeLogUpdatedBy(e.target.value)}
            sx={{ flex: 1, ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Update Reason"
            value={newChangeLogUpdateReason}
            onChange={(e) => setNewChangeLogUpdateReason(e.target.value)}
            sx={{ flex: 1, ...getTextFieldThemeStyles() }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addChangeLog}
            disabled={!newChangeLogVersion || !newChangeLogUpdatedBy || !newChangeLogUpdateReason}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1),
              },
            }}
          >
            Add
          </Button>
        </Box>
      </Paper>

      {/* Child Tables */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: currentTheme.card, border: `1px solid ${currentTheme.border}`, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: currentTheme.text }}>
          Reference Data Tables
        </Typography>
        
        {editedItem?.childTables?.map((table, tableIndex) => (
          <Accordion 
            key={tableIndex} 
            sx={{ 
              mb: 2, 
              bgcolor: currentTheme.background,
              '& .MuiAccordionSummary-root': {
                bgcolor: currentTheme.background,
                color: currentTheme.text,
              },
              '& .MuiAccordionDetails-root': {
                bgcolor: currentTheme.background,
                color: currentTheme.text,
              },
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    {table.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    ID: {table.id} | Source: {table.sourceType} | Owner: {table.owner}
                  </Typography>
                </Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChildTable(tableIndex);
                  }}
                  sx={{ color: currentTheme.textSecondary }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                {table.description}
              </Typography>
              
              {/* Dataframe Editor */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
                    Data Table
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setEditingTableIndex(tableIndex);
                        setShowAddColumnDialog(true);
                      }}
                      sx={{ 
                        fontSize: '0.75rem',
                        color: currentTheme.primary,
                        borderColor: currentTheme.border,
                        '&:hover': {
                          borderColor: currentTheme.primary,
                          bgcolor: alpha(currentTheme.primary, 0.1),
                        },
                      }}
                    >
                      Add Column
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => addRow(tableIndex)}
                      sx={{ 
                        fontSize: '0.75rem',
                        color: currentTheme.primary,
                        borderColor: currentTheme.border,
                        '&:hover': {
                          borderColor: currentTheme.primary,
                          bgcolor: alpha(currentTheme.primary, 0.1),
                        },
                      }}
                    >
                      Add Row
                    </Button>
                  </Box>
                </Box>
                
                {/* Dataframe Table */}
                <TableContainer 
                  component={Paper} 
                  sx={{ 
                    maxHeight: 400, 
                    overflow: 'auto',
                    bgcolor: currentTheme.card,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {table.columns?.map((column, columnIndex) => (
                          <TableCell key={columnIndex} sx={{ 
                            bgcolor: currentTheme.card, 
                            color: currentTheme.text,
                            fontWeight: 600,
                            minWidth: 120
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {column}
                              <IconButton
                                size="small"
                                onClick={() => removeColumn(tableIndex, columnIndex)}
                                sx={{ 
                                  color: currentTheme.textSecondary,
                                  p: 0.5,
                                  '&:hover': { color: 'error.main' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        ))}
                        <TableCell sx={{ 
                          bgcolor: currentTheme.card, 
                          color: currentTheme.text,
                          fontWeight: 600,
                          minWidth: 80
                        }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {table.rows?.map((row, rowIndex) => {
                        // Ensure row has consistent structure
                        const consistentRow = ensureRowStructure(row, table.columns);
                        
                        return (
                          <TableRow 
                            key={rowIndex} 
                            hover
                            sx={{
                              '&:hover': {
                                bgcolor: alpha(currentTheme.primary, 0.05),
                              },
                            }}
                          >
                            {table.columns?.map((column, columnIndex) => (
                              <TableCell key={columnIndex} sx={{ color: currentTheme.text }}>
                                {editingTableIndex === tableIndex && editingRowIndex === rowIndex && editingColumnIndex === columnIndex ? (
                                  <TextField
                                    size="small"
                                    value={editingCellValue}
                                    onChange={(e) => setEditingCellValue(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') saveCellEdit();
                                      if (e.key === 'Escape') cancelCellEdit();
                                    }}
                                    autoFocus
                                    sx={{ 
                                      ...getTextFieldThemeStyles(),
                                      '& .MuiInputBase-input': { 
                                        p: 0.5, 
                                        fontSize: '0.875rem' 
                                      } 
                                    }}
                                  />
                                ) : (
                                  <Box
                                    onClick={() => startEditingCell(tableIndex, rowIndex, columnIndex, getCellValue(consistentRow, column))}
                                    sx={{
                                      p: 1,
                                      cursor: 'pointer',
                                      borderRadius: 1,
                                      '&:hover': {
                                        bgcolor: alpha(currentTheme.primary, 0.1)
                                      }
                                    }}
                                  >
                                    {getCellValue(consistentRow, column)}
                                  </Box>
                                )}
                              </TableCell>
                            ))}
                            <TableCell sx={{ bgcolor: currentTheme.card }}>
                              <IconButton
                                size="small"
                                onClick={() => removeRow(tableIndex, rowIndex)}
                                sx={{ 
                                  color: currentTheme.textSecondary,
                                  '&:hover': { color: 'error.main' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(!table.rows || table.rows.length === 0) && (
                        <TableRow>
                          <TableCell 
                            colSpan={(table.columns?.length || 0) + 1} 
                            sx={{ 
                              textAlign: 'center', 
                              color: currentTheme.textSecondary,
                              fontStyle: 'italic',
                              bgcolor: currentTheme.card,
                            }}
                          >
                            No data rows. Click "Add Row" to start adding data.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {editingTableIndex === tableIndex && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={saveCellEdit}
                      sx={{ 
                        fontSize: '0.75rem',
                        bgcolor: currentTheme.primary,
                        '&:hover': {
                          bgcolor: currentTheme.primary,
                          opacity: 0.9,
                        },
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={cancelCellEdit}
                      sx={{ 
                        fontSize: '0.75rem',
                        color: currentTheme.textSecondary,
                        borderColor: currentTheme.border,
                        '&:hover': {
                          borderColor: currentTheme.primary,
                          bgcolor: alpha(currentTheme.primary, 0.1),
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Table ID"
            value={newChildTableId}
            onChange={(e) => setNewChildTableId(e.target.value)}
            sx={{ minWidth: '150px', ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Table Name"
            value={newChildTableName}
            onChange={(e) => setNewChildTableName(e.target.value)}
            sx={{ minWidth: '150px', ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Description"
            value={newChildTableDescription}
            onChange={(e) => setNewChildTableDescription(e.target.value)}
            sx={{ minWidth: '200px', ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Columns (comma-separated)"
            value={newChildTableColumns}
            onChange={(e) => setNewChildTableColumns(e.target.value)}
            sx={{ minWidth: '200px', ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Source Type"
            value={newChildTableSourceType}
            onChange={(e) => setNewChildTableSourceType(e.target.value)}
            sx={{ minWidth: '120px', ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Review Frequency"
            value={newChildTableReviewFrequency}
            onChange={(e) => setNewChildTableReviewFrequency(e.target.value)}
            sx={{ minWidth: '120px', ...getTextFieldThemeStyles() }}
          />
          <TextField
            size="small"
            label="Owner"
            value={newChildTableOwner}
            onChange={(e) => setNewChildTableOwner(e.target.value)}
            sx={{ minWidth: '120px', ...getTextFieldThemeStyles() }}
          />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addChildTable}
            disabled={!newChildTableId || !newChildTableName || !newChildTableDescription}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1),
              },
            }}
          >
            Add
          </Button>
        </Box>
      </Paper>



      {/* Add Column Dialog */}
      <Dialog 
        open={showAddColumnDialog} 
        onClose={() => setShowAddColumnDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>Add New Column</DialogTitle>
        <DialogContent sx={{ bgcolor: currentTheme.card }}>
          <TextField
            autoFocus
            margin="dense"
            label="Column Name"
            fullWidth
            variant="outlined"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') addColumn(editingTableIndex);
            }}
            sx={getTextFieldThemeStyles()}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowAddColumnDialog(false)}
            sx={{
              color: currentTheme.textSecondary,
              '&:hover': {
                bgcolor: alpha(currentTheme.textSecondary, 0.1),
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => addColumn(editingTableIndex)} 
            variant="contained"
            disabled={!newColumnName.trim()}
            sx={{
              bgcolor: currentTheme.primary,
              '&:hover': {
                bgcolor: currentTheme.primary,
                opacity: 0.9,
              },
            }}
          >
            Add Column
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Reference Data Modal */}
      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Reference Data"
        itemName={editedItem?.name}
        itemType="reference data"
        theme={currentTheme}
      >
        <Typography sx={{ mb: 2 }}>
          This will:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
          <Typography component="li">Permanently delete the reference data "{editedItem?.name}"</Typography>
          <Typography component="li">Remove all associated data and configurations</Typography>
          <Typography component="li">Break any existing references to this item</Typography>
          <Typography component="li">Require manual cleanup of external references</Typography>
        </Box>
      </DeleteModal>

      {/* Save Confirmation Dialog */}
      <Dialog 
        open={showSaveDialog} 
        onClose={() => setShowSaveDialog(false)}
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
        <DialogTitle sx={{ color: currentTheme.text }}>Unsaved Changes</DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Typography sx={{ color: currentTheme.text }}>
            You have unsaved changes. Are you sure you want to discard them?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSaveDialog(false)} 
            sx={{ 
              color: currentTheme.text,
              '&:hover': {
                bgcolor: alpha(currentTheme.text, 0.1),
              },
            }}
          >
            Continue Editing
          </Button>
          <Button 
            onClick={goToViewMode} 
            color="error"
            sx={{
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>

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
            width: '100%',
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditReferenceDataPage;
