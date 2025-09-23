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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Download as DownloadIcon,
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
  Merge as MergeIcon
} from '@mui/icons-material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchData } from '../services/api';
import LineageDiagram from '../components/LineageDiagram';

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
                {dataset.name}
              </Typography>
            </Box>


            <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3, lineHeight: 1.6 }}>
              {dataset.description}
            </Typography>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StarIcon sx={{ color: currentTheme.favorite, fontSize: '1.2rem' }} />
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  {dataset.rating}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon sx={{ color: currentTheme.textSecondary, fontSize: '1.2rem' }} />
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  {dataset.downloads?.toLocaleString() || 'N/A'} downloads
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
        <Tab label="Data Lineage" />
      </Tabs>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Box>
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
            Data Products ({dataset.products?.length || 0})
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
            Individual data products created from this dataset
          </Typography>

          <Grid container spacing={3}>
            {dataset.products?.map((relatedProduct) => (
              <Grid item xs={12} sm={6} md={4} key={relatedProduct.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: currentTheme.card,
                    borderColor: currentTheme.border,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: currentTheme.primary,
                      boxShadow: `0 4px 12px ${currentTheme.border}40`,
                      transform: 'translateY(-2px)',
                    }
                  }}
                  onClick={() => navigate(`/data-products/${dataset.id}/products/${relatedProduct.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                        {relatedProduct.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {/* Product Type Indicator */}
                        <Tooltip 
                          title={relatedProduct.parentDataset ? "Child Product - Derived from parent dataset" : "Aggregated Product - Master dataset"}
                          arrow
                          placement="top"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {relatedProduct.parentDataset ? (
                              <AccountTreeIcon 
                                sx={{ 
                                  color: currentTheme.warning, 
                                  fontSize: '1.2rem' 
                                }} 
                              />
                            ) : (
                              <MergeIcon 
                                sx={{ 
                                  color: currentTheme.success, 
                                  fontSize: '1.2rem' 
                                }} 
                              />
                            )}
                          </Box>
                        </Tooltip>
                        <Chip
                          label={relatedProduct.format}
                          size="small"
                          sx={{
                            bgcolor: `${currentTheme.primary}15`,
                            color: currentTheme.primary,
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: currentTheme.textSecondary,
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {relatedProduct.description}
                    </Typography>

                    {/* Stats */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StorageIcon sx={{ color: currentTheme.textSecondary, fontSize: '1rem' }} />
                        <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                          {relatedProduct.size}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ color: currentTheme.textSecondary, fontSize: '1rem' }} />
                        <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                          {relatedProduct.lastUpdated ? new Date(relatedProduct.lastUpdated).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>

                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      size="small"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate(`/data-products/${dataset.id}/products/${relatedProduct.id}`); 
                      }}
                      sx={{
                        color: currentTheme.primary,
                        fontSize: '0.875rem',
                        textTransform: 'none',
                        fontWeight: 500,
                        flexGrow: 1,
                      }}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
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
            <Card variant="outlined" sx={{ bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Dataset Name
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Provider
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Category
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Trustworthiness
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Last Updated
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, borderColor: currentTheme.border }}>
                        Size
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
                              <Box>
                                <Typography variant="body1" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                                  {parentDataset.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: currentTheme.textSecondary }}>
                                  {parentDataset.id}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderColor: currentTheme.border }}>
                            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                              {parentDataset.provider}
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
                              <SecurityIcon 
                                sx={{ 
                                  color: getTrustworthinessColor(parentDataset.trustworthiness), 
                                  fontSize: '1rem' 
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: getTrustworthinessColor(parentDataset.trustworthiness),
                                  textTransform: 'capitalize',
                                  fontWeight: 500
                                }}
                              >
                                {parentDataset.trustworthiness}
                              </Typography>
                            </Box>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StorageIcon sx={{ color: currentTheme.textSecondary, fontSize: '1rem' }} />
                              <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                                {parentDataset.size}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ borderColor: currentTheme.border }}>
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
            Comprehensive data quality assessments, issue tracking, and trustworthiness evaluations for this dataset
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

      {selectedTab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
            Data Lineage
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
            Visual representation of upstream sources and downstream consumers of this dataset
          </Typography>

          {/* Mermaid Lineage Diagram */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
            <CardContent sx={{ p: 3 }}>
              <LineageDiagram
                upstream={dataset.technicalMetadata?.datasetLineage?.upstream || []}
                downstream={dataset.technicalMetadata?.datasetLineage?.downstream || []}
                currentItem={{
                  name: dataset.name,
                  type: dataset.format || 'Dataset'
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
              {dataset.technicalMetadata?.datasetLineage?.upstream?.length > 0 ? (
                dataset.technicalMetadata.datasetLineage.upstream.map((source, index) => (
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
              {dataset.technicalMetadata?.datasetLineage?.downstream?.length > 0 ? (
                dataset.technicalMetadata.datasetLineage.downstream.map((consumer, index) => (
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



        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            {/* Dataset Info */}
            <Card variant="outlined" sx={{ mb: 3, bgcolor: currentTheme.card, borderColor: currentTheme.border }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: currentTheme.text, mb: 2 }}>
                  Dataset Information
                </Typography>
                <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                      <PersonIcon sx={{ color: currentTheme.primary }} />
                  </ListItemIcon>
                  <ListItemText
                      primary="Provider"
                      secondary={dataset.provider || 'Unknown'}
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
                      secondary={dataset.category || 'Dataset'}
                    primaryTypographyProps={{ color: currentTheme.text }}
                    secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                      <UpdateIcon sx={{ color: currentTheme.primary }} />
                  </ListItemIcon>
                  <ListItemText
                      primary="Feed Type"
                      secondary={dataset.feedType || 'One Time'}
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
                      secondary={dataset.lastUpdated ? new Date(dataset.lastUpdated).toLocaleDateString() : 'N/A'}
                      primaryTypographyProps={{ color: currentTheme.text }}
                      secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <SecurityIcon sx={{ color: getTrustworthinessColor(dataset.trustworthiness) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Trustworthiness"
                      secondary={dataset.trustworthiness?.charAt(0).toUpperCase() + dataset.trustworthiness?.slice(1) || 'Unknown'}
                    primaryTypographyProps={{ color: currentTheme.text }}
                    secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>


          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DatasetDetailPage;
