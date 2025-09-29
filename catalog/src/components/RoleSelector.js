import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Work as WorkIcon,
  Factory as FactoryIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const RoleSelector = ({ 
  selectedRoles = [], 
  onRolesChange, 
  currentTheme,
  label = 'Roles',
  showLabel = true,
  maxSelections = null,
  placeholder = 'No roles selected'
}) => {
  // Role options with specific icons
  const roleOptions = [
    { value: 'data_producer', label: 'Data Producer', description: 'Teams that create and maintain data', icon: FactoryIcon },
    { value: 'data_consumer', label: 'Data Consumer', description: 'Teams that use data for business operations', icon: ShoppingBasketIcon },
    { value: 'application', label: 'Application', description: 'Application development teams', icon: CodeIcon },
    { value: 'data_governance', label: 'Data Governance', description: 'Teams responsible for data policies and compliance', icon: SecurityIcon },
    { value: 'data_manager', label: 'Data Manager', description: 'Teams that manage data infrastructure and processes', icon: SettingsIcon },
  ];

  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [availableOptions, setAvailableOptions] = useState([]);

  const handleAddRole = () => {
    // Check if we can add more roles
    if (maxSelections && selectedRoles.length >= maxSelections) {
      return;
    }

    // Get available role options (filter out already selected ones)
    const currentRoles = selectedRoles || [];
    const availableOptions = roleOptions
      .filter(role => !currentRoles.includes(role.value))
      .map(role => role);

    if (availableOptions.length === 0) {
      return;
    }

    setAvailableOptions(availableOptions);
    setShowSelectionDialog(true);
  };

  const handleRemoveRole = (roleToRemove) => {
    const newRoles = selectedRoles.filter(role => role !== roleToRemove);
    onRolesChange(newRoles);
  };

  const handleRoleSelection = (selectedRole) => {
    if (!selectedRole) return;
    
    if (maxSelections === 1) {
      // Single selection - replace current selection
      onRolesChange([selectedRole]);
    } else {
      // Multiple selection - add to current selection
      const newRoles = [...(selectedRoles || []), selectedRole];
      onRolesChange(newRoles);
    }
    
    setShowSelectionDialog(false);
    setAvailableOptions([]);
  };

  const canAddMore = !maxSelections || selectedRoles.length < maxSelections;

  return (
    <Box>
      {showLabel && (
        <Typography variant="subtitle1" sx={{ color: currentTheme.text, mb: 2 }}>
          {label}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {selectedRoles && selectedRoles.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {selectedRoles.map((role, index) => {
              const roleInfo = roleOptions.find(r => r.value === role);
              const IconComponent = roleInfo?.icon || WorkIcon;
              return (
                <Chip
                  key={index}
                  label={roleInfo ? roleInfo.label : role}
                  onDelete={() => handleRemoveRole(role)}
                  icon={<IconComponent />}
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
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
            {placeholder}
          </Typography>
        )}
        
        {canAddMore && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRole}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              alignSelf: 'flex-start',
            }}
          >
            {maxSelections === 1 ? 'Select Role' : 'Add Role'}
          </Button>
        )}
      </Box>

      {/* Role Selection Dialog */}
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
        <DialogTitle sx={{ color: currentTheme.text, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkIcon />
          {maxSelections === 1 ? 'Select Role' : 'Select Roles'}
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
            <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
              ℹ️ <strong>Note:</strong> {maxSelections === 1 
                ? 'Selecting a role will replace the current selection.' 
                : 'Selected roles will be read-only and cannot be manually edited. Use the delete button to remove roles if needed.'
              }
            </Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Choose from available roles:
          </Typography>
          
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {availableOptions.map((option, index) => {
              const IconComponent = option.icon || WorkIcon;
              return (
                <Button
                  key={index}
                  fullWidth
                  variant="outlined"
                  onClick={() => handleRoleSelection(option.value)}
                  startIcon={<IconComponent />}
                  sx={{
                    mb: 1,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    color: currentTheme.text,
                    borderColor: currentTheme.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    py: 1.5,
                    '&:hover': {
                      bgcolor: currentTheme.primary,
                      color: 'white',
                      borderColor: currentTheme.primary,
                    }
                  }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {option.label}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                      {option.description}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
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

export default RoleSelector;
