import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  ShoppingCart as ShoppingCartIcon,
  Gavel as ComplianceIcon,
  Psychology as AIIcon,
  AccountBalance as FinanceIcon,
  Support as SupportIcon,
  Inventory as InventoryIcon,
  VerifiedUser as QualityIcon,
} from '@mui/icons-material';

const DataProductCard = ({ product, onClick, currentTheme }) => {
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'analytics':
        return <AnalyticsIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
      case 'operations':
        return <ShoppingCartIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
      case 'compliance':
        return <ComplianceIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
      case 'ai/ml':
      case 'ai':
      case 'ml':
        return <AIIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
      case 'finance':
        return <FinanceIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
      case 'support':
        return <SupportIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
      case 'data quality':
        return <QualityIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
      default:
        return <AnalyticsIcon sx={{ color: currentTheme.primary, fontSize: 32 }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'warning';
    return 'error';
  };

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: '100%',
        minHeight: '280px',
        p: 2.5,
        cursor: 'pointer',
        bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
        border: `1px solid ${currentTheme.darkMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border}`,
        borderRadius: '12px',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderColor: '#37ABBF',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: currentTheme.text, 
              fontWeight: 600,
              fontSize: '1rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              mb: 0.5,
            }}
          >
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={product.status || 'unknown'}
              color={getStatusColor(product.status)}
              size="small"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                sx={{
                  backgroundColor: currentTheme.background,
                  color: currentTheme.text,
                  fontSize: '0.7rem',
                  height: '20px',
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Description */}
      <Typography 
        variant="body2" 
        sx={{ 
          color: currentTheme.textSecondary, 
          mb: 2,
          fontSize: '0.875rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
          width: '100%',
          minHeight: '40px',
        }}
      >
        {product.description || 'No description available'}
      </Typography>

      {/* Quality Score */}
      {product.qualityScore !== undefined && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontSize: '0.7rem' }}>
              Quality Score
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: getQualityColor(product.qualityScore) === 'success' ? currentTheme.success : 
                       getQualityColor(product.qualityScore) === 'warning' ? '#f59e0b' : 'error.main',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              {product.qualityScore}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={product.qualityScore}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: currentTheme.background,
              '& .MuiLinearProgress-bar': {
                backgroundColor: getQualityColor(product.qualityScore) === 'success' ? currentTheme.success : 
                                 getQualityColor(product.qualityScore) === 'warning' ? '#f59e0b' : 'error.main',
              },
            }}
          />
        </Box>
      )}

      {/* Details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto' }}>
        {/* Data Freshness Indicator */}
        {product.lastUpdated && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontSize: '0.7rem' }}>
                Data Freshness:
              </Typography>
              <Typography variant="caption" sx={{ color: currentTheme.text, fontSize: '0.7rem', fontWeight: 500 }}>
                {(() => {
                  try {
                    const lastUpdated = new Date(product.lastUpdated);
                    const now = new Date();
                    const diffMs = now - lastUpdated;
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    
                    if (diffDays > 0) {
                      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
                    } else if (diffHours > 0) {
                      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
                    } else if (diffMinutes > 0) {
                      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
                    } else {
                      return 'Just now';
                    }
                  } catch (e) {
                    return product.lastUpdated;
                  }
                })()}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(() => {
                try {
                  const lastUpdated = new Date(product.lastUpdated);
                  const now = new Date();
                  const diffMs = now - lastUpdated;
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  
                  // Calculate freshness percentage (0-100)
                  // 0 days = 100%, 1 day = 80%, 2 days = 60%, 3 days = 40%, 4+ days = 20%
                  if (diffDays === 0) {
                    return 100;
                  } else if (diffDays === 1) {
                    return 80;
                  } else if (diffDays === 2) {
                    return 60;
                  } else if (diffDays === 3) {
                    return 40;
                  } else {
                    return 20;
                  }
                } catch (e) {
                  return 0;
                }
              })()}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: currentTheme.background,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: (() => {
                    try {
                      const lastUpdated = new Date(product.lastUpdated);
                      const now = new Date();
                      const diffMs = now - lastUpdated;
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      
                      if (diffDays <= 1) {
                        return '#4caf50'; // Green
                      } else if (diffDays <= 3) {
                        return '#ff9800'; // Orange
                      } else {
                        return '#f44336'; // Red
                      }
                    } catch (e) {
                      return '#9e9e9e';
                    }
                  })(),
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        )}

        {/* Version and Last Updated */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {product.version && (
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontSize: '0.7rem' }}>
              v{product.version}
            </Typography>
          )}
          {product.lastUpdated && (
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontSize: '0.7rem' }}>
              {product.lastUpdated}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default DataProductCard;
