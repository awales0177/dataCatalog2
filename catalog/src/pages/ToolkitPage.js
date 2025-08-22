import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Rating,
  Badge,
  alpha,
  Fab,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../App';
import { fetchData } from '../services/api';

const ToolkitPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [toolkitData, setToolkitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load toolkit data
  useEffect(() => {
    const loadToolkitData = async () => {
      try {
        const data = await fetchData('toolkit');
        setToolkitData(data);
      } catch (error) {
        console.error('Error loading toolkit data:', error);
        setSnackbar({ open: true, message: 'Failed to load toolkit data', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadToolkitData();
  }, []);

  // Filter components based on search
  const getFilteredComponents = () => {
    if (!toolkitData) return { functions: [], containers: [], terraform: [] };

    let filtered = {
      functions: toolkitData.toolkit.functions || [],
      containers: toolkitData.toolkit.containers || [],
      terraform: toolkitData.toolkit.terraform || []
    };

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      Object.keys(filtered).forEach(key => {
        filtered[key] = filtered[key].filter(item =>
          item.name.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          item.author.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  };

  const filteredComponents = getFilteredComponents();



  // Component card renderer
  const renderComponentCard = (component, type) => {
    const getTypeIcon = () => {
      switch (type) {
        case 'functions': return <CodeIcon />;
        case 'containers': return <StorageIcon />;
        case 'terraform': return <CloudIcon />;
        default: return <CodeIcon />;
      }
    };

    const getTypeColor = () => {
      switch (type) {
        case 'functions': return 'primary';
        case 'containers': return 'secondary';
        case 'terraform': return 'success';
        default: return 'primary';
      }
    };

    return (
      <Card 
        key={component.id} 
        elevation={0}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              icon={getTypeIcon()}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              color={getTypeColor()}
              size="small"
            />
            <Box sx={{ ml: 'auto' }}>
              <Rating value={component.rating} readOnly size="small" />
            </Box>
          </Box>

          <Typography variant="h6" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
            {component.name}
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: currentTheme.textSecondary, lineHeight: 1.5 }}>
            {component.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            {component.tags.slice(0, 4).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ 
                  mr: 0.5, 
                  mb: 0.5,
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                  '&:hover': {
                    bgcolor: alpha(currentTheme.primary, 0.2),
                  }
                }}
              />
            ))}
            {component.tags.length > 4 && (
              <Chip
                label={`+${component.tags.length - 4} more`}
                size="small"
                variant="outlined"
                sx={{ 
                  mr: 0.5, 
                  mb: 0.5,
                  borderColor: currentTheme.border,
                  color: currentTheme.textSecondary
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, fontSize: '0.875rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: currentTheme.textSecondary }}>
              <PersonIcon fontSize="small" />
              {component.author}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: currentTheme.textSecondary }}>
              <ScheduleIcon fontSize="small" />
              {new Date(component.lastUpdated).toLocaleDateString()}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.875rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: currentTheme.textSecondary }}>
              <InfoIcon fontSize="small" />
              v{component.version}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: currentTheme.textSecondary }}>
              <DownloadIcon fontSize="small" />
              {component.downloads} downloads
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={() => handleViewComponent(component, type)}
            sx={{
              color: currentTheme.primary,
              borderColor: currentTheme.border,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: alpha(currentTheme.primary, 0.1),
              },
            }}
          >
            View Details
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadComponent(component, type)}
            sx={{
              bgcolor: currentTheme.primary,
              '&:hover': {
                bgcolor: currentTheme.primary,
                opacity: 0.9,
              },
            }}
          >
            Download
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Handle component viewing
  const handleViewComponent = (component, type) => {
    // TODO: Implement detailed view modal
    console.log('View component:', component, type);
  };

  // Handle component download
  const handleDownloadComponent = (component, type) => {
    // TODO: Implement download functionality
    console.log('Download component:', component, type);
    setSnackbar({ open: true, message: 'Download started!', severity: 'success' });
  };

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
        Developer Toolkit
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
              bgcolor: currentTheme.card,
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
      <Box sx={{ borderBottom: 1, borderColor: currentTheme.border, mb: 3 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CodeIcon />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  Functions
                  <Badge badgeContent={filteredComponents.functions.length} color="primary" />
                </Box>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  Containers
                  <Badge badgeContent={filteredComponents.containers.length} color="secondary" />
                </Box>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudIcon />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  Terraform
                  <Badge badgeContent={filteredComponents.terraform.length} color="success" />
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
        
        {selectedTab === 2 && filteredComponents.terraform.map(component => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={component.id}>
            {renderComponentCard(component, 'terraform')}
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {Object.values(filteredComponents).every(arr => arr.length === 0) && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
            No components found
          </Typography>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            Try adjusting your search terms or filters
          </Typography>
        </Box>
      )}

      {/* Add Component FAB */}
      <Fab
        color="primary"
        aria-label="add component"
        onClick={() => {
          // TODO: Implement add component dialog
          setSnackbar({ open: true, message: 'Add component feature coming soon!', severity: 'info' });
        }}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: currentTheme.primary,
          color: currentTheme.background,
          '&:hover': {
            bgcolor: currentTheme.primaryDark || currentTheme.primary
          },
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ToolkitPage;
