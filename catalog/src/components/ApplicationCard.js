import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
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
  Email as EmailIcon,
  Factory as FactoryIcon,
  ShoppingBasket as ShoppingBasketIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
const ApplicationCard = ({ application, onEdit }) => {
  const { currentTheme } = useContext(ThemeContext);
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
  
  const imageSrc = application.image || application.imageUrl || application.logo;
  const dark = Boolean(currentTheme?.darkMode);
  const primary = currentTheme.primary;

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        border: `1px solid ${currentTheme.border}`,
        bgcolor: currentTheme.card,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flex: 1,
          p: 2.5,
          '&:last-child': { pb: 2.5 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            mb: 2,
          }}
        >
          {imageSrc ? (
            <Box
              component="img"
              src={imageSrc}
              alt=""
              sx={{
                width: 56,
                height: 56,
                objectFit: 'cover',
                borderRadius: '50%',
                flexShrink: 0,
                border: `2px solid ${alpha(primary, dark ? 0.35 : 0.28)}`,
                boxShadow: `0 4px 14px ${alpha(primary, dark ? 0.2 : 0.12)}`,
                bgcolor: alpha(currentTheme.text, 0.04),
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(primary, dark ? 0.14 : 0.1),
                border: `1px dashed ${alpha(primary, 0.4)}`,
                color: alpha(primary, 0.85),
              }}
              aria-hidden
            >
              <GroupsIcon sx={{ fontSize: 28 }} />
            </Box>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: currentTheme.textSecondary,
                letterSpacing: '0.06em',
                fontWeight: 700,
                fontSize: '0.65rem',
                lineHeight: 1.2,
                mb: 0.25,
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Data team
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: currentTheme.text,
                wordBreak: 'break-word',
                lineHeight: 1.25,
                mb: 0.75,
              }}
            >
              {application.name}
            </Typography>
            {application.roles && application.roles.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
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
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          bgcolor: alpha(primary, dark ? 0.18 : 0.12),
                          color: primary,
                          border: `1px solid ${alpha(primary, 0.22)}`,
                        }}
                      >
                        <IconComponent sx={{ fontSize: 15 }} />
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
                        minWidth: 28,
                        height: 28,
                        px: 0.5,
                        borderRadius: 1,
                        bgcolor: alpha(currentTheme.textSecondary, 0.08),
                        color: currentTheme.textSecondary,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        border: `1px solid ${alpha(currentTheme.border, 0.8)}`,
                      }}
                    >
                      +{application.roles.length - 3}
                    </Box>
                  </Tooltip>
                )}
              </Box>
            ) : null}
          </Box>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: currentTheme.textSecondary,
            mb: 2,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {application.description}
        </Typography>

        {application.domains && application.domains.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            {application.domains.map((domain) => (
              <Chip
                key={domain}
                label={domain}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: alpha(primary, 0.35),
                  color: currentTheme.text,
                  bgcolor: alpha(primary, dark ? 0.06 : 0.04),
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ flex: 1, minHeight: 8 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 0.75,
            pt: 2,
            mt: 'auto',
          }}
        >
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
                onClick={() => onEdit(application.uuid || application.id)}
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