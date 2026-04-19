import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

const SESSION_KEY = 'dh_welcome_modal_seen';

export function shouldShowWelcomeModal() {
  try {
    return !sessionStorage.getItem(SESSION_KEY);
  } catch {
    return true;
  }
}

export function markWelcomeModalSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * First-visit-in-session welcome; call only after app shell (theme) is ready.
 */
const WelcomeModal = ({ open, onClose, theme }) => {
  const handleClose = () => {
    markWelcomeModalSeen();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      BackdropProps={{
        sx: { backdropFilter: 'blur(4px)' },
      }}
      PaperProps={{
        sx: {
          bgcolor: theme.card,
          backgroundImage: theme.darkMode
            ? 'linear-gradient(to top, rgba(239, 83, 80, 0.1) 0%, rgba(239, 83, 80, 0.02) 36%, transparent 58%)'
            : 'linear-gradient(to top, rgba(211, 47, 47, 0.055) 0%, rgba(255, 248, 248, 0.65) 44%, #ffffff 100%)',
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 2,
          textAlign: 'center',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          color: theme.text,
          fontWeight: 700,
          fontSize: '1.5rem',
          pt: 3,
          pb: 1,
        }}
      >
        Welcome to DH
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2.5,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${theme.border}`,
              boxShadow: theme.darkMode
                ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
                : 'inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            <Box
              component="img"
              src="/lotus.svg"
              alt=""
              sx={{
                width: 52,
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: theme.textSecondary,
            lineHeight: 1.6,
            maxWidth: 420,
            mx: 'auto',
          }}
        >
          Browse data models, agreements, policies, and the toolkit from the sidebar. Open search with{' '}
          <Box component="span" sx={{ color: theme.text, fontWeight: 600 }}>
            ⌘K
          </Box>{' '}
          or{' '}
          <Box component="span" sx={{ color: theme.text, fontWeight: 600 }}>
            Ctrl+K
          </Box>{' '}
          to jump anywhere in the catalog.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 3, pt: 0 }}>
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            bgcolor: theme.primary,
            color: theme.background,
            px: 3,
            '&:hover': {
              bgcolor: theme.primaryHover || theme.primary,
            },
          }}
        >
          Get started
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WelcomeModal;
