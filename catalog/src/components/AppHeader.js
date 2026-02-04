import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  alpha,
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
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
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
  const [modalOpen, setModalOpen] = useState({ nessie: false, dremio: false, opensearch: false });

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
          
          {/* Nessie and Dremio Logos */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, pl: 1, borderLeft: `1px solid ${currentTheme.border}` }}>
            <Tooltip title="Nessie - Click to learn more">
              <Box
                component="img"
                src="/nessie.svg"
                alt="Nessie"
                onClick={() => setModalOpen({ ...modalOpen, nessie: true })}
                sx={{
                  height: '32px',
                  width: 'auto',
                  cursor: 'pointer',
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              />
            </Tooltip>
            <Tooltip title="Dremio - Click to learn more">
              <Box
                component="img"
                src="/dremio.png"
                alt="Dremio"
                onClick={() => setModalOpen({ ...modalOpen, dremio: true })}
                sx={{
                  height: '28px',
                  width: 'auto',
                  cursor: 'pointer',
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              />
            </Tooltip>
            <Tooltip title="OpenSearch - Click to learn more">
              <Box
                component="img"
                src="/Opensearch-1.png"
                alt="OpenSearch"
                onClick={() => setModalOpen({ ...modalOpen, opensearch: true })}
                sx={{
                  height: '28px',
                  width: 'auto',
                  cursor: 'pointer',
                  opacity: 0.8,
                  transition: 'opacity 0.2s',
                  ml: -0.75,
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              />
            </Tooltip>
          </Box>
          
        </Box>
      </Toolbar>
      
      {/* Global Search Dialog */}
      <GlobalSearch 
        open={searchOpen} 
        onClose={() => setSearchOpen(false)}
        currentTheme={currentTheme}
        darkMode={darkMode}
      />

      {/* Nessie Modal */}
      <Dialog
        open={modalOpen.nessie}
        onClose={() => setModalOpen({ ...modalOpen, nessie: false })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            position: 'relative',
          },
        }}
      >
        <IconButton
          onClick={() => setModalOpen({ ...modalOpen, nessie: false })}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: currentTheme.textSecondary,
            zIndex: 1,
            '&:hover': {
              color: currentTheme.text,
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
          <Box
            component="img"
            src="/nessie.svg"
            alt="Nessie"
            sx={{ height: '32px', width: 'auto' }}
          />
          <Typography variant="h6" sx={{ color: currentTheme.text }}>
            Nessie
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
            Nessie is being used as a Git-like data versioning system for our data catalog. It enables:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: currentTheme.textSecondary }}>
            <li>Version control for data tables and schemas</li>
            <li>Branching and merging of data changes</li>
            <li>Time travel queries to access historical data states</li>
            <li>Collaborative data development workflows</li>
            <li>Data lineage tracking across versions</li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              window.open('https://projectnessie.org/', '_blank', 'noopener,noreferrer');
            }}
            variant="contained"
            startIcon={<OpenInNewIcon />}
            sx={{
              bgcolor: currentTheme.primary,
              color: '#fff',
              px: 3,
              py: 1,
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: `0 2px 8px ${alpha(currentTheme.primary, 0.3)}`,
              '&:hover': {
                bgcolor: currentTheme.primary,
                opacity: 0.9,
                boxShadow: `0 4px 12px ${alpha(currentTheme.primary, 0.4)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Explore Nessie
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dremio Modal */}
      <Dialog
        open={modalOpen.dremio}
        onClose={() => setModalOpen({ ...modalOpen, dremio: false })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            position: 'relative',
          },
        }}
      >
        <IconButton
          onClick={() => setModalOpen({ ...modalOpen, dremio: false })}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: currentTheme.textSecondary,
            zIndex: 1,
            '&:hover': {
              color: currentTheme.text,
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
          <Box
            component="img"
            src="/dremio.png"
            alt="Dremio"
            sx={{ height: '28px', width: 'auto' }}
          />
          <Typography variant="h6" sx={{ color: currentTheme.text }}>
            Dremio
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
            Dremio is being used as our data lakehouse engine and query acceleration layer. It provides:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: currentTheme.textSecondary }}>
            <li>SQL query engine for data lake analytics</li>
            <li>Data reflection acceleration for faster queries</li>
            <li>Integration with Nessie for versioned data access</li>
            <li>Self-service data exploration and analytics</li>
            <li>Connection to various data sources and formats</li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              window.open('https://www.dremio.com/', '_blank', 'noopener,noreferrer');
            }}
            variant="contained"
            startIcon={<OpenInNewIcon />}
            sx={{
              bgcolor: currentTheme.primary,
              color: '#fff',
              px: 3,
              py: 1,
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: `0 2px 8px ${alpha(currentTheme.primary, 0.3)}`,
              '&:hover': {
                bgcolor: currentTheme.primary,
                opacity: 0.9,
                boxShadow: `0 4px 12px ${alpha(currentTheme.primary, 0.4)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Explore Dremio
          </Button>
        </DialogActions>
      </Dialog>

      {/* OpenSearch Modal */}
      <Dialog
        open={modalOpen.opensearch}
        onClose={() => setModalOpen({ ...modalOpen, opensearch: false })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            position: 'relative',
          },
        }}
      >
        <IconButton
          onClick={() => setModalOpen({ ...modalOpen, opensearch: false })}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: currentTheme.textSecondary,
            zIndex: 1,
            '&:hover': {
              color: currentTheme.text,
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 6 }}>
          <Box
            component="img"
            src="/Opensearch-1.png"
            alt="OpenSearch"
            sx={{ height: '28px', width: 'auto' }}
          />
          <Typography variant="h6" sx={{ color: currentTheme.text }}>
            OpenSearch
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
            OpenSearch is being used as the search and analytics engine for our data catalog. It enables:
          </Typography>
          <Box component="ul" sx={{ pl: 3, color: currentTheme.textSecondary }}>
            <li>Full-text search across datasets, data products, and metadata</li>
            <li>Fast and scalable search capabilities</li>
            <li>Advanced filtering and faceted search</li>
            <li>Real-time indexing of catalog metadata</li>
            <li>Search suggestions and autocomplete functionality</li>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              window.open('https://opensearch.org/', '_blank', 'noopener,noreferrer');
            }}
            variant="contained"
            startIcon={<OpenInNewIcon />}
            sx={{
              bgcolor: currentTheme.primary,
              color: '#fff',
              px: 3,
              py: 1,
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: `0 2px 8px ${alpha(currentTheme.primary, 0.3)}`,
              '&:hover': {
                bgcolor: currentTheme.primary,
                opacity: 0.9,
                boxShadow: `0 4px 12px ${alpha(currentTheme.primary, 0.4)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Explore OpenSearch
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default AppHeader;
