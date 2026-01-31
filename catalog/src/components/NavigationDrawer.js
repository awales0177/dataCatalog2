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
import { drawerWidth, collapsedDrawerWidth } from '../constants/navigation';
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
  const { user, currentRole, isAdmin, canEdit } = useAuth();

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
          
          const filteredItems = menuData.items.filter(item => {
            // Filter admin-only items
            if (item.adminOnly && !isAdmin()) return false;
            // Filter editor-only items (editors and admins can see)
            if (item.editorOnly && !canEdit() && !isAdmin()) return false;
            return true;
          });

          // Find Pipelines and Data Products items
          const pipelinesItem = filteredItems.find(item => item.id === 'pipelines');
          const productsItem = filteredItems.find(item => item.id === 'data-products');
          const hasPipelinesAndProducts = pipelinesItem && productsItem;

          // Helper function to render a menu item
          const renderMenuItem = (item, isCompact = false) => {
            // Check if this item should be highlighted
            const isSelected = item.path === '/' 
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            
            return (
              <Tooltip
                key={item.path}
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
                    mx: isDrawerCollapsed ? 0.5 : isCompact ? 0.5 : 1,
                    flex: isCompact && !isDrawerCollapsed ? 1 : 'none',
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
                      px: isDrawerCollapsed ? 1 : isCompact ? 1 : 1.5,
                      justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
                      borderRadius: '8px',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(55, 171, 191, 0.2)',
                        borderRadius: '8px',
                        color: '#37ABBF',
                        '&:hover': {
                          bgcolor: 'rgba(55, 171, 191, 0.3)',
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
                      minWidth: isDrawerCollapsed ? 0 : isCompact ? 28 : 36,
                      marginRight: isDrawerCollapsed ? 0 : isCompact ? 0.75 : 1.5,
                      '& svg': {
                        width: item.id === 'home' ? '1.2rem' : isCompact ? '1.2rem' : '1.35rem',
                        height: item.id === 'home' ? '1.2rem' : isCompact ? '1.2rem' : '1.35rem'
                      }
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {!isDrawerCollapsed && (
                      <ListItemText 
                        primary={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: isCompact ? '0.8rem' : '0.875rem',
                              fontWeight: 500,
                            }}
                          >
                            {item.name}
                          </Typography>
                        }
                      />
                    )}
                  </ListItem>
                </Box>
              </Tooltip>
            );
          };

          // Build the menu items array
          const menuItems = [];
          filteredItems.forEach((item, index) => {
            // Handle Pipelines and Data Products together on the same line
            if (hasPipelinesAndProducts && item.id === 'pipelines') {
              // Insert divider before Pipelines/Products combo
              menuItems.push(
                <React.Fragment key="pipelines-products-group">
                  <Divider 
                    sx={{ 
                      my: 1, 
                      mx: isDrawerCollapsed ? 1 : 2, 
                      borderColor: alpha(currentTheme.border, 0.5),
                      opacity: 0.6
                    }} 
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isDrawerCollapsed ? 'column' : 'row',
                      gap: 0.5,
                      mx: isDrawerCollapsed ? 0.5 : 1,
                      alignItems: 'stretch',
                    }}
                  >
                    {renderMenuItem(pipelinesItem, true)}
                    {!isDrawerCollapsed && (
                      <Divider 
                        orientation="vertical" 
                        flexItem
                        sx={{ 
                          borderColor: alpha(currentTheme.border, 0.3),
                          opacity: 0.4,
                          my: 0.5,
                        }} 
                      />
                    )}
                    {isDrawerCollapsed && (
                      <Divider 
                        orientation="horizontal" 
                        flexItem
                        sx={{ 
                          borderColor: alpha(currentTheme.border, 0.3),
                          opacity: 0.4,
                          mx: 0.5,
                        }} 
                      />
                    )}
                    {renderMenuItem(productsItem, true)}
                  </Box>
                  <Divider 
                    sx={{ 
                      my: 1, 
                      mx: isDrawerCollapsed ? 1 : 2, 
                      borderColor: alpha(currentTheme.border, 0.5),
                      opacity: 0.6
                    }} 
                  />
                </React.Fragment>
              );
              return; // Skip rendering pipelines individually
            }
            
            // Skip data-products - it's rendered with pipelines above
            if (hasPipelinesAndProducts && item.id === 'data-products') {
              return;
            }
            
            menuItems.push(
              <React.Fragment key={item.path}>
                {renderMenuItem(item)}
              </React.Fragment>
            );
          });

          return menuItems;
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
