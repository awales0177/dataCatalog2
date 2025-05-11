import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
} from '@mui/material';

const ReferenceDataCard = ({ item, currentTheme }) => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        bgcolor: currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, color: currentTheme.text, mb: 1 }}>
          {item.name}
        </Typography>

        <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
          {item.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              fontSize: '0.75rem',
            }}
          >
            {item.category}
          </Box>
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              fontSize: '0.75rem',
            }}
          >
            v{item.version}
          </Box>
        </Box>

        <Typography 
          variant="caption" 
          sx={{ 
            color: currentTheme.textSecondary,
            mt: 2,
            display: 'block'
          }}
        >
          Last Updated: {new Date(item.lastUpdated).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ReferenceDataCard; 