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
  Badge,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Collapse
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
  Description as DescriptionIcon,
  Tag as TagIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  OpenInNew as OpenInNewIcon,
  AccountTree as AccountTreeIcon,
  Update as UpdateIcon,
  LibraryBooks as LibraryBooksIcon,
  Merge as MergeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Folder as FolderIcon,
  Schema as SchemaIcon,
  Handshake as HandshakeIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchData } from '../services/api';

const DatasetDetailPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { canEdit, canDelete } = useAuth();
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorite, setFavorite] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [parentDatasets, setParentDatasets] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadDataset = async () => {
      try {
        const data = await fetchData('dataProducts');
        const foundDataset = data.dataProducts?.find(p => p.id === datasetId);
        
        if (foundDataset && foundDataset.type === 'dataset') {
          setDataset(foundDataset);
          
          // Load parent datasets
          const parentDatasetIds = foundDataset.technicalMetadata?.datasetLineage?.upstream
            ?.filter(item => item.type === 'Parent Dataset')
            ?.map(item => item.id) || [];
          
          if (parentDatasetIds.length > 0) {
            const parentDatasetsData = data.dataProducts?.filter(p => 
              parentDatasetIds.includes(p.id) && p.type === 'dataset'
            ) || [];
            setParentDatasets(parentDatasetsData);
          } else {
            setParentDatasets([]);
          }
          
          setError(null);
        } else {
          setError('Dataset not found');
        }
      } catch (err) {
        setError('Failed to load dataset details');
        console.error('Error loading dataset:', err);
      } finally {
        setLoading(false);
      }
    };

    if (datasetId) {
      loadDataset();
    }
  }, [datasetId]);


  const handleFavoriteToggle = () => {
    setFavorite(!favorite);
  };

  const handleSubscribe = () => {
    console.log('Subscribing to dataset:', dataset.id);
    // Implement subscription logic
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  if (!dataset) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: currentTheme.background, minHeight: '100vh' }}>
        <Alert severity="info" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Dataset not found
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
        <Typography color={currentTheme.text}>
          {dataset.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12}>

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
                {dataset.name}
              </Typography>
            </Box>


            <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3, lineHeight: 1.6 }}>
              {dataset.description}
            </Typography>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 4, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  <strong>Dataset Type:</strong> {dataset.feedType || 'One Time'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon sx={{ color: currentTheme.textSecondary, fontSize: '1.2rem' }} />
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  {dataset.size}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ color: currentTheme.textSecondary, fontSize: '1.2rem' }} />
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Updated {dataset.lastUpdated ? new Date(dataset.lastUpdated).toLocaleDateString() : 'N/A'}
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
        <Tab label="Products" />
        <Tab label="Parent Datasets" />
        <Tab label="Triage" />
      </Tabs>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: currentTheme.text, mb: 0.5 }}>
                Data Models and Views ({dataset.products?.length || 0})
          </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            Individual data products created from this dataset
          </Typography>
            </Box>
          </Box>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search products by name, format, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
              mb: 3,
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: currentTheme.textSecondary }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Products Cards */}
          <Grid container spacing={3}>
                {dataset.products
                  ?.filter((product) => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    const location = product.tables?.[0]?.s3Location || product.location || '';
                    return (
                      product.name?.toLowerCase().includes(query) ||
                      product.format?.toLowerCase().includes(query) ||
                      product.description?.toLowerCase().includes(query) ||
                      location.toLowerCase().includes(query)
                    );
                  })
                  .map((relatedProduct) => {
                    // Handle both string and array formats for backward compatibility
                    let model = null;
                    if (relatedProduct.relatedEntities?.dataModels) {
                      model = Array.isArray(relatedProduct.relatedEntities.dataModels) 
                        ? relatedProduct.relatedEntities.dataModels[0] 
                        : relatedProduct.relatedEntities.dataModels;
                    } else if (dataset.relatedEntities?.dataModels) {
                      model = Array.isArray(dataset.relatedEntities.dataModels)
                        ? dataset.relatedEntities.dataModels[0]
                        : dataset.relatedEntities.dataModels;
                    }
                    return (
              <Grid item xs={12} sm={6} md={4} key={relatedProduct.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: currentTheme.card,
                        borderColor: currentTheme.border,
                        borderRadius: 3,
                        borderWidth: 1,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 3,
                          bgcolor: relatedProduct.parentDataset ? currentTheme.warning : currentTheme.success,
                          opacity: 0.6,
                        },
                        '&:hover': {
                          boxShadow: `0 8px 24px ${currentTheme.primary}15`,
                          transform: 'translateY(-4px)',
                          '&::before': {
                            opacity: 1,
                          }
                        }
                      }}
                      onClick={() => navigate(`/data-products/${dataset.id}/products/${relatedProduct.id}`)}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 3.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
                        <Box>
                          {/* Title - Data Model */}
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              color: currentTheme.text, 
                              fontWeight: 700, 
                              mb: 2.5,
                              fontSize: '1.5rem',
                              letterSpacing: '-0.02em',
                              lineHeight: 1.2
                            }}
                          >
                            {model || relatedProduct.name}
                          </Typography>

                          {/* Aggregated/Child Indicator */}
                          <Box>
                            <Tooltip 
                              title={relatedProduct.parentDataset ? "Child Product - Derived from parent dataset" : "Aggregated Product - Master dataset"}
                              arrow
                              placement="top"
                            >
                              <Chip
                                icon={relatedProduct.parentDataset ? (
                                  <AccountTreeIcon sx={{ fontSize: '0.9rem !important' }} />
                                ) : (
                                  <MergeIcon sx={{ fontSize: '0.9rem !important' }} />
                                )}
                                label={relatedProduct.parentDataset ? 'Child' : 'Aggregated'}
                                size="medium"
                                sx={{
                                  bgcolor: relatedProduct.parentDataset 
                                    ? `${currentTheme.warning}12` 
                                    : `${currentTheme.success}12`,
                                  color: relatedProduct.parentDataset 
                                    ? currentTheme.warning 
                                    : currentTheme.success,
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  height: 28,
                                  border: `1.5px solid ${relatedProduct.parentDataset ? currentTheme.warning : currentTheme.success}40`,
                                  '& .MuiChip-icon': {
                                    color: relatedProduct.parentDataset ? currentTheme.warning : currentTheme.success,
                                  }
                                }}
                              />
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Data Product Producer */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5, 
                            pt: 2.5, 
                            borderTop: `1px solid ${currentTheme.border}40`,
                            mt: 'auto'
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: `${currentTheme.primary}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <PersonIcon sx={{ color: currentTheme.primary, fontSize: '1.25rem' }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: currentTheme.textSecondary, 
                                display: 'block', 
                                lineHeight: 1.3,
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontWeight: 600,
                                mb: 0.5
                              }}
                            >
                              Producer
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: currentTheme.text, 
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {relatedProduct.provider || dataset.provider || 'Not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
              </Grid>
                    );
                  })}
            {(!dataset.products || dataset.products.length === 0) && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 6 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: currentTheme.textSecondary, opacity: 0.5 }} />
                  <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>No data products available</Typography>
                </Box>
          </Grid>
            )}
            {dataset.products && dataset.products.filter((product) => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              const location = product.tables?.[0]?.s3Location || product.location || '';
              return (
                product.name?.toLowerCase().includes(query) ||
                product.format?.toLowerCase().includes(query) ||
                product.description?.toLowerCase().includes(query) ||
                location.toLowerCase().includes(query)
              );
            }).length === 0 && searchQuery && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 6 }}>
                  <SearchIcon sx={{ fontSize: 48, color: currentTheme.textSecondary, opacity: 0.5 }} />
                  <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>No products found matching "{searchQuery}"</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
            Parent Datasets
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
            Datasets that this dataset depends on or is derived from
          </Typography>

          {parentDatasets.length > 0 ? (
            <Card 
              variant="outlined"
              elevation={0}
              sx={{ 
                bgcolor: currentTheme.card, 
                borderColor: currentTheme.border,
                boxShadow: 'none',
                '&:hover': {
                  transform: 'none',
                  boxShadow: 'none',
                }
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Dataset Name
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Category
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Last Updated
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parentDatasets
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((parentDataset) => (
                        <TableRow 
                          key={parentDataset.id}
                          sx={{ 
                            '&:hover': { 
                              bgcolor: `${currentTheme.primary}05` 
                            } 
                          }}
                        >
                          <TableCell sx={{ borderColor: currentTheme.border }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccountTreeIcon sx={{ color: currentTheme.primary, fontSize: '1.2rem' }} />
                              <Typography variant="body1" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                                {parentDataset.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderColor: currentTheme.border }}>
                            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                              {parentDataset.id}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderColor: currentTheme.border }}>
                            <Chip
                              label={parentDataset.category}
                              size="small"
                              sx={{
                                bgcolor: `${currentTheme.primary}15`,
                                color: currentTheme.primary,
                                fontSize: '0.75rem',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderColor: currentTheme.border }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <UpdateIcon sx={{ color: currentTheme.textSecondary, fontSize: '1rem' }} />
                              <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                                {parentDataset.lastUpdated ? new Date(parentDataset.lastUpdated).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderColor: currentTheme.border }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<OpenInNewIcon />}
                                onClick={() => navigate(`/data-products/${parentDataset.id}`)}
                                sx={{
                                  color: currentTheme.primary,
                                  borderColor: currentTheme.border,
                                  fontSize: '0.75rem',
                                  '&:hover': {
                                    borderColor: currentTheme.primary,
                                    bgcolor: `${currentTheme.primary}10`,
                                  },
                                }}
                              >
                                View
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<LinkIcon />}
                                component="a"
                                href={parentDataset.catalogLink || `#/data-products/${parentDataset.id}`}
                                target={parentDataset.catalogLink ? "_blank" : undefined}
                                rel={parentDataset.catalogLink ? "noopener noreferrer" : undefined}
                                onClick={(e) => {
                                  if (!parentDataset.catalogLink) {
                                    e.preventDefault();
                                    navigate(`/data-products/${parentDataset.id}`);
                                  }
                                }}
                                sx={{
                                  color: currentTheme.primary,
                                  borderColor: currentTheme.border,
                                  fontSize: '0.75rem',
                                  '&:hover': {
                                    borderColor: currentTheme.primary,
                                    bgcolor: `${currentTheme.primary}10`,
                                  },
                                }}
                              >
                                Catalog
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={parentDatasets.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  color: currentTheme.text,
                  borderTop: `1px solid ${currentTheme.border}`,
                  '& .MuiTablePagination-toolbar': {
                    color: currentTheme.text,
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    color: currentTheme.textSecondary,
                  },
                  '& .MuiTablePagination-select': {
                    color: currentTheme.text,
                  },
                  '& .MuiIconButton-root': {
                    color: currentTheme.textSecondary,
                    '&:hover': {
                      bgcolor: `${currentTheme.primary}10`,
                    },
                    '&.Mui-disabled': {
                      color: currentTheme.textSecondary,
                    },
                  },
                }}
              />
            </Card>
          ) : (
            <Card variant="outlined" sx={{ bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
                  <CheckCircleIcon sx={{ color: currentTheme.success, fontSize: '2rem' }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: currentTheme.text }}>
                      No Parent Datasets
                    </Typography>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      This is a root dataset with no dependencies
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
            Triage & Assessment
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
            Comprehensive data quality assessments and issue tracking for this dataset
          </Typography>

          {/* Triage Reports */}
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2, mt: 3 }}>
            Triage Reports
          </Typography>
          {dataset.technicalMetadata?.triageReports?.map((report, index) => (
            <Card 
              key={index}
              variant="outlined" 
              sx={{ 
                mb: 2,
                bgcolor: currentTheme.card,
                borderColor: currentTheme.border,
                '&:hover': {
                  borderColor: currentTheme.primary,
                  boxShadow: `0 2px 8px ${currentTheme.border}40`
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: currentTheme.text }}>
                    {report.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={report.status}
                      size="small"
                      sx={{
                        bgcolor: report.status === 'Completed' ? `${currentTheme.success}15` : 
                                 report.status === 'In Progress' ? `${currentTheme.warning}15` : `${currentTheme.error}15`,
                        color: report.status === 'Completed' ? currentTheme.success : 
                               report.status === 'In Progress' ? currentTheme.warning : currentTheme.error,
                      }}
                    />
                    <Chip
                      label={report.severity}
                      size="small"
                      sx={{
                        bgcolor: report.severity === 'Low' ? `${currentTheme.success}15` : 
                                 report.severity === 'Medium' ? `${currentTheme.warning}15` : `${currentTheme.error}15`,
                        color: report.severity === 'Low' ? currentTheme.success : 
                               report.severity === 'Medium' ? currentTheme.warning : currentTheme.error,
                      }}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
                  {report.description}
                </Typography>
                
                <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1 }}>
                  Key Findings:
                </Typography>
                <List dense>
                  {report.findings?.map((finding, idx) => (
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
                        primary={finding}
                        primaryTypographyProps={{ 
                          color: currentTheme.textSecondary,
                          fontSize: '0.875rem'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Typography variant="caption" sx={{ color: currentTheme.textSecondary, mt: 2, display: 'block' }}>
                  Report Date: {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {/* Data Quality Metrics */}
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2, mt: 4 }}>
            Data Quality Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
                <Typography variant="h4" sx={{ color: currentTheme.primary, mb: 1 }}>
                  {dataset.technicalMetadata?.qualityMetrics?.accuracy || '99.0%'}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Accuracy
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
                <Typography variant="h4" sx={{ color: currentTheme.primary, mb: 1 }}>
                  {dataset.technicalMetadata?.qualityMetrics?.completeness || '98.0%'}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Completeness
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
                <Typography variant="h4" sx={{ color: currentTheme.primary, mb: 1 }}>
                  {dataset.technicalMetadata?.qualityMetrics?.consistency || '98.0%'}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Consistency
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
                <Typography variant="h4" sx={{ color: currentTheme.primary, mb: 1 }}>
                  {dataset.technicalMetadata?.qualityMetrics?.timeliness || '97.0%'}
                </Typography>
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Timeliness
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Data Issues */}
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2, mt: 4 }}>
            Known Issues
          </Typography>
          <Card variant="outlined" sx={{ bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
            <CardContent>
              <List>
                {dataset.technicalMetadata?.knownIssues?.map((issue, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <WarningIcon sx={{ color: currentTheme.warning }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={issue.title}
                      secondary={issue.description}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                    <Chip
                      label={issue.priority}
                      size="small"
                      sx={{
                        bgcolor: issue.priority === 'High' ? `${currentTheme.error}15` : 
                                 issue.priority === 'Medium' ? `${currentTheme.warning}15` : `${currentTheme.success}15`,
                        color: issue.priority === 'High' ? currentTheme.error : 
                               issue.priority === 'Medium' ? currentTheme.warning : currentTheme.success,
                      }}
                    />
                  </ListItem>
                )) || (
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: currentTheme.success }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="No Known Issues"
                      secondary="This dataset has no outstanding issues"
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}




        </Grid>
      </Grid>
    </Container>
  );
};

export default DatasetDetailPage;
