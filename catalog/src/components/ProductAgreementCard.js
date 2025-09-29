import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/themeUtils';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import FactoryIcon from '@mui/icons-material/Factory';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

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

  // Determine owner role based on producers and consumers
  const getOwnerRole = () => {
    const owner = agreement.owner;
    const producers = agreement.dataProducer || [];
    const consumers = agreement.dataConsumer || [];
    
    if (!owner || owner.length === 0) return null;
    
    const ownerArray = Array.isArray(owner) ? owner : [owner];
    const producerArray = Array.isArray(producers) ? producers : [producers];
    const consumerArray = Array.isArray(consumers) ? consumers : [consumers];
    
    const isProducer = ownerArray.some(ownerName => 
      producerArray.some(producer => producer && producer.toLowerCase() === ownerName.toLowerCase())
    );
    
    const isConsumer = ownerArray.some(ownerName => 
      consumerArray.some(consumer => consumer && consumer.toLowerCase() === ownerName.toLowerCase())
    );
    
    if (isProducer && isConsumer) return 'both';
    if (isProducer) return 'producer';
    if (isConsumer) return 'consumer';
    return null;
  };

  const ownerRole = getOwnerRole();
  
  // Debug logging
  console.log('Agreement:', agreement.name, {
    owner: agreement.owner,
    producers: agreement.dataProducer,
    consumers: agreement.dataConsumer,
    ownerRole
  });

  const getRoleIcon = () => {
    switch (ownerRole) {
      case 'producer':
        return (
          <Tooltip title="Owner is a data producer" arrow>
            <FactoryIcon sx={{ fontSize: 16, color: currentTheme.primary }} />
          </Tooltip>
        );
      case 'consumer':
        return (
          <Tooltip title="Owner is a data consumer" arrow>
            <ShoppingBasketIcon sx={{ fontSize: 16, color: currentTheme.primary }} />
          </Tooltip>
        );
      case 'both':
        return (
          <Tooltip title="Owner is both producer and consumer" arrow>
            <SwapHorizIcon sx={{ fontSize: 16, color: currentTheme.primary }} />
          </Tooltip>
        );
      default:
        return null;
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, position: 'relative' }}>
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
          
          {/* Role icon in top right corner */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0,
            zIndex: 1
          }}>
            {getRoleIcon() || (
              <Tooltip title="Owner role not determined" arrow>
                <FactoryIcon sx={{ fontSize: 16, color: currentTheme.primary }} />
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 1, 
          mt: 'auto'
        }}>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
            {formatDate(agreement.lastUpdated)}
          </Typography>
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
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductAgreementCard; 