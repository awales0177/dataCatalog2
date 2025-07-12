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
import DataObjectIcon from '@mui/icons-material/DataObject';
import { formatDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

const ReferenceDataCard = ({ item, currentTheme }) => {
  const navigate = useNavigate();
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        bgcolor: currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        position: 'relative',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      }}
      onClick={() => navigate(`/reference/${item.id}`)}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: currentTheme.text }}>
            {item.name}
          </Typography>
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
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: currentTheme.textSecondary,
            }}
          >
            {formatDate(item.lastUpdated)}
          </Typography>

          {item.swaggerPage && (
            <Tooltip title="View Swagger Page">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.swaggerPage, '_blank');
                }}
                sx={{
                  color: currentTheme.textSecondary,
                  '&:hover': {
                    color: currentTheme.primary,
                  }
                }}
              >
                <DataObjectIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReferenceDataCard; 