import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  alpha,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  DataObject as DataObjectIcon,
  Storage as StorageIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { formatDate } from '../utils/themeUtils';
import { useNavigate } from 'react-router-dom';
import { generateUsageData, getUsageColor } from '../data/graphData';

const ReferenceDataCard = ({ item, currentTheme }) => {
  const navigate = useNavigate();

  // Generate usage data using imported graph data
  const usageDataResult = generateUsageData(item);
  const usageData = usageDataResult.data;

  // Get usage color using imported function
  const usageColor = getUsageColor(usageData);
  const avgUsage = Math.round(usageData.reduce((a, b) => a + b, 0) / usageData.length);

  return (
    <Card 
      elevation={0}
      onClick={() => navigate(`/reference/${item.id}`)}
      sx={{ 
        height: '100%',
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
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: currentTheme.text }}>
              {item.name || 'Unnamed Reference Data'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: currentTheme.textSecondary,
                fontWeight: 500,
                letterSpacing: '0.5px',
                fontFamily: 'monospace',
              }}
            >
              {item.domain && item.domain.length > 0 ? item.domain.join(' • ') : 'No domains assigned'}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <StorageIcon sx={{ fontSize: 20 }} />
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
          {item.description || 'No description available'}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mr: 1 }}>
              Usage Activity
            </Typography>
            <Typography variant="caption" sx={{ color: usageColor, fontWeight: 600 }}>
              {avgUsage}%
            </Typography>
          </Box>
          <Box sx={{ 
            height: 40, 
            width: '100%', 
            position: 'relative',
            bgcolor: alpha(usageColor, 0.05),
            borderRadius: 1,
            overflow: 'hidden'
          }}>
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 200 40"
              preserveAspectRatio="none"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={usageColor} stopOpacity="0.8" />
                  <stop offset="50%" stopColor={usageColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={usageColor} stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke={`url(#gradient-${item.id})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={usageData.map((value, index) => 
                  `${(index / (usageData.length - 1)) * 200},${40 - (value / 100) * 40}`
                ).join(' ')}
              />
              {/* Add small dots at each data point */}
              {usageData.map((value, index) => (
                <circle
                  key={index}
                  cx={(index / (usageData.length - 1)) * 200}
                  cy={40 - (value / 100) * 40}
                  r="1.5"
                  fill={usageColor}
                  opacity="0.8"
                />
              ))}
            </svg>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {item.swaggerPage && (
              <Tooltip title="View Swagger Documentation">
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
            
            {item.apiEndpoint && (
              <Tooltip title="View API Endpoint">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.apiEndpoint, '_blank');
                  }}
                  sx={{
                    color: currentTheme.textSecondary,
                    '&:hover': {
                      color: currentTheme.primary,
                    }
                  }}
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              v{item.version || '1.0.0'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReferenceDataCard; 