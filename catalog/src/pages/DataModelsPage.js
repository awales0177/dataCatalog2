import React, { useState, useContext, useEffect } from 'react';
import { 
  Box, 
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  Button,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DataModelCard from '../components/DataModelCard';
import { ThemeContext } from '../App';
import { fetchData } from '../services/api';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 12;

const DataSpecificationsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [allModels, setAllModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const theme = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('all');

  useEffect(() => {
    const loadSpecifications = async () => {
      try {
        const data = await fetchData('specifications');
        setAllModels(data.models || []);
        setFilteredModels(data.models || []);
        setError(null);
      } catch (err) {
        setError('Failed to load specifications');
        console.error('Error loading specifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSpecifications();
  }, []);

  useEffect(() => {
    let filtered = [...allModels];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(model => {
        if (!model) return false;
        
        const searchableText = [
          model.name,
          model.description,
          model.shortName,
          // Handle tags safely
          Array.isArray(model.tags) ? model.tags.join(' ') : '',
          // Add any other searchable fields
          model.meta?.tier || '',
          model.meta?.verified ? 'verified' : ''
        ].map(item => String(item || '')).join(' ').toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    if (selectedQuality !== 'all') {
      filtered = filtered.filter(model => {
        if (selectedQuality === 'verified') {
          return model.meta?.verified === true;
        }
        return model.meta?.tier?.toLowerCase() === selectedQuality;
      });
    }

    setFilteredModels(filtered);
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedQuality, allModels]);

  const handleFavoriteToggle = (modelId) => {
    setFavorites(prev => 
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleCreateNewModel = () => {
    // Generate a unique temporary ID for the new model
    const tempId = `temp_${Date.now()}`;
    
    // Create an empty model template
    const newModel = {
      id: tempId,
      shortName: '',
      name: '',
      version: '1.0.0',
      description: '',
      extendedDescription: '',
      lastUpdated: new Date().toISOString().slice(0, 19).replace('T', ' '),
      owner: '',
      specMaintainer: '',
      maintainerEmail: '',
      domain: [],
      referenceData: [],
      meta: {
        tier: 'bronze',
        verified: false
      },
      changelog: [
        {
          version: '1.0.0',
          date: new Date().toISOString().slice(0, 10),
          changes: ['Initial model creation']
        }
      ],
      resources: {
        code: '',
        documentation: '',
        rules: '',
        tools: {},
        git: '',
        validation: ''
      },
      users: []
    };

    // Store the new model in localStorage temporarily
    localStorage.setItem('newModelTemplate', JSON.stringify(newModel));
    
    // Navigate to the edit page with a special "new" parameter
    navigate('/specifications/new/edit');
  };

  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedModels = filteredModels.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const qualityLevels = [
    { id: 'all', label: 'All' },
    { id: 'bronze', label: 'Bronze' },
    { id: 'silver', label: 'Silver' },
    { id: 'gold', label: 'Gold' },
    { id: 'verified', label: 'Verified' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Specifications
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Explore and manage your data specifications. View specification details, quality metrics, and relationships between different data structures.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search data specifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {qualityLevels.map((level) => (
            <Chip
              key={level.id}
              label={level.label}
              onClick={() => setSelectedQuality(level.id)}
              sx={{
                backgroundColor: selectedQuality === level.id ? currentTheme.primary : currentTheme.background,
                color: selectedQuality === level.id ? currentTheme.background : currentTheme.text,
                '&:hover': {
                  backgroundColor: selectedQuality === level.id ? currentTheme.primaryDark : currentTheme.background,
                },
                flexShrink: 0,
              }}
            />
          ))}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {paginatedModels.map((model) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={model.id}>
            {model && model.shortName && (
              <DataModelCard
                model={model}
                isFavorite={favorites.includes(model.id)}
                onFavoriteToggle={handleFavoriteToggle}
                currentTheme={currentTheme}
              />
            )}
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={page}
          onChange={handlePageChange}
          currentTheme={currentTheme}
        />
      </Box>

      {/* Floating Action Button for creating new model */}
      <Fab
        color="primary"
        aria-label="add new model"
        onClick={handleCreateNewModel}
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
    </Container>
  );
};

export default DataSpecificationsPage; 