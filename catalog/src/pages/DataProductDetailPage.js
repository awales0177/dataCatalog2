import React, { useState, useContext, useEffect, useMemo } from 'react';
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
  ContentCopy as ContentCopyIcon,
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
import DatasetSelector from '../components/datasets/DatasetSelector';
import catalogImage from '../imgs/catalog.png';
import org1Image from '../imgs/org1.png';
import org2Image from '../imgs/org2.png';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const DataProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dataModels, setDataModels] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [sourceDatasets, setSourceDatasets] = useState([]);
  const [childDatasets, setChildDatasets] = useState([]);
  const [allDerivedProducts, setAllDerivedProducts] = useState([]);
  const [derivedSearchQuery, setDerivedSearchQuery] = useState('');
  const [derivedProductsModalOpen, setDerivedProductsModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  // Get the selected dataset object
  const selectedDatasetObj = useMemo(() => {
    if (!selectedDataset || !sourceDatasets.length) return null;
    return sourceDatasets.find(d => d.id === selectedDataset) || null;
  }, [selectedDataset, sourceDatasets]);

  // Use selected dataset data for metrics if available, otherwise use product data
  const metricsData = useMemo(() => {
    if (!product) {
      return {
        qualityScore: 0,
        lastUpdated: null,
        s3Location: null,
        dataFreshness: null,
        records: null,
        periodicity: null,
        readme: null,
      };
    }
    
    if (selectedDatasetObj && product.productType === 'Derived') {
      // Get the first table's data quality if available, or use dataset-level quality
      const table = selectedDatasetObj.tables && selectedDatasetObj.tables.length > 0 
        ? selectedDatasetObj.tables[0] 
        : null;
      
      // Check localStorage for saved readme first, then dataset readme, then generate from metadata
      const datasetId = selectedDatasetObj.id;
      const savedReadme = localStorage.getItem(`dataset_readme_${datasetId}`);
      let datasetReadme = savedReadme || selectedDatasetObj.readme;
      if (!datasetReadme && selectedDatasetObj) {
        const lines = [];
        lines.push(`# ${selectedDatasetObj.name || 'Dataset'}`);
        lines.push('');
        if (selectedDatasetObj.description) {
          lines.push(selectedDatasetObj.description);
          lines.push('');
        }
        
        if (selectedDatasetObj.shortId) {
          lines.push(`**Dataset ID:** ${selectedDatasetObj.shortId}`);
        }
        if (selectedDatasetObj.records) {
          lines.push(`**Records:** ${selectedDatasetObj.records.toLocaleString()}`);
        }
        if (selectedDatasetObj.lastUpdated) {
          lines.push(`**Last Updated:** ${selectedDatasetObj.lastUpdated}`);
        }
        if (selectedDatasetObj.periodicity) {
          lines.push(`**Update Frequency:** ${selectedDatasetObj.periodicity}`);
        }
        if (selectedDatasetObj.size) {
          lines.push(`**Size:** ${selectedDatasetObj.size}`);
        }
        if (selectedDatasetObj.complexity) {
          lines.push(`**Complexity:** ${selectedDatasetObj.complexity}`);
        }
        if (selectedDatasetObj.gigabytesProcessed) {
          lines.push(`**Data Processed:** ${selectedDatasetObj.gigabytesProcessed} GB`);
        }
        lines.push('');
        
        if (table) {
          lines.push('## Table Information');
          lines.push('');
          lines.push(`**Table Name:** ${table.name || 'N/A'}`);
          if (table.rowCount) {
            lines.push(`**Row Count:** ${table.rowCount.toLocaleString()}`);
          }
          if (table.columnCount) {
            lines.push(`**Column Count:** ${table.columnCount}`);
          }
          if (table.dataQuality) {
            lines.push(`**Data Quality:** ${table.dataQuality}%`);
          }
          if (table.dataFreshness !== undefined) {
            lines.push(`**Data Freshness:** ${table.dataFreshness} hours`);
          }
          lines.push('');
          
          if (table.columns && table.columns.length > 0) {
            lines.push('### Columns');
            lines.push('');
            lines.push('| Column Name |');
            lines.push('|------------|');
            table.columns.forEach(col => {
              lines.push(`| ${col} |`);
            });
            lines.push('');
          }
        }
        
        if (selectedDatasetObj.etlOverview) {
          lines.push('## ETL Overview');
          lines.push('');
          if (selectedDatasetObj.etlOverview.poc) {
            lines.push(`**POC:** ${selectedDatasetObj.etlOverview.poc}`);
          }
          if (selectedDatasetObj.etlOverview.org) {
            lines.push(`**Organization:** ${selectedDatasetObj.etlOverview.org}`);
          }
          if (selectedDatasetObj.etlOverview.platform) {
            lines.push(`**Platform:** ${selectedDatasetObj.etlOverview.platform}`);
          }
          if (selectedDatasetObj.etlOverview.schedule) {
            lines.push(`**Schedule:** ${selectedDatasetObj.etlOverview.schedule}`);
          }
          if (selectedDatasetObj.etlOverview.githubLink) {
            lines.push(`**GitHub:** ${selectedDatasetObj.etlOverview.githubLink}`);
          }
          lines.push('');
        }
        
        if (selectedDatasetObj.s3Location || selectedDatasetObj.s3BasePath) {
          lines.push('## Storage');
          lines.push('');
          lines.push(`**S3 Location:** \`${selectedDatasetObj.s3Location || selectedDatasetObj.s3BasePath}\``);
          lines.push('');
        }
        
        datasetReadme = lines.join('\n');
      }
      
      return {
        qualityScore: table?.dataQuality || selectedDatasetObj.dataQuality || product.qualityScore || 0,
        lastUpdated: selectedDatasetObj.lastUpdated || product.lastUpdated,
        s3Location: table?.s3Location || selectedDatasetObj.s3Location || selectedDatasetObj.s3BasePath || product.s3Location,
        dataFreshness: table?.dataFreshness || selectedDatasetObj.dataFreshness,
        records: selectedDatasetObj.records || table?.rowCount,
        periodicity: selectedDatasetObj.periodicity || product.periodicity,
        readme: datasetReadme || product.readme,
      };
    }
    // For derived products, don't show product readme - only dataset readmes
    return {
      qualityScore: product.qualityScore || 0,
      lastUpdated: product.lastUpdated,
      s3Location: product.s3Location || product.s3_location || product.storageLocation,
      dataFreshness: null,
      records: null,
      periodicity: product.periodicity || product.updateFrequency,
      readme: product.productType === 'Derived' ? null : product.readme,
    };
  }, [selectedDatasetObj, product]);

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
            } else if (foundProduct.productType === 'Derived') {
              // Source datasets for Derived (can be single or multiple)
              if (foundProduct.sourceDatasets && Array.isArray(foundProduct.sourceDatasets)) {
                // Multiple source datasets
                const matchedDatasets = foundProduct.sourceDatasets
                  .map(datasetId => {
                    const dataset = allDatasets.find(d => d.id === datasetId);
                    return dataset || null;
                  })
                  .filter(Boolean);
                setSourceDatasets(matchedDatasets);
                // Set first dataset as selected by default
                if (matchedDatasets.length > 0 && !selectedDataset) {
                  setSelectedDataset(matchedDatasets[0].id);
                }
              } else if (foundProduct.sourceDataset) {
                // Single source dataset (backward compatibility)
                const dataset = allDatasets.find(d => d.id === foundProduct.sourceDataset);
                if (dataset) {
                  setSourceDatasets([dataset]);
                  // Set as selected by default
                  if (!selectedDataset) {
                    setSelectedDataset(dataset.id);
                  }
                }
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
    const lastUpdated = metricsData?.lastUpdated;
    if (!lastUpdated) return null;
    try {
      const lastUpdatedDate = new Date(lastUpdated);
      const now = new Date();
      const diffMs = now - lastUpdatedDate;
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
      return lastUpdated;
    }
  };

  const getFreshnessPercent = () => {
    const lastUpdated = metricsData?.lastUpdated;
    if (!lastUpdated) return 0;
    
    // If dataset has dataFreshness field (in hours), use that
    if (metricsData?.dataFreshness !== undefined && metricsData.dataFreshness !== null) {
      const hours = metricsData.dataFreshness;
      if (hours <= 1) return 100;
      if (hours <= 6) return 90;
      if (hours <= 12) return 80;
      if (hours <= 24) return 70;
      if (hours <= 48) return 50;
      return 30;
    }
    
    try {
      const lastUpdatedDate = new Date(lastUpdated);
      const now = new Date();
      const diffMs = now - lastUpdatedDate;
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
    const lastUpdated = metricsData?.lastUpdated;
    if (!lastUpdated) return '#9e9e9e';
    
    // If dataset has dataFreshness field (in hours), use that
    if (metricsData?.dataFreshness !== undefined && metricsData.dataFreshness !== null) {
      const hours = metricsData.dataFreshness;
      if (hours <= 1) return '#4caf50';
      if (hours <= 24) return '#ff9800';
      return '#f44336';
    }
    
    try {
      const lastUpdatedDate = new Date(lastUpdated);
      const now = new Date();
      const diffMs = now - lastUpdatedDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) return '#4caf50';
      if (diffDays <= 3) return '#ff9800';
      return '#f44336';
    } catch (e) {
      return '#9e9e9e';
    }
  };

  const calculateValidation = () => {
    const validationScore = metricsData?.qualityScore ?? 0;
    if (validationScore >= 95) return 'Excellent';
    if (validationScore >= 85) return 'Good';
    if (validationScore >= 70) return 'Fair';
    return 'Needs Attention';
  };

  const getValidationPercent = () => {
    const validationScore = metricsData?.qualityScore ?? 0;
    return Math.max(0, Math.min(100, validationScore));
  };

  const getValidationColor = () => {
    const validationScore = product?.validationScore ?? product?.qualityScore ?? 0;
    if (validationScore >= 95) return '#4caf50';
    if (validationScore >= 85) return '#ff9800';
    if (validationScore >= 70) return '#ffc107';
    return '#f44336';
  };

  // Generate sample data volume data for the last 30 days
  const generateVolumeData = () => {
    const data = [];
    const today = new Date();
    // Use dataset gigabytesProcessed if available, otherwise use product size or default
    const baseVolume = selectedDatasetObj?.gigabytesProcessed 
      ? selectedDatasetObj.gigabytesProcessed 
      : (product?.size ? parseFloat(product.size) || 100 : 100);
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic volume data with some variation
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const volume = baseVolume * (1 + variation);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(volume * 100) / 100, // Round to 2 decimal places
      });
    }
    
    return data;
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
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                sx={{
                  backgroundColor: alpha(currentTheme.primary, 0.15),
                  color: currentTheme.primary,
                  fontWeight: 500,
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

      {/* Dataset Selector - Only for Derived products */}
      {product.productType === 'Derived' && sourceDatasets.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <DatasetSelector
            datasets={sourceDatasets}
            selectedDataset={selectedDataset}
            onDatasetSelect={setSelectedDataset}
          />
        </Box>
      )}

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
              {metricsData.qualityScore !== undefined && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      Quality Score
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: getQualityColor(metricsData.qualityScore) === 'success' ? '#2ecc71' :
                               getQualityColor(metricsData.qualityScore) === 'warning' ? '#f59e0b' : '#e74c3c',
                        fontWeight: 600,
                      }}
                    >
                      {metricsData.qualityScore.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={metricsData.qualityScore}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: currentTheme.background,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getQualityColor(metricsData.qualityScore) === 'success' ? '#2ecc71' :
                                         getQualityColor(metricsData.qualityScore) === 'warning' ? '#f59e0b' : '#e74c3c',
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              )}

              {/* Data Freshness */}
              {metricsData.lastUpdated && (
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

              {/* Data Validation */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    Data Validation
                  </Typography>
                  <Typography variant="body2" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                    {calculateValidation()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getValidationPercent()}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: currentTheme.background,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getValidationColor(),
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>

              {/* S3 Location */}
              {metricsData.s3Location && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      S3 Location
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        color: darkMode ? '#ff9800' : currentTheme.text,
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        bgcolor: currentTheme.background,
                        p: 1,
                        borderRadius: 1,
                        border: `1px solid ${currentTheme.border}`,
                      }}
                    >
                      {metricsData.s3Location}
                    </Typography>
                    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(metricsData.s3Location);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        sx={{
                          color: darkMode ? '#ff9800' : currentTheme.textSecondary,
                          '&:hover': {
                            color: darkMode ? '#ffb74d' : currentTheme.primary,
                            bgcolor: alpha(darkMode ? '#ff9800' : currentTheme.primary, 0.1),
                          }
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}

              {/* Data Volume Graph */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    Data Volume (Last 30 Days)
                  </Typography>
                  {metricsData.periodicity && (
                    <Chip
                      label={metricsData.periodicity}
                      sx={{
                        borderRadius: 1,
                        bgcolor: currentTheme.primary + '20',
                        color: currentTheme.primary,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 28,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={generateVolumeData()}
                      margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.border} />
                      <XAxis 
                        dataKey="date" 
                        stroke={currentTheme.textSecondary}
                        style={{ fontSize: '0.75rem' }}
                      />
                      <YAxis 
                        stroke={currentTheme.textSecondary}
                        style={{ fontSize: '0.75rem' }}
                        label={{ value: 'GB', angle: -90, position: 'insideLeft', style: { fontSize: '0.75rem', fill: currentTheme.textSecondary } }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: currentTheme.card,
                          border: `1px solid ${currentTheme.border}`,
                          color: currentTheme.text,
                          borderRadius: 4,
                        }}
                        labelStyle={{ color: currentTheme.textSecondary }}
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#37ABBF"
                        strokeWidth={2}
                        dot={{ fill: '#37ABBF', r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>

              {/* Producer, Consumers, and Agreement */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    {/* Owner */}
                    {product.owner && (
                      <Box sx={{ mb: 2 }}>
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
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {/* Data Product Agreement */}
                  {agreement && (
                    <Box>
                      <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                        Agreement
                      </Typography>
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
                  )}
                </Grid>
              </Grid>

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

              {/* Domains */}
              {((product.domain && product.domain.length > 0) || (product.domains && product.domains.length > 0)) && (
                <Box>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
                    Domains
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(product.domains || (product.domain ? [product.domain] : [])).map((domain, idx) => (
                      <Chip
                        key={idx}
                        label={domain}
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
              {(product.productType !== 'Derived' || (product.productType === 'Derived' && selectedDatasetObj)) && (
                <Tooltip title={product.productType === 'Derived' ? "Edit Dataset README" : "Edit Markdown"}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (product.productType === 'Derived' && selectedDatasetObj) {
                        navigate(`/datasets/${selectedDatasetObj.id}/markdown`);
                      } else {
                        navigate(`/data-products/${product.id}/markdown`);
                      }
                    }}
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
              )}
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
              {metricsData.readme ? (
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
                  '& table': {
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginBottom: '1.5rem',
                    '& th, & td': {
                      border: `1px solid ${currentTheme.border}`,
                      padding: '8px 12px',
                      textAlign: 'left',
                      color: currentTheme.text,
                    },
                    '& th': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      fontWeight: 600,
                      color: currentTheme.text,
                    },
                    '& tr:nth-of-type(even)': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    },
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
                    color: currentTheme.text,
                  },
                  '& th': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: currentTheme.text,
                    fontWeight: 600,
                  },
                  '& tr:nth-of-type(even)': {
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
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
                    {metricsData.readme}
                  </ReactMarkdown>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                  No README available{selectedDatasetObj ? ' for this dataset' : ' for this data product'}.
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
