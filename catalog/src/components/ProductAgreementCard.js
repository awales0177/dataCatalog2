import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/themeUtils';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import FactoryIcon from '@mui/icons-material/Factory';
import { getProducerTeamImageSrc } from '../utils/producerTeamImage';

// ProductAgreementCard component for displaying individual product agreement information
const ProductAgreementCard = ({ agreement, currentTheme, applications = [] }) => {
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
  const producerTeamImageSrc = getProducerTeamImageSrc(agreement, applications);

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
  
  // Get chips showing consumers or producers based on owner role
  const getRoleChips = () => {
    const producers = agreement.dataProducer || [];
    const consumers = agreement.dataConsumer || [];
    const owner = agreement.owner;
    
    if (!owner || !Array.isArray(owner)) return null;
    
    const ownerArray = Array.isArray(owner) ? owner : [owner];
    const producerArray = Array.isArray(producers) ? producers : [producers];
    const consumerArray = Array.isArray(consumers) ? consumers : [consumers];
    
    // Filter out empty values
    const validProducers = producerArray.filter(p => p && p.trim());
    const validConsumers = consumerArray.filter(c => c && c.trim());
    
    if (ownerRole === 'producer' && validConsumers.length > 0) {
      // Owner is producer, show consumers
      return validConsumers.slice(0, 3).map((consumer, index) => (
        <Chip
          key={`consumer-${index}`}
          icon={<ShoppingBasketIcon sx={{ fontSize: 14 }} />}
          label={consumer}
          size="small"
          sx={{
            bgcolor: alpha('#4caf50', 0.1),
            color: '#4caf50',
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
            '& .MuiChip-icon': {
              fontSize: 14,
            },
          }}
        />
      ));
    } else if (ownerRole === 'consumer' && validProducers.length > 0) {
      // Owner is consumer, show producers
      return validProducers.slice(0, 3).map((producer, index) => (
        <Chip
          key={`producer-${index}`}
          icon={<FactoryIcon sx={{ fontSize: 14 }} />}
          label={producer}
          size="small"
          sx={{
            bgcolor: alpha('#2196f3', 0.1),
            color: '#2196f3',
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
            '& .MuiChip-icon': {
              fontSize: 14,
            },
          }}
        />
      ));
    } else if (ownerRole === 'both') {
      // Owner is both, show both with different styling
      const allParties = [...validProducers, ...validConsumers].slice(0, 3);
      return allParties.map((party, index) => {
        const isProducer = validProducers.includes(party);
        return (
          <Chip
            key={`party-${index}`}
            icon={isProducer ? <FactoryIcon sx={{ fontSize: 14 }} /> : <ShoppingBasketIcon sx={{ fontSize: 14 }} />}
            label={party}
            size="small"
            sx={{
              bgcolor: isProducer ? alpha('#2196f3', 0.1) : alpha('#4caf50', 0.1),
              color: isProducer ? '#2196f3' : '#4caf50',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 24,
              '& .MuiChip-icon': {
                fontSize: 14,
              },
            }}
          />
        );
      });
    }
    
    return null;
  };

  const handleClick = () => {
    navigate(`/agreements/${agreement.id}`);
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        flex: 1
      }}>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: currentTheme.text,
                fontWeight: 600,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.3,
              }}
            >
              {agreement.name}
            </Typography>
            {producerTeamImageSrc ? (
              <Box
                component="img"
                src={producerTeamImageSrc}
                alt=""
                sx={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: `1px solid ${currentTheme.border}`,
                  bgcolor: alpha(currentTheme.text, 0.04),
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : null}
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: currentTheme.textSecondary,
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

        {/* Consumer/Producer chips */}
        {getRoleChips() && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {getRoleChips()}
            </Stack>
          </Box>
        )}

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