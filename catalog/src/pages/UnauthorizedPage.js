import React, { useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box
} from '@mui/material';
import {
  Block as BlockIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTheme } = useContext(ThemeContext);

  // Prevent the modal from being closed by clicking outside or pressing escape
  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      // Do nothing - prevent closing
      return;
    }
  };

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: currentTheme.card,
          color: currentTheme.text,
          border: `1px solid ${currentTheme.border}`,
        },
        '& .MuiBackdrop-root': {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <BlockIcon 
            sx={{ 
              fontSize: 64, 
              color: currentTheme.error, 
              mb: 2 
            }} 
          />
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ color: currentTheme.text }}
          >
            Access Denied
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
        <Typography 
          variant="body1" 
          paragraph
          sx={{ color: currentTheme.textSecondary }}
        >
          You don't have permission to access this page.
        </Typography>

        {user && (
          <Typography 
            variant="body2" 
            paragraph
            sx={{ color: currentTheme.textSecondary }}
          >
            Your current role: <strong style={{ color: currentTheme.text }}>{user.currentRole}</strong>
          </Typography>
        )}

        <Typography 
          variant="body2" 
          paragraph
          sx={{ color: currentTheme.textSecondary }}
        >
          Please contact your administrator if you believe this is an error.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ 
            bgcolor: currentTheme.primary,
            color: currentTheme.background,
            '&:hover': {
              bgcolor: currentTheme.primaryHover || currentTheme.primary,
            }
          }}
        >
          Go Back
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnauthorizedPage;
