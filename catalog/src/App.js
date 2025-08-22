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
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Home as HomeIcon,
  GitHub as GitHubIcon,
  Info as InfoIcon,
  AutoMode as AutoModeIcon,
  Policy as PolicyIcon,
} from '@mui/icons-material';
import {
  FiHome,
  FiPlus,
  FiBook,
  FiChevronLeft,
  FiChevronRight,
  FiDatabase,
  FiLayers,
  FiGrid,
  FiBookOpen,
  FiTool,
} from 'react-icons/fi';
import { MdHandshake, MdDomain } from "react-icons/md";
import { ImMakeGroup } from "react-icons/im";
import { AiOutlineAppstore } from "react-icons/ai";

import { IoIosApps } from "react-icons/io";
import { PiGraph } from "react-icons/pi";
import lotusRed from './imgs/lotus-red.svg';
import lotusWhite from './imgs/lotus-white.svg';
import { GoVerified } from "react-icons/go";

// Import components
import DataSpecificationsPage from './pages/DataModelsPage';
import ProductAgreementsPage from './pages/ProductAgreementsPage';
import DataDomainsPage from './pages/DataDomainsPage';
import SplashPage from './pages/SplashPage';
import ApplicationsPage from './pages/ApplicationsPage';
import EditApplicationPage from './pages/EditApplicationPage';

import ReferenceDataPage from './pages/ReferenceDataPage';
import EditReferenceDataPage from './pages/EditReferenceDataPage';
import DataSpecificationDetailPage from './pages/DataModelDetailPage';
import EditDataModelDetailPage from './pages/EditDataModelDetailPage';
import ProductAgreementDetailPage from './pages/ProductAgreementDetailPage';
import EditAgreementPage from './pages/EditAgreementPage';
import ReferenceDataDetailPage from './pages/ReferenceDataDetailPage';
import ToolkitPage from './pages/ToolkitPage';
import DataPoliciesPage from './pages/DataPoliciesPage';

import InfoSidebar from './components/InfoSidebar';

// Import data and utilities
import { fetchTheme, fetchItemCount, fetchModels, fetchAgreements } from './services/api';

// Theme context for managing dark/light mode
export const ThemeContext = createContext();

const drawerWidth = 280;
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

// Add Google Fonts import
const fontStyle = document.createElement('style');
fontStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Courgette&display=swap');
`;
document.head.appendChild(fontStyle);

// Function to generate random pastel color
const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 65%)`;
};

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
      Data Hub
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

  const loadFilterData = async () => {
    try {
      const data = await fetchModels({ forceRefresh: true });
      const tags = [...new Set(data.models.flatMap(model => model.tags))];
      const owners = [...new Set(data.models.map(model => model.owner))];
      setAllTags(tags);
      setAllOwners(owners);
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  // Refresh filter data when models are updated
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'models-updated') {
        // Models were updated, refresh filter data
        loadFilterData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
          expandIcon={<FiChevronRight />}
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
          expandIcon={<FiChevronRight />}
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
          expandIcon={<FiChevronRight />}
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
          expandIcon={<FiChevronRight />}
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
          expandIcon={<FiChevronRight />}
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
          expandIcon={<FiChevronRight />}
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
          expandIcon={<FiChevronRight />}
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
          expandIcon={<FiChevronRight />}
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

// Update the menu items with count functionality
const menuItems = [
  {
    name: 'Home',
    path: '/',
    icon: <FiHome />,
    id: 'home'
  },
  {
    name: 'Data Specifications',
    path: '/specifications',
    icon: <PiGraph />,
    id: 'specifications'
  },
  {
    name: 'Product Agreements',
    path: '/agreements',
    icon: <MdHandshake />,
    id: 'agreements'
  },
  {
    name: 'Toolkit',
    path: '/toolkit',
    icon: <FiTool />,
    id: 'toolkit'
  },
  {
    name: 'Reference Data',
    path: '/reference',
    icon: <IoIosApps />,
    id: 'reference'
  },
  {
    name: 'Data Applications',
    path: '/applications',
    icon: <AiOutlineAppstore />,
    id: 'applications'
  },
  {
    name: 'Data Policies',
    path: '/policies',
    icon: <PolicyIcon />,
    id: 'policies'
  },
  {
    name: 'Data Domains',
    path: '/domains',
    icon: <MdDomain />,
    id: 'domains'
  },
];

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
  const [menuData, setMenuData] = useState({ items: menuItems });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countsLoaded, setCountsLoaded] = useState(false);
  const [dataModels, setDataModels] = useState([]);
  const [avatarColor] = useState(getRandomColor());

  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname;
    let title = 'Data Catalog';
    
    if (path === '/') {
      title = 'Home';
    } else if (path === '/specifications') {
      title = 'Data Specifications';
    } else if (path === '/agreements') {
      title = 'Product Agreements';
    } else if (path === '/domains') {
      title = 'Data Domains';
    } else if (path === '/applications') {
      title = 'Data Applications';
    } else if (path === '/toolkit') {
      title = 'Developer Toolkit';
    } else if (path === '/policies') {
      title = 'Data Policies';
    } else if (path === '/reference') {
      title = 'Reference Data';
    } else if (path.startsWith('/specifications/')) {
      const shortName = path.split('/').pop().toUpperCase();
      title = shortName;
    } else if (path.startsWith('/agreements/')) {
      title = 'Product Agreement Details';
    } else if (path.startsWith('/reference/')) {
      title = 'Reference Data Details';
    }

    document.title = title;
  }, [location.pathname]);

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

  // Update the menu count fetching
  useEffect(() => {
    const loadMenuCounts = async () => {
      if (countsLoaded) return;
      try {
        const itemsWithCounts = await Promise.all(
          menuItems.map(async (item) => {
            if (item.id === 'home') return item;
            try {
              const endpoint = item.id === 'agreements' ? 'dataAgreements' : item.id;
              const count = await fetchItemCount(endpoint);
              return { ...item, count };
            } catch (error) {
              console.error(`Error fetching count for ${item.name}:`, error);
              return item;
            }
          })
        );
        setMenuData({ items: itemsWithCounts });
        setCountsLoaded(true);
        setError(null);
      } catch (err) {
        setError('Failed to load menu counts');
        console.error('Error loading menu counts:', err);
      }
    };
    loadMenuCounts();
  }, [countsLoaded]);

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

  // Add effect to handle sidebar collapse on 2-level navigation and edit mode
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    console.log('Current path segments:', pathSegments);
    
    // Collapse if we're exactly 2 levels deep (e.g., /specifications/CUST)
    // OR if we're in edit mode (e.g., /specifications/CUST/edit)
    if (pathSegments.length === 2 || 
        (pathSegments.length === 3 && pathSegments[2] === 'edit')) {
      console.log('Collapsing sidebar - 2-level navigation or edit mode detected');
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
    <>
      <List>
        {(menuData?.items || []).map((item, index) => {
          // Add divider before Applications (start of second section)
          const shouldAddDivider = item.id === 'applications' && !isDrawerCollapsed;
          
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
        })}
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
            bgcolor: '#FFC107',
            color: 'rgba(0, 0, 0, 0.87)',
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
                onClick={handleDrawerCollapse}
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
        <Route path="/applications/create" element={<EditApplicationPage />} />
        <Route path="/applications/edit/:id" element={<EditApplicationPage />} />
        <Route path="/toolkit" element={<ToolkitPage />} />
        <Route path="/policies" element={<DataPoliciesPage />} />
            <Route path="/reference" element={<ReferenceDataPage />} />
            <Route path="/reference/create" element={<EditReferenceDataPage currentTheme={currentTheme} />} />
            <Route path="/reference/:id/edit" element={<EditReferenceDataPage currentTheme={currentTheme} />} />
            <Route path="/reference/:id" element={<ReferenceDataDetailPage currentTheme={currentTheme} />} />
            <Route 
              path="/specifications/:shortName" 
              element={
                <DataSpecificationDetailPage 
                  currentTheme={currentTheme}
                />
              } 
            />
            <Route 
              path="/specifications/:shortName/edit" 
              element={
                <EditDataModelDetailPage 
                  currentTheme={currentTheme}
                />
              } 
            />
            <Route 
              path="/agreements/create" 
              element={
                <EditAgreementPage 
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
            <Route 
              path="/agreements/:id/edit" 
              element={
                <EditAgreementPage 
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
