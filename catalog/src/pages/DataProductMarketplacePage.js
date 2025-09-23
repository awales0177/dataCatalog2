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
  Fab,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchData } from '../services/api';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 12;

// Mock data for data products - in a real app, this would come from an API
const mockDataProducts = [
  {
    id: 'dp-001',
    name: 'Customer Analytics Dataset',
    description: 'Comprehensive customer behavior analytics with purchase history and engagement metrics',
    category: 'Analytics',
    provider: 'Data Analytics Team',
    rating: 4.8,
    downloads: 1247
  },
  {
    id: 'dp-002',
    name: 'Financial Risk Models',
    description: 'Advanced machine learning models for credit risk assessment and fraud detection',
    category: 'Machine Learning',
    provider: 'Risk Management Team',
    rating: 4.9,
    downloads: 892
  },
  {
    id: 'dp-003',
    name: 'Product Catalog API',
    description: 'Real-time product information API with inventory levels and pricing',
    category: 'API',
    provider: 'Product Team',
    rating: 4.6,
    downloads: 2156
  },
  {
    id: 'dp-004',
    name: 'Market Research Insights',
    description: 'Quarterly market research data with competitor analysis and trends',
    category: 'Research',
    provider: 'Market Research Team',
    rating: 4.3,
    downloads: 456
  },
  {
    id: 'dp-005',
    name: 'Supply Chain Optimization',
    description: 'Supply chain data and optimization algorithms for logistics management',
    category: 'Operations',
    provider: 'Supply Chain Team',
    rating: 4.7,
    downloads: 678
  },
  {
    id: 'dp-006',
    name: 'Customer Support Analytics',
    description: 'Customer support ticket data with sentiment analysis and metrics',
    category: 'Analytics',
    provider: 'Support Team',
    rating: 4.4,
    downloads: 334
  }
];

const DataProductCard = ({ product, currentTheme, onView, onFavorite, isFavorite }) => {
  const getTrustworthinessColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return currentTheme.success;
      case 'medium': return currentTheme.warning;
      case 'low': return currentTheme.error;
      default: return currentTheme.textSecondary;
    }
  };

  const getTrustworthinessPercentage = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 90;
      case 'medium': return 60;
      case 'low': return 30;
      default: return 0;
    }
  };

  return (
    <Card
      onClick={() => onView(product)}
      sx={{
        height: '220px',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        boxShadow: `0 2px 8px ${currentTheme.border}20`,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${currentTheme.border}30, 0 4px 12px ${currentTheme.primary}20`,
          borderColor: currentTheme.primary,
          '&::before': {
            opacity: 1,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.primary}80)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Typography
          variant="h6"
          sx={{
            color: currentTheme.text,
            fontWeight: 700,
            fontSize: '1.1rem',
            lineHeight: 1.4,
            mb: 0.5,
            letterSpacing: '-0.01em',
          }}
        >
          {product.name}
        </Typography>
        
        {/* Dataset ID */}
        <Typography
          variant="caption"
          sx={{
            color: currentTheme.textSecondary,
            mb: 1,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            opacity: 0.7,
            display: 'block',
          }}
        >
          ID: {product.id}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: currentTheme.textSecondary,
            fontSize: '0.9rem',
            lineHeight: 1.6,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            letterSpacing: '0.01em',
          }}
        >
          {product.description}
        </Typography>

        {/* Simple Stats - Aligned to bottom */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mt: 'auto', 
          mb: 0.5,
          pt: 1.5,
          borderTop: `1px solid ${currentTheme.border}30`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip 
              title={`${product.products?.length || 0} data products in this dataset`}
              arrow
              placement="top"
            >
              <Typography variant="caption" sx={{ 
                color: currentTheme.textSecondary,
                fontWeight: 600,
                fontSize: '0.8rem',
              }}>
                🔥 {product.products?.length || 0}
              </Typography>
            </Tooltip>
            <Tooltip 
              title={`Trustworthiness: ${product.trustworthiness?.charAt(0).toUpperCase() + product.trustworthiness?.slice(1) || 'Unknown'} (${getTrustworthinessPercentage(product.trustworthiness)}%)`}
              arrow
              placement="top"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress
                  variant="determinate"
                  value={getTrustworthinessPercentage(product.trustworthiness)}
                  size={20}
                  thickness={3}
                  sx={{
                    color: getTrustworthinessColor(product.trustworthiness),
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: currentTheme.textSecondary,
                  }}
                >
                  {getTrustworthinessPercentage(product.trustworthiness)}%
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                // Handle A icon click - could link to documentation or details
                console.log('A icon clicked for product:', product.id);
              }}
              sx={{
                color: currentTheme.textSecondary,
                minWidth: 'auto',
                px: 0.5,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  color: currentTheme.primary,
                  bgcolor: `${currentTheme.primary}10`,
                },
              }}
            >
              <ArticleIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(product.id);
              }}
              sx={{
                color: isFavorite ? currentTheme.favorite : currentTheme.favoriteInactive,
                minWidth: 'auto',
                px: 0.5,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: `${currentTheme.favorite}10`,
                },
              }}
            >
              <StarIcon fontSize="small" />
            </Button>
          </Box>
        </Box>
      </CardContent>

    </Card>
  );
};

const DataProductMarketplacePage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { canCreate } = useAuth();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);

  const categories = ['all', 'Analytics', 'Machine Learning', 'API', 'Research', 'Operations'];

  useEffect(() => {
    const loadDataProducts = async () => {
      try {
        const data = await fetchData('dataProducts');
        setAllProducts(data.dataProducts || []);
        setFilteredProducts(data.dataProducts || []);
        setError(null);
      } catch (err) {
        setError('Failed to load data products');
        console.error('Error loading data products:', err);
        // Fallback to mock data if API fails
        setAllProducts(mockDataProducts);
        setFilteredProducts(mockDataProducts);
      } finally {
        setLoading(false);
      }
    };

    loadDataProducts();
  }, []);

  useEffect(() => {
    let filtered = [...allProducts];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        const searchableText = [
          product.name,
          product.description,
          product.category,
          product.provider,
          product.tags?.join(' ') || '',
        ].join(' ').toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
    setPage(1);
  }, [searchQuery, selectedCategory, allProducts]);

  const handleFavoriteToggle = (productId) => {
    setFavorites(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleViewProduct = (product) => {
    // Navigate to product detail page
    if (product.type === 'dataset') {
      // Navigate to dataset view
      navigate(`/data-products/${product.id}`);
    } else {
      // For individual products, we need to find their parent dataset
      // For now, navigate to the product directly - this will be handled by the detail page
      navigate(`/data-products/${product.id}`);
    }
  };


  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    if (newValue === 0) {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(categories[newValue]);
    }
  };

  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Product Marketplace
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Discover, explore, and access data products from across the organization
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search data products..."
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
      </Box>

      {/* Category Tabs */}
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: `1px solid ${currentTheme.border}`,
          '& .MuiTab-root': {
            color: currentTheme.textSecondary,
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': {
              color: currentTheme.primary,
            },
          },
          '& .MuiTabs-indicator': {
            bgcolor: currentTheme.primary,
          },
        }}
      >
        <Tab label="All Products" />
        <Tab label="Analytics" />
        <Tab label="Machine Learning" />
        <Tab label="API" />
        <Tab label="Research" />
        <Tab label="Operations" />
      </Tabs>

      {/* Products Grid */}
      <Box sx={{ mt: 4 }}>
      {paginatedProducts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StoreIcon sx={{ fontSize: '4rem', color: currentTheme.textSecondary, mb: 2 }} />
          <Typography variant="h6" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
            No data products found
          </Typography>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedProducts.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <DataProductCard
                  product={product}
                  currentTheme={currentTheme}
                  onView={handleViewProduct}
                  onFavorite={handleFavoriteToggle}
                  isFavorite={favorites.includes(product.id)}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {filteredProducts.length > ITEMS_PER_PAGE && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                page={page}
                onChange={(event, value) => setPage(value)}
                currentTheme={currentTheme}
              />
            </Box>
          )}
        </>
      )}
      </Box>

      {/* Floating Action Button */}
      {canCreate() && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: currentTheme.primary,
            '&:hover': {
              bgcolor: currentTheme.primaryHover,
            },
          }}
          onClick={() => {
            // Navigate to create data product page
            console.log('Create new data product');
            // navigate('/data-products/create');
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default DataProductMarketplacePage;
