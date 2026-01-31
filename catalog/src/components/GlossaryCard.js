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
  Description as DescriptionIcon,
  Link as LinkIcon,
  DataObject as DataObjectIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const GlossaryCard = ({ term, currentTheme, dataModels = [], canEdit = false }) => {
  const navigate = useNavigate();
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        bgcolor: currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: '#37ABBF',
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
          {term.taggedModels && term.taggedModels.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                alignItems: 'center',
                maxWidth: '40%',
                justifyContent: 'flex-end',
              }}
            >
              {term.taggedModels.slice(0, 2).map((modelShortName) => {
                const model = dataModels.find(m => m.shortName === modelShortName);
                return (
                  <Chip
                    key={modelShortName}
                    icon={<DataObjectIcon sx={{ fontSize: 14 }} />}
                    label={model ? model.shortName : modelShortName}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      bgcolor: alpha(currentTheme.primary, 0.1),
                      color: currentTheme.primary,
                      border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                    }}
                  />
                );
              })}
              {term.taggedModels.length > 2 && (
                <Chip
                  label={`+${term.taggedModels.length - 2}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                    border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                  }}
                />
              )}
            </Box>
          )}
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
            {canEdit && (
              <Tooltip title="Edit Term">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/glossary/${term.id}/edit`);
                  }}
                  sx={{
                    color: currentTheme.textSecondary,
                    '&:hover': {
                      color: currentTheme.primary,
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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


