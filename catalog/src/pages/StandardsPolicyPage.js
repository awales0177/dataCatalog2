import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const StandardsPolicyPage = ({ currentTheme }) => {
  return (
    <Box sx={{ p: 3, maxWidth: 900, margin: '0 auto' }}>
      <Paper elevation={0} sx={{ p: 4, bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}`, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ color: currentTheme?.primary, mb: 2 }}>
          Standards & Policy
        </Typography>
        <Typography variant="body1" sx={{ color: currentTheme?.textSecondary, mb: 2 }}>
          This section will contain information about data standards, governance policies, and compliance requirements for the organization. You can use this page to document:
        </Typography>
        <ul style={{ color: currentTheme?.textSecondary, marginLeft: 24 }}>
          <li>Data quality standards</li>
          <li>Data access and usage policies</li>
          <li>Compliance and regulatory requirements</li>
          <li>Best practices and guidelines</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default StandardsPolicyPage; 