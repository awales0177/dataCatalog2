import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Chip,
  alpha,
  CircularProgress,
  Alert,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ToolkitPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [toolkitData, setToolkitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData('toolkit');
        const baseToolkits = data.toolkit?.toolkits || [];
        
        // Load toolkits from localStorage and merge
        const allStorageKeys = Object.keys(localStorage);
        const toolkitKeys = allStorageKeys.filter(key => 
          key.startsWith('toolkit_') && 
          !key.includes('_tech_') && 
          !key.includes('_reactions') &&
          !key.includes('_evaluation') &&
          !key.includes('_installation') &&
          !key.includes('_usage')
        );
        
        const savedToolkits = toolkitKeys.map(key => {
          try {
            return JSON.parse(localStorage.getItem(key));
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
        
        // Merge base toolkits with saved ones (prioritize saved)
        const mergedToolkits = baseToolkits.map(base => {
          const saved = savedToolkits.find(s => s.id === base.id);
          return saved ? { ...base, ...saved } : base;
        });
        
        // Add new toolkits that don't exist in base
        savedToolkits.forEach(saved => {
          if (!mergedToolkits.find(t => t.id === saved.id)) {
            mergedToolkits.push(saved);
          }
        });
        
        setToolkitData({
          ...data,
          toolkit: {
            ...data.toolkit,
            toolkits: mergedToolkits
          }
        });
      } catch (err) {
        setError('Failed to load toolkit data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter toolkits based on search
  const getFilteredToolkits = () => {
    if (!toolkitData) return [];
    
    const toolkits = toolkitData.toolkit?.toolkits || [];
    
    if (!searchTerm.trim()) {
      return toolkits;
    }
    
      const searchLower = searchTerm.toLowerCase();
    return toolkits.filter(toolkit =>
      (toolkit.displayName && toolkit.displayName.toLowerCase().includes(searchLower)) ||
      (toolkit.name && toolkit.name.toLowerCase().includes(searchLower)) ||
      (toolkit.description && toolkit.description.toLowerCase().includes(searchLower)) ||
      (toolkit.tags && toolkit.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  };

  const filteredToolkits = getFilteredToolkits();

  // Toolkit card renderer
  const renderToolkitCard = (toolkit) => {
    const handleCardClick = () => {
      navigate(`/toolkit/toolkit/${toolkit.id}`);
    };

    const technologyCount = toolkit.technologies?.length || 0;

    return (
      <Card 
        key={toolkit.id} 
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
            borderColor: '#37ABBF',
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                  {toolkit.displayName || toolkit.name}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                {toolkit.description}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {toolkit.tags?.slice(0, 4).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  bgcolor: alpha('#37ABBF', 0.1),
                  color: '#37ABBF',
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${technologyCount} Technology${technologyCount !== 1 ? 'ies' : ''}`}
              size="small"
              sx={{
                bgcolor: alpha(currentTheme.primary, 0.1),
                color: currentTheme.primary,
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
          Toolkits
      </Typography>
        <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 4 }}>
          Compare and evaluate technologies for specific capabilities
      </Typography>

        {/* Search */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search toolkits..."
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
            '& .MuiOutlinedInput-root': {
              backgroundColor: currentTheme.card,
              '& fieldset': {
                borderColor: currentTheme.border,
              },
              '&:hover fieldset': {
                borderColor: '#37ABBF',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#37ABBF',
              },
            },
            '& .MuiInputBase-input': {
              color: currentTheme.text,
            },
          }}
        />
      </Box>

      {/* Toolkits Grid */}
      <Grid container spacing={3}>
        {filteredToolkits.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary, textAlign: 'center', py: 4 }}>
              {searchTerm ? 'No toolkits found matching your search.' : 'No toolkits available.'}
            </Typography>
          </Grid>
        ) : (
          filteredToolkits.map(toolkit => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={toolkit.id}>
              {renderToolkitCard(toolkit)}
          </Grid>
          ))
        )}
      </Grid>

      {/* Floating Action Button for creating new toolkit */}
      {canEdit() && (
        <Fab
          color="primary"
          aria-label="add new toolkit"
          onClick={() => navigate('/toolkit/create')}
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
      )}
    </Container>
  );
};

export default ToolkitPage;
