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
  TableRow
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
  LibraryBooks as LibraryBooksIcon
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


  const getTrustworthinessColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return currentTheme.success;
      case 'medium': return currentTheme.warning;
      case 'low': return currentTheme.error;
      default: return currentTheme.textSecondary;
    }
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
            <Tab label="Lineage" />
          </Tabs>

          {/* Tab Content */}
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Schema
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                {product.description}
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 3, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <TableChartIcon sx={{ color: currentTheme.primary, mr: 1, fontSize: '1.5rem' }} />
                      <Typography variant="h6" sx={{ color: currentTheme.text }}>
                        Tables & Schemas
                      </Typography>
                      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" sx={{ color: currentTheme.primary }}>
                          {product.technicalMetadata?.tableCounts?.totalTables || product.tables?.length || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                          Total Tables
                        </Typography>
                      </Box>
                    </Box>
                    
                    {product.tables && product.tables.length > 0 ? (
                      <Box>
                        {product.tables.map((table, index) => {
                          const tableName = typeof table === 'string' ? table : table.name;
                          const tableSchema = typeof table === 'object' ? table.schema : null;
                          const s3Location = typeof table === 'object' && table.s3Location ? table.s3Location : `s3://data-catalog/${product.id}/${tableName}`;
                          const isExpanded = expandedTables[index];
                          
                          return (
                            <Accordion
                              key={index}
                              expanded={isExpanded}
                              onChange={() => handleTableToggle(index)}
                              sx={{
                                mb: 2,
                                bgcolor: currentTheme.background,
                                border: `1px solid ${currentTheme.border}`,
                                '&:before': { display: 'none' },
                                '&.Mui-expanded': {
                                  margin: '0 0 16px 0',
                                },
                              }}
                            >
                              <AccordionSummary
                                expandIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{
                                  bgcolor: currentTheme.card,
                                  borderBottom: isExpanded ? `1px solid ${currentTheme.border}` : 'none',
                                  '&:hover': {
                                    bgcolor: `${currentTheme.primary}05`,
                                  },
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <StorageIcon sx={{ color: currentTheme.primary, mr: 2, fontSize: '1.2rem' }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                                      {tableName}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                      S3: {s3Location}
                                    </Typography>
                                  </Box>
                                  {tableSchema && (
                                    <Chip
                                      label={`${tableSchema.length} columns`}
                                      size="small"
                                      sx={{
                                        bgcolor: `${currentTheme.primary}15`,
                                        color: currentTheme.primary,
                                        fontWeight: 500,
                                      }}
                                    />
                                  )}
                                </Box>
                              </AccordionSummary>
                              
                              <AccordionDetails sx={{ p: 0 }}>
                                {tableSchema && tableSchema.length > 0 ? (
                                  <Box sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 2 }}>
                                      Schema
                                    </Typography>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                                        Column Name
                                      </TableCell>
                                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                                        Source
                                      </TableCell>
                                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                                        Data Type
                                      </TableCell>
                                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                                        Description
                                      </TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {tableSchema.map((column, colIndex) => (
                                          <TableRow key={colIndex}>
                                            <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border }}>
                                              {column.name}
                                            </TableCell>
                                            <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border }}>
                                              <Chip
                                                label={column.source || 'Unknown'}
                                                size="small"
                                                sx={{
                                                  bgcolor: column.source === 'source' ? `${currentTheme.success}15` : `${currentTheme.primary}15`,
                                                  color: column.source === 'source' ? currentTheme.success : currentTheme.primary,
                                                  fontSize: '0.75rem',
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border }}>
                                              <Chip
                                                label={column.type}
                                                size="small"
                                                sx={{
                                                  bgcolor: `${currentTheme.primary}10`,
                                                  color: currentTheme.primary,
                                                  fontSize: '0.75rem',
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border }}>
                                              {column.description || 'No description'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </Box>
                                ) : (
                                  <Box sx={{ p: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                                      No schema information available
                                    </Typography>
                                  </Box>
                                )}
                              </AccordionDetails>
                            </Accordion>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <StorageIcon sx={{ color: currentTheme.textSecondary, fontSize: '3rem', mb: 2 }} />
                        <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
                          No tables available
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>
              </Grid>
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
                <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
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
                <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
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
              <Card variant="outlined" sx={{ mb: 3, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
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

              {/* Detailed Lineage Information */}
              <Grid container spacing={3}>
                {/* Upstream Sources Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Upstream Sources
              </Typography>
                  {product.technicalMetadata?.datasetLineage?.upstream?.length > 0 ? (
                    product.technicalMetadata.datasetLineage.upstream.map((source, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: currentTheme.text }}>
                          {source.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                          {source.type}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={source.status}
                          size="small"
                          sx={{
                            bgcolor: source.status === 'Active' ? `${currentTheme.success}15` : `${currentTheme.error}15`,
                            color: source.status === 'Active' ? currentTheme.success : currentTheme.error,
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mt: 1, display: 'block' }}>
                      Last Updated: {source.lastUpdated ? new Date(source.lastUpdated).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                      No upstream sources defined
                    </Typography>
                  )}
                </Grid>

                {/* Downstream Consumers Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Downstream Consumers
              </Typography>
                  {product.technicalMetadata?.datasetLineage?.downstream?.length > 0 ? (
                    product.technicalMetadata.datasetLineage.downstream.map((consumer, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" sx={{ color: currentTheme.text }}>
                          {consumer.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                          {consumer.type}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={consumer.status}
                          size="small"
                          sx={{
                            bgcolor: consumer.status === 'Active' ? `${currentTheme.success}15` : `${currentTheme.error}15`,
                            color: consumer.status === 'Active' ? currentTheme.success : currentTheme.error,
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mt: 1, display: 'block' }}>
                      Last Updated: {consumer.lastUpdated ? new Date(consumer.lastUpdated).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                      No downstream consumers defined
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                Code & Versions
              </Typography>
              <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
                Version history and code changes for this data product
              </Typography>

              {product.technicalMetadata?.codeVersions?.map((version, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
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
                            primaryTypographyProps={{ 
                              color: currentTheme.textSecondary,
                              fontSize: '0.875rem'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Commit: {version.commitHash}
                      </Typography>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                        Author: {version.author}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}



        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            {/* Product Info */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                  Product Information
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <PersonIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Provider"
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
                      <TagIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Version"
                      secondary={product.version || product.technicalMetadata?.currentVersion || '1.0.0'}
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
                      <ScheduleIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Updated"
                      secondary={product.lastUpdated ? new Date(product.lastUpdated).toLocaleDateString() : product.technicalMetadata?.lastUpdated ? new Date(product.technicalMetadata.lastUpdated).toLocaleDateString() : 'N/A'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <SecurityIcon sx={{ color: getTrustworthinessColor(product.trustworthiness) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Trustworthiness"
                      secondary={product.trustworthiness?.charAt(0).toUpperCase() + product.trustworthiness?.slice(1) || 'Unknown'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Related Entities */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
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
