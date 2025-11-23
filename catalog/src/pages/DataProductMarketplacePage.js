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
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Tooltip,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  TableChart as StructuredIcon,
  Description as UnstructuredIcon,
  Article as ArticlesIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchData } from '../services/api';
import Pagination from '../components/Pagination';
import DataSourceConnection from '../components/DataSourceConnection';
import { calculateProductScore, getProductQualityColor, getProductQualityLevel } from '../utils/productScoreUtils';

const ITEMS_PER_PAGE = 12;

// Mock data for data products - in a real app, this would come from an API
const mockDataProducts = [
  {
    id: 'dp-001',
    name: 'Customer Analytics Dataset',
    description: 'Comprehensive customer behavior analytics with purchase history and engagement metrics',
    category: 'Structured',
    provider: 'Data Analytics Team',
    users: 1247,
    dataQuality: 'excellent',
    freshness: 'daily',
    documentation: 'https://docs.example.com/customer-analytics',
    schema: 'https://schema.example.com/customer-analytics.json',
    sampleData: 'https://data.example.com/samples/customer-analytics.csv',
    tags: ['customer', 'analytics', 'behavior'],
    lastUpdated: '2024-01-15',
    version: '2.1.0',
    usage: 'high'
  },
  {
    id: 'dp-002',
    name: 'Financial Risk Models',
    description: 'Advanced machine learning models for credit risk assessment and fraud detection',
    category: 'Structured',
    provider: 'Risk Management Team',
    users: 892,
    dataQuality: 'excellent',
    freshness: 'weekly',
    documentation: 'https://docs.example.com/risk-models',
    schema: 'https://schema.example.com/risk-models.json',
    tags: ['finance', 'risk', 'ml'],
    lastUpdated: '2024-01-10',
    version: '1.5.2',
    usage: 'medium'
  },
  {
    id: 'dp-003',
    name: 'Product Catalog API',
    description: 'Real-time product information API with inventory levels and pricing',
    category: 'Structured',
    provider: 'Product Team',
    users: 2156,
    dataQuality: 'good',
    freshness: 'real-time',
    documentation: 'https://api.example.com/docs',
    tags: ['api', 'products', 'inventory'],
    lastUpdated: '2024-01-14',
    version: '3.0.1',
    usage: 'high'
  },
  {
    id: 'dp-004',
    name: 'Market Research Insights',
    description: 'Quarterly market research data with competitor analysis and trends',
    category: ['Articles', 'Unstructured'],
    provider: 'Market Research Team',
    users: 456,
    dataQuality: 'fair',
    freshness: 'quarterly',
    documentation: 'https://docs.example.com/market-research',
    tags: ['market', 'research', 'competitors'],
    lastUpdated: '2023-12-01',
    version: '1.0.0',
    usage: 'low'
  },
  {
    id: 'dp-005',
    name: 'Supply Chain Optimization',
    description: 'Supply chain data and optimization algorithms for logistics management',
    category: 'Structured',
    provider: 'Supply Chain Team',
    users: 678,
    dataQuality: 'good',
    freshness: 'daily',
    documentation: 'https://docs.example.com/supply-chain',
    schema: 'https://schema.example.com/supply-chain.json',
    tags: ['supply-chain', 'logistics', 'optimization'],
    lastUpdated: '2024-01-12',
    version: '2.0.3',
    usage: 'medium'
  },
  {
    id: 'dp-006',
    name: 'Customer Support Analytics',
    description: 'Customer support ticket data with sentiment analysis and metrics',
    category: 'Structured',
    provider: 'Support Team',
    users: 334,
    dataQuality: 'poor',
    freshness: 'weekly',
    tags: ['support', 'tickets', 'sentiment'],
    lastUpdated: '2024-01-05',
    version: '1.2.1',
    usage: 'low'
  }
];

const DataProductCard = ({ product, currentTheme, onView, onFavorite, isFavorite }) => {
  // Calculate data quality score
  const qualityResult = calculateProductScore(product);
  const qualityScore = qualityResult.score;
  const qualityColor = getProductQualityColor(qualityScore, currentTheme.darkMode);
  const qualityLevel = getProductQualityLevel(qualityScore);

  // Get category icon and color
  const getCategoryInfo = (category) => {
    switch (category?.toLowerCase()) {
      case 'structured':
        return { IconComponent: StructuredIcon, color: '#2196F3' };
      case 'unstructured':
        return { IconComponent: UnstructuredIcon, color: '#9C27B0' };
      case 'articles':
        return { IconComponent: ArticlesIcon, color: '#4CAF50' };
      default:
        return { IconComponent: StoreIcon, color: '#9E9E9E' };
    }
  };

  // Handle both single category (string) and multiple categories (array)
  const productCategories = product.category 
    ? (Array.isArray(product.category) ? product.category : [product.category])
    : ['Structured'];
  const primaryCategory = productCategories[0] || 'Structured';
  const categoryInfo = getCategoryInfo(primaryCategory);

  const getDataFreshness = (product) => {
    // Check if freshness field exists
    if (product.freshness) {
      return product.freshness;
    }
    
    // Calculate from lastUpdated date
    if (product.lastUpdated) {
      const lastUpdated = new Date(product.lastUpdated);
      const now = new Date();
      const diffTime = Math.abs(now - lastUpdated);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    }
    
    return 'Unknown';
  };

  const getFreshnessPercentage = (product) => {
    const freshness = getDataFreshness(product);
    if (!freshness) return 0;
    
    const freshnessLower = freshness.toLowerCase();
    
    // Real-time or today = 100%
    if (freshnessLower.includes('real-time') || freshnessLower.includes('today')) {
      return 100;
    }
    // Daily = 95%
    if (freshnessLower.includes('daily') || freshnessLower === 'yesterday') {
      return 95;
    }
    // Weekly = 75%
    if (freshnessLower.includes('weekly') || freshnessLower.includes('week')) {
      return 75;
    }
    // Monthly = 50%
    if (freshnessLower.includes('month')) {
      return 50;
    }
    // Quarterly = 25%
    if (freshnessLower.includes('quarter')) {
      return 25;
    }
    // Yearly or older = 10%
    if (freshnessLower.includes('year')) {
      return 10;
    }
    // Days ago (1-6 days) = 90% - (days * 2)
    const daysMatch = freshnessLower.match(/(\d+)\s*days?\s*ago/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      return Math.max(80, 100 - (days * 3));
    }
    
    return 50; // Default
  };

  const getFreshnessColor = (product) => {
    const percentage = getFreshnessPercentage(product);
    if (percentage >= 90) return currentTheme.success;
    if (percentage >= 60) return currentTheme.warning;
    return currentTheme.error;
  };

  return (
    <Card
      elevation={0}
      onClick={() => onView(product)}
      sx={{
        height: '320px',
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: currentTheme.card,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 'none',
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
        {/* Header with Category Badge */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{
              color: currentTheme.text,
              fontWeight: 700,
              fontSize: '1.1rem',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
              flex: 1,
              mr: 1,
            }}
          >
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', flexShrink: 0, maxWidth: '50%', justifyContent: 'flex-end' }}>
            {productCategories && productCategories.length > 0 ? (
              <>
                {productCategories.slice(0, 2).map((category, idx) => {
                  if (!category) return null;
                  const catInfo = getCategoryInfo(category);
                  const CatIcon = catInfo.IconComponent;
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: `${catInfo.color}15`,
                        border: `1px solid ${catInfo.color}30`,
                      }}
                    >
                      <CatIcon sx={{ fontSize: 12, color: catInfo.color }} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: catInfo.color,
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {category}
                      </Typography>
                    </Box>
                  );
                })}
                {productCategories.length > 2 && (
                  <Chip
                    label={`+${productCategories.length - 2}`}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      bgcolor: `${currentTheme.textSecondary}15`,
                      color: currentTheme.textSecondary,
                      border: `1px solid ${currentTheme.border}`,
                      '& .MuiChip-label': {
                        px: 0.75,
                        py: 0,
                      },
                    }}
                  />
                )}
              </>
            ) : (
              (() => {
                const CatIcon = categoryInfo.IconComponent;
                return (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: `${categoryInfo.color}15`,
                      border: `1px solid ${categoryInfo.color}30`,
                    }}
                  >
                    <CatIcon sx={{ fontSize: 12, color: categoryInfo.color }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: categoryInfo.color,
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {primaryCategory}
                    </Typography>
                  </Box>
                );
              })()
            )}
          </Box>
        </Box>
        
        {/* Dataset ID */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: currentTheme.textSecondary,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              opacity: 0.7,
            }}
          >
            ID: {product.id}
          </Typography>
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: currentTheme.textSecondary,
            fontSize: '0.85rem',
            lineHeight: 1.5,
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            letterSpacing: '0.01em',
            flex: '0 0 auto',
          }}
        >
          {product.description}
        </Typography>

        {/* Data Quality Meter */}
        <Tooltip 
          title={`Data Quality Score: ${qualityScore}% - ${qualityLevel}. Based on completeness of metadata, documentation, and data freshness.`}
          arrow
          placement="top"
        >
          <Box sx={{ mb: 1.5, flex: '0 0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: currentTheme.textSecondary, fontWeight: 600, fontSize: '0.75rem' }}>
                Data Quality
              </Typography>
              <Typography variant="caption" sx={{ color: qualityColor, fontWeight: 600, fontSize: '0.75rem' }}>
                {qualityScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={qualityScore}
              sx={{
                height: 3,
                borderRadius: 1.5,
                bgcolor: `${qualityColor}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: qualityColor,
                  borderRadius: 1.5,
                },
              }}
            />
            <Typography variant="caption" sx={{ 
              color: currentTheme.textSecondary, 
              fontSize: '0.65rem',
              mt: 0.25,
              display: 'block'
            }}>
              {qualityLevel}
            </Typography>
          </Box>
        </Tooltip>

        {/* Enhanced Stats - Aligned to bottom */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mt: 'auto', 
          mb: 0,
          pt: 1.5,
          borderTop: `1px solid ${currentTheme.border}30`,
          flex: '0 0 auto',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip 
              title={`${product.users || 0} users`}
              arrow
              placement="top"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 14, color: currentTheme.primary }} />
                <Typography variant="caption" sx={{ 
                  color: currentTheme.textSecondary,
                  fontWeight: 600,
                  fontSize: '0.8rem',
                }}>
                  {product.users || 0}
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip 
              title={`Data Freshness: ${getDataFreshness(product)}`}
              arrow
              placement="top"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress
                  variant="determinate"
                  value={getFreshnessPercentage(product)}
                  size={16}
                  thickness={3}
                  sx={{
                    color: getFreshnessColor(product),
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
                  {getFreshnessPercentage(product)}%
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={isFavorite ? "Remove from Favorites" : "Add to Favorites"} arrow>
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
            </Tooltip>
          </Box>
        </Box>
      </CardContent>

    </Card>
  );
};

const DataProductMarketplacePage = () => {
  const { currentTheme } = useContext(ThemeContext);
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

  const categories = ['all', 'Structured', 'Unstructured', 'Articles'];

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
        // Handle both single category (string) and multiple categories (array)
        const productCategories = Array.isArray(product.category) ? product.category : [product.category];
        const categoryText = productCategories.join(' ');
        
        const searchableText = [
          product.name,
          product.description,
          categoryText,
          product.provider,
          product.tags?.join(' ') || '',
        ].join(' ').toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        // Handle both single category (string) and multiple categories (array)
        const productCategories = Array.isArray(product.category) ? product.category : [product.category];
        return productCategories.includes(selectedCategory);
      });
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

  const handleDataSourceConnect = async (connectionData) => {
    console.log('Connecting data source:', connectionData);
    // TODO: Implement actual connection logic
    // This could call an API endpoint to save/validate the connection
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
            Data Product Marketplace
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            Discover, explore, and access data products from across the organization
          </Typography>
        </Box>
        <DataSourceConnection 
          currentTheme={currentTheme} 
          onConnect={handleDataSourceConnect}
        />
      </Box>

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
        
        {/* Product Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
          <Chip
            label={`${filteredProducts.length} products`}
            size="small"
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              fontWeight: 600,
            }}
          />
        </Box>
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
        <Tab label="Structured" />
        <Tab label="Unstructured" />
        <Tab label="Articles" />
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

    </Container>
  );
};

export default DataProductMarketplacePage;
