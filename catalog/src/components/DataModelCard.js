import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  alpha,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  EmojiEvents as EmojiEventsIcon,
  Whatshot as WhatshotIcon,
} from '@mui/icons-material';
import { formatDate, getQualityColor } from '../utils/themeUtils';
import verifiedLogo from '../imgs/verified.svg';
import { GoVerified } from "react-icons/go";

// DataModelCard component for displaying individual data model information
const DataModelCard = ({ model, currentTheme }) => {
  const navigate = useNavigate();

  // Safety check - if no model, don't render
  if (!model) {
    return null;
  }

  // Calculate score based on how many fields have values
  const calculateScore = (model) => {
    const countFilledFields = (obj) => {
      let filledCount = 0;
      let totalCount = 0;

      for (const [key, value] of Object.entries(obj)) {
        totalCount++;
        if (value === null || value === undefined || value === "") {
          continue;
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          const nestedResult = countFilledFields(value);
          filledCount += nestedResult.filled;
          totalCount += nestedResult.total - 1; // Subtract 1 to avoid double counting the parent object
        } else {
          filledCount++;
        }
      }
      return { filled: filledCount, total: totalCount };
    };

    const result = countFilledFields(model);
    return Math.round((result.filled / result.total) * 100);
  };

  const score = calculateScore(model);
  const qualityColor = getQualityColor(score, currentTheme.darkMode);

  // Get tier color based on meta.tier
  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#9e9e9e';
    }
  };

  const tierColor = getTierColor(model.meta?.tier);

  return (
    <Card 
      elevation={0}
      onClick={() => model.shortName ? navigate(`/specifications/${model.shortName.toLowerCase()}`) : null}
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
              {model.name || 'Unnamed Model'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: currentTheme.textSecondary,
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}
            >
              {model.shortName || 'N/A'}
            </Typography>
          </Box>
          {model.meta?.verified && (
            <Tooltip title="Verified Model">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: currentTheme.primary,
                }}
              >
                <GoVerified size={24} />
              </Box>
            </Tooltip>
          )}
        </Box>

        <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
          {model.description || 'No description available'}
        </Typography>

        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {model.domain && Array.isArray(model.domain) && model.domain.map((domain, index) => (
            <Chip
              key={index}
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

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mr: 1 }}>
              Metadata Score
            </Typography>
            <Typography variant="caption" sx={{ color: qualityColor, fontWeight: 600 }}>
              {score}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(qualityColor, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: qualityColor,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={`${model.users?.length || 0} users`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  {model.users?.length || 0}
                </Typography>
                <WhatshotIcon sx={{ fontSize: 16, color: '#FF9800' }} />
              </Box>
            </Tooltip>
          </Box>
          <Tooltip title={`${model.meta?.tier?.charAt(0).toUpperCase() + model.meta?.tier?.slice(1)} Tier Model`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: tierColor,
                  boxShadow: `0 0 0 1px ${alpha(tierColor, 0.3)}`,
                }}
              />
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                {model.meta?.tier?.charAt(0).toUpperCase() + model.meta?.tier?.slice(1)}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DataModelCard;