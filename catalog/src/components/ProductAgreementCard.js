import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
    <Paper
      elevation={0}
      onClick={handleClick}
      sx={{
        p: 2,
        height: '180px',
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

        {/* Consumer Chips */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          mb: 1,
        }}>
          {(() => {
            const consumers = Array.isArray(agreement.dataConsumer)
              ? agreement.dataConsumer
              : agreement.dataConsumer
                ? [agreement.dataConsumer]
                : [];
            
            if (consumers.length === 0) {
              return (
                <Chip
                  icon={<ShoppingBasketIcon sx={{ color: currentTheme.primary, opacity: 0.8 }} />}
                  label="No Consumer"
                  size="small"
                  sx={{
                    bgcolor: currentTheme.card,
                    color: currentTheme.textSecondary,
                    border: `1px solid ${currentTheme.border}`,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    opacity: 0.7,
                    height: '24px',
                  }}
                />
              );
            }
            
            // Show only first 2 consumers to prevent title from being hidden
            const maxVisible = 2;
            const visibleConsumers = consumers.slice(0, maxVisible);
            const hiddenCount = consumers.length - maxVisible;
            
            return (
              <>
                {visibleConsumers.map((consumer, idx) => (
                  <Chip
                    key={idx}
                    icon={<ShoppingBasketIcon sx={{ color: currentTheme.primary, opacity: 0.8 }} />}
                    label={consumer}
                    size="small"
                    sx={{
                      bgcolor: currentTheme.card,
                      color: currentTheme.text,
                      border: `1px solid ${currentTheme.border}`,
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      opacity: 0.95,
                      height: '24px',
                    }}
                  />
                ))}
                {hiddenCount > 0 && (
                  <Chip
                    label={`+${hiddenCount} more`}
                    size="small"
                    sx={{
                      bgcolor: currentTheme.textSecondary,
                      color: currentTheme.card,
                      fontWeight: 500,
                      fontSize: '0.7rem',
                      opacity: 0.8,
                      height: '24px',
                    }}
                  />
                )}
              </>
            );
          })()}
        </Box>

        {/* Contract Version */}
        {agreement.contractVersion && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ 
              color: currentTheme.textSecondary,
              fontSize: '0.7rem',
              fontWeight: 500,
            }}>
              v{agreement.contractVersion}
            </Typography>
          </Box>
        )}

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