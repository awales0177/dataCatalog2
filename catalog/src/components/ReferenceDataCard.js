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

const ReferenceDataCard = ({ item, currentTheme }) => {
  const navigate = useNavigate();

  // Generate diverse mock usage data for heart monitor chart
  const generateUsageData = (item) => {
    const data = [];
    const points = 20;
    
    // Create different patterns based on item properties
    const seed = (item.id?.charCodeAt(0) || 0) + (item.name?.length || 0);
    const patternType = seed % 7;
    
    for (let i = 0; i < points; i++) {
      const x = i / (points - 1);
      let value;
      
      switch (patternType) {
        case 0: // High activity with spikes
          value = 60 + Math.sin(x * Math.PI * 4) * 20 + Math.sin(x * Math.PI * 12) * 8 + (Math.random() - 0.5) * 10;
          break;
        case 1: // Steady high usage (GREEN)
          value = 85 + Math.sin(x * Math.PI * 2) * 8 + Math.sin(x * Math.PI * 8) * 4 + (Math.random() - 0.5) * 4;
          break;
        case 2: // Low activity with occasional peaks
          value = 25 + Math.sin(x * Math.PI * 3) * 15 + Math.sin(x * Math.PI * 15) * 12 + (Math.random() - 0.5) * 8;
          break;
        case 3: // Erratic pattern
          value = 40 + Math.sin(x * Math.PI * 6) * 25 + Math.sin(x * Math.PI * 18) * 15 + (Math.random() - 0.5) * 15;
          break;
        case 4: // Gradual increase
          value = 20 + x * 40 + Math.sin(x * Math.PI * 5) * 10 + (Math.random() - 0.5) * 8;
          break;
        case 5: // Gradual decrease
          value = 80 - x * 30 + Math.sin(x * Math.PI * 4) * 12 + (Math.random() - 0.5) * 6;
          break;
        case 6: // High activity with consistent peaks (GREEN)
          value = 85 + Math.sin(x * Math.PI * 3) * 10 + Math.sin(x * Math.PI * 9) * 5 + (Math.random() - 0.5) * 3;
          break;
        default:
          value = 50 + Math.sin(x * Math.PI * 3) * 20 + (Math.random() - 0.5) * 10;
      }
      
      // Ensure value stays within bounds
      data.push(Math.max(5, Math.min(95, value)));
    }
    
    return data;
  };

  const usageData = generateUsageData(item);

  // Get usage color based on average usage - red to yellow to orange to green
  const getUsageColor = (data) => {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    if (avg >= 80) return '#4caf50'; // Green for high usage
    if (avg >= 60) return '#ff9800'; // Orange for medium-high usage
    if (avg >= 40) return '#ffc107'; // Yellow for medium usage
    if (avg >= 20) return '#ff5722'; // Red-orange for low usage
    return '#f44336'; // Red for very low usage
  };

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