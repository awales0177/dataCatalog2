import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
} from '@mui/material';
import { formatDate } from '../utils/dateUtils';

const ApplicationCard = ({ application, currentTheme }) => {
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
          {application.name}
        </Typography>

        <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
          {application.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {application.domains?.map((domain) => (
            <Chip
              key={domain}
              label={domain}
              size="small"
              sx={{
                bgcolor: alpha(currentTheme.primary, 0.1),
                color: currentTheme.primary,
                fontWeight: 500,
              }}
            />
          ))}
        </Box>

        <Typography 
          variant="caption" 
          sx={{ 
            color: currentTheme.textSecondary,
            mt: 2,
            display: 'block'
          }}
        >
          Last Updated: {formatDate(application.lastUpdated)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard; 