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
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { drawerWidth, collapsedDrawerWidth } from '../constants/navigation';

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
  
  // Monitor menu data changes for debugging
  React.useEffect(() => {
    console.log('NavigationDrawer: menuData changed', { 
      menuData, 
      hasItems: menuData?.items?.length > 0,
      itemCount: menuData?.items?.length || 0
    });
  }, [menuData]);

  const drawer = (
    <>
      <List>
        {(() => {
          // Debug logging and safety checks
          if (!menuData || !menuData.items) {
            console.warn('NavigationDrawer: menuData or menuData.items is missing', { menuData });
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
            console.warn('NavigationDrawer: menuData.items is empty', { menuData });
            return (
              <ListItem>
                <ListItemText 
                  primary="No menu items available" 
                  sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}
                />
              </ListItem>
            );
          }
          
          console.log('NavigationDrawer: Rendering menu items', { 
            itemCount: menuData.items.length, 
            items: menuData.items 
          });
          
          return menuData.items.map((item, index) => {
            // Add divider before Product Agreements (start of second section)
            const shouldAddDivider = item.id === 'agreements' && !isDrawerCollapsed;
            
            return (
              <React.Fragment key={item.path}>
                {shouldAddDivider && (
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
                <ListItem
                  button
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    color: currentTheme.text,
                    py: 1.25,
                    px: isDrawerCollapsed ? 1 : 1.5,
                    justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
                    '&.Mui-selected': {
                      bgcolor: `${currentTheme.primary}20`,
                      '&:hover': {
                        bgcolor: `${currentTheme.primary}30`,
                      },
                    },
                    '&:hover': {
                      bgcolor: `${currentTheme.primary}10`,
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
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.875rem',
                              fontWeight: 500,
                            }}
                          >
                            {item.name}
                          </Typography>
                          {item.count !== undefined && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: currentTheme.textSecondary,
                                ml: 1,
                                minWidth: '24px',
                                textAlign: 'right',
                                fontSize: '0.75rem',
                                bgcolor: `${currentTheme.primary}15`,
                                px: 1,
                                py: 0.25,
                                borderRadius: '12px',
                              }}
                            >
                              {item.count}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  )}
                </ListItem>
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
            alignItems: 'center',
            gap: 2,
            justifyContent: isDrawerCollapsed ? 'center' : 'space-between',
          }}
        >
          {!isDrawerCollapsed && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: currentTheme.text,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {process.env.REACT_APP_USERNAME || 'User'}
              </Typography>
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
            {(process.env.REACT_APP_USERNAME || 'U').charAt(0).toUpperCase()}
          </Avatar>
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
            borderRight: `1px solid ${currentTheme.border}`,
            borderTopRightRadius: '16px',
            borderBottomRightRadius: '16px',
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
            borderRight: `1px solid ${currentTheme.border}`,
            height: 'calc(100vh - 84px)',
            top: '84px',
            transition: 'width 0.2s ease-in-out',
            borderTopRightRadius: '16px',
            borderBottomRightRadius: '16px',
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
