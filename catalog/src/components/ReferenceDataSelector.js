import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import referenceDataJson from '../data/reference.json';

const ReferenceDataSelector = ({ 
  selectedReferenceData = [], 
  onReferenceDataChange, 
  currentTheme,
  label = 'Reference Data',
  showLabel = true 
}) => {
  const [referenceData, setReferenceData] = useState([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [availableOptions, setAvailableOptions] = useState([]);

  useEffect(() => {
    const loadReferenceData = () => {
      try {
        setReferenceData(referenceDataJson.items || []);
      } catch (error) {
        // Handle error silently or show user notification
      }
    };

    loadReferenceData();
  }, []);

  const handleAddReferenceData = () => {
    // Get available reference data options (filter out already selected ones)
    const currentReferenceData = selectedReferenceData || [];
    const availableOptions = referenceData
      .filter(item => !currentReferenceData.includes(item.name || item.shortName || item.id))
      .map(item => ({
        value: item.name || item.shortName || item.id,
        label: item.name || item.shortName || item.id,
        description: item.description || item.shortDescription || ''
      }));

    if (availableOptions.length === 0) {
      return;
    }

    setAvailableOptions(availableOptions);
    setShowSelectionDialog(true);
  };

  const handleRemoveReferenceData = (referenceDataToRemove) => {
    const newReferenceData = selectedReferenceData.filter(item => item !== referenceDataToRemove);
    onReferenceDataChange(newReferenceData);
  };

  const handleReferenceDataSelection = (selectedReferenceData) => {
    if (!selectedReferenceData) return;
    
    const newReferenceData = [...(selectedReferenceData || []), selectedReferenceData];
    onReferenceDataChange(newReferenceData);
    
    setShowSelectionDialog(false);
    setAvailableOptions([]);
  };

  return (
    <Box>
      {showLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: currentTheme.text }}>
            {label}
          </Typography>
          <IconButton
            size="small"
            onClick={handleAddReferenceData}
            sx={{
              color: currentTheme.primary,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white'
              }
            }}
            title="Add reference data"
          >
            <AddIcon />
          </IconButton>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {selectedReferenceData && selectedReferenceData.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {selectedReferenceData.map((item, index) => (
              <Chip
                key={index}
                label={item}
                onDelete={() => handleRemoveReferenceData(item)}
                sx={{
                  bgcolor: currentTheme.primary,
                  color: 'white',
                  '& .MuiChip-deleteIcon': {
                    color: 'white',
                    '&:hover': {
                      color: 'rgba(255, 255, 255, 0.8)',
                    },
                  },
                }}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ 
            color: currentTheme.textSecondary, 
            fontStyle: 'italic',
            mb: 2
          }}>
            No {label.toLowerCase()} selected
          </Typography>
        )}
        
      </Box>

      {/* Reference Data Selection Dialog */}
      <Dialog
        open={showSelectionDialog}
        onClose={() => setShowSelectionDialog(false)}
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
          📊 Select Reference Data
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
              ℹ️ <strong>Note:</strong> Selected reference data will be read-only and cannot be manually edited. 
              Use the delete button to remove reference data if needed.
            </Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Choose from available reference data:
          </Typography>
          
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {availableOptions.map((option, index) => (
              <Button
                key={index}
                fullWidth
                variant="outlined"
                onClick={() => handleReferenceDataSelection(option.value)}
                sx={{
                  mb: 1,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                  '&:hover': {
                    bgcolor: currentTheme.primary,
                    color: 'white',
                    borderColor: currentTheme.primary
                  }
                }}
              >
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {option.label}
                  </Typography>
                  {option.description && (
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSelectionDialog(false)}
            sx={{ color: currentTheme.textSecondary }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReferenceDataSelector;
