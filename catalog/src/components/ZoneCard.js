import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  Chip,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import DomainCard from './DomainCard';
import DomainModal from './DomainModal';

const ZoneCard = ({ zone, currentTheme }) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState(null);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        mb: 3,
        bgcolor: currentTheme.darkMode ? '#1E1E1E' : currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Zone Header */}
      <Box
        onClick={handleToggle}
        sx={{
          p: 2,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: currentTheme.darkMode 
            ? alpha(currentTheme.primary, 0.1) 
            : alpha(currentTheme.primary, 0.05),
          borderBottom: expanded ? `1px solid ${currentTheme.border}` : 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: currentTheme.darkMode 
              ? alpha(currentTheme.primary, 0.15) 
              : alpha(currentTheme.primary, 0.08),
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {expanded ? (
            <FolderOpenIcon sx={{ color: currentTheme.primary, fontSize: 28 }} />
          ) : (
            <FolderIcon sx={{ color: currentTheme.primary, fontSize: 28 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: currentTheme.text, 
                fontWeight: 600,
                mb: 0.5
              }}
            >
              {zone.name}
            </Typography>
            {zone.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: currentTheme.textSecondary,
                  fontSize: '0.875rem'
                }}
              >
                {zone.description}
              </Typography>
            )}
          </Box>
          <Chip
            label={`${zone.domains?.length || 0} domains`}
            size="small"
            sx={{
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
              fontWeight: 500,
              mr: 1,
            }}
          />
        </Box>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          sx={{
            color: currentTheme.text,
            '&:hover': {
              bgcolor: alpha(currentTheme.primary, 0.1),
            },
          }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Domains List */}
      <Collapse in={expanded}>
        <Box
          sx={{
            p: 2,
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(5, 1fr)'
            },
            gap: { xs: 0.75, sm: 1, md: 1.25 },
          }}
        >
          {zone.domains && zone.domains.length > 0 ? (
            zone.domains.map((domain) => (
              <DomainCard
                key={domain.id || domain.name}
                domain={domain}
                onClick={() => handleDomainClick(domain)}
                currentTheme={currentTheme}
              />
            ))
          ) : (
            <Box
              sx={{
                gridColumn: '1 / -1',
                p: 2,
                textAlign: 'center',
                color: currentTheme.textSecondary,
              }}
            >
              <Typography variant="body2">
                No domains in this zone
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>

      <DomainModal
        open={Boolean(selectedDomain)}
        onClose={() => setSelectedDomain(null)}
        domain={selectedDomain}
        currentTheme={currentTheme}
      />
    </Paper>
  );
};

export default ZoneCard;

