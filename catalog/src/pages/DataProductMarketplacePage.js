import React, { useState, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Tooltip,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Popover
} from '@mui/material';
import {
  Search as SearchIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchData } from '../services/api';
import Pagination from '../components/Pagination';
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

const DataProductCard = React.memo(({ product, currentTheme, onView, onFavorite, isFavorite }) => {
  // Calculate data quality score as average of the 4 quality metrics
  const qualityScore = useMemo(() => {
    const metrics = product.technicalMetadata?.qualityMetrics;
    if (metrics && typeof metrics === 'object') {
      const values = [];
      
      // Extract and parse each metric
      ['accuracy', 'completeness', 'consistency', 'timeliness'].forEach(key => {
        if (metrics[key] !== undefined && metrics[key] !== null) {
          const val = metrics[key];
          // Handle both string ("95.2%") and number (95.2) formats
          let num;
          if (typeof val === 'string') {
            num = parseFloat(val.replace('%', '').trim());
          } else if (typeof val === 'number') {
            num = val;
          } else {
            return; // Skip invalid values
          }
          
          if (!isNaN(num) && num >= 0 && num <= 100) {
            values.push(num);
          }
        }
      });
      
      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        const average = sum / values.length;
        return Math.round(average); // Round to nearest integer
      }
    }
    
    // Fallback to original calculation if no quality metrics
  const qualityResult = calculateProductScore(product);
    return qualityResult.score;
  }, [product]);
  
  const qualityColor = useMemo(() => getProductQualityColor(qualityScore, currentTheme.darkMode), [qualityScore, currentTheme.darkMode]);
  const qualityLevel = useMemo(() => getProductQualityLevel(qualityScore), [qualityScore]);


  const dataFreshness = useMemo(() => {
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
  }, [product.freshness, product.lastUpdated]);

  const freshnessPercentage = useMemo(() => {
    if (!dataFreshness) return 0;
    
    const freshnessLower = dataFreshness.toLowerCase();
    
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
  }, [dataFreshness]);

  const freshnessColor = useMemo(() => {
    if (freshnessPercentage >= 90) return currentTheme.success;
    if (freshnessPercentage >= 60) return currentTheme.warning;
    return currentTheme.error;
  }, [freshnessPercentage, currentTheme]);

  return (
    <Card
      elevation={0}
      onClick={() => onView(product)}
      sx={{
        height: '240px',
        minHeight: '240px',
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
      <CardContent sx={{ flexGrow: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{
              color: currentTheme.text,
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              flex: 1,
              mr: 1,
            }}
          >
            {product.name}
                      </Typography>
        </Box>
        
        {/* Dataset ID */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
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
          <Box sx={{ mb: 1, flex: '0 0 auto' }}>
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
          pt: 1,
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
              title={`Timeliness: ${dataFreshness}`}
              arrow
              placement="top"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CircularProgress
                  variant="determinate"
                  value={freshnessPercentage}
                  size={16}
                  thickness={3}
                  sx={{
                    color: freshnessColor,
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
                  {freshnessPercentage}%
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
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.currentTheme === nextProps.currentTheme
  );
});

const DataProductMarketplacePage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [selectedProducers, setSelectedProducers] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedFeedType, setSelectedFeedType] = useState('all');
  const [availableModels, setAvailableModels] = useState([]);
  const [availableProducers, setAvailableProducers] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [triageView, setTriageView] = useState(() => {
    // Load from sessionStorage on initial render
    const saved = sessionStorage.getItem('dataProductTriageView');
    return saved ? JSON.parse(saved) : false;
  });
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedCell, setExpandedCell] = useState({ anchorEl: null, content: '', title: '' });
  const hoverTimeoutRef = useRef(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadDataProducts = async () => {
      try {
        const data = await fetchData('dataProducts');
        const products = data.dataProducts || [];
        setAllProducts(products);
        
        // Extract unique values for filters
        const modelsSet = new Set();
        const producersSet = new Set();
        const platformsSet = new Set();
        
        products.forEach(product => {
          // Extract models from relatedEntities.dataModels
          if (product.relatedEntities?.dataModels) {
            const models = Array.isArray(product.relatedEntities.dataModels) 
              ? product.relatedEntities.dataModels 
              : [product.relatedEntities.dataModels];
            models.forEach(model => {
              if (model) modelsSet.add(model);
            });
          }
          
          // Extract producers (providers)
          if (product.provider) {
            producersSet.add(product.provider);
          }
          
          // Extract platforms
          if (product.platform) {
            platformsSet.add(product.platform);
          }
        });
        
        setAvailableModels(Array.from(modelsSet).sort());
        setAvailableProducers(Array.from(producersSet).sort());
        setAvailablePlatforms(Array.from(platformsSet).sort());
        
        setError(null);
      } catch (err) {
        setError('Failed to load data products');
        console.error('Error loading data products:', err);
        // Fallback to mock data if API fails
        setAllProducts(mockDataProducts);
      } finally {
        setLoading(false);
      }
    };

    loadDataProducts();
  }, []);

  // Memoize filtered products to avoid recalculating on every render
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        const searchableText = [
          product.name,
          product.description,
          product.provider,
          product.tags?.join(' ') || '',
        ].join(' ').toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    // Filter by models
    if (selectedModels.length > 0) {
      filtered = filtered.filter(product => {
        const productModels = product.relatedEntities?.dataModels || [];
        const modelsArray = Array.isArray(productModels) ? productModels : [productModels];
        return selectedModels.some(model => modelsArray.includes(model));
      });
    }

    // Filter by producers (providers)
    if (selectedProducers.length > 0) {
      filtered = filtered.filter(product => {
        return selectedProducers.includes(product.provider);
      });
    }

    // Filter by platforms
    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(product => {
        return selectedPlatforms.includes(product.platform);
      });
    }

    // Filter by feed type (one-time vs feeds)
    if (selectedFeedType !== 'all') {
      filtered = filtered.filter(product => {
        const feedType = product.feedType || (product.freshness && product.freshness !== 'one-time' ? 'Feed' : 'One Time');
        if (selectedFeedType === 'one-time') {
          return feedType === 'One Time' || feedType === 'one-time' || !product.freshness || product.freshness === 'one-time';
        } else if (selectedFeedType === 'feed') {
          return feedType === 'Feed' || (product.freshness && product.freshness !== 'one-time');
        }
        return true;
      });
    }

    return filtered;
  }, [searchQuery, selectedModels, selectedProducers, selectedPlatforms, selectedFeedType, allProducts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedModels, selectedProducers, selectedPlatforms, selectedFeedType]);

  const handleFavoriteToggle = (productId) => {
    setFavorites(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleViewProduct = useCallback((product) => {
    // Navigate to product detail page
    if (product.type === 'dataset') {
      // Navigate to dataset view
      navigate(`/data-products/${product.id}`);
    } else {
      // For individual products, we need to find their parent dataset
      // For now, navigate to the product directly - this will be handled by the detail page
      navigate(`/data-products/${product.id}`);
    }
  }, [navigate]);


  const handleClearFilters = () => {
    setSelectedModels([]);
    setSelectedProducers([]);
    setSelectedPlatforms([]);
    setSelectedFeedType('all');
  };

  const getActiveFilterCount = () => {
    return selectedModels.length + selectedProducers.length + selectedPlatforms.length + (selectedFeedType !== 'all' ? 1 : 0);
  };

  // Sort products if sortBy is set
  const sortedProducts = useMemo(() => {
    if (!sortBy) return filteredProducts;
    
    return [...filteredProducts].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'id':
          aValue = a.id || '';
          bValue = b.id || '';
          break;
        case 'numSchemas':
          aValue = a.tables?.length || a.technicalMetadata?.tableCounts?.totalTables || 0;
          bValue = b.tables?.length || b.technicalMetadata?.tableCounts?.totalTables || 0;
          break;
        case 'languages':
          const aLangs = new Set();
          if (a.technicalMetadata?.codeVersions) {
            a.technicalMetadata.codeVersions.forEach(v => v.language && aLangs.add(v.language));
          }
          if (a.technicalMetadata?.engines) {
            a.technicalMetadata.engines.forEach(e => e.language && aLangs.add(e.language));
          }
          aValue = Array.from(aLangs).join(', ') || 'N/A';
          
          const bLangs = new Set();
          if (b.technicalMetadata?.codeVersions) {
            b.technicalMetadata.codeVersions.forEach(v => v.language && bLangs.add(v.language));
          }
          if (b.technicalMetadata?.engines) {
            b.technicalMetadata.engines.forEach(e => e.language && bLangs.add(e.language));
          }
          bValue = Array.from(bLangs).join(', ') || 'N/A';
          break;
        case 'numFiles':
          aValue = a.tables?.length || a.technicalMetadata?.tableCounts?.totalTables || 0;
          bValue = b.tables?.length || b.technicalMetadata?.tableCounts?.totalTables || 0;
          break;
        case 'fileExtensions':
          const aExts = new Set();
          if (a.format) {
            const format = a.format.toLowerCase();
            if (format.includes('parquet')) aExts.add('.parquet');
            if (format.includes('csv')) aExts.add('.csv');
            if (format.includes('json')) aExts.add('.json');
          }
          aValue = Array.from(aExts).join(', ') || 'N/A';
          
          const bExts = new Set();
          if (b.format) {
            const format = b.format.toLowerCase();
            if (format.includes('parquet')) bExts.add('.parquet');
            if (format.includes('csv')) bExts.add('.csv');
            if (format.includes('json')) bExts.add('.json');
          }
          bValue = Array.from(bExts).join(', ') || 'N/A';
          break;
        case 'size':
          aValue = a.size || 'N/A';
          bValue = b.size || 'N/A';
          // Try to parse size for numeric comparison
          const parseSize = (size) => {
            if (typeof size === 'string') {
              const match = size.match(/(\d+\.?\d*)\s*(TB|GB|MB|KB)/i);
              if (match) {
                const num = parseFloat(match[1]);
                const unit = match[2].toUpperCase();
                if (unit === 'TB') return num * 1000000;
                if (unit === 'GB') return num * 1000;
                if (unit === 'MB') return num;
                if (unit === 'KB') return num / 1000;
              }
            }
            return 0;
          };
          aValue = parseSize(a.size);
          bValue = parseSize(b.size);
          break;
        case 'type':
          const aType = a.feedType || (a.freshness && a.freshness !== 'one-time' ? 'Feed' : 'One Time');
          const bType = b.feedType || (b.freshness && b.freshness !== 'one-time' ? 'Feed' : 'One Time');
          aValue = aType === 'One Time' || aType === 'one-time' ? 'One Time' : 'Feed';
          bValue = bType === 'One Time' || bType === 'one-time' ? 'One Time' : 'Feed';
          break;
        case 'etlLoe':
          // Calculate ETL LOE for comparison
          const calcLoe = (product) => {
            let score = 0;
            const tables = product.tables || product.technicalMetadata?.tableCounts?.tables || [];
            score += Math.min(tables.length * 2, 20);
            const totalColumns = tables.reduce((sum, table) => sum + (table.schema?.length || 0), 0);
            score += Math.min(totalColumns * 0.1, 15);
            if (product.technicalMetadata?.mappings?.length > 0) {
              score += product.technicalMetadata.mappings.length * 3;
            }
            return Math.min(Math.round(score), 100);
          };
          aValue = calcLoe(a);
          bValue = calcLoe(b);
          break;
        case 'dataProducts':
          aValue = a.products?.length || 0;
          bValue = b.products?.length || 0;
          break;
        case 'jobStatus':
          // Get job status for comparison
          const getJobStatusValue = (product) => {
            if (!product.technicalMetadata?.jobStatuses || product.technicalMetadata.jobStatuses.length === 0) {
              return 0; // N/A = 0
            }
            const latestJob = product.technicalMetadata.jobStatuses[product.technicalMetadata.jobStatuses.length - 1];
            const status = latestJob.status?.toLowerCase() || '';
            if (status.includes('running') || status.includes('in progress') || status.includes('pending')) {
              return 1; // running
            } else if (status.includes('failed') || status.includes('error') || status.includes('failure')) {
              return 2; // failed
            } else if (status.includes('success') || status.includes('completed') || status.includes('done')) {
              return 3; // success
            }
            return 0; // N/A
          };
          aValue = getJobStatusValue(a);
          bValue = getJobStatusValue(b);
          break;
        case 'producer':
          aValue = (a.provider || a.producer || 'N/A').toLowerCase();
          bValue = (b.provider || b.producer || 'N/A').toLowerCase();
          break;
        default:
          return 0;
      }
      
      // Compare values
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortBy, sortOrder]);

  const paginatedProducts = sortedProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Memoize table rows to avoid recalculating on every render
  const tableRows = useMemo(() => {
    return paginatedProducts.map((product) => {
      // Count number of schemas (from tables)
      const numSchemas = product.tables?.length || 
                        product.technicalMetadata?.tableCounts?.totalTables || 
                        (product.technicalMetadata?.tableCounts?.tables?.length) || 0;
      
      // Extract languages from codeVersions or engines
      const languages = new Set();
      if (product.technicalMetadata?.codeVersions) {
        product.technicalMetadata.codeVersions.forEach(version => {
          if (version.language) languages.add(version.language);
        });
      }
      if (product.technicalMetadata?.engines) {
        product.technicalMetadata.engines.forEach(engine => {
          if (engine.language) languages.add(engine.language);
          // Also check engine name for common languages
          const engineName = engine.name?.toLowerCase() || '';
          if (engineName.includes('python')) languages.add('Python');
          if (engineName.includes('java')) languages.add('Java');
          if (engineName.includes('scala')) languages.add('Scala');
          if (engineName.includes('sql')) languages.add('SQL');
        });
      }
      const languagesList = Array.from(languages).join(', ') || 'N/A';
      
      // Count number of files (tables or files)
      const numFiles = product.tables?.length || 
                      product.technicalMetadata?.tableCounts?.totalTables || 
                      (product.technicalMetadata?.tableCounts?.tables?.length) || 0;
      
      // Extract file extensions from format or file paths
      const extensions = new Set();
      if (product.format) {
        const format = product.format.toLowerCase();
        if (format.includes('parquet')) extensions.add('.parquet');
        if (format.includes('csv')) extensions.add('.csv');
        if (format.includes('json')) extensions.add('.json');
        if (format.includes('avro')) extensions.add('.avro');
        if (format.includes('orc')) extensions.add('.orc');
        if (format.includes('delta')) extensions.add('.delta');
      }
      // Check table locations for file extensions
      if (product.tables) {
        product.tables.forEach(table => {
          if (table.s3Location) {
            const match = table.s3Location.match(/\.(\w+)(\?|$)/);
            if (match) extensions.add('.' + match[1]);
          }
        });
      }
      if (product.technicalMetadata?.tableCounts?.tables) {
        product.technicalMetadata.tableCounts.tables.forEach(table => {
          if (table.s3Location) {
            const match = table.s3Location.match(/\.(\w+)(\?|$)/);
            if (match) extensions.add('.' + match[1]);
          }
        });
      }
      const extensionsList = Array.from(extensions).join(', ') || 'N/A';
      
      // Get size of data
      const dataSize = product.size || 
                     product.technicalMetadata?.tableCounts?.tables?.reduce((sum, table) => {
                       // Try to parse size if it's a string like "800 MB"
                       return sum;
                     }, 0) || 'N/A';
      
      // Calculate row ratios [count x rows, count x rows, ...]
      const rowRatios = [];
      const rowCountMap = new Map();
      
      // Collect row counts from tables
      const allTables = product.tables || product.technicalMetadata?.tableCounts?.tables || [];
      allTables.forEach(table => {
        const rowCount = table.rowCount || table.row_count || table.rows || 0;
        if (rowCount > 0) {
          rowCountMap.set(rowCount, (rowCountMap.get(rowCount) || 0) + 1);
        }
      });
      
      // Format as [count x rows, count x rows, ...]
      rowCountMap.forEach((count, rows) => {
        rowRatios.push(`${count}x${rows.toLocaleString()}`);
      });
      
      const rowRatiosString = rowRatios.length > 0 
        ? `[${rowRatios.join(', ')}]` 
        : 'N/A';
      
      // Calculate ETL LOE Score based on complexity factors
      let etlLoeScore = 0;
      
      // Factor 1: Number of tables (more tables = more complexity)
      etlLoeScore += Math.min(numFiles * 2, 20);
      
      // Factor 2: Number of schemas/columns (more columns = more complexity)
      const totalColumns = allTables.reduce((sum, table) => {
        return sum + (table.schema?.length || 0);
      }, 0);
      etlLoeScore += Math.min(totalColumns * 0.1, 15);
      
      // Factor 3: Data transformations (mappings indicate transformations)
      if (product.technicalMetadata?.mappings?.length > 0) {
        etlLoeScore += product.technicalMetadata.mappings.length * 3;
      }
      
      // Factor 4: Multiple languages (indicates complex ETL)
      if (languages.size > 1) {
        etlLoeScore += languages.size * 2;
      }
      
      // Factor 5: Data size complexity (larger data = more effort)
      if (typeof dataSize === 'string') {
        const sizeMatch = dataSize.match(/(\d+\.?\d*)\s*(GB|TB|MB)/i);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2].toUpperCase();
          if (unit === 'TB') etlLoeScore += Math.min(size * 5, 25);
          else if (unit === 'GB') etlLoeScore += Math.min(size * 0.5, 15);
          else if (unit === 'MB') etlLoeScore += Math.min(size * 0.01, 5);
        }
      }
      
      // Cap the score at 100 and convert to S/M/L/XL scale
      etlLoeScore = Math.min(Math.round(etlLoeScore), 100);
      let etlLoeLabel = 'S';
      if (etlLoeScore >= 75) {
        etlLoeLabel = 'XL';
      } else if (etlLoeScore >= 50) {
        etlLoeLabel = 'L';
      } else if (etlLoeScore >= 25) {
        etlLoeLabel = 'M';
      } else {
        etlLoeLabel = 'S';
      }
      
      // Determine type (One Time or Feed)
      const feedType = product.feedType || (product.freshness && product.freshness !== 'one-time' ? 'Feed' : 'One Time');
      const productType = feedType === 'One Time' || feedType === 'one-time' || !product.freshness || product.freshness === 'one-time' 
        ? 'One Time' 
        : 'Feed';
      
      // Get job status from technicalMetadata.jobStatuses
      let jobStatus = 'N/A';
      if (product.technicalMetadata?.jobStatuses && product.technicalMetadata.jobStatuses.length > 0) {
        // Get the latest job status (last in array or most recent)
        const latestJob = product.technicalMetadata.jobStatuses[product.technicalMetadata.jobStatuses.length - 1];
        const status = latestJob.status?.toLowerCase() || '';
        
        // Map to running, failed, or success
        if (status.includes('running') || status.includes('in progress') || status.includes('pending')) {
          jobStatus = 'running';
        } else if (status.includes('failed') || status.includes('error') || status.includes('failure')) {
          jobStatus = 'failed';
        } else if (status.includes('success') || status.includes('completed') || status.includes('done')) {
          jobStatus = 'success';
        } else {
          jobStatus = 'N/A';
        }
      }
      
      // Get producer/provider
      const producer = product.provider || product.producer || 'N/A';
      
      return {
        product,
        numSchemas,
        languagesList,
        numFiles,
        extensionsList,
        dataSize,
        rowRatiosString,
        etlLoeLabel,
        productType,
        jobStatus,
        producer
      };
    });
  }, [paginatedProducts]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleCellHover = useCallback((event, content, title) => {
    event.stopPropagation(); // Prevent row click
    
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Only update if different to prevent unnecessary re-renders
    const newAnchorEl = event.currentTarget;
    setExpandedCell(prev => {
      if (prev.anchorEl !== newAnchorEl || prev.content !== content) {
        return {
        anchorEl: newAnchorEl,
        content: content,
        title: title
  };
      }
      return prev;
    });
  }, []);

  const handleCellLeave = useCallback((event) => {
    // Check if we're moving to the popover
    const relatedTarget = event.relatedTarget;
    
    // Check if relatedTarget is a valid DOM element
    let isMovingToPopover = false;
    if (relatedTarget && typeof relatedTarget.closest === 'function') {
      // Check multiple ways to detect popover
      isMovingToPopover = (
        relatedTarget.closest('[role="presentation"]') ||
        relatedTarget.closest('[data-popover-content]') ||
        relatedTarget.hasAttribute('data-popover-content') ||
        (relatedTarget.classList && relatedTarget.classList.contains('MuiPaper-root')) ||
        (relatedTarget.parentElement && typeof relatedTarget.parentElement.closest === 'function' && (
          relatedTarget.parentElement.closest('[role="presentation"]') ||
          relatedTarget.parentElement.closest('[data-popover-content]')
        ))
      );
    }
    
    if (!isMovingToPopover) {
      // Clear any existing timeout first
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      // Add a longer delay before closing to allow moving to popover
      hoverTimeoutRef.current = setTimeout(() => {
        // Double check that popover is still not being hovered
        const popoverElement = document.querySelector('[data-popover-content]');
        if (!popoverElement || !popoverElement.matches(':hover')) {
          setExpandedCell({ anchorEl: null, content: '', title: '' });
        }
        hoverTimeoutRef.current = null;
      }, 500);
    } else {
      // If moving to popover, clear any timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    }
  }, []);

  const handlePopoverEnter = useCallback((event) => {
    // Clear timeout when entering popover to keep it open
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Prevent the popover from closing
    event.stopPropagation();
  }, []);

  const handlePopoverLeave = useCallback(() => {
    // Clear timeout and close popover
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Add a small delay before closing to prevent accidental closes
    hoverTimeoutRef.current = setTimeout(() => {
      setExpandedCell({ anchorEl: null, content: '', title: '' });
      hoverTimeoutRef.current = null;
    }, 100);
  }, []);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
            Data Product Marketplace
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            Discover, explore, and access data products from across the organization
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterModalOpen(true)}
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.text,
              textTransform: 'none',
              minWidth: 120,
              '&:hover': {
                borderColor: currentTheme.primary,
                bgcolor: `${currentTheme.primary}10`,
              },
            }}
          >
            Filters
            {getActiveFilterCount() > 0 && (
              <Chip
                label={getActiveFilterCount()}
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  minWidth: 20,
                  bgcolor: currentTheme.primary,
                  color: currentTheme.background,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={triageView}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setTriageView(newValue);
                  // Save to sessionStorage
                  sessionStorage.setItem('dataProductTriageView', JSON.stringify(newValue));
                }}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: currentTheme.primary,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: currentTheme.primary,
                  },
                }}
              />
            }
            label="Triage View"
            sx={{
              color: currentTheme.text,
              ml: 1,
            }}
          />
        </Box>
        
        {/* Product Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

      {/* Filter Modal */}
      <Dialog
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: currentTheme.text,
          borderBottom: `1px solid ${currentTheme.border}`,
        }}>
          <Typography variant="h6">Filter Products</Typography>
          <IconButton
            onClick={() => setFilterModalOpen(false)}
            sx={{ color: currentTheme.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>

          {/* Models Filter */}
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1.5, fontWeight: 600 }}>
            Models
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 3 }}>
            {availableModels.length > 0 ? (
              availableModels.map((model) => (
                <FormControlLabel
                  key={model}
                  control={
                    <Checkbox
                      checked={selectedModels.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModels([...selectedModels, model]);
                        } else {
                          setSelectedModels(selectedModels.filter(m => m !== model));
                        }
                      }}
                      sx={{
                        color: currentTheme.primary,
                        '&.Mui-checked': {
              color: currentTheme.primary,
            },
                      }}
                    />
                  }
                  label={model}
                  sx={{ color: currentTheme.text, display: 'block', mb: 0.5 }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                No models available
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2, borderColor: currentTheme.border }} />

          {/* Producers Filter */}
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1.5, fontWeight: 600 }}>
            Producers
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 3 }}>
            {availableProducers.length > 0 ? (
              availableProducers.map((producer) => (
                <FormControlLabel
                  key={producer}
                  control={
                    <Checkbox
                      checked={selectedProducers.includes(producer)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducers([...selectedProducers, producer]);
                        } else {
                          setSelectedProducers(selectedProducers.filter(p => p !== producer));
                        }
                      }}
                      sx={{
                        color: currentTheme.primary,
                        '&.Mui-checked': {
                          color: currentTheme.primary,
                        },
                      }}
                    />
                  }
                  label={producer}
                  sx={{ color: currentTheme.text, display: 'block', mb: 0.5 }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                No producers available
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2, borderColor: currentTheme.border }} />

          {/* Platforms Filter */}
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1.5, fontWeight: 600 }}>
            Platforms
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 3 }}>
            {availablePlatforms.length > 0 ? (
              availablePlatforms.map((platform) => (
                <FormControlLabel
                  key={platform}
                  control={
                    <Checkbox
                      checked={selectedPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }
                      }}
                      sx={{
                        color: currentTheme.primary,
                        '&.Mui-checked': {
                          color: currentTheme.primary,
                        },
                      }}
                    />
                  }
                  label={platform}
                  sx={{ color: currentTheme.text, display: 'block', mb: 0.5 }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                No platforms available
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2, borderColor: currentTheme.border }} />

          {/* Feed Type Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: currentTheme.textSecondary }}>Feed Type</InputLabel>
            <Select
              value={selectedFeedType}
              label="Feed Type"
              onChange={(e) => setSelectedFeedType(e.target.value)}
              sx={{
                color: currentTheme.text,
                bgcolor: currentTheme.background,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: currentTheme.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: currentTheme.primary,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: currentTheme.primary,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: currentTheme.card,
                    '& .MuiMenuItem-root': {
                      color: currentTheme.text,
                      '&:hover': {
                        bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                      },
                      '&.Mui-selected': {
                        bgcolor: `${currentTheme.primary}20`,
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="feed">Feeds</MenuItem>
              <MenuItem value="one-time">One Time</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${currentTheme.border}` }}>
          <Button
            onClick={handleClearFilters}
            sx={{
              color: currentTheme.textSecondary,
              textTransform: 'none',
            }}
          >
            Clear All
          </Button>
          <Button
            onClick={() => setFilterModalOpen(false)}
            variant="contained"
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              textTransform: 'none',
              '&:hover': {
            bgcolor: currentTheme.primary,
          },
        }}
      >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Products View */}
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
          {!triageView ? (
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
          ) : (
            <>
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                bgcolor: currentTheme.card,
                border: `1px solid ${currentTheme.border}`,
                borderRadius: 2,
                overflowX: 'auto',
                '& .MuiTable-root': {
                  tableLayout: 'fixed',
                  width: '100%',
                },
              }}
            >
              <Table sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '12%',
                        px: 1,
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('id')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>ID</Typography>
                        {sortBy === 'id' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '8%',
                        px: 1,
                        textAlign: 'center',
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('numSchemas')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Schemas</Typography>
                        {sortBy === 'numSchemas' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '10%',
                        px: 1,
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('languages')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Languages</Typography>
                        {sortBy === 'languages' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '8%',
                        px: 1,
                        textAlign: 'center',
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('numFiles')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Files</Typography>
                        {sortBy === 'numFiles' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '10%',
                        px: 1,
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('fileExtensions')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Extensions</Typography>
                        {sortBy === 'fileExtensions' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '8%',
                        px: 1,
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('size')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Size</Typography>
                        {sortBy === 'size' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border, width: '11%', px: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Col:Row Ratio</Typography>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '12%',
                        px: 1,
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('dataProducts')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Data Products</Typography>
                        {sortBy === 'dataProducts' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '7%',
                        px: 1,
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('type')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Type</Typography>
                        {sortBy === 'type' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '8%',
                        px: 1,
                        textAlign: 'center',
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('etlLoe')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>ETL LOE</Typography>
                        {sortBy === 'etlLoe' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '8%',
                        px: 1,
                        textAlign: 'center',
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('jobStatus')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Job Status</Typography>
                        {sortBy === 'jobStatus' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: currentTheme.text, 
                        fontWeight: 600, 
                        borderColor: currentTheme.border,
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: '10%',
                        px: 1,
                        '&:hover': { bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                      }}
                      onClick={() => handleSort('producer')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Producer</Typography>
                        {sortBy === 'producer' && (sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />)}
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.map((rowData) => {
                    const { product, numSchemas, languagesList, numFiles, extensionsList, dataSize, rowRatiosString, etlLoeLabel, productType, jobStatus, producer } = rowData;
                    
                    return (
                      <TableRow
                        key={product.id}
                        onClick={() => handleViewProduct(product)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                      >
                        <TableCell 
                          sx={{ 
                            color: currentTheme.textSecondary, 
                            borderColor: currentTheme.border, 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem', 
                            width: '12%', 
                            px: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            }
                          }}
                          onMouseEnter={(e) => handleCellHover(e, product.id, 'ID')}
                          onMouseLeave={handleCellLeave}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                            }}
                          >
                            {product.id}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border, width: '8%', px: 1, textAlign: 'center' }}>
                          {numSchemas}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: currentTheme.text, 
                            borderColor: currentTheme.border, 
                            width: '10%', 
                            px: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            }
                          }}
                          onMouseEnter={(e) => handleCellHover(e, languagesList, 'Languages')}
                          onMouseLeave={handleCellLeave}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                            }}
                          >
                            {languagesList}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border, width: '8%', px: 1, textAlign: 'center' }}>
                          {numFiles}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: currentTheme.text, 
                            borderColor: currentTheme.border, 
                            width: '10%', 
                            px: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            }
                          }}
                          onMouseEnter={(e) => handleCellHover(e, extensionsList, 'File Extensions')}
                          onMouseLeave={handleCellLeave}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                            }}
                          >
                            {extensionsList}
                          </Typography>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: currentTheme.text, 
                            borderColor: currentTheme.border, 
                            width: '8%', 
                            px: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            }
                          }}
                          onMouseEnter={(e) => handleCellHover(e, dataSize, 'Size of Data')}
                          onMouseLeave={handleCellLeave}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                            }}
                          >
                            {dataSize}
                          </Typography>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: currentTheme.text, 
                            borderColor: currentTheme.border, 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem', 
                            width: '12%', 
                            px: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            }
                          }}
                          onMouseEnter={(e) => handleCellHover(e, rowRatiosString, 'Column to Row Ratio')}
                          onMouseLeave={handleCellLeave}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                            }}
                          >
                            {rowRatiosString}
                          </Typography>
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: currentTheme.text, 
                            borderColor: currentTheme.border, 
                            width: '15%', 
                            px: 1,
                            cursor: product.products && product.products.length > 0 ? 'pointer' : 'default',
                            '&:hover': product.products && product.products.length > 0 ? {
                              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            } : {}
                          }}
                          onMouseEnter={(e) => {
                            if (product.products && product.products.length > 0) {
                              handleCellHover(e, product.products.map(p => p.name || p.id).join(', '), 'Data Products');
                            }
                          }}
                          onMouseLeave={handleCellLeave}
                        >
                          {product.products && product.products.length > 0 ? (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.8rem',
                              }}
                            >
                              {product.products.map(p => p.name || p.id).join(', ')}
                            </Typography>
                          ) : (
                            '0'
                          )}
                        </TableCell>
                        <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border, width: '7%', px: 1 }}>
                          {productType}
                        </TableCell>
                        <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border, width: '9%', px: 1, textAlign: 'center' }}>
                          {etlLoeLabel}
                        </TableCell>
                        <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border, width: '8%', px: 1, textAlign: 'center' }}>
                          <Chip
                            label={jobStatus}
                            size="small"
                            sx={{
                              bgcolor: jobStatus === 'success'
                                ? `${currentTheme.success}15`
                                : jobStatus === 'running'
                                ? `${currentTheme.warning}15`
                                : jobStatus === 'failed'
                                ? `${currentTheme.error}15`
                                : `${currentTheme.textSecondary}15`,
                              color: jobStatus === 'success'
                                ? currentTheme.success
                                : jobStatus === 'running'
                                ? currentTheme.warning
                                : jobStatus === 'failed'
                                ? currentTheme.error
                                : currentTheme.textSecondary,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 20,
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            color: currentTheme.text, 
                            borderColor: currentTheme.border, 
                            width: '10%', 
                            px: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            }
                          }}
                          onMouseEnter={(e) => handleCellHover(e, producer, 'Producer')}
                          onMouseLeave={handleCellLeave}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                            }}
                          >
                            {producer}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Popover for displaying full content */}
            <Popover
              open={Boolean(expandedCell.anchorEl)}
              anchorEl={expandedCell.anchorEl}
              onClose={handlePopoverLeave}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              disableRestoreFocus
              disableAutoFocus
              disableEnforceFocus
              transitionDuration={0}
              sx={{
                pointerEvents: 'none',
              }}
              PaperProps={{
                onMouseEnter: handlePopoverEnter,
                onMouseLeave: handlePopoverLeave,
                onMouseMove: handlePopoverEnter,
                'data-popover-content': true,
                sx: {
                  bgcolor: currentTheme.card,
                  border: `1px solid ${currentTheme.border}`,
                  borderRadius: 2,
                  maxWidth: 400,
                  p: 2,
                  mt: 0.5, // Small gap to prevent cursor issues
                  pointerEvents: 'auto',
                },
              }}
            >
              <Box
                onMouseEnter={handlePopoverEnter}
                onMouseLeave={handlePopoverLeave}
                onMouseMove={handlePopoverEnter}
                sx={{
                  pointerEvents: 'auto',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
                  {expandedCell.title}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {expandedCell.content}
                </Typography>
              </Box>
            </Popover>
            </>
          )}

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
