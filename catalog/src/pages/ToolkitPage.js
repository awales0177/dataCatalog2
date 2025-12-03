import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Grid,
  Divider,
  Link,
  Card,
  CardContent,
  Badge,
  alpha,
  LinearProgress,
  Tooltip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, trackToolkitComponentClick } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ToolkitPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [toolkitData, setToolkitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [componentClickCounts, setComponentClickCounts] = useState({});
  const [selectedPackage, setSelectedPackage] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData('toolkit');
        setToolkitData(data);
        
        // Initialize click counts from loaded data
        const counts = {};
        ['functions', 'containers', 'infrastructure'].forEach(type => {
          const components = data.toolkit[type] || [];
          components.forEach(component => {
            const key = `${type}_${component.id}`;
            counts[key] = component.clickCount || 0;
          });
        });
        setComponentClickCounts(counts);
      } catch (error) {

        setSnackbar({ open: true, message: 'Failed to load toolkit data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Extract package name from a function
  const getPackageName = (component) => {
    if (component.language !== 'python') return null;
    
    // Check for source_module first (from bulk import)
    if (component.source_module) {
      // Extract root package from source_module (e.g., 'pandas.io' -> 'pandas')
      const parts = component.source_module.split('.');
      return parts[0];
    }
    
    // Check dependencies array
    if (component.dependencies && component.dependencies.length > 0) {
      // Get the first dependency that looks like a package name
      const packageDep = component.dependencies.find(dep => 
        typeof dep === 'string' && !dep.includes('/') && !dep.includes('http')
      );
      if (packageDep) {
        // Extract root package (e.g., 'pandas>=1.0' -> 'pandas')
        return packageDep.split(/[>=<!=]/)[0].trim();
      }
    }
    
    // Check tags for package names
    if (component.tags && component.tags.length > 0) {
      const packageTag = component.tags.find(tag => 
        typeof tag === 'string' && 
        !tag.includes('auto-generated') && 
        !tag.includes('library-function') &&
        tag.length > 2
      );
      if (packageTag) return packageTag;
    }
    
    return null;
  };

  // Get all available packages from Python functions
  const getAvailablePackages = () => {
    if (!toolkitData || !toolkitData.toolkit.functions) return [];
    
    const packages = new Set();
    toolkitData.toolkit.functions.forEach(func => {
      if (func.language === 'python') {
        const pkg = getPackageName(func);
        if (pkg) packages.add(pkg);
      }
    });
    
    return Array.from(packages).sort();
  };

  // Filter components based on search and package
  const getFilteredComponents = () => {
    if (!toolkitData) return { functions: [], containers: [], infrastructure: [] };

    let filtered = {
      functions: toolkitData.toolkit.functions || [],
      containers: toolkitData.toolkit.containers || [],
      infrastructure: toolkitData.toolkit.infrastructure || []
    };

    // Filter by package (only for Python functions)
    if (selectedTab === 0 && selectedPackage !== 'all') {
      filtered.functions = filtered.functions.filter(component => {
        if (component.language !== 'python') return true; // Keep non-Python functions
        const pkg = getPackageName(component);
        return pkg === selectedPackage;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filtered).forEach(key => {
        filtered[key] = filtered[key].filter(component =>
          component.name.toLowerCase().includes(searchLower) ||
          (component.displayName && component.displayName.toLowerCase().includes(searchLower)) ||
          component.description.toLowerCase().includes(searchLower) ||
          component.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          component.author.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };


  const filteredComponents = getFilteredComponents();

  // Component card renderer
  const renderComponentCard = (component, type) => {
    // Get click count from state or component data
    const componentKey = `${type}_${component.id}`;
    const clickCount = componentClickCounts[componentKey] !== undefined 
      ? componentClickCounts[componentKey] 
      : (component.clickCount || 0);
    const getLanguageIcon = (language) => {
      if (!language) return <CodeIcon />;
      
      const languageLower = language.toLowerCase();
      switch (languageLower) {
        case 'python':
          return <img src="/python.svg" alt="Python" style={{ width: 20, height: 20 }} />;
        case 'javascript':
        case 'js':
          return <img src="/javascript.svg" alt="JavaScript" style={{ width: 20, height: 20 }} />;
        case 'java':
          return <img src="/java.svg" alt="Java" style={{ width: 20, height: 20 }} />;
        case 'ruby':
          return <img src="/ruby.svg" alt="Ruby" style={{ width: 20, height: 20 }} />;
        case 'typescript':
        case 'ts':
          return <img src="/typescript.svg" alt="TypeScript" style={{ width: 20, height: 20 }} />;
        case 'go':
          return <img src="/go.svg" alt="Go" style={{ width: 20, height: 20 }} />;
        case 'rust':
          return <img src="/rust.svg" alt="Rust" style={{ width: 20, height: 20 }} />;
        case 'php':
          return <img src="/php.svg" alt="PHP" style={{ width: 20, height: 20 }} />;
        case 'swift':
          return <img src="/swift.svg" alt="Swift" style={{ width: 20, height: 20 }} />;
        case 'kotlin':
          return <img src="/kotlin.svg" alt="Kotlin" style={{ width: 20, height: 20 }} />;
        case 'scala':
          return <img src="/scala.svg" alt="Scala" style={{ width: 20, height: 20 }} />;
        case 'r':
          return <img src="/r.svg" alt="R" style={{ width: 20, height: 20 }} />;
        case 'sql':
          return <img src="/sql.svg" alt="SQL" style={{ width: 20, height: 20 }} />;
        case 'bash':
        case 'shell':
          return <img src="/bash.svg" alt="Bash" style={{ width: 20, height: 20 }} />;
        case 'yaml':
        case 'yml':
          return <img src="/yaml.svg" alt="YAML" style={{ width: 20, height: 20 }} />;
        case 'json':
          return <img src="/json.svg" alt="JSON" style={{ width: 20, height: 20 }} />;
        case 'xml':
          return <img src="/xml.svg" alt="XML" style={{ width: 20, height: 20 }} />;
        case 'html':
          return <img src="/html.svg" alt="HTML" style={{ width: 20, height: 20 }} />;
        case 'css':
          return <img src="/css.svg" alt="CSS" style={{ width: 20, height: 20 }} />;
        default:
          return <CodeIcon />;
      }
    };

    const getTypeIcon = () => {
      switch (type) {
        case 'functions': 
          return getLanguageIcon(component.language);
        case 'containers': 
          return <StorageIcon />;
        case 'infrastructure': 
          return <CloudIcon />;
        default: 
          return <CodeIcon />;
      }
    };

    const getTypeColor = () => {
      switch (type) {
        case 'functions': return currentTheme.primary;
        case 'containers': return currentTheme.secondary || '#9c27b0';
        case 'infrastructure': return currentTheme.success || '#4caf50';
        default: return currentTheme.primary;
      }
    };

    // Convert rating to percentage for progress bar
    const ratingPercentage = (component.rating / 5) * 100;

    const handleCardClick = async () => {
      if (!component.id) return;
      
      // Check if this component has already been clicked in this session
      const sessionKey = `toolkit_clicked_${type}_${component.id.toLowerCase()}`;
      const alreadyClicked = sessionStorage.getItem(sessionKey);
      
      // Only track the click if it hasn't been clicked in this session
      if (!alreadyClicked) {
        try {
          const result = await trackToolkitComponentClick(type, component.id);
          if (result && result.clickCount !== undefined) {
            // Update the click count in state
            setComponentClickCounts(prev => ({
              ...prev,
              [componentKey]: result.clickCount
            }));
            // Mark as clicked in this session
            sessionStorage.setItem(sessionKey, 'true');
          }
        } catch (error) {
          // Silently fail - don't block navigation
          console.error('Failed to track click:', error);
        }
      }
      
      // Navigate to the detail page
      handleViewComponent(component, type);
    };

    return (
      <Card 
        key={component.id} 
        elevation={0}
        onClick={handleCardClick}
        sx={{ 
          height: '100%',
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: currentTheme.text }}>
                {component.displayName || component.name}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: currentTheme.textSecondary,
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                }}
              >
                {component.name}
              </Typography>
              {type === 'functions' && component.language === 'python' && getPackageName(component) && (
                <Chip
                  label={getPackageName(component)}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                  }}
                />
              )}
            </Box>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: alpha(getTypeColor(), 0.1),
                color: getTypeColor(),
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {getTypeIcon()}
            </Box>
          </Box>

          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
            {component.description}
          </Typography>

          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {component.tags.slice(0, 4).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                  fontWeight: 500,
                }}
              />
            ))}
            {component.tags.length > 4 && (
              <Chip
                label={`+${component.tags.length - 4} more`}
                size="small"
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                  fontWeight: 500,
                }}
              />
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mr: 1 }}>
                Rating
              </Typography>
              <Typography variant="caption" sx={{ color: currentTheme.primary, fontWeight: 600 }}>
                {component.rating}/5
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={ratingPercentage}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(currentTheme.primary, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: currentTheme.primary,
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={`${clickCount} views`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {clickCount}
                  </Typography>
                  <VisibilityIcon sx={{ fontSize: 16, color: currentTheme.primary }} />
                </Box>
              </Tooltip>
            </Box>
            <Tooltip title={`v${component.version} - ${new Date(component.lastUpdated).toLocaleDateString()}`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: alpha(currentTheme.primary, 0.1),
                    color: currentTheme.primary,
                    fontSize: '0.75rem',
                  }}
                >
                  v{component.version}
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Handle component viewing
  const handleViewComponent = (component, type) => {
    if (type === 'functions') {
      navigate(`/toolkit/function/${component.id}`);
    } else if (type === 'containers') {
      navigate(`/toolkit/container/${component.id}`);
    } else if (type === 'infrastructure') {
      navigate(`/toolkit/infrastructure/${component.id}`);
    } else {
      setSnackbar({ open: true, message: `Viewing ${component.name} details`, severity: 'info' });
    }
  };

  // Handle component download - removed as cards are now clickable for viewing
  // const handleDownloadComponent = (component, type) => {

  //   setSnackbar({ open: true, message: 'Download started!', severity: 'success' });
  // };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6" sx={{ color: currentTheme.textSecondary }}>
            Loading Toolkit...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Tools
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Discover, share, and use modular components for faster development
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search components, tags, authors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme.textSecondary }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  sx={{ color: currentTheme.textSecondary }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              backgroundColor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
              '&:hover fieldset': {
                borderColor: currentTheme.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: currentTheme.primary,
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
        
        {selectedTab === 0 && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: currentTheme.textSecondary }}>
              Filter by Package
            </InputLabel>
            <Select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
              label="Filter by Package"
              sx={{
                color: currentTheme.text,
                backgroundColor: currentTheme.card,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: currentTheme.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: currentTheme.primary,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: currentTheme.primary,
                },
                '& .MuiSelect-icon': {
                  color: currentTheme.textSecondary,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: currentTheme.card,
                    border: `1px solid ${currentTheme.border}`,
                    '& .MuiMenuItem-root': {
                      color: currentTheme.text,
                      '&:hover': {
                        bgcolor: alpha(currentTheme.primary, 0.1),
                      },
                      '&.Mui-selected': {
                        bgcolor: alpha(currentTheme.primary, 0.2),
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="all">All Packages</MenuItem>
              {getAvailablePackages().map(pkg => (
                <MenuItem key={pkg} value={pkg}>{pkg}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => {
            setSelectedTab(newValue);
            // Reset package filter when switching tabs
            setSelectedPackage('all');
          }}
          sx={{
            '& .MuiTab-root': {
              color: currentTheme.textSecondary,
              '&.Mui-selected': {
                color: currentTheme.primary,
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: currentTheme.primary,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CodeIcon />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  Functions
                  <Badge badgeContent={filteredComponents.functions.length} />
                </Box>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  Containers
                  <Badge badgeContent={filteredComponents.containers.length} />
                </Box>
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CloudIcon />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  Infrastructure
                  <Badge badgeContent={filteredComponents.infrastructure.length} />
                </Box>
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Components Grid */}
      <Grid container spacing={3}>
        {selectedTab === 0 && filteredComponents.functions.map(component => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={component.id}>
            {renderComponentCard(component, 'functions')}
          </Grid>
        ))}
        
        {selectedTab === 1 && filteredComponents.containers.map(component => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={component.id}>
            {renderComponentCard(component, 'containers')}
          </Grid>
        ))}
        
        {selectedTab === 2 && filteredComponents.infrastructure.map(component => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={component.id}>
            {renderComponentCard(component, 'infrastructure')}
          </Grid>
        ))}
      </Grid>

      {/* Floating Action Button with menu for creating new items */}
      <>
        <Fab
          color="primary"
          aria-label="add new item"
          onClick={(e) => setAddMenuAnchor(e.currentTarget)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: currentTheme.primary,
            color: currentTheme.background,
            '&:hover': {
              bgcolor: currentTheme.primaryDark || currentTheme.primary,
            },
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
        
        <Menu
          anchorEl={addMenuAnchor}
          open={Boolean(addMenuAnchor)}
          onClose={() => setAddMenuAnchor(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              mt: -1,
              minWidth: 200,
            }
          }}
        >
          <MenuItem
            onClick={() => {
              setAddMenuAnchor(null);
              navigate('/toolkit/function/new');
            }}
            sx={{
              color: currentTheme.text,
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.1),
              }
            }}
          >
            <ListItemIcon>
              <CodeIcon sx={{ color: currentTheme.primary }} />
            </ListItemIcon>
            <ListItemText primary="Add Function" />
          </MenuItem>
          
          <MenuItem
            onClick={() => {
              setAddMenuAnchor(null);
              navigate('/toolkit/container/new');
            }}
            sx={{
              color: currentTheme.text,
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.1),
              }
            }}
          >
            <ListItemIcon>
              <StorageIcon sx={{ color: currentTheme.primary }} />
            </ListItemIcon>
            <ListItemText primary="Add Container" />
          </MenuItem>
          
          <MenuItem
            onClick={() => {
              setAddMenuAnchor(null);
              navigate('/toolkit/infrastructure/new');
            }}
            sx={{
              color: currentTheme.text,
              '&:hover': {
                bgcolor: alpha(currentTheme.primary, 0.1),
              }
            }}
          >
            <ListItemIcon>
              <CloudIcon sx={{ color: currentTheme.primary }} />
            </ListItemIcon>
            <ListItemText primary="Add Infrastructure" />
          </MenuItem>
        </Menu>
      </>

      {/* Snackbar */}
      {snackbar.open && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 1000,
            bgcolor: snackbar.severity === 'error' ? '#f44336' : 
                     snackbar.severity === 'success' ? '#4caf50' : '#2196f3',
            color: 'white',
            px: 3,
            py: 2,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
          }}
          onClick={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Box>
      )}
    </Container>
  );
};

export default ToolkitPage;
