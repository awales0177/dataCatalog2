import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/themeUtils';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';

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
    <Card 
      elevation={0}
      onClick={handleClick}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        bgcolor: currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        flex: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
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
            <Typography 
              variant="body2" 
              sx={{ 
                color: currentTheme.textSecondary,
                mb: 2,
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {agreement.description || 'No description available'}
            </Typography>
          </Box>
          <Chip
            label={(agreement.status || 'unknown').split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
            size="small"
            sx={{
              bgcolor: alpha(statusColor, 0.1),
              color: statusColor,
              fontWeight: 600,
              textTransform: 'capitalize',
              ml: 1
            }}
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 1, 
          mt: 'auto'
        }}>
          {agreement.contractVersion && (
            <Typography variant="caption" sx={{ 
              color: currentTheme.textSecondary,
              fontSize: '0.7rem',
              fontWeight: 500,
            }}>
              v{agreement.contractVersion}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
            {formatDate(agreement.lastUpdated)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductAgreementCard; 