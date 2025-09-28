import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
} from '@mui/icons-material';
import { formatDate } from '../utils/themeUtils';

const ApplicationCard = ({ application, currentTheme, onEdit }) => {
  // Debug: Log application object to see available fields
  console.log('ApplicationCard - application object:', application);
  console.log('ApplicationCard - lastUpdated field:', application.lastUpdated);
  
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
          '& .action-buttons': {
            opacity: 1,
          },
        },
        position: 'relative',
      }}
    >
      {/* Action buttons */}
      <Box 
        className="action-buttons"
        sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8, 
          display: 'flex', 
          gap: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        {onEdit && (
          <Tooltip title="Edit Application">
            <IconButton
              size="small"
              onClick={() => onEdit(application.id)}
              sx={{ 
                bgcolor: alpha(currentTheme.primary, 0.1),
                color: currentTheme.primary,
                '&:hover': {
                  bgcolor: currentTheme.primary,
                  color: 'white',
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

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
          Last Updated: {formatDate(application.lastUpdated || application.updatedAt || application.modifiedAt || application.lastModified)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard; 