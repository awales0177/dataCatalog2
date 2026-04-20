import React, { useContext } from 'react';
import { Box, Container } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Page title band — same width as body (`Container maxWidth="xl"`); title and subtitle centered.
 */
function StickyPageIntro({ children, sx = {} }) {
  const { currentTheme } = useContext(ThemeContext);

  return (
    <Container
      component="header"
      maxWidth="xl"
      aria-label="Page header"
      sx={{
        flexShrink: 0,
        bgcolor: currentTheme.background,
        pt: { xs: 1.5, sm: 2 },
        pb: { xs: 1.75, sm: 2 },
        mb: 2,
        ...sx,
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          '& > .MuiTypography-body1, & > .MuiTypography-body2, & > .MuiTypography-subtitle1': {
            maxWidth: 720,
            mx: 'auto',
          },
        }}
      >
        {children}
      </Box>
    </Container>
  );
}

export default StickyPageIntro;
