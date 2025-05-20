import React, { useState, createContext, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Button,
  alpha,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Paper,
  ThemeProvider,
  createTheme,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  FilterList as FilterIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Domain as DomainIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Apps as AppsIcon,
  MenuBook as MenuBookIcon,
  Home as HomeIcon,
  Add as AddIcon,
  LibraryBooks as LibraryBooksIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  GitHub as GitHubIcon,
  AccountTree as AccountTreeIcon,
  Info as InfoIcon,
  AutoMode as AutoModeIcon,
} from '@mui/icons-material';
import lotusRed from './imgs/lotus-red.svg';
import lotusWhite from './imgs/lotus-white.svg';

// Import components
import DataSpecificationsPage from './pages/DataModelsPage';
import ProductAgreementsPage from './pages/ProductAgreementsPage';
import DataDomainsPage from './pages/DataDomainsPage';
import SplashPage from './pages/SplashPage';
import ApplicationsPage from './pages/ApplicationsPage';
import LexiconPage from './pages/LexiconPage';
import ReferenceDataPage from './pages/ReferenceDataPage';
import DataSpecificationDetailPage from './pages/DataModelDetailPage';
import ProductAgreementDetailPage from './pages/ProductAgreementDetailPage';
import InfoSidebar from './components/InfoSidebar';

// Import data and utilities
import { fetchTheme, fetchItemCount, fetchModels, fetchAgreements } from './services/api';
import { menuItems } from './data/menuItems';

// Theme context for managing dark/light mode
export const ThemeContext = createContext();

const drawerWidth = 320;
const collapsedDrawerWidth = 56;

// Create theme with Inter font
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
});

// Logo component
const Logo = ({ currentTheme }) => (
  <Box 
    component={Link} 
    to="/"
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      textDecoration: 'none',
      '&:hover': {
        opacity: 0.8,
      },
    }}
  >
    <Box
      component="img"
      src={currentTheme.darkMode ? lotusWhite : lotusRed}
      alt="Lotus"
      sx={{
        height: '40px',
        width: 'auto',
      }}
    />
    <Typography 
      variant="h6" 
      sx={{ 
        color: currentTheme.primary, 
        fontWeight: 600,
        letterSpacing: '-0.5px',
      }}
    >
      Data Catalog
    </Typography>
  </Box>
);

// Filter components for each page
const ModelFilters = ({ filters, setFilters, currentTheme }) => {
  const [expanded, setExpanded] = useState({
    quality: false,
    tags: false,
    owner: false,
  });

  const handleExpandChange = (panel) => (event, isExpanded) => {
    setExpanded({ ...expanded, [panel]: isExpanded });
  };

  const [allTags, setAllTags] = useState([]);
  const [allOwners, setAllOwners] = useState([]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const data = await fetchModels();
        const tags = [...new Set(data.models.flatMap(model => model.tags))];
        const owners = [...new Set(data.models.map(model => model.owner))];
        setAllTags(tags);
        setAllOwners(owners);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };
    loadFilterData();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Accordion
        expanded={expanded.quality}
        onChange={handleExpandChange('quality')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Quality Score
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Slider
            value={filters.quality}
            onChange={(e, v) => setFilters(prev => ({ ...prev, quality: v }))}
            valueLabelDisplay="auto"
            min={0}
            max={100}
            sx={{
              color: currentTheme.primary,
              '& .MuiSlider-thumb': {
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0 0 0 8px ${currentTheme.primary}20`,
                },
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              {filters.quality[0]}%
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              {filters.quality[1]}%
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded.tags}
        onChange={handleExpandChange('tags')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Tags
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {allTags.map(tag => (
              <FormControlLabel
                key={tag}
                control={
                  <Checkbox
                    checked={filters.tags.includes(tag)}
                    onChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter(t => t !== tag)
                          : [...prev.tags, tag]
                      }));
                    }}
                    sx={{
                      color: currentTheme.primary,
                      '&.Mui-checked': {
                        color: currentTheme.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {tag}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded.owner}
        onChange={handleExpandChange('owner')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Owner
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {allOwners.map(owner => (
              <FormControlLabel
                key={owner}
                control={
                  <Checkbox
                    checked={filters.owner.includes(owner)}
                    onChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        owner: prev.owner.includes(owner)
                          ? prev.owner.filter(o => o !== owner)
                          : [...prev.owner, owner]
                      }));
                    }}
                    sx={{
                      color: currentTheme.primary,
                      '&.Mui-checked': {
                        color: currentTheme.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {owner}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const ContractFilters = ({ filters, setFilters, currentTheme }) => {
  const [expanded, setExpanded] = useState({
    status: false,
    tags: false,
    owner: false,
    producer: false,
    consumer: false,
  });

  const handleExpandChange = (panel) => (event, isExpanded) => {
    setExpanded({ ...expanded, [panel]: isExpanded });
  };

  const [allTags, setAllTags] = useState([]);
  const [allOwners, setAllOwners] = useState([]);
  const [allProducers, setAllProducers] = useState([]);
  const [allConsumers, setAllConsumers] = useState([]);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const data = await fetchAgreements();
        const tags = [...new Set(data.agreements.flatMap(agreement => agreement.tags))];
        const owners = [...new Set(data.agreements.map(agreement => agreement.owner))];
        const producers = [...new Set(data.agreements.map(agreement => agreement.producer))];
        const consumers = [...new Set(data.agreements.map(agreement => agreement.consumer))];
        setAllTags(tags);
        setAllOwners(owners);
        setAllProducers(producers);
        setAllConsumers(consumers);
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };
    loadFilterData();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Accordion
        expanded={expanded.status}
        onChange={handleExpandChange('status')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Status
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, color: currentTheme.text }}>
              Status Range
            </Typography>
            <Slider
              value={filters.status}
              onChange={(e, v) => setFilters(prev => ({
                ...prev,
                status: v
              }))}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              sx={{
                color: currentTheme.primary,
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0 0 0 8px ${currentTheme.primary}20`,
                  },
                },
              }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded.tags}
        onChange={handleExpandChange('tags')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Tags
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {allTags.map(tag => (
              <FormControlLabel
                key={tag}
                control={
                  <Checkbox
                    checked={filters.tags.includes(tag)}
                    onChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter(t => t !== tag)
                          : [...prev.tags, tag]
                      }));
                    }}
                    sx={{
                      color: currentTheme.primary,
                      '&.Mui-checked': {
                        color: currentTheme.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {tag}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded.owner}
        onChange={handleExpandChange('owner')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Owner
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {allOwners.map(owner => (
              <FormControlLabel
                key={owner}
                control={
                  <Checkbox
                    checked={filters.owner.includes(owner)}
                    onChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        owner: prev.owner.includes(owner)
                          ? prev.owner.filter(o => o !== owner)
                          : [...prev.owner, owner]
                      }));
                    }}
                    sx={{
                      color: currentTheme.primary,
                      '&.Mui-checked': {
                        color: currentTheme.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {owner}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded.producer}
        onChange={handleExpandChange('producer')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
          mb: 2,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Producer
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {allProducers.map(producer => (
              <FormControlLabel
                key={producer}
                control={
                  <Checkbox
                    checked={filters.producer.includes(producer)}
                    onChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        producer: prev.producer.includes(producer)
                          ? prev.producer.filter(p => p !== producer)
                          : [...prev.producer, producer]
                      }));
                    }}
                    sx={{
                      color: currentTheme.primary,
                      '&.Mui-checked': {
                        color: currentTheme.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {producer}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded.consumer}
        onChange={handleExpandChange('consumer')}
        sx={{
          bgcolor: 'transparent',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          border: `1px solid ${currentTheme.border}`,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: currentTheme.textSecondary }} />}
          sx={{ 
            minHeight: '48px',
            '& .MuiAccordionSummary-content': { my: 0 },
          }}
        >
          <Typography variant="subtitle2" sx={{ color: currentTheme.text }}>
            Consumer
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            {allConsumers.map(consumer => (
              <FormControlLabel
                key={consumer}
                control={
                  <Checkbox
                    checked={filters.consumer.includes(consumer)}
                    onChange={() => {
                      setFilters(prev => ({
                        ...prev,
                        consumer: prev.consumer.includes(consumer)
                          ? prev.consumer.filter(c => c !== consumer)
                          : [...prev.consumer, consumer]
                      }));
                    }}
                    sx={{
                      color: currentTheme.primary,
                      '&.Mui-checked': {
                        color: currentTheme.primary,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {consumer}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

function AppContent() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [infoSidebarOpen, setInfoSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [themeData, setThemeData] = useState(null);
  const [menuData, setMenuData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [dataModels, setDataModels] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const theme = await fetchTheme();
        setThemeData(theme);
        setMenuData(menuItems); // Use local menuItems directly
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial data');
        // Set default values if API is down
        setThemeData({ light: { background: '#f5f5f5', text: '#000000', primary: '#1976d2', card: '#ffffff', border: '#e0e0e0', textSecondary: '#757575' }, dark: { background: '#121212', text: '#ffffff', primary: '#90caf9', card: '#1e1e1e', border: '#333333', textSecondary: '#b0b0b0' } });
        setMenuData(menuItems); // Use local menuItems even if API fails
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update the menu item count fetching
  useEffect(() => {
    const loadMenuCounts = async () => {
      if (!menuData.items || menuData.items.length === 0 || countsLoaded) return;
      try {
        const itemsWithCounts = await Promise.all(
          menuData.items.map(async (item) => {
            try {
              // Use 'dataContracts' for the agreements menu item
              const endpoint = item.id === 'agreements' ? 'dataContracts' : item.path.slice(1);
              const count = await fetchItemCount(endpoint);
              return { ...item, count };
            } catch (error) {
              console.error(`Error fetching count for ${item.name}:`, error);
              return item;
            }
          })
        );
        setMenuData(prev => ({ ...prev, items: itemsWithCounts }));
        setCountsLoaded(true);
        setError(null);
      } catch (err) {
        setError('Failed to load menu counts');
        console.error('Error loading menu counts:', err);
      }
    };
    loadMenuCounts();
  }, [menuData.items, countsLoaded]);

  useEffect(() => {
    fetchDataModels();
  }, []);

  const fetchDataModels = async () => {
    try {
      const response = await fetch('/api/data/models');
      if (!response.ok) {
        throw new Error('Failed to fetch data models');
      }
      const data = await response.json();
      setDataModels(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Add effect to handle sidebar collapse on 2-level navigation
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    console.log('Current path segments:', pathSegments);
    
    // Collapse if we're exactly 2 levels deep (e.g., /models/PROD)
    if (pathSegments.length === 2) {
      console.log('Collapsing sidebar - 2-level navigation detected');
      setIsDrawerCollapsed(true);
    } else {
      console.log('Expanding sidebar - top level navigation');
      setIsDrawerCollapsed(false);
    }
  }, [location.pathname]);

  if (loading || !themeData || !menuData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: themeData?.light?.background || '#f5f5f5'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentTheme = {
    ...(darkMode ? themeData.dark : themeData.light),
    darkMode
  };

  // Event handlers
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const handleDrawerCollapse = () => {
    setIsDrawerCollapsed(!isDrawerCollapsed);
  };

  const handleInfoSidebarToggle = () => {
    setInfoSidebarOpen(!infoSidebarOpen);
  };

  // Check if we're on the splash page
  const isSplashPage = location.pathname === '/';

  const drawer = (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        p: 1,
        borderBottom: `1px solid ${currentTheme.border}`,
      }}>
        <IconButton 
          onClick={handleDrawerCollapse}
          sx={{ 
            color: currentTheme.text,
            '&:hover': {
              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {isDrawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <List>
        {menuData.items.map((item) => (
          <ListItem
            button
            key={item.id}
            component={Link}
            to={item.path}
            sx={{
              color: currentTheme.text,
              py: 1.5,
              px: isDrawerCollapsed ? 1 : 2,
              justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon sx={{ 
              color: currentTheme.text,
              minWidth: isDrawerCollapsed ? 0 : 40,
              marginRight: isDrawerCollapsed ? 0 : 2,
            }}>
              {React.createElement(item.icon)}
            </ListItemIcon>
            {!isDrawerCollapsed && (
              <>
                <ListItemText primary={item.name} />
                {item.count && (
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                    {item.count}
                  </Typography>
                )}
              </>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeContext.Provider value={{ currentTheme, darkMode, setDarkMode }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        bgcolor: currentTheme.background,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto'
      }}>
        <Box 
          sx={{ 
            bgcolor: '#FF9800',
            color: 'white',
            py: 0.25,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.8rem',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar + 1
          }}
        >
          New Website
        </Box>

        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            ml: 0,
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            boxShadow: 'none',
            borderBottom: `1px solid ${currentTheme.border}`,
            top: '20px',
            height: '64px',
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
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
              <Tooltip title={isSplashPage ? "Explore" : "Home"}>
                <IconButton
                  component={Link}
                  to={isSplashPage ? "/specifications" : "/"}
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
                  onClick={handleInfoSidebarToggle}
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
                  onClick={handleThemeToggle} 
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
              <Tooltip title="Add New">
                <IconButton
                  component="a"
                  href="https://www.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: currentTheme.text,
                    '&:hover': {
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <CssBaseline />
        
        {/* Sidebar Navigation - Only show if not on splash page */}
        {!isSplashPage && (
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
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
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
                },
              }}
              open
            >
              {drawer}
            </Drawer>
          </Box>
        )}

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
            bgcolor: currentTheme.background,
            mt: '84px',
            ml: { sm: `${isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
            transition: 'margin-left 0.2s ease-in-out, width 0.2s ease-in-out',
          }}
        >
          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/specifications" element={<DataSpecificationsPage />} />
            <Route path="/agreements" element={<ProductAgreementsPage />} />
            <Route path="/domains" element={<DataDomainsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/lexicon" element={<LexiconPage />} />
            <Route path="/reference" element={<ReferenceDataPage />} />
            <Route 
              path="/specifications/:shortName" 
              element={
                <DataSpecificationDetailPage 
                  currentTheme={currentTheme}
                />
              } 
            />
            <Route 
              path="/agreements/:id" 
              element={
                <ProductAgreementDetailPage 
                  currentTheme={currentTheme}
                />
              } 
            />
          </Routes>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              bgcolor: currentTheme.card,
              color: currentTheme.text,
            },
          }}
        >
          <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
          <MenuItem onClick={handleMenuClose}>My Account</MenuItem>
          <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
        </Menu>

        <Menu
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              bgcolor: currentTheme.card,
              color: currentTheme.text,
            },
          }}
        >
          <MenuItem onClick={handleMenuClose}>New data model added</MenuItem>
          <MenuItem onClick={handleMenuClose}>Contract violation detected</MenuItem>
          <MenuItem onClick={handleMenuClose}>Domain health check failed</MenuItem>
          <MenuItem onClick={handleMenuClose}>System update available</MenuItem>
        </Menu>

        <InfoSidebar
          open={infoSidebarOpen}
          onClose={() => setInfoSidebarOpen(false)}
          currentTheme={currentTheme}
        />
      </Box>
    </ThemeContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
