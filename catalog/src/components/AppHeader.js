import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Home as HomeIcon,
  GitHub as GitHubIcon,
  Info as InfoIcon,
  AutoMode as AutoModeIcon,
  People as PeopleIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import GlobalSearch from './GlobalSearch';

const AppHeader = ({ 
  currentTheme, 
  darkMode, 
  onDrawerToggle, 
  onThemeToggle, 
  onInfoSidebarToggle, 
  isSplashPage 
}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: '100%',
        ml: 0,
        bgcolor: currentTheme.card,
        color: currentTheme.text,
        boxShadow: 'none',
        top: '20px',
        height: '64px',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ 
            mr: 2, 
            display: { sm: 'none' }, 
            color: currentTheme.text,
            '&:hover': {
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
        <Logo currentTheme={currentTheme} />
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Search Button - Only show if authenticated */}
          {isAuthenticated() && !isSplashPage && (
            <Tooltip title="Global Search (Ctrl+K)">
              <IconButton
                onClick={() => setSearchOpen(true)}
                sx={{
                  color: currentTheme.text,
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={isSplashPage ? "Explore" : "Home"}>
            <IconButton
              component="a"
              href={isSplashPage ? "/models" : "/"}
              sx={{
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {isSplashPage ? <AutoModeIcon /> : <HomeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Information">
            <IconButton
              onClick={onInfoSidebarToggle}
              sx={{
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle dark mode">
            <IconButton 
              onClick={onThemeToggle} 
              sx={{ 
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="View on GitHub">
            <IconButton
              component="a"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: currentTheme.text,
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>
          
          {/* User Management - Admin Only */}
          {isAuthenticated() && isAdmin() && (
            <Tooltip title="User Management">
              <IconButton
                onClick={() => navigate('/users')}
                sx={{
                  color: currentTheme.text,
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <PeopleIcon />
              </IconButton>
            </Tooltip>
          )}
          
        </Box>
      </Toolbar>
      
      {/* Global Search Dialog */}
      <GlobalSearch 
        open={searchOpen} 
        onClose={() => setSearchOpen(false)}
        currentTheme={currentTheme}
        darkMode={darkMode}
      />
    </AppBar>
  );
};

export default AppHeader;
