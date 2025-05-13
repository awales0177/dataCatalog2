import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

const BaseCard = ({
  title,
  subtitle,
  description,
  tags = [],
  actions,
  onClick,
  currentTheme,
  status,
  icon,
  children,
  sx = {},
}) => {
  const cardStyles = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: onClick ? 'pointer' : 'default',
    '&:hover': onClick ? {
      transform: 'translateY(-4px)',
      boxShadow: `0 8px 16px ${alpha(currentTheme.primary, 0.1)}`,
    } : {},
    ...sx,
  };

  return (
    <Card sx={cardStyles} onClick={onClick}>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          {icon && (
            <Box sx={{ mr: 1, color: currentTheme.primary }}>
              {icon}
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: currentTheme.textPrimary,
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{ color: currentTheme.textSecondary }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {status && (
            <Chip
              label={status}
              size="small"
              sx={{
                bgcolor: alpha(currentTheme.primary, 0.1),
                color: currentTheme.primary,
                fontWeight: 500,
              }}
            />
          )}
        </Box>

        {description && (
          <Typography
            variant="body2"
            sx={{
              color: currentTheme.textSecondary,
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}

        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.05),
                  color: currentTheme.textSecondary,
                }}
              />
            ))}
          </Box>
        )}

        {children}
      </CardContent>

      {actions && (
        <CardActions sx={{ p: 2, pt: 0 }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default BaseCard; 