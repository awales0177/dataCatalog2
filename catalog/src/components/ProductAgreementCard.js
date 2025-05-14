import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ProductAgreementCard component for displaying individual product agreement information
const ProductAgreementCard = ({ agreement, currentTheme }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'in_review':
        return '#ff9800';
      case 'expired':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const statusColor = getStatusColor(agreement.status);

  const handleClick = () => {
    navigate(`/agreements/${agreement.id}`);
  };

  return (
    <Paper
      elevation={0}
      onClick={handleClick}
      sx={{
        p: 2,
        height: '150px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '1px solid',
        borderColor: currentTheme.border,
        borderRadius: '20px',
        bgcolor: currentTheme.card,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: currentTheme.border,
        },
      }}
    >
      {/* Status Color Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '8px',
          height: '8px',
          backgroundColor: statusColor,
          borderRadius: '50%',
        }}
      />

      {/* Content */}
      <Box sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: currentTheme.text, 
            fontWeight: 600, 
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {agreement.name}
        </Typography>

        {/* Flowchart */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flex: 1,
        }}>
          {/* Producer */}
          <Typography sx={{
            color: currentTheme.darkMode ? '#ff8c00' : currentTheme.textSecondary,
            fontSize: '0.7rem',
            opacity: currentTheme.darkMode ? 0.9 : 0.7,
            flex: 1,
            textAlign: 'center',
          }}>
            {agreement.dataProducer || 'System A'}
          </Typography>

          {/* Arrow */}
          <ArrowForwardIcon sx={{ 
            color: currentTheme.darkMode ? '#ff8c00' : currentTheme.textSecondary,
            mx: 0.75,
            fontSize: '1rem',
            opacity: currentTheme.darkMode ? 0.9 : 0.5,
          }} />

          {/* Model */}
          <Typography sx={{
            color: currentTheme.darkMode ? '#ff8c00' : currentTheme.textSecondary,
            fontSize: '0.7rem',
            opacity: currentTheme.darkMode ? 0.9 : 0.7,
            flex: 1,
            textAlign: 'center',
          }}>
            {agreement.modelShortName || 'Unknown'}
          </Typography>

          {/* Arrow */}
          <ArrowForwardIcon sx={{ 
            color: currentTheme.darkMode ? '#ff8c00' : currentTheme.textSecondary,
            mx: 0.75,
            fontSize: '1rem',
            opacity: currentTheme.darkMode ? 0.9 : 0.5,
          }} />

          {/* Consumer */}
          <Typography sx={{
            color: currentTheme.darkMode ? '#ff8c00' : currentTheme.textSecondary,
            fontSize: '0.7rem',
            opacity: currentTheme.darkMode ? 0.9 : 0.7,
            flex: 1,
            textAlign: 'center',
          }}>
            {agreement.dataConsumer || 'System B'}
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 'auto',
        }}>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
            {formatDate(agreement.lastUpdated)}
          </Typography>
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: `${statusColor}20`,
              color: statusColor,
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {(agreement.status || 'unknown').split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProductAgreementCard; 