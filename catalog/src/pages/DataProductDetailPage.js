import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  alpha,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Code as CodeIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import datasetsData from '../data/datasets.json';
import dataProductsData from '../data/dataProducts.json';
import pipelinesData from '../data/pipelines.json';
import modelsData from '../data/models.json';
import dataAgreementsData from '../data/dataAgreements.json';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import MermaidDiagram from '../components/MermaidDiagram';
import ProductAgreementCard from '../components/ProductAgreementCard';
import catalogImage from '../imgs/catalog.png';
import org1Image from '../imgs/org1.png';
import org2Image from '../imgs/org2.png';

const DataProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [dataModels, setDataModels] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [sourceDatasets, setSourceDatasets] = useState([]);
  const [childDatasets, setChildDatasets] = useState([]);
  const [allDerivedProducts, setAllDerivedProducts] = useState([]);
  const [derivedSearchQuery, setDerivedSearchQuery] = useState('');
  const [derivedProductsModalOpen, setDerivedProductsModalOpen] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const products = dataProductsData.products || dataProductsData.items || [];
        const foundProduct = products.find(p => p.id === id);
        
        if (!foundProduct) {
          setError('Data product not found');
          return;
        }
        
        setProduct(foundProduct);
        
        // Load linked agreement if agreementId exists
        if (foundProduct.agreementId) {
          try {
            const agreements = dataAgreementsData.agreements || dataAgreementsData || [];
            const foundAgreement = agreements.find(a => a.id === foundProduct.agreementId);
            if (foundAgreement) {
              setAgreement(foundAgreement);
            }
          } catch (err) {
            console.error('Error loading agreement:', err);
            // Don't fail the whole page if agreement can't be loaded
          }
        }

        // Load data models if dataSources exist
        if (foundProduct.dataSources && foundProduct.dataSources.length > 0) {
          try {
            const models = Array.isArray(modelsData) ? modelsData : (modelsData.models || []);
            const matchedModels = foundProduct.dataSources
              .map(source => {
                // Try to find model by shortName (case-insensitive)
                const model = models.find(m => 
                  m.shortName && m.shortName.toLowerCase() === source.toLowerCase()
                );
                return model ? { ...model, sourceName: source } : null;
              })
              .filter(Boolean);
            setDataModels(matchedModels);
          } catch (err) {
            console.error('Error loading data models:', err);
            // Don't fail the whole page if models can't be loaded
          }
        }

        // Load pipelines if pipelines field exists
        if (foundProduct.pipelines && foundProduct.pipelines.length > 0) {
          try {
            const allPipelines = Array.isArray(pipelinesData) ? pipelinesData : (pipelinesData.pipelines || []);
            const matchedPipelines = foundProduct.pipelines
              .map(pipelineUuid => {
                const pipeline = allPipelines.find(p => p.uuid === pipelineUuid);
                return pipeline || null;
              })
              .filter(Boolean);
            setPipelines(matchedPipelines);
          } catch (err) {
            console.error('Error loading pipelines:', err);
            // Don't fail the whole page if pipelines can't be loaded
          }
        }

        // Load source datasets based on product type
        if (foundProduct.productType) {
          try {
            const allDatasets = Array.isArray(datasetsData) ? datasetsData : [];
            
            if (foundProduct.productType === 'Aggregate' && foundProduct.sourceDatasets) {
              // Multiple source datasets for Aggregate
              const matchedDatasets = foundProduct.sourceDatasets
                .map(datasetId => {
                  const dataset = allDatasets.find(d => d.id === datasetId);
                  return dataset || null;
                })
                .filter(Boolean);
              setSourceDatasets(matchedDatasets);
            } else if (foundProduct.productType === 'Derived' && foundProduct.sourceDataset) {
              // Single source dataset for Derived
              const dataset = allDatasets.find(d => d.id === foundProduct.sourceDataset);
              if (dataset) {
                setSourceDatasets([dataset]);
              }
            }

            // Load child datasets for Child products
            if (foundProduct.productType === 'Child' && foundProduct.childDatasets) {
              const matchedChildDatasets = foundProduct.childDatasets
                .map(datasetId => {
                  const dataset = allDatasets.find(d => d.id === datasetId);
                  return dataset || null;
                })
                .filter(Boolean);
              setChildDatasets(matchedChildDatasets);
            }
          } catch (err) {
            console.error('Error loading source datasets:', err);
            // Don't fail the whole page if datasets can't be loaded
          }
        }

        // Load all derived products for search component
        if (foundProduct.productType === 'Derived') {
          try {
            const allProducts = dataProductsData.products || dataProductsData.items || [];
            const derivedProducts = allProducts.filter(p => 
              p.productType === 'Derived' && p.id !== foundProduct.id
            );
            setAllDerivedProducts(derivedProducts);
          } catch (err) {
            console.error('Error loading derived products:', err);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading data product:', err);
        setError('Failed to load data product');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'deprecated':
        return 'error';
      default:
        return 'default';
    }
  };

  const getQualityColor = (score) => {
    if (score >= 95) return 'success';
    if (score >= 85) return 'warning';
    return 'error';
  };

  const calculateFreshness = () => {
    if (!product?.lastUpdated) return null;
    try {
      const lastUpdated = new Date(product.lastUpdated);
      const now = new Date();
      const diffMs = now - lastUpdated;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'Just now';
      }
    } catch (e) {
      return product.lastUpdated;
    }
  };

  const getFreshnessPercent = () => {
    if (!product?.lastUpdated) return 0;
    try {
      const lastUpdated = new Date(product.lastUpdated);
      const now = new Date();
      const diffMs = now - lastUpdated;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 100;
      if (diffDays === 1) return 80;
      if (diffDays === 2) return 60;
      if (diffDays === 3) return 40;
      return 20;
    } catch (e) {
      return 0;
    }
  };

  const getFreshnessColor = () => {
    if (!product?.lastUpdated) return '#9e9e9e';
    try {
      const lastUpdated = new Date(product.lastUpdated);
      const now = new Date();
      const diffMs = now - lastUpdated;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) return '#4caf50';
      if (diffDays <= 3) return '#ff9800';
      return '#f44336';
    } catch (e) {
      return '#9e9e9e';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: currentTheme.primary }} />
        </Box>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error || 'Data product not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton
          onClick={() => navigate('/data-products')}
          sx={{
            color: currentTheme.textSecondary,
            '&:hover': {
              color: currentTheme.primary,
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, flex: 1 }}>
              {product.name}
            </Typography>
            {(() => {
              const getOrgImage = (org) => {
                if (!org) return null;
                const orgLower = String(org).toLowerCase().trim();
                if (orgLower === 'org1' || orgLower === 'organization1' || orgLower === '1') {
                  return org1Image;
                }
                if (orgLower === 'org2' || orgLower === 'organization2' || orgLower === '2') {
                  return org2Image;
                }
                return null;
              };
              const orgImage = getOrgImage(product.organization || product.org);
              return orgImage ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: currentTheme.background,
                    border: `1px solid ${currentTheme.border}`,
                    overflow: 'hidden',
                    ml: 2,
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={orgImage}
                    alt={product.organization || product.org || 'Organization'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ) : null;
            })()}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={product.status || 'unknown'}
              color={getStatusColor(product.status)}
              size="small"
            />
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                sx={{
                  backgroundColor: currentTheme.background,
                  color: currentTheme.text,
                }}
              />
            )}
            {product.version && (
              <Chip
                label={`v${product.version}`}
                size="small"
                sx={{
                  backgroundColor: currentTheme.background,
                  color: currentTheme.textSecondary,
                }}
              />
            )}
            {product.productType && (
              <Chip
                label={product.productType}
                size="small"
                sx={{
                  backgroundColor: currentTheme.primary + '20',
                  color: currentTheme.primary,
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Metrics */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              height: '100%',
            }}
          >
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 3, fontWeight: 600 }}>
              Metrics
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Quality Score */}
              {product.qualityScore !== undefined && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      Quality Score
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: getQualityColor(product.qualityScore) === 'success' ? '#2ecc71' :
                               getQualityColor(product.qualityScore) === 'warning' ? '#f59e0b' : '#e74c3c',
                        fontWeight: 600,
                      }}
                    >
                      {product.qualityScore}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={product.qualityScore}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: currentTheme.background,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getQualityColor(product.qualityScore) === 'success' ? '#2ecc71' :
                                         getQualityColor(product.qualityScore) === 'warning' ? '#f59e0b' : '#e74c3c',
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}

              {/* Data Freshness */}
              {product.lastUpdated && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      Data Freshness
                    </Typography>
                    <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                      {calculateFreshness()}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getFreshnessPercent()}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: currentTheme.background,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getFreshnessColor(),
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}

              {/* Owner */}
              {product.owner && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 0.5 }}>
                    Producer
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                    {product.owner}
                  </Typography>
                </Box>
              )}

              {/* Consumers */}
              {product.consumers && product.consumers.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Consumers
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {product.consumers.map((consumer, idx) => (
                      <Chip
                        key={idx}
                        label={consumer}
                        size="small"
                        sx={{
                          backgroundColor: currentTheme.primary + '20',
                          color: currentTheme.primary,
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Data Models */}
              {dataModels.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Data Models
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {dataModels.map((model, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        onClick={() => navigate(`/models/${model.shortName}`)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: currentTheme.card,
                          border: `1px solid ${currentTheme.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          flex: '1 1 calc(50% - 8px)',
                          minWidth: 0,
                          '&:hover': {
                            borderColor: '#37ABBF',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: currentTheme.text,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                              flex: 1,
                              minWidth: 0,
                              pr: 1,
                            }}
                          >
                            {model.name}
                          </Typography>
                          <Chip
                            label={model.shortName || model.sourceName}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: currentTheme.primary + '20',
                              color: currentTheme.primary,
                              flexShrink: 0,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: currentTheme.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            fontSize: '0.7rem',
                          }}
                        >
                          {model.description || 'No description available.'}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}
              {/* Fallback: Show chips if no models found but dataSources exist */}
              {dataModels.length === 0 && product.dataSources && product.dataSources.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Data Models
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {product.dataSources.map((source, idx) => (
                      <Chip
                        key={idx}
                        label={source}
                        size="small"
                        sx={{
                          backgroundColor: currentTheme.primary + '20',
                          color: currentTheme.primary,
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Pipelines - Hidden for Derived products since they have pipeline buttons in cards */}
              {pipelines.length > 0 && product?.productType !== 'Derived' && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Pipelines
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {pipelines.map((pipeline, idx) => (
                        <Paper
                          key={idx}
                          elevation={0}
                          onClick={async () => {
                            try {
                              const datasets = Array.isArray(datasetsData) ? datasetsData : [];
                              const dataset = datasets.find(d => d.systems && d.systems.includes(pipeline.uuid));
                              if (dataset) {
                                navigate(`/pipelines/datasets/${dataset.id}?pipeline=${pipeline.uuid}`);
                              } else {
                                navigate('/pipelines');
                              }
                            } catch (err) {
                              console.error('Error finding dataset for pipeline:', err);
                              navigate('/pipelines');
                            }
                          }}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: currentTheme.card,
                            border: `1px solid ${currentTheme.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            flex: '1 1 calc(50% - 8px)',
                            minWidth: 0,
                            '&:hover': {
                              borderColor: '#37ABBF',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: currentTheme.text,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.8rem',
                                flex: 1,
                                minWidth: 0,
                                pr: 1,
                              }}
                            >
                              {pipeline.name}
                            </Typography>
                            <Chip
                              label={pipeline.type?.replace('-based', '') || 'Pipeline'}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: currentTheme.primary + '20',
                                color: currentTheme.primary,
                                flexShrink: 0,
                                textTransform: 'capitalize',
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: currentTheme.textSecondary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              fontSize: '0.7rem',
                            }}
                          >
                            {pipeline.description || 'No description available.'}
                          </Typography>
                        </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Source Datasets - Hidden for Derived products */}
              {sourceDatasets.length > 0 && product?.productType !== 'Derived' && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    {product.productType === 'Aggregate' ? 'Source Datasets' : 'Source Dataset'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {sourceDatasets.map((dataset, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        onClick={() => navigate(`/pipelines/datasets/${dataset.id}`)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: currentTheme.card,
                          border: `1px solid ${currentTheme.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          flex: product.productType === 'Aggregate' ? '1 1 calc(50% - 8px)' : '1 1 100%',
                          minWidth: 0,
                          '&:hover': {
                            borderColor: '#37ABBF',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: currentTheme.text,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                              flex: 1,
                              minWidth: 0,
                              pr: 1,
                            }}
                          >
                            {dataset.name}
                          </Typography>
                          {dataset.shortId && (
                            <Chip
                              label={dataset.shortId}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: currentTheme.primary + '20',
                                color: currentTheme.primary,
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: currentTheme.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            fontSize: '0.7rem',
                          }}
                        >
                          {dataset.description || 'No description available.'}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Derived Products Preview - Only for Derived products */}
              {product.productType === 'Derived' && allDerivedProducts.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: currentTheme.text }}>
                      Derived Products
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setDerivedProductsModalOpen(true)}
                      sx={{
                        borderColor: currentTheme.border,
                        color: currentTheme.text,
                        '&:hover': {
                          borderColor: '#37ABBF',
                          bgcolor: '#37ABBF20',
                        },
                      }}
                    >
                      See All ({allDerivedProducts.length})
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                            Dataset Name
                          </TableCell>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                            Category
                          </TableCell>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                            Status
                          </TableCell>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border, textAlign: 'center' }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allDerivedProducts.slice(0, 6).map((derivedProduct) => (
                          <TableRow
                            key={derivedProduct.id}
                            sx={{
                              '&:hover': {
                                bgcolor: currentTheme.background,
                              },
                            }}
                          >
                            <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {derivedProduct.name}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border }}>
                              {derivedProduct.category || 'N/A'}
                            </TableCell>
                            <TableCell sx={{ borderColor: currentTheme.border }}>
                              <Chip
                                label={derivedProduct.status || 'unknown'}
                                size="small"
                                color={derivedProduct.status?.toLowerCase() === 'active' ? 'success' : 'default'}
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 22,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ borderColor: currentTheme.border }}>
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                {derivedProduct.pipelines && derivedProduct.pipelines.length > 0 && (
                                  <Tooltip title="View Dataset" arrow placement="top">
                                    <IconButton
                                      size="small"
                                      onClick={async () => {
                                        try {
                                          const pipelineUuid = derivedProduct.pipelines[0];
                                          const datasets = Array.isArray(datasetsData) ? datasetsData : [];
                                          const dataset = datasets.find(d => d.systems && d.systems.includes(pipelineUuid));
                                          if (dataset) {
                                            navigate(`/pipelines/datasets/${dataset.id}?pipeline=${pipelineUuid}`);
                                          } else {
                                            navigate(`/pipelines?pipeline=${pipelineUuid}`);
                                          }
                                        } catch (err) {
                                          console.error('Error finding dataset for pipeline:', err);
                                          const pipelineUuid = derivedProduct.pipelines[0];
                                          navigate(`/pipelines?pipeline=${pipelineUuid}`);
                                        }
                                      }}
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: currentTheme.background,
                                        border: `1px solid ${currentTheme.border}`,
                                        borderRadius: '50%',
                                        '&:hover': {
                                          borderColor: '#37ABBF',
                                          bgcolor: '#37ABBF20',
                                          transform: 'scale(1.1)',
                                        },
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <img
                                        src="/pipe-svgrepo-com.svg"
                                        alt="Pipeline"
                                        style={{
                                          width: 18,
                                          height: 18,
                                          filter: currentTheme.darkMode ? 'invert(1)' : 'none',
                                        }}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="View in Catalog" arrow placement="top">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      navigate(`/data-products/${derivedProduct.id}`);
                                    }}
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: currentTheme.background,
                                      border: `1px solid ${currentTheme.border}`,
                                      borderRadius: '50%',
                                      '&:hover': {
                                        borderColor: '#37ABBF',
                                        bgcolor: '#37ABBF20',
                                        transform: 'scale(1.1)',
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    <img
                                      src={catalogImage}
                                      alt="Catalog"
                                      style={{
                                        width: 18,
                                        height: 18,
                                      }}
                                    />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Derived Products Modal */}
              <Dialog
                open={derivedProductsModalOpen}
                onClose={() => setDerivedProductsModalOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                  sx: {
                    bgcolor: currentTheme.card,
                    border: `1px solid ${currentTheme.border}`,
                    maxHeight: '90vh',
                  },
                }}
              >
                <DialogTitle sx={{ color: currentTheme.text, pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Derived Products</Typography>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      {allDerivedProducts.length} products
                    </Typography>
                  </Box>
                </DialogTitle>
                <DialogContent sx={{ overflowY: 'auto', p: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search for derived products..."
                    value={derivedSearchQuery}
                    onChange={(e) => setDerivedSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: currentTheme.textSecondary }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: currentTheme.background,
                        '& fieldset': {
                          borderColor: currentTheme.border,
                        },
                        '&:hover fieldset': {
                          borderColor: '#37ABBF',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#37ABBF',
                          borderWidth: '2px',
                        },
                      },
                    }}
                  />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                            Dataset Name
                          </TableCell>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                            Category
                          </TableCell>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                            Status
                          </TableCell>
                          <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border, textAlign: 'center' }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allDerivedProducts
                          .filter(derivedProduct => {
                            if (!derivedSearchQuery.trim()) return true;
                            const query = derivedSearchQuery.toLowerCase();
                            return (
                              derivedProduct.name?.toLowerCase().includes(query) ||
                              derivedProduct.description?.toLowerCase().includes(query) ||
                              derivedProduct.category?.toLowerCase().includes(query)
                            );
                          })
                          .map((derivedProduct) => (
                            <TableRow
                              key={derivedProduct.id}
                              sx={{
                                '&:hover': {
                                  bgcolor: currentTheme.background,
                                },
                              }}
                            >
                              <TableCell sx={{ color: currentTheme.text, borderColor: currentTheme.border }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {derivedProduct.name}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ color: currentTheme.textSecondary, borderColor: currentTheme.border }}>
                                {derivedProduct.category || 'N/A'}
                              </TableCell>
                              <TableCell sx={{ borderColor: currentTheme.border }}>
                                <Chip
                                  label={derivedProduct.status || 'unknown'}
                                  size="small"
                                  color={derivedProduct.status?.toLowerCase() === 'active' ? 'success' : 'default'}
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 22,
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ borderColor: currentTheme.border }}>
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  {derivedProduct.pipelines && derivedProduct.pipelines.length > 0 && (
                                    <Tooltip title="View Dataset" arrow placement="top">
                                      <IconButton
                                        size="small"
                                        onClick={async () => {
                                          try {
                                            const pipelineUuid = derivedProduct.pipelines[0];
                                            const datasets = Array.isArray(datasetsData) ? datasetsData : [];
                                            const dataset = datasets.find(d => d.systems && d.systems.includes(pipelineUuid));
                                            if (dataset) {
                                              navigate(`/pipelines/datasets/${dataset.id}?pipeline=${pipelineUuid}`);
                                            } else {
                                              navigate(`/pipelines?pipeline=${pipelineUuid}`);
                                            }
                                            setDerivedProductsModalOpen(false);
                                          } catch (err) {
                                            console.error('Error finding dataset for pipeline:', err);
                                            const pipelineUuid = derivedProduct.pipelines[0];
                                            navigate(`/pipelines?pipeline=${pipelineUuid}`);
                                            setDerivedProductsModalOpen(false);
                                          }
                                        }}
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          bgcolor: currentTheme.background,
                                          border: `1px solid ${currentTheme.border}`,
                                          borderRadius: '50%',
                                          '&:hover': {
                                            borderColor: '#37ABBF',
                                            bgcolor: '#37ABBF20',
                                            transform: 'scale(1.1)',
                                          },
                                          transition: 'all 0.2s ease',
                                        }}
                                      >
                                        <img
                                          src="/pipe-svgrepo-com.svg"
                                          alt="Pipeline"
                                          style={{
                                            width: 18,
                                            height: 18,
                                            filter: currentTheme.darkMode ? 'invert(1)' : 'none',
                                          }}
                                        />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="View in Catalog" arrow placement="top">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        navigate(`/data-products/${derivedProduct.id}`);
                                        setDerivedProductsModalOpen(false);
                                      }}
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: currentTheme.background,
                                        border: `1px solid ${currentTheme.border}`,
                                        borderRadius: '50%',
                                        '&:hover': {
                                          borderColor: '#37ABBF',
                                          bgcolor: '#37ABBF20',
                                          transform: 'scale(1.1)',
                                        },
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <img
                                        src={catalogImage}
                                        alt="Catalog"
                                        style={{
                                          width: 18,
                                          height: 18,
                                        }}
                                      />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        {allDerivedProducts.filter(derivedProduct => {
                          if (!derivedSearchQuery.trim()) return true;
                          const query = derivedSearchQuery.toLowerCase();
                          return (
                            derivedProduct.name?.toLowerCase().includes(query) ||
                            derivedProduct.description?.toLowerCase().includes(query) ||
                            derivedProduct.category?.toLowerCase().includes(query)
                          );
                        }).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ textAlign: 'center', borderColor: currentTheme.border, py: 3 }}>
                              <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                                {derivedSearchQuery
                                  ? 'No derived products found matching your search'
                                  : 'No derived products available'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: `1px solid ${currentTheme.border}` }}>
                  <Button
                    onClick={() => setDerivedProductsModalOpen(false)}
                    sx={{
                      color: currentTheme.text,
                      '&:hover': {
                        bgcolor: currentTheme.background,
                      },
                    }}
                  >
                    Close
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Child Datasets */}
              {childDatasets.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Child Datasets
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {childDatasets.map((dataset, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        onClick={() => navigate(`/pipelines/datasets/${dataset.id}`)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: currentTheme.card,
                          border: `1px solid ${currentTheme.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          flex: '1 1 calc(50% - 8px)',
                          minWidth: 0,
                          '&:hover': {
                            borderColor: '#37ABBF',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: currentTheme.text,
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                              flex: 1,
                              minWidth: 0,
                              pr: 1,
                            }}
                          >
                            {dataset.name}
                          </Typography>
                          {dataset.shortId && (
                            <Chip
                              label={dataset.shortId}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: currentTheme.primary + '20',
                                color: currentTheme.primary,
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: currentTheme.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            fontSize: '0.7rem',
                          }}
                        >
                          {dataset.description || 'No description available.'}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {/* SLA */}
              {product.sla && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    SLA
                  </Typography>
                  {product.sla.availability && (
                    <Typography variant="body2" sx={{ color: currentTheme.text, mb: 0.5 }}>
                      Availability: {product.sla.availability}
                    </Typography>
                  )}
                  {product.sla.latency && (
                    <Typography variant="body2" sx={{ color: currentTheme.text }}>
                      Latency: {product.sla.latency}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Data Product Agreement */}
              {agreement && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Agreement
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Paper
                      elevation={0}
                      onClick={() => navigate(`/agreements/${agreement.id}`)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: currentTheme.card,
                        border: `1px solid ${currentTheme.border}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        flex: '1 1 calc(50% - 8px)',
                        minWidth: 0,
                        '&:hover': {
                          borderColor: '#37ABBF',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                    >
                    <Typography
                      variant="body2"
                      sx={{
                        color: currentTheme.text,
                        fontWeight: 600,
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                      }}
                    >
                      {agreement.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: currentTheme.textSecondary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.7rem',
                        }}
                      >
                        {agreement.description || 'No description'}
                      </Typography>
                      <Chip
                        label={agreement.status || 'unknown'}
                        size="small"
                        sx={{
                          width: 'fit-content',
                          height: 18,
                          fontSize: '0.65rem',
                          bgcolor: agreement.status === 'active' ? '#4caf50' + '20' : currentTheme.background,
                          color: agreement.status === 'active' ? '#4caf50' : currentTheme.textSecondary,
                        }}
                      />
                    </Box>
                  </Paper>
                  </Box>
                </Box>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {product.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: currentTheme.background,
                          color: currentTheme.text,
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: README */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <Typography variant="h6" sx={{ color: currentTheme.text }}>
                README
              </Typography>
              <Tooltip title="Edit Markdown">
                <IconButton
                  size="small"
                  onClick={() => navigate(`/data-products/${product.id}/markdown`)}
                  sx={{
                    color: currentTheme.textSecondary,
                    '&:hover': {
                      color: currentTheme.primary,
                    }
                  }}
                >
                  <CodeIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{
              p: 3,
              overflowY: 'auto',
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                },
              },
            }}>
              {product.readme ? (
                <Box sx={{
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    color: currentTheme.text,
                    fontWeight: 600,
                    mt: 2,
                    mb: 1,
                  },
                  '& p': {
                    color: currentTheme.textSecondary,
                    mb: 1.5,
                    lineHeight: 1.6,
                  },
                  '& code': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    fontFamily: 'monospace',
                    color: currentTheme.text,
                  },
                  '& pre': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    padding: 2,
                    borderRadius: 2,
                    overflow: 'auto',
                    '& code': {
                      backgroundColor: 'transparent',
                      padding: 0,
                    },
                  },
                  '& ul, & ol': {
                    color: currentTheme.textSecondary,
                    pl: 3,
                    mb: 1.5,
                  },
                  '& li': {
                    mb: 0.5,
                  },
                  '& a': {
                    color: currentTheme.primary,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  },
                  '& blockquote': {
                    borderLeft: `3px solid ${currentTheme.primary}`,
                    pl: 2,
                    ml: 0,
                    color: currentTheme.textSecondary,
                    fontStyle: 'italic',
                  },
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    mb: 2,
                  },
                  '& th, & td': {
                    border: `1px solid ${currentTheme.border}`,
                    padding: 1,
                    textAlign: 'left',
                  },
                  '& th': {
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    fontWeight: 600,
                  },
                }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkEmoji]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isMermaid = match && match[1] === 'mermaid';
                        
                        if (isMermaid && !inline) {
                          // Convert children to string properly
                          const codeContent = Array.isArray(children)
                            ? children.join('')
                            : String(children);
                          return (
                            <MermaidDiagram className={className}>
                              {codeContent}
                            </MermaidDiagram>
                          );
                        }
                        
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {product.readme}
                  </ReactMarkdown>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                  No README available for this data product.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DataProductDetailPage;
