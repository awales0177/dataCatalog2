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
} from '@mui/material';
import {
  Search as SearchIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Add as AddIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ToolkitPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [toolkitData, setToolkitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData('toolkit');
        setToolkitData(data);
      } catch (error) {

        setSnackbar({ open: true, message: 'Failed to load toolkit data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter components based on search
  const getFilteredComponents = () => {
    if (!toolkitData) return { functions: [], containers: [], infrastructure: [] };

    let filtered = {
      functions: toolkitData.toolkit.functions || [],
      containers: toolkitData.toolkit.containers || [],
      infrastructure: toolkitData.toolkit.infrastructure || []
    };

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

    return (
      <Card 
        key={component.id} 
        elevation={0}
        onClick={() => handleViewComponent(component, type)}
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
              <Tooltip title={`${component.downloads} downloads`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    {component.downloads}
                  </Typography>
                  <DownloadIcon sx={{ fontSize: 16, color: '#FF9800' }} />
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

      {/* Search */}
      <Box sx={{ mb: 4 }}>
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
          }}
          sx={{
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
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
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

      {/* Floating Action Button for creating new function */}
      <Fab
        color="primary"
        aria-label="add new function"
        onClick={() => navigate('/toolkit/function/new')}
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
