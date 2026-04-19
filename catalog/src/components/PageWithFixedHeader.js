import React from 'react';
import { Box } from '@mui/material';

/**
 * Page title band + body in one flow (main scrolls as a whole in App).
 */
export default function PageWithFixedHeader({ header, children, sx = {} }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        ...sx,
      }}
    >
      {header}
      {children}
    </Box>
  );
}
