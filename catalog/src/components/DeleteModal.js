import React, { useState, useEffect, useContext } from 'react';
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
import { ThemeContext } from '../contexts/ThemeContext';

const DeleteModal = ({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'item',
  confirmationText = null,
  /** 'typed' requires matching phrase; 'simple' is Cancel / Delete only. */
  confirmMode = 'typed',
  children
}) => {
  const { currentTheme: theme } = useContext(ThemeContext);
  const [confirmation, setConfirmation] = useState('');
  const [canDelete, setCanDelete] = useState(false);

  const defaultConfirmationText = confirmationText || `delete ${itemName}`;

  useEffect(() => {
    if (open) {
      setConfirmation('');
      setCanDelete(confirmMode === 'simple');
    }
  }, [open, confirmMode]);

  useEffect(() => {
    if (confirmMode === 'simple') {
      setCanDelete(true);
    } else {
      setCanDelete(confirmation === defaultConfirmationText);
    }
  }, [confirmation, defaultConfirmationText, confirmMode]);

  const handleClose = () => {
    setConfirmation('');
    onClose();
  };

  const handleConfirm = () => {
    if (!canDelete) return;
    onConfirm();
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme?.darkMode ? theme?.background : theme?.card,
          color: theme.text,
          border: `1px solid ${theme.border}`,
        },
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
          You are about to delete the {itemType}: <strong>&quot;{itemName}&quot;</strong>
        </Typography>
        
        {children && (
          <Box sx={{ mb: 3 }}>
            {children}
          </Box>
        )}
        
        {confirmMode === 'typed' && (
          <>
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
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={!canDelete}
        >
          Delete {itemType}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteModal;
