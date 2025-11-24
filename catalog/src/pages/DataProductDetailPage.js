import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Breadcrumbs,
  Link,
  Avatar,
  Rating,
  Badge,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
  Notifications as NotificationsIcon,
  Bookmark as BookmarkIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Code as CodeIcon,
  Tag as TagIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TableChart as TableChartIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  LibraryBooks as LibraryBooksIcon,
  Work as WorkIcon,
  Verified as VerifiedIcon,
  Cloud as CloudIcon,
  AccountTree as AccountTreeIcon,
  Factory as FactoryIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchData } from '../services/api';
import LineageDiagram from '../components/LineageDiagram';

const DataProductDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { canEdit, canDelete } = useAuth();
  const { datasetId, productId, id: legacyId } = useParams();
  const id = productId || legacyId; // Use productId if available, otherwise legacyId
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [parentDataset, setParentDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorite, setFavorite] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedTables, setExpandedTables] = useState({});
  const [selectedVersion, setSelectedVersion] = useState('');
  const [relatedEntities, setRelatedEntities] = useState({
    dataModels: [],
    agreements: [],
    referenceData: [],
    dataPolicies: []
  });

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchData('dataProducts');
        
        if (productId && datasetId) {
          // URL: /data-products/:datasetId/products/:productId
          // Find the dataset first
          const foundDataset = data.dataProducts?.find(p => p.id === datasetId);
          if (foundDataset && foundDataset.type === 'dataset') {
            // Find the product within the dataset
            const childProduct = foundDataset.products?.find(p => p.id === productId);
            if (childProduct) {
              setProduct(childProduct);
              setParentDataset(foundDataset);
              setError(null);
            } else {
              setError('Product not found in dataset');
            }
          } else {
            setError('Dataset not found');
          }
        } else if (legacyId) {
          // Legacy URL: /data-products/:id
          // Check if this is a product within a dataset
          const parentDataset = data.dataProducts?.find(ds => 
            ds.type === 'dataset' && ds.products?.some(p => p.id === legacyId)
          );
          
          if (parentDataset) {
            const childProduct = parentDataset.products.find(p => p.id === legacyId);
            setProduct(childProduct);
            setParentDataset(parentDataset);
          } else {
            // Regular standalone product
            const foundProduct = data.dataProducts?.find(p => p.id === legacyId);
            if (foundProduct) {
              setProduct(foundProduct);
              setParentDataset(null);
            } else {
              setError('Product not found');
            }
          }
          setError(null);
        } else {
          setError('Invalid URL');
        }
      } catch (err) {
        setError('Failed to load product details');
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (datasetId || legacyId) {
      loadProduct();
    }
  }, [datasetId, productId, legacyId]);

  useEffect(() => {
    if (product) {
      const version = product.version || 
                      product.technicalMetadata?.codeVersions?.[0]?.version || 
                      product.technicalMetadata?.currentVersion || 
                      '1';
      const versionNum = typeof version === 'string' ? version.split('.')[0] : String(version);
      setSelectedVersion(versionNum);
    }
  }, [product]);

  // Load related entities when product changes
  useEffect(() => {
    const loadRelatedEntities = async () => {
      if (!product?.relatedEntities) return;

      try {
        const [modelsData, agreementsData, referenceData, policiesData] = await Promise.all([
          fetchData('models'),
          fetchData('dataAgreements'),
          fetchData('reference'),
          fetchData('policies')
        ]);

        const relatedEntitiesData = {
          dataModels: product.relatedEntities.dataModels?.map(modelId => 
            modelsData.models?.find(model => model.shortName === modelId)
          ).filter(Boolean) || [],
          agreements: product.relatedEntities.agreements?.map(agreementId => 
            agreementsData.agreements?.find(agreement => agreement.id === agreementId)
          ).filter(Boolean) || [],
          referenceData: product.relatedEntities.referenceData?.map(refId => 
            referenceData.items?.find(item => item.id === refId)
          ).filter(Boolean) || [],
          dataPolicies: product.relatedEntities.dataPolicies?.map(policyId => 
            policiesData.policies?.find(policy => policy.id === policyId)
          ).filter(Boolean) || []
        };

        setRelatedEntities(relatedEntitiesData);
      } catch (error) {
        console.error('Error loading related entities:', error);
      }
    };

    loadRelatedEntities();
  }, [product]);

  const handleFavoriteToggle = () => {
    setFavorite(!favorite);
  };

  const handleSubscribe = () => {
    console.log('Subscribing to data product:', product.id);
    // Implement subscription logic
  };

  const handleTableToggle = (tableIndex) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableIndex]: !prev[tableIndex]
    }));
  };



  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: currentTheme.background,
        }}
      >
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: currentTheme.background, minHeight: '100vh' }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: currentTheme.background, minHeight: '100vh' }}>
        <Alert severity="info" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Product not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: currentTheme.background, minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/data-products"
          sx={{ 
            color: currentTheme.textSecondary, 
            textDecoration: 'none',
            '&:hover': { color: currentTheme.primary }
          }}
        >
          Data Products
        </Link>
        {parentDataset && (
          <Link
            component={RouterLink}
            to={`/data-products/${parentDataset.id}`}
            sx={{ 
              color: currentTheme.textSecondary, 
              textDecoration: 'none',
              '&:hover': { color: currentTheme.primary }
            }}
          >
            {parentDataset.name}
          </Link>
        )}
        <Typography color={currentTheme.text}>
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    {product.name}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3, lineHeight: 1.6 }}>
                  {product.description}
                </Typography>

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StorageIcon sx={{ color: currentTheme.textSecondary, fontSize: '1.2rem' }} />
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      {product.size}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ color: currentTheme.textSecondary, fontSize: '1.2rem' }} />
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      Updated {product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>

              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 3 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={handleFavoriteToggle}
                  sx={{
                      color: favorite ? currentTheme.favorite : currentTheme.favoriteInactive,
                      border: `1px solid ${currentTheme.border}`,
                    '&:hover': {
                        bgcolor: `${currentTheme.primary}10`,
                    },
                  }}
                >
                    <StarIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleSubscribe}
                    sx={{
                      color: currentTheme.textSecondary,
                      border: `1px solid ${currentTheme.border}`,
                      '&:hover': {
                        bgcolor: `${currentTheme.primary}10`,
                      },
                    }}
                  >
                    <NotificationsIcon />
                  </IconButton>
                  <IconButton
                    sx={{
                      color: currentTheme.textSecondary,
                      border: `1px solid ${currentTheme.border}`,
                      '&:hover': {
                        bgcolor: `${currentTheme.primary}10`,
                      },
                    }}
                  >
                    <ShareIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Version Selector and Tabs */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
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
                '& .MuiInputLabel-root': {
                  color: currentTheme.textSecondary,
                  '&.Mui-focused': {
                    color: currentTheme.primary,
                  },
                },
                '& .MuiSvgIcon-root': {
                  color: currentTheme.textSecondary,
                },
              }}
            >
              <InputLabel>Version</InputLabel>
              <Select
                value={selectedVersion || (() => {
                  const version = product?.version || product?.technicalMetadata?.codeVersions?.[0]?.version || product?.technicalMetadata?.currentVersion || '1';
                  return typeof version === 'string' ? version.split('.')[0] : String(version);
                })()}
                label="Version"
                onChange={(e) => setSelectedVersion(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme.card,
                      border: `1px solid ${currentTheme.border}`,
                      '& .MuiMenuItem-root': {
                        color: currentTheme.text,
                        '&:hover': {
                          bgcolor: currentTheme.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        },
                        '&.Mui-selected': {
                          bgcolor: `${currentTheme.primary}20`,
                          '&:hover': {
                            bgcolor: `${currentTheme.primary}30`,
                          },
                        },
                      },
                    },
                  },
                }}
                sx={{
                  color: currentTheme.text,
                }}
              >
                {product?.technicalMetadata?.codeVersions?.map((version, index) => {
                  const versionNum = typeof version.version === 'string' ? version.version.split('.')[0] : String(version.version || '1');
                  return (
                    <MenuItem key={index} value={versionNum}>
                      {versionNum}
                    </MenuItem>
                  );
                }) || (
                  <MenuItem value={(() => {
                    const version = product?.version || product?.technicalMetadata?.currentVersion || '1';
                    return typeof version === 'string' ? version.split('.')[0] : String(version);
                  })()}>
                    {(() => {
                      const version = product?.version || product?.technicalMetadata?.currentVersion || '1';
                      return typeof version === 'string' ? version.split('.')[0] : String(version);
                    })()}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            sx={{
              borderBottom: `1px solid ${currentTheme.border}`,
              mb: 3,
              '& .MuiTab-root': {
                color: currentTheme.textSecondary,
                textTransform: 'none',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: currentTheme.primary,
                },
                '&:hover': {
                  color: currentTheme.primary,
                  bgcolor: `${currentTheme.primary}10`
                }
              },
              '& .MuiTabs-indicator': {
                bgcolor: currentTheme.primary,
              },
            }}
          >
            <Tab label="Schema" />
            <Tab label="Engines & Code" />
            <Tab label="Product Lineage" />
            <Tab label="Job Status" />
            <Tab label="Validation" />
            <Tab label="Mapping" />
          </Tabs>

          {/* Tab Content */}
          {selectedTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TableChartIcon sx={{ color: currentTheme.primary, fontSize: '1.75rem' }} />
                  <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                    Tables & Schemas
                  </Typography>
                  <Chip
                    label={`${product.technicalMetadata?.tableCounts?.totalTables || product.tables?.length || 0} tables`}
                    size="small"
                    sx={{
                      bgcolor: `${currentTheme.primary}15`,
                      color: currentTheme.primary,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 4 }}>
                {product.description}
              </Typography>

              {product.tables && product.tables.length > 0 ? (
                      <Box>
                        {product.tables.map((table, index) => {
                          const tableName = typeof table === 'string' ? table : table.name;
                          const tableSchema = typeof table === 'object' ? table.schema : null;
                          const s3Location = typeof table === 'object' && table.s3Location ? table.s3Location : `s3://data-catalog/${product.id}/${tableName}`;
                          const isExpanded = expandedTables[index];
                          const isLast = index === product.tables.length - 1;
                          
                          return (
                            <Box key={index} sx={{ mb: isLast ? 0 : 3 }}>
                              <Accordion
                                expanded={isExpanded}
                                onChange={() => handleTableToggle(index)}
                                sx={{
                                  bgcolor: currentTheme.card,
                                  border: `1px solid ${currentTheme.border}`,
                                  borderRadius: 2,
                                  boxShadow: 'none',
                                  '&:before': { display: 'none' },
                                  '&.Mui-expanded': {
                                    margin: 0,
                                  },
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={
                                    <Box
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: isExpanded ? `${currentTheme.primary}15` : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                          bgcolor: `${currentTheme.primary}20`,
                                        }
                                      }}
                                    >
                                      {isExpanded ? (
                                        <ExpandLessIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                                      ) : (
                                        <ExpandMoreIcon sx={{ color: currentTheme.textSecondary, fontSize: '1.2rem' }} />
                                      )}
                                    </Box>
                                  }
                                  sx={{
                                    bgcolor: 'transparent',
                                    px: 3,
                                    py: 2.5,
                                    minHeight: 'auto',
                                    '&.Mui-expanded': {
                                      minHeight: 'auto',
                                      borderBottom: `1px solid ${currentTheme.border}`,
                                    },
                                    '&:hover': {
                                      bgcolor: 'transparent',
                                    },
                                    '& .MuiAccordionSummary-content': {
                                      margin: 0,
                                      '&.Mui-expanded': {
                                        margin: 0,
                                      }
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                                    <Box
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: `${currentTheme.primary}12`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}
                                    >
                                      <TableChartIcon sx={{ color: currentTheme.primary, fontSize: '1.3rem' }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600, mb: 0.5 }}>
                                        {tableName}
                                      </Typography>
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: currentTheme.textSecondary,
                                          fontFamily: 'monospace',
                                          fontSize: '0.75rem',
                                          display: 'block',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {s3Location}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, mr: 2 }}>
                                    {tableSchema && (
                                      <Chip
                                        label={`${tableSchema.length} columns`}
                                        size="small"
                                        sx={{
                                          bgcolor: `${currentTheme.primary}15`,
                                          color: currentTheme.primary,
                                          fontWeight: 600,
                                          fontSize: '0.75rem',
                                          height: 24,
                                          transition: 'none',
                                          transform: 'none',
                                          '&:hover': {
                                            transform: 'none',
                                            scale: 1,
                                          }
                                          }}
                                        />
                                      )}
                                      {typeof table === 'object' && (table.rowCount || table.rows || table.row_count) && (
                                        <Chip
                                          label={`${(table.rowCount || table.rows || table.row_count)?.toLocaleString() || 'N/A'} rows`}
                                          size="small"
                                          sx={{
                                            bgcolor: `${currentTheme.success}15`,
                                            color: currentTheme.success,
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            height: 24,
                                        }}
                                      />
                                    )}
                                    </Box>
                                  </Box>
                                </AccordionSummary>
                              
                                <AccordionDetails sx={{ p: 0 }}>
                                  {tableSchema && tableSchema.length > 0 ? (
                                    <Box sx={{ p: 3, bgcolor: `${currentTheme.border}08` }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                                        Schema Columns
                                      </Typography>
                                        {typeof table === 'object' && (table.rowCount || table.rows || table.row_count) && (
                                          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                                            {`${(table.rowCount || table.rows || table.row_count)?.toLocaleString() || 'N/A'} rows`}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Box
                                        sx={{
                                          border: `1px solid ${currentTheme.border}`,
                                          borderRadius: 1,
                                          overflow: 'hidden',
                                          bgcolor: currentTheme.card
                                        }}
                                      >
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow sx={{ bgcolor: `${currentTheme.primary}08` }}>
                                              <TableCell sx={{ color: currentTheme.text, fontWeight: 700, borderColor: currentTheme.border, fontSize: '0.875rem', py: 1.5 }}>
                                                Column Name
                                              </TableCell>
                                              <TableCell sx={{ color: currentTheme.text, fontWeight: 700, borderColor: currentTheme.border, fontSize: '0.875rem', py: 1.5 }}>
                                                Source
                                              </TableCell>
                                              <TableCell sx={{ color: currentTheme.text, fontWeight: 700, borderColor: currentTheme.border, fontSize: '0.875rem', py: 1.5 }}>
                                                Data Type
                                              </TableCell>
                                              <TableCell sx={{ color: currentTheme.text, fontWeight: 700, borderColor: currentTheme.border, fontSize: '0.875rem', py: 1.5 }}>
                                                Description
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {tableSchema.map((column, colIndex) => (
                                              <TableRow 
                                                key={colIndex}
                                                sx={{
                                                  borderColor: currentTheme.border,
                                                  '&:not(:last-child)': {
                                                    borderBottom: `1px solid ${currentTheme.border}`
                                                  },
                                                  '&:hover': {
                                                    bgcolor: `${currentTheme.primary}05`,
                                                  }
                                                }}
                                              >
                                                <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border, fontWeight: 500, py: 1.5 }}>
                                                  {column.name}
                                                </TableCell>
                                                <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border, py: 1.5 }}>
                                                  <Chip
                                                    label={column.source || 'Unknown'}
                                                    size="small"
                                                    sx={{
                                                      bgcolor: column.source === 'source' ? `${currentTheme.success}15` : `${currentTheme.primary}15`,
                                                      color: column.source === 'source' ? currentTheme.success : currentTheme.primary,
                                                      fontSize: '0.7rem',
                                                      fontWeight: 500,
                                                      height: 22,
                                                    }}
                                                  />
                                                </TableCell>
                                                <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border, py: 1.5 }}>
                                                  <Chip
                                                    label={column.type}
                                                    size="small"
                                                    sx={{
                                                      bgcolor: `${currentTheme.primary}10`,
                                                      color: currentTheme.primary,
                                                      fontSize: '0.7rem',
                                                      fontWeight: 500,
                                                      height: 22,
                                                      fontFamily: 'monospace',
                                                    }}
                                                  />
                                                </TableCell>
                                                <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border, py: 1.5, fontSize: '0.875rem' }}>
                                                  {column.description || 'No description'}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: `${currentTheme.border}08` }}>
                                      <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                                        No schema information available
                                      </Typography>
                                    </Box>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <StorageIcon sx={{ color: currentTheme.textSecondary, fontSize: '3rem', mb: 2, opacity: 0.5 }} />
                        <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
                          No tables available
                        </Typography>
                      </Box>
                    )}
            </Box>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Engines & Code Details
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Technical specifications, processing engines, dataset statistics, and version history
              </Typography>

              {/* Processing Engines */}
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2, mt: 3 }}>
                Processing Engines
              </Typography>
              {product.technicalMetadata?.engines?.map((engine, index) => (
                <Card key={index} variant="outlined" sx={{ 
                  mb: 2, 
                  bgcolor: currentTheme.card, 
                  borderColor: currentTheme.border,
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: currentTheme.text }}>
                        {engine.name}
                      </Typography>
                      <Chip
                        label={engine.type}
                        size="small"
                        sx={{
                          bgcolor: `${currentTheme.primary}15`,
                          color: currentTheme.primary,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                      Version: {engine.version}
                    </Typography>
                    {engine.configuration && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1 }}>
                          Configuration:
                        </Typography>
                        <List dense>
                          {Object.entries(engine.configuration).map(([key, value]) => (
                            <ListItem key={key} sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                primary={`${key}: ${value}`}
                                primaryTypographyProps={{ color: currentTheme.textSecondary, fontSize: '0.875rem' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}


              {/* Code & Versions Section */}
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2, mt: 4 }}>
                Code & Versions
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Version history and code changes for this data product
                    </Typography>

              {product.technicalMetadata?.codeVersions?.map((version, index) => (
                <Card key={index} variant="outlined" sx={{ 
                  mb: 2, 
                  bgcolor: currentTheme.card, 
                  borderColor: currentTheme.border,
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: currentTheme.text }}>
                        Version {version.version}
                    </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={version.status}
                          size="small"
                          sx={{
                            bgcolor: version.status === 'Production' ? `${currentTheme.success}15` : `${currentTheme.warning}15`,
                            color: version.status === 'Production' ? currentTheme.success : currentTheme.warning,
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                      Released: {version.releaseDate ? new Date(version.releaseDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    
                    <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1 }}>
                      Changes:
                      </Typography>
                    <List dense>
                      {version.changes?.map((change, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: '24px' }}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: currentTheme.primary,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={change}
                            primaryTypographyProps={{ color: currentTheme.textSecondary, fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    {version.codeRepository && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1 }}>
                          Repository:
                      </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: currentTheme.primary, 
                            textDecoration: 'none',
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => window.open(version.codeRepository, '_blank')}
                        >
                          {version.codeRepository}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                    </Card>
              ))}

              {(!product.technicalMetadata?.codeVersions || product.technicalMetadata.codeVersions.length === 0) && (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                  No version history available
                </Typography>
              )}
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Data Lineage
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Visual representation of upstream sources and downstream consumers of this data product
              </Typography>

              {/* Mermaid Lineage Diagram */}
              <Card variant="outlined" sx={{ 
                mb: 3, 
                bgcolor: currentTheme.card, 
                borderColor: currentTheme.border,
                '&:hover': {
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <LineageDiagram
                    upstream={product.technicalMetadata?.datasetLineage?.upstream || []}
                    downstream={product.technicalMetadata?.datasetLineage?.downstream || []}
                    currentItem={{
                      name: product.name,
                      type: product.format || 'Data Product'
                    }}
                    currentTheme={currentTheme}
                    height="400px"
                  />
                </CardContent>
              </Card>
            </Box>
          )}

          {selectedTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <WorkIcon sx={{ color: currentTheme.primary, fontSize: '1.75rem' }} />
                <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                  Job Status
              </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Monitor the status and execution history of data processing jobs for this product
              </Typography>

              {product.technicalMetadata?.jobStatuses && product.technicalMetadata.jobStatuses.length > 0 ? (
                <Box>
                  {product.technicalMetadata.jobStatuses.map((job, index) => (
                    <Card 
                      key={index}
                      variant="outlined" 
                      sx={{ 
                  mb: 2, 
                  bgcolor: currentTheme.card, 
                  borderColor: currentTheme.border,
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                      }}
                    >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 1 }}>
                              {job.name || `Job ${index + 1}`}
                      </Typography>
                            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                              {job.description || 'No description available'}
                            </Typography>
                          </Box>
                        <Chip
                            label={job.status || 'Unknown'}
                          size="small"
                          sx={{
                              bgcolor: job.status === 'Completed' || job.status === 'Success' 
                                ? `${currentTheme.success}15` 
                                : job.status === 'Running' || job.status === 'In Progress'
                                ? `${currentTheme.warning}15`
                                : job.status === 'Failed' || job.status === 'Error'
                                ? `${currentTheme.error}15`
                                : `${currentTheme.primary}15`,
                              color: job.status === 'Completed' || job.status === 'Success'
                                ? currentTheme.success
                                : job.status === 'Running' || job.status === 'In Progress'
                                ? currentTheme.warning
                                : job.status === 'Failed' || job.status === 'Error'
                                ? currentTheme.error
                                : currentTheme.primary,
                              fontWeight: 600,
                          }}
                        />
                      </Box>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {job.jobId && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                <strong>Job ID:</strong> {job.jobId}
                              </Typography>
                            </Grid>
                          )}
                          {job.startTime && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                <strong>Start Time:</strong> {new Date(job.startTime).toLocaleString()}
                              </Typography>
                            </Grid>
                          )}
                          {job.endTime && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                <strong>End Time:</strong> {new Date(job.endTime).toLocaleString()}
                              </Typography>
                            </Grid>
                          )}
                          {job.duration && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                <strong>Duration:</strong> {job.duration}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>

                        {job.error && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            {job.error}
                          </Alert>
                        )}

                        {job.logs && job.logs.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1 }}>
                              Logs:
                            </Typography>
                            <Box sx={{ 
                              bgcolor: currentTheme.background, 
                              p: 2, 
                              borderRadius: 1,
                              maxHeight: 200,
                              overflow: 'auto',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem'
                            }}>
                              {job.logs.map((log, logIndex) => (
                                <Typography key={logIndex} variant="body2" sx={{ color: currentTheme.textSecondary, mb: 0.5 }}>
                                  {log}
                                </Typography>
                              ))}
                    </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Card variant="outlined" sx={{ 
                  bgcolor: currentTheme.card, 
                  borderColor: currentTheme.border,
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <WorkIcon sx={{ fontSize: '3rem', color: currentTheme.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                      No job statuses available
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {selectedTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <VerifiedIcon sx={{ color: currentTheme.primary, fontSize: '1.75rem' }} />
                <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                  Validation
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Data quality validation results and compliance checks for this product
                    </Typography>
                    
              {product.technicalMetadata?.validations && product.technicalMetadata.validations.length > 0 ? (
                <Box>
                  {product.technicalMetadata.validations.map((validation, index) => (
                    <Card 
                      key={index}
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        bgcolor: currentTheme.card, 
                        borderColor: currentTheme.border,
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 1 }}>
                              {validation.name || `Validation ${index + 1}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                              {validation.description || 'No description available'}
                            </Typography>
                          </Box>
                          <Chip
                            icon={validation.passed ? <CheckCircleIcon /> : <WarningIcon />}
                            label={validation.passed ? 'Passed' : 'Failed'}
                            size="small"
                            sx={{
                              bgcolor: validation.passed 
                                ? `${currentTheme.success}15` 
                                : `${currentTheme.error}15`,
                              color: validation.passed 
                                ? currentTheme.success 
                                : currentTheme.error,
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {validation.type && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                <strong>Type:</strong> {validation.type}
                              </Typography>
                            </Grid>
                          )}
                          {validation.timestamp && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                <strong>Timestamp:</strong> {new Date(validation.timestamp).toLocaleString()}
                              </Typography>
                            </Grid>
                          )}
                          {validation.validator && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                <strong>Validator:</strong> {validation.validator}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>

                        {validation.results && validation.results.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1 }}>
                              Results:
                    </Typography>
                    <List dense>
                              {validation.results.map((result, resultIndex) => (
                                <ListItem key={resultIndex} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: '24px' }}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                        bgcolor: result.passed ? currentTheme.success : currentTheme.error,
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText 
                                    primary={result.check || 'Validation check'}
                                    secondary={result.message || ''}
                            primaryTypographyProps={{ 
                                      color: currentTheme.text, 
                              fontSize: '0.875rem'
                            }}
                                    secondaryTypographyProps={{ 
                                      color: currentTheme.textSecondary, 
                                      fontSize: '0.75rem' 
                                    }}
                          />
                        </ListItem>
                      ))}
                    </List>
                          </Box>
                        )}

                        {validation.issues && validation.issues.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Issues Found:
                      </Typography>
                            <List dense>
                              {validation.issues.map((issue, issueIndex) => (
                                <ListItem key={issueIndex} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemText
                                    primary={issue}
                                    primaryTypographyProps={{ 
                                      color: currentTheme.text, 
                                      fontSize: '0.875rem' 
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}
                  </CardContent>
                </Card>
              ))}
                </Box>
              ) : (
                <Card variant="outlined" sx={{ 
                  bgcolor: currentTheme.card, 
                  borderColor: currentTheme.border,
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <VerifiedIcon sx={{ fontSize: '3rem', color: currentTheme.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                      No validation results available
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {selectedTab === 5 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <AccountTreeIcon sx={{ color: currentTheme.primary, fontSize: '1.75rem' }} />
                <Typography variant="h5" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                  Mapping
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Data mapping and transformation rules for this product
              </Typography>
              
              {product.technicalMetadata?.mappings && product.technicalMetadata.mappings.length > 0 ? (
                <Box>
                  {product.technicalMetadata.mappings.map((mapping, index) => (
                    <Card 
                      key={index}
                      variant="outlined" 
                      sx={{ 
                        mb: 2, 
                        bgcolor: currentTheme.card, 
                        borderColor: currentTheme.border,
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 1 }}>
                              {mapping.name || `Mapping ${index + 1}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 1 }}>
                              {mapping.description || 'No description available'}
                            </Typography>
                          </Box>
                          {mapping.status && (
                            <Chip
                              label={mapping.status}
                              size="small"
                              sx={{
                                bgcolor: mapping.status === 'Active' 
                                  ? `${currentTheme.success}15` 
                                  : `${currentTheme.textSecondary}15`,
                                color: mapping.status === 'Active' 
                                  ? currentTheme.success 
                                  : currentTheme.textSecondary,
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>

                        {mapping.sourceFields && mapping.sourceFields.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                              Source Fields
                            </Typography>
                            <List dense>
                              {mapping.sourceFields.map((field, fieldIndex) => (
                                <ListItem key={fieldIndex} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemText 
                                    primary={field.name || field}
                                    secondary={field.type || ''}
                                    primaryTypographyProps={{ 
                                      color: currentTheme.text, 
                                      fontSize: '0.875rem'
                                    }}
                                    secondaryTypographyProps={{ 
                                      color: currentTheme.textSecondary, 
                                      fontSize: '0.75rem' 
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {mapping.targetFields && mapping.targetFields.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                              Target Fields
                            </Typography>
                            <List dense>
                              {mapping.targetFields.map((field, fieldIndex) => (
                                <ListItem key={fieldIndex} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemText 
                                    primary={field.name || field}
                                    secondary={field.type || ''}
                                    primaryTypographyProps={{ 
                                      color: currentTheme.text, 
                                      fontSize: '0.875rem'
                                    }}
                                    secondaryTypographyProps={{ 
                                      color: currentTheme.textSecondary, 
                                      fontSize: '0.75rem' 
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}

                        {mapping.transformationRules && mapping.transformationRules.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                              Transformation Rules
                            </Typography>
                            <List dense>
                              {mapping.transformationRules.map((rule, ruleIndex) => (
                                <ListItem key={ruleIndex} sx={{ py: 0.5, px: 0 }}>
                                  <ListItemIcon>
                                    <CheckCircleIcon sx={{ color: currentTheme.primary, fontSize: '1rem' }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={typeof rule === 'string' ? rule : rule.description || rule.rule}
                                    primaryTypographyProps={{ 
                                      color: currentTheme.text, 
                                      fontSize: '0.875rem'
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Card variant="outlined" sx={{ 
                  bgcolor: currentTheme.card, 
                  borderColor: currentTheme.border,
                  '&:hover': {
                    transform: 'none',
                    boxShadow: 'none'
                  }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <AccountTreeIcon sx={{ fontSize: '3rem', color: currentTheme.textSecondary, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                      No mapping information available
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box>
            {/* Product Info */}
            <Card variant="outlined" sx={{ 
              mb: 3, 
              bgcolor: currentTheme.card, 
              borderColor: currentTheme.border,
              '&:hover': {
                transform: 'none',
                boxShadow: 'none'
              }
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                  Product Information
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <FactoryIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Producer"
                      secondary={parentDataset?.provider || 'Unknown'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CategoryIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Category"
                      secondary={parentDataset?.category || 'Data Product'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <ScheduleIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Feed Type"
                      secondary={parentDataset?.feedType || product.feedType || 'One Time'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <StorageIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Format"
                      secondary={product.technicalMetadata?.format || product.format || 'Parquet'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CloudIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Platform"
                      secondary={parentDataset?.platform || product.platform || 'Not specified'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <ScheduleIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Data Freshness"
                      secondary={product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : product.technicalMetadata?.lastUpdated ? new Date(product.technicalMetadata.lastUpdated).toLocaleDateString() : 'N/A'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Related Entities */}
            <Card variant="outlined" sx={{ 
              mb: 3, 
              bgcolor: currentTheme.card, 
              borderColor: currentTheme.border,
              '&:hover': {
                transform: 'none',
                boxShadow: 'none'
              }
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                  Related Entities
                </Typography>
                <List dense>
                  {/* Data Models */}
                  {relatedEntities.dataModels.length > 0 && (
                    <>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: currentTheme.primary, fontWeight: 'bold' }}>
                          Data Models
                        </Typography>
                      </ListItem>
                      {relatedEntities.dataModels.map((model, index) => (
                        <ListItem 
                      key={index}
                      sx={{
                            px: 2, 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: `${currentTheme.primary}10` },
                            borderRadius: 1
                          }}
                          onClick={() => navigate(`/models/${model.shortName.toLowerCase()}`)}
                        >
                          <ListItemIcon>
                            <StorageIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={model.name}
                            secondary={`${model.shortName} • v${model.version}`}
                            primaryTypographyProps={{ color: currentTheme.text, fontSize: '0.9rem' }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary, fontSize: '0.8rem' }}
                          />
                        </ListItem>
                      ))}
                    </>
                  )}

                  {/* Data Agreements */}
                  {relatedEntities.agreements.length > 0 && (
                    <>
                      <ListItem sx={{ px: 0, py: 1, mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: currentTheme.primary, fontWeight: 'bold' }}>
                          Data Agreements
                        </Typography>
                      </ListItem>
                      {relatedEntities.agreements.map((agreement, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            px: 2, 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: `${currentTheme.primary}10` },
                            borderRadius: 1
                          }}
                          onClick={() => navigate(`/agreements/${agreement.id}`)}
                        >
                          <ListItemIcon>
                            <DescriptionIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={agreement.name}
                            secondary={`v${agreement.contractVersion} • ${agreement.status}`}
                            primaryTypographyProps={{ color: currentTheme.text, fontSize: '0.9rem' }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary, fontSize: '0.8rem' }}
                          />
                        </ListItem>
                      ))}
                    </>
                  )}

                  {/* Reference Data */}
                  {relatedEntities.referenceData.length > 0 && (
                    <>
                      <ListItem sx={{ px: 0, py: 1, mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: currentTheme.primary, fontWeight: 'bold' }}>
                          Reference Data
                        </Typography>
                      </ListItem>
                      {relatedEntities.referenceData.map((ref, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            px: 2, 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: `${currentTheme.primary}10` },
                            borderRadius: 1
                          }}
                          onClick={() => navigate(`/reference/${ref.id}`)}
                        >
                          <ListItemIcon>
                            <LibraryBooksIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={ref.name}
                            secondary={`${ref.category} • v${ref.version}`}
                            primaryTypographyProps={{ color: currentTheme.text, fontSize: '0.9rem' }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary, fontSize: '0.8rem' }}
                          />
                        </ListItem>
                      ))}
                    </>
                  )}

                  {/* Data Policies */}
                  {relatedEntities.dataPolicies.length > 0 && (
                    <>
                      <ListItem sx={{ px: 0, py: 1, mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: currentTheme.primary, fontWeight: 'bold' }}>
                          Data Policies
                        </Typography>
                      </ListItem>
                      {relatedEntities.dataPolicies.map((policy, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            px: 2, 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: `${currentTheme.primary}10` },
                            borderRadius: 1
                          }}
                          onClick={() => navigate(`/policies/${policy.id}`)}
                        >
                          <ListItemIcon>
                            <SecurityIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={policy.name}
                            secondary={`${policy.type} • ${policy.status}`}
                            primaryTypographyProps={{ color: currentTheme.text, fontSize: '0.9rem' }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary, fontSize: '0.8rem' }}
                          />
                        </ListItem>
                      ))}
                    </>
                  )}

                  {/* No related entities message */}
                  {relatedEntities.dataModels.length === 0 && 
                   relatedEntities.agreements.length === 0 && 
                   relatedEntities.referenceData.length === 0 && 
                   relatedEntities.dataPolicies.length === 0 && (
                    <ListItem sx={{ px: 0 }}>
                      <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                        No related entities
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>

          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DataProductDetailPage;
