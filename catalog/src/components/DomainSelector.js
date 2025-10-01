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
import { fetchData } from '../services/api';

const DomainSelector = ({ 
  selectedDomains = [], 
  onDomainsChange, 
  currentTheme,
  label = 'Domains',
  showLabel = true 
}) => {
  const [domainsData, setDomainsData] = useState([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [availableOptions, setAvailableOptions] = useState([]);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const response = await fetchData('domains');
        setDomainsData(response.domains || []);
      } catch (error) {
        // Handle error silently or show user notification
      }
    };

    loadDomains();
  }, []);

  const handleAddDomain = () => {
    // Get available domain options (filter out already selected ones)
    const currentDomains = selectedDomains || [];
    const availableOptions = domainsData
      .filter(domain => !currentDomains.includes(domain.name || domain.shortName || domain.id))
      .map(domain => ({
        value: domain.name || domain.shortName || domain.id,
        label: domain.name || domain.shortName || domain.id
      }));

    if (availableOptions.length === 0) {
      // You could add a snackbar here if needed
      return;
    }

    setAvailableOptions(availableOptions);
    setShowSelectionDialog(true);
  };

  const handleRemoveDomain = (domainToRemove) => {
    const newDomains = selectedDomains.filter(domain => domain !== domainToRemove);
    onDomainsChange(newDomains);
  };

  const handleDomainSelection = (selectedDomain) => {
    if (!selectedDomain) return;
    
    const newDomains = [...(selectedDomains || []), selectedDomain];
    onDomainsChange(newDomains);
    
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
            onClick={handleAddDomain}
            sx={{
              color: currentTheme.primary,
              '&:hover': {
                bgcolor: currentTheme.primary,
                color: 'white'
              }
            }}
            title="Add domain"
          >
            <AddIcon />
          </IconButton>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {selectedDomains && selectedDomains.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {selectedDomains.map((domain, index) => (
              <Chip
                key={index}
                label={domain}
                onDelete={() => handleRemoveDomain(domain)}
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

      {/* Domain Selection Dialog */}
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
          🌐 Select Domain
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
              ℹ️ <strong>Note:</strong> Selected domains will be read-only and cannot be manually edited. 
              Use the delete button to remove domains if needed.
            </Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Choose from available domains:
          </Typography>
          
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {availableOptions.map((option, index) => (
              <Button
                key={index}
                fullWidth
                variant="outlined"
                onClick={() => handleDomainSelection(option.value)}
                sx={{
                  mb: 1,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                  '&:hover': {
                    bgcolor: currentTheme.primary,
                    color: 'white',
                    borderColor: currentTheme.primary,
                  }
                }}
              >
                {option.label}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSelectionDialog(false)} 
            sx={{ color: currentTheme.text }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DomainSelector;
