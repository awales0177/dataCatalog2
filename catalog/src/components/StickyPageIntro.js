import React, { useContext } from 'react';
import { Container } from '@mui/material';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Page title band — same horizontal alignment as body (`Container maxWidth="xl"`), no rule/border.
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
      {children}
    </Container>
  );
}

export default StickyPageIntro;
