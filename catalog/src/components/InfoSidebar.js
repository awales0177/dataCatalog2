import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Link,
  alpha,
} from '@mui/material';
import {
  Info as InfoIcon,
  Description as DescriptionIcon,
  Help as HelpIcon,
  Code as CodeIcon,
  Book as BookIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

const InfoSidebar = ({ open, onClose, currentTheme }) => {
  const infoLinks = [
    {
      title: 'Documentation',
      description: 'Guides and tutorials',
      icon: <DescriptionIcon />,
      href: 'https://docs.example.com',
    },
    {
      title: 'API Reference',
      description: 'API documentation',
      icon: <CodeIcon />,
      href: 'https://api.example.com',
    },
    {
      title: 'User Guide',
      description: 'Step-by-step guide',
      icon: <BookIcon />,
      href: 'https://guide.example.com',
    },
    {
      title: 'Help Center',
      description: 'Get support',
      icon: <HelpIcon />,
      href: 'https://help.example.com',
    },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          bgcolor: currentTheme.card,
          color: currentTheme.text,
          borderLeft: `1px solid ${currentTheme.border}`,
          boxShadow: currentTheme.darkMode 
            ? '0 0 30px rgba(0, 0, 0, 0.3)' 
            : '0 0 30px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Box sx={{ 
        p: 1.5, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: `1px solid ${currentTheme.border}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '8px',
            bgcolor: alpha(currentTheme.primary, 0.1),
          }}>
            <InfoIcon sx={{ color: currentTheme.primary, fontSize: 16 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 600,
            letterSpacing: '-0.3px',
          }}>
            Information
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: currentTheme.textSecondary,
            '&:hover': {
              bgcolor: alpha(currentTheme.primary, 0.1),
              color: currentTheme.primary,
            },
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
      
      <List sx={{ p: 1.5 }}>
        {infoLinks.map((link, index) => (
          <ListItem
            key={index}
            component={Link}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderRadius: '8px',
              mb: 1,
              py: 1,
              color: currentTheme.text,
              textDecoration: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.08),
                transform: 'translateX(-2px)',
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: currentTheme.primary,
              minWidth: 32,
            }}>
              {React.cloneElement(link.icon, { sx: { fontSize: 18 } })}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography variant="body2" sx={{ 
                  fontWeight: 600,
                  mb: 0.25,
                }}>
                  {link.title}
                </Typography>
              }
              secondary={
                <Typography variant="caption" sx={{ 
                  color: currentTheme.textSecondary,
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                }}>
                  {link.description}
                </Typography>
              }
              sx={{ my: 0 }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default InfoSidebar; 