import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  alpha,
  Chip,
  Button,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  Visibility as EyeIcon,
  Edit as EditIcon,
  Diamond as CrownIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { drawerWidth, collapsedDrawerWidth, DIVIDER_AFTER_ITEM_ID, DIVIDER_BEFORE_ITEM_ID } from '../constants/navigation';
import { useAuth } from '../contexts/AuthContext';

const NavigationDrawer = ({ 
  currentTheme, 
  isDrawerCollapsed, 
  onDrawerCollapse, 
  mobileOpen, 
  onDrawerToggle,
  menuData,
  avatarColor 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentRole } = useAuth();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <CrownIcon />;
      case 'editor': return <EditIcon />;
      case 'reader': return <EyeIcon />;
      default: return <EyeIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'editor': return 'secondary';
      case 'reader': return 'primary';
      default: return 'primary';
    }
  };

  const handleChangeRole = () => {
    navigate('/role', { state: { changeRole: true, from: { pathname: window.location.pathname } } });
  };
  

  const drawer = (
    <>
      <List>
        {(() => {
          // Safety checks
          if (!menuData || !menuData.items) {
            return (
              <ListItem>
                <ListItemText 
                  primary="Loading..." 
                  sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}
                />
              </ListItem>
            );
          }
          
          if (menuData.items.length === 0) {
            return (
              <ListItem>
                <ListItemText 
                  primary="No menu items available" 
                  sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}
                />
              </ListItem>
            );
          }
          
          return menuData.items.map((item, index) => {
            // Add divider after the specified item (start of second section)
            const shouldAddDividerAfter = item.id === DIVIDER_AFTER_ITEM_ID && !isDrawerCollapsed;
            // Add divider before the specified item (before data products)
            const shouldAddDividerBefore = item.id === DIVIDER_BEFORE_ITEM_ID && !isDrawerCollapsed;
            
            // Check if this item should be highlighted
            // For home (/), only match exactly. For other paths, match exact or child paths
            const isSelected = item.path === '/' 
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <React.Fragment key={item.path}>
                {shouldAddDividerBefore && (
                  <Divider 
                    sx={{ 
                      my: 1, 
                      mx: 2, 
                      borderColor: alpha(currentTheme.border, 0.5),
                      opacity: 0.6
                    }} 
                  />
                )}
                {shouldAddDividerAfter && (
                  <Divider 
                    sx={{ 
                      my: 1, 
                      mx: 2, 
                      borderColor: alpha(currentTheme.border, 0.5),
                      opacity: 0.6
                    }} 
                  />
                )}
              <Tooltip
                title={item.name}
                placement="right"
                arrow
                sx={{
                  display: isDrawerCollapsed ? 'block' : 'none'
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    mx: isDrawerCollapsed ? 0.5 : 1,
                  }}
                >
                  <ListItem
                    button
                    component={Link}
                    to={item.path}
                    selected={isSelected}
                    sx={{
                      color: currentTheme.text,
                      py: 1.25,
                      px: isDrawerCollapsed ? 1 : 1.5,
                      justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
                      borderRadius: '8px',
                      '&.Mui-selected': {
                        bgcolor: `${currentTheme.primary}20`,
                        borderRadius: '8px',
                        '&:hover': {
                          bgcolor: `${currentTheme.primary}30`,
                        },
                      },
                      '&:hover': {
                        bgcolor: `${currentTheme.primary}10`,
                        borderRadius: '8px',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: 'inherit', 
                      minWidth: isDrawerCollapsed ? 0 : 36,
                      marginRight: isDrawerCollapsed ? 0 : 1.5,
                      '& svg': {
                        width: item.id === 'home' ? '1.2rem' : '1.35rem',
                        height: item.id === 'home' ? '1.2rem' : '1.35rem'
                      }
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {!isDrawerCollapsed && (
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontSize: '0.875rem',
                                fontWeight: 500,
                              }}
                            >
                              {item.name}
                            </Typography>
                            {item.beta && (
                              <Chip
                                label="BETA"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  bgcolor: alpha(currentTheme.primary, 0.1),
                                  color: currentTheme.primary,
                                  border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                                  '& .MuiChip-label': {
                                    px: 0.75,
                                    py: 0
                                  }
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    )}
                  </ListItem>
                </Box>
              </Tooltip>
            </React.Fragment>
          );
          });
        })()}
      </List>

      {/* Avatar Section */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          borderTop: `1px solid ${currentTheme.border}`,
          bgcolor: currentTheme.card,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: isDrawerCollapsed ? 'center' : 'stretch',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              justifyContent: isDrawerCollapsed ? 'center' : 'space-between',
            }}
          >
            {!isDrawerCollapsed && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: currentTheme.text,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {user?.full_name || user?.username || 'User'}
                  </Typography>
                  <Chip
                    icon={getRoleIcon(currentRole || 'reader')}
                    label={(currentRole || 'reader').charAt(0).toUpperCase() + (currentRole || 'reader').slice(1)}
                    color={getRoleColor(currentRole || 'reader')}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: '20px',
                    }}
                  />
                </Box>
              </Box>
            )}
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: avatarColor,
                fontSize: '0.875rem',
              }}
            >
              {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
            </Avatar>
          </Box>
          
          {!isDrawerCollapsed && user && (
            <Button
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={handleChangeRole}
              sx={{
                alignSelf: 'flex-start',
                fontSize: '0.75rem',
                minWidth: 'auto',
                px: 1,
                py: 0.5,
                color: currentTheme.textSecondary,
                '&:hover': {
                  bgcolor: currentTheme.background,
                  color: currentTheme.text,
                },
              }}
            >
              Change Role
            </Button>
          )}
          
          {isDrawerCollapsed && user && (
            <Tooltip title={`Current Role: ${(currentRole || 'reader').charAt(0).toUpperCase() + (currentRole || 'reader').slice(1)} - Click to change`} placement="right">
              <IconButton
                onClick={handleChangeRole}
                size="small"
                sx={{
                  color: currentTheme.textSecondary,
                  '&:hover': {
                    bgcolor: currentTheme.background,
                    color: currentTheme.text,
                  },
                }}
              >
                {getRoleIcon(currentRole || 'reader')}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ 
        width: { sm: isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth }, 
        flexShrink: { sm: 0 },
        position: 'fixed',
        top: '84px',
        left: 0,
        height: 'calc(100vh - 84px)',
        zIndex: (theme) => theme.zIndex.drawer,
        transition: 'width 0.2s ease-in-out',
      }}
    >
      {/* Floating collapse button */}
      <Box
        sx={{
          position: 'absolute',
          right: '-14px',
          top: '20px',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <IconButton 
          onClick={onDrawerCollapse}
          sx={{ 
            color: currentTheme.text,
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
            width: '28px',
            height: '28px',
            '&:hover': {
              bgcolor: `${currentTheme.primary}10`,
            },
            '& .MuiSvgIcon-root': {
              fontSize: '32px',
            },
          }}
        >
          {isDrawerCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </IconButton>
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            borderRadius: 0,
            boxShadow: 'none',
            borderRight: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth,
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            height: 'calc(100vh - 84px)',
            top: '84px',
            transition: 'width 0.2s ease-in-out',
            borderRadius: 0,
            boxShadow: 'none',
            borderRight: 'none',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default NavigationDrawer;
