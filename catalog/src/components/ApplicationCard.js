import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  Factory as FactoryIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { formatDate } from '../utils/themeUtils';

const ApplicationCard = ({ application, currentTheme, onEdit }) => {
  // Handle link out functionality
  const handleLinkOut = (e) => {
    e.stopPropagation(); // Prevent card click
    if (application.url || application.link || application.website) {
      const url = application.url || application.link || application.website;
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle email functionality
  const handleEmail = (e) => {
    e.stopPropagation(); // Prevent card click
    if (application.email || application.contactEmail || application.contact) {
      const email = application.email || application.contactEmail || application.contact;
      window.open(`mailto:${email}`, '_blank');
    }
  };

  // Check if application has a link
  const hasLink = !!(application.url || application.link || application.website);
  
  // Check if application has an email
  const hasEmail = !!(application.email || application.contactEmail || application.contact);

  // Role icon mapping
  const getRoleIcon = (role) => {
    const roleIcons = {
      'data_producer': FactoryIcon,
      'data_consumer': ShoppingBasketIcon,
      'application': CodeIcon,
      'data_governance': SecurityIcon,
      'data_manager': SettingsIcon,
    };
    return roleIcons[role] || null;
  };

  const getRoleTooltip = (role) => {
    const roleTooltips = {
      'data_producer': 'Data Producer',
      'data_consumer': 'Data Consumer',
      'application': 'Application',
      'data_governance': 'Data Governance',
      'data_manager': 'Data Manager',
    };
    return roleTooltips[role] || role;
  };
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        bgcolor: currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        cursor: 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: '#37ABBF',
        },
        position: 'relative',
      }}
    >

      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: currentTheme.text,
              flex: 1,
              minWidth: 0,
              wordBreak: 'break-word',
              lineHeight: 1.2
            }}
          >
            {application.name}
          </Typography>
          
          {/* Role icons in top right */}
          {application.roles && application.roles.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
              {application.roles.slice(0, 3).map((role, index) => {
                const IconComponent = getRoleIcon(role);
                if (!IconComponent) return null;
                
                return (
                  <Tooltip key={index} title={getRoleTooltip(role)} arrow>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: alpha(currentTheme.primary, 0.1),
                        color: currentTheme.primary,
                      }}
                    >
                      <IconComponent sx={{ fontSize: 14 }} />
                    </Box>
                  </Tooltip>
                );
              })}
              {application.roles.length > 3 && (
                <Tooltip title={`+${application.roles.length - 3} more roles`} arrow>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: alpha(currentTheme.textSecondary, 0.1),
                      color: currentTheme.textSecondary,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    +{application.roles.length - 3}
                  </Box>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>

        <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
          {application.description}
        </Typography>

        {/* Domain chips */}
        {application.domains && application.domains.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {application.domains.map((domain) => (
              <Chip
                key={domain}
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
        )}


        {/* Spacer to push action buttons to bottom */}
        <Box sx={{ flex: 1 }} />

        {/* Action buttons in bottom right */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 1,
          mt: 2
        }}>
          {hasEmail && (
            <Tooltip title="Send Email">
              <IconButton
                size="small"
                onClick={handleEmail}
                sx={{ 
                  bgcolor: alpha(currentTheme.warning || '#f39c12', 0.1),
                  color: currentTheme.warning || '#f39c12',
                  '&:hover': {
                    bgcolor: currentTheme.warning || '#f39c12',
                    color: 'white',
                  },
                }}
              >
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {hasLink && (
            <Tooltip title="Open Application">
              <IconButton
                size="small"
                onClick={handleLinkOut}
                sx={{ 
                  bgcolor: alpha(currentTheme.success || '#2ecc71', 0.1),
                  color: currentTheme.success || '#2ecc71',
                  '&:hover': {
                    bgcolor: currentTheme.success || '#2ecc71',
                    color: 'white',
                  },
                }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Edit Application">
              <IconButton
                size="small"
                onClick={() => onEdit(application.id)}
                sx={{ 
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                  '&:hover': {
                    bgcolor: currentTheme.primary,
                    color: 'white',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard; 