import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
} from '@mui/material';

const DeleteModal = ({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'item',
  confirmationText = null,
  theme,
  children
}) => {
  const [confirmation, setConfirmation] = useState('');
  const [canDelete, setCanDelete] = useState(false);

  // Default confirmation text if not provided
  const defaultConfirmationText = confirmationText || `delete ${itemName}`;

  useEffect(() => {
    if (open) {
      setConfirmation('');
      setCanDelete(false);
    }
  }, [open]);

  useEffect(() => {
    setCanDelete(confirmation === defaultConfirmationText);
  }, [confirmation, defaultConfirmationText]);

  const handleClose = () => {
    setConfirmation('');
    setCanDelete(false);
    onClose();
  };

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
      handleClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme.card,
          color: theme.text,
          border: `1px solid ${theme.border}`
        }
      }}
    >
      <DialogTitle sx={{ color: theme.text }}>
        🗑️ {title || `Delete ${itemType}`}
      </DialogTitle>
      
      <DialogContent sx={{ color: theme.text }}>
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: 'error.light', 
          borderRadius: 1, 
          border: '1px solid', 
          borderColor: 'error.main' 
        }}>
          <Typography variant="subtitle2" sx={{ color: 'error.dark', fontWeight: 'bold', mb: 1 }}>
            ⚠️ This action cannot be undone!
          </Typography>
          <Typography variant="body2" sx={{ color: 'error.dark' }}>
            Deleting this {itemType} will permanently remove it and all associated data.
          </Typography>
        </Box>
        
        <Typography sx={{ mb: 2 }}>
          You are about to delete the {itemType}: <strong>"{itemName}"</strong>
        </Typography>
        
        {children && (
          <Box sx={{ mb: 3 }}>
            {children}
          </Box>
        )}
        
        <Typography sx={{ mb: 2, fontWeight: 'bold' }}>
          To confirm deletion, type exactly: <strong>{defaultConfirmationText}</strong>
        </Typography>
        
        <TextField
          fullWidth
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder={defaultConfirmationText}
          sx={{
            '& .MuiInputLabel-root': { color: theme.textSecondary },
            '& .MuiOutlinedInput-root': { 
              color: theme.text,
              '& fieldset': { borderColor: theme.border },
              '&:hover fieldset': { borderColor: theme.primary },
              '&.Mui-focused fieldset': { borderColor: theme.primary }
            },
            '& .MuiInputBase-input': { color: theme.text },
            '& .MuiInputBase-input::placeholder': { color: theme.textSecondary, opacity: 0.7 }
          }}
        />
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          sx={{ color: theme.textSecondary }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
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
          Delete {itemType}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteModal;
