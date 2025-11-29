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
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Description as DescriptionIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const GlossaryCard = ({ term, currentTheme }) => {
  const navigate = useNavigate();

  return (
    <Card 
      elevation={0}
      onClick={() => navigate(`/glossary/${term.id}`)}
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
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: currentTheme.text, mb: 0.5 }}>
              {term.term || 'Unnamed Term'}
            </Typography>
            {term.category && (
              <Chip
                label={term.category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                  border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                }}
              />
            )}
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
            <MenuBookIcon sx={{ fontSize: 20 }} />
          </Box>
        </Box>

        <Typography 
          variant="body2" 
          sx={{ 
            color: currentTheme.textSecondary, 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {term.definition || 'No definition available'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {term.documentation && (
              <Tooltip title="View Documentation">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(term.documentation, '_blank');
                  }}
                  sx={{
                    color: currentTheme.textSecondary,
                    '&:hover': {
                      color: currentTheme.primary,
                    }
                  }}
                >
                  <DescriptionIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            {term.link && (
              <Tooltip title="View Related Link">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(term.link, '_blank');
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
          
          {term.lastUpdated && (
            <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
              Updated {new Date(term.lastUpdated).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default GlossaryCard;


