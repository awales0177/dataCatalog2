import React, { useContext } from 'react';
import { Box, Container, CircularProgress, Snackbar, Alert } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';
import MarkdownEditorLayout from './MarkdownEditorLayout';

/**
 * Full-page markdown editor: loading spinner, optional error state, MarkdownEditorLayout, themed snackbar.
 * Entity-specific load/save/navigation stays in route pages; pass layout props matching MarkdownEditorLayout.
 */
const MarkdownEditorScreen = ({
  loading,
  /** When true after loading, render errorChildren instead of the editor. */
  error = false,
  errorChildren = null,
  snackbar,
  onSnackbarClose,
  /** Props forwarded to MarkdownEditorLayout (currentTheme / darkMode injected here). */
  layout,
}) => {
  const { currentTheme } = useContext(ThemeContext);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress sx={{ color: currentTheme.primary }} />
        </Box>
      </Container>
    );
  }

  if (error && errorChildren != null) {
    return <Container maxWidth="lg" sx={{ py: 4 }}>{errorChildren}</Container>;
  }

  return (
    <>
      <MarkdownEditorLayout
        {...layout}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={onSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%', bgcolor: currentTheme.card, color: currentTheme.text }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MarkdownEditorScreen;
