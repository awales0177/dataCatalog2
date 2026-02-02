import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  PushPin as PinIcon,
  PinDrop as PinDropIcon,
  Storage as StorageIcon,
  Description as DescriptionIcon,
  AccountTree as AccountTreeIcon,
  ShoppingCart as ShoppingCartIcon,
  Build as BuildIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import DataProductCard from '../components/DataProductCard';
import DataModelCard from '../components/DataModelCard';
import DatasetCard from '../components/DatasetCard';
import dataProductsData from '../data/dataProducts.json';
import modelsData from '../data/models.json';
import datasetsData from '../data/datasets.json';
import pipelinesData from '../data/pipelines.json';
import { getPipelineName } from '../utils/pipelineUtils';

const PINNED_STORAGE_KEY = 'pinnedItems';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [pipelineNames, setPipelineNames] = useState({});

  // Load pinned items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(PINNED_STORAGE_KEY);
    if (stored) {
      try {
        setPinnedItems(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading pinned items:', e);
      }
    }
  }, []);

  // Load pipeline names
  useEffect(() => {
    const pipelinesArray = Array.isArray(pipelinesData) ? pipelinesData : [];
    const nameMap = {};
    pipelinesArray.forEach(p => {
      nameMap[p.uuid] = p.name;
    });
    setPipelineNames(nameMap);
  }, []);

  // Save pinned items to localStorage
  const savePinnedItems = (items) => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(items));
    setPinnedItems(items);
  };

  const handlePin = (item) => {
    const newPinnedItems = [...pinnedItems, item];
    savePinnedItems(newPinnedItems);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleUnpin = (itemId, itemType) => {
    const newPinnedItems = pinnedItems.filter(
      item => !(item.id === itemId && item.type === itemType)
    );
    savePinnedItems(newPinnedItems);
  };

  const isPinned = (itemId, itemType) => {
    return pinnedItems.some(item => item.id === itemId && item.type === itemType);
  };

  // Search functionality
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { products: [], models: [], datasets: [] };

    const query = searchQuery.toLowerCase();
    const products = (dataProductsData.products || dataProductsData.items || [])
      .filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(p => ({ ...p, type: 'product', displayName: p.name }));

    const models = (Array.isArray(modelsData) ? modelsData : (modelsData.models || []))
      .filter(m => 
        m.name?.toLowerCase().includes(query) ||
        m.shortName?.toLowerCase().includes(query) ||
        m.summary?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(m => ({ ...m, type: 'model', displayName: m.name || m.shortName, id: m.shortName || m.id }));

    const datasets = (Array.isArray(datasetsData) ? datasetsData : [])
      .filter(d => 
        d.name?.toLowerCase().includes(query) ||
        d.description?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(d => ({ ...d, type: 'dataset', displayName: d.name }));

    return { products, models, datasets };
  }, [searchQuery]);

  // Group pinned items by type
  const groupedPins = React.useMemo(() => {
    const groups = {
      products: [],
      models: [],
      datasets: [],
      tools: [],
    };

    pinnedItems.forEach(item => {
      if (groups[item.type]) {
        groups[item.type].push(item);
      }
    });

    return groups;
  }, [pinnedItems]);

  const handleNavigate = (item) => {
    switch (item.type) {
      case 'product':
        navigate(`/data-products/${item.id}`);
        break;
      case 'model':
        navigate(`/models/${item.id}`);
        break;
      case 'dataset':
        navigate(`/pipelines/datasets/${item.id}`);
        break;
      default:
        break;
    }
  };

  const renderPinnedItem = (item) => {
    switch (item.type) {
      case 'product':
        const product = (dataProductsData.products || dataProductsData.items || [])
          .find(p => p.id === item.id);
        if (!product) return null;
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`product-${item.id}`}>
            <Box sx={{ position: 'relative', overflow: 'visible' }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnpin(item.id, 'product');
                }}
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  right: -16,
                  zIndex: 20,
                  bgcolor: '#37ABBF',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px 0 0 4px',
                  boxShadow: '0 2px 8px rgba(55, 171, 191, 0.3)',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                  '&:hover': { 
                    bgcolor: '#2a8a9a',
                    boxShadow: '0 2px 12px rgba(55, 171, 191, 0.4)',
                  },
                }}
              >
                <PinIcon sx={{ color: 'white', fontSize: 18 }} />
              </IconButton>
              <Box onClick={() => handleNavigate(item)}>
                <DataProductCard
                  product={product}
                  currentTheme={currentTheme}
                  onClick={() => handleNavigate(item)}
                />
              </Box>
            </Box>
          </Grid>
        );
      case 'model':
        const model = (Array.isArray(modelsData) ? modelsData : (modelsData.models || []))
          .find(m => (m.shortName || m.id) === item.id);
        if (!model) return null;
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`model-${item.id}`}>
            <Box sx={{ position: 'relative', overflow: 'visible' }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnpin(item.id, 'model');
                }}
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  right: -16,
                  zIndex: 20,
                  bgcolor: '#37ABBF',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px 0 0 4px',
                  boxShadow: '0 2px 8px rgba(55, 171, 191, 0.3)',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                  '&:hover': { 
                    bgcolor: '#2a8a9a',
                    boxShadow: '0 2px 12px rgba(55, 171, 191, 0.4)',
                  },
                }}
              >
                <PinIcon sx={{ color: 'white', fontSize: 18 }} />
              </IconButton>
              <Box onClick={() => handleNavigate(item)}>
                <DataModelCard
                  model={model}
                  currentTheme={currentTheme}
                  onClick={() => handleNavigate(item)}
                />
              </Box>
            </Box>
          </Grid>
        );
      case 'dataset':
        const dataset = (Array.isArray(datasetsData) ? datasetsData : [])
          .find(d => d.id === item.id);
        if (!dataset) return null;
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`dataset-${item.id}`}>
            <Box sx={{ position: 'relative', overflow: 'visible' }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnpin(item.id, 'dataset');
                }}
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  right: -16,
                  zIndex: 20,
                  bgcolor: '#37ABBF',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px 0 0 4px',
                  boxShadow: '0 2px 8px rgba(55, 171, 191, 0.3)',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
                  '&:hover': { 
                    bgcolor: '#2a8a9a',
                    boxShadow: '0 2px 12px rgba(55, 171, 191, 0.4)',
                  },
                }}
              >
                <PinIcon sx={{ color: 'white', fontSize: 18 }} />
              </IconButton>
              <Box onClick={() => handleNavigate(item)}>
                <DatasetCard
                  dataset={dataset}
                  currentTheme={currentTheme}
                  onClick={() => handleNavigate(item)}
                  pipelineNames={pipelineNames}
                />
              </Box>
            </Box>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
            My Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary }}>
            Pin your frequently accessed items for quick access
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PinDropIcon />}
          onClick={() => setSearchOpen(true)}
          sx={{
            bgcolor: '#37ABBF',
            '&:hover': { bgcolor: '#2a8a9a' },
          }}
        >
          Add Pin
        </Button>
      </Box>

      {/* Tabs for filtering pinned items */}
      {pinnedItems.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                color: currentTheme.textSecondary,
                '&.Mui-selected': {
                  color: '#37ABBF',
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#37ABBF',
              },
            }}
          >
            <Tab label={`All (${pinnedItems.length})`} />
            <Tab label={`Products (${groupedPins.products.length})`} />
            <Tab label={`Models (${groupedPins.models.length})`} />
            <Tab label={`Datasets (${groupedPins.datasets.length})`} />
          </Tabs>
        </Box>
      )}

      {/* Pinned Items Grid */}
      {pinnedItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: currentTheme.card,
            border: `1px dashed ${currentTheme.border}`,
            borderRadius: 2,
          }}
        >
          <PinDropIcon sx={{ fontSize: 64, color: currentTheme.textSecondary, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ color: currentTheme.text, mb: 1 }}>
            No pinned items yet
          </Typography>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mb: 3 }}>
            Click "Add Pin" to start pinning your favorite items
          </Typography>
          <Button
            variant="outlined"
            startIcon={<PinDropIcon />}
            onClick={() => setSearchOpen(true)}
            sx={{
              borderColor: '#37ABBF',
              color: '#37ABBF',
              '&:hover': {
                borderColor: '#2a8a9a',
                bgcolor: alpha('#37ABBF', 0.1),
              },
            }}
          >
            Add Your First Pin
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {(() => {
            let itemsToShow = pinnedItems;
            if (activeTab === 1) itemsToShow = groupedPins.products;
            else if (activeTab === 2) itemsToShow = groupedPins.models;
            else if (activeTab === 3) itemsToShow = groupedPins.datasets;

            return itemsToShow.map(item => renderPinnedItem(item)).filter(Boolean);
          })()}
        </Grid>
      )}

      {/* Search Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            border: `1px solid ${currentTheme.border}`,
          },
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Pin Items</Typography>
            <IconButton
              size="small"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              sx={{ color: currentTheme.textSecondary }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search for products, models, datasets..."
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
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: currentTheme.background,
                '& fieldset': {
                  borderColor: currentTheme.border,
                },
                '&:hover fieldset': {
                  borderColor: '#37ABBF',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#37ABBF',
                },
              },
            }}
          />

          {searchQuery.trim() && (
            <Box>
              {searchResults.products.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                    Data Products
                  </Typography>
                  <List>
                    {searchResults.products.map((product) => (
                      <ListItem
                        key={product.id}
                        disablePadding
                        secondaryAction={
                          isPinned(product.id, 'product') ? (
                            <Chip label="Pinned" size="small" sx={{ bgcolor: alpha('#37ABBF', 0.1), color: '#37ABBF' }} />
                          ) : (
                            <IconButton
                              edge="end"
                              onClick={() => handlePin({ id: product.id, type: 'product', name: product.name })}
                              sx={{ color: '#37ABBF' }}
                            >
                              <PinDropIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemButton onClick={() => handleNavigate(product)}>
                          <ListItemIcon>
                            <ShoppingCartIcon sx={{ color: '#37ABBF' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={product.name}
                            secondary={product.description?.substring(0, 60) + '...'}
                            primaryTypographyProps={{ color: currentTheme.text }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {searchResults.models.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                    Data Models
                  </Typography>
                  <List>
                    {searchResults.models.map((model) => (
                      <ListItem
                        key={model.id}
                        disablePadding
                        secondaryAction={
                          isPinned(model.id, 'model') ? (
                            <Chip label="Pinned" size="small" sx={{ bgcolor: alpha('#37ABBF', 0.1), color: '#37ABBF' }} />
                          ) : (
                            <IconButton
                              edge="end"
                              onClick={() => handlePin({ id: model.id, type: 'model', name: model.displayName })}
                              sx={{ color: '#37ABBF' }}
                            >
                              <PinDropIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemButton onClick={() => handleNavigate(model)}>
                          <ListItemIcon>
                            <StorageIcon sx={{ color: '#37ABBF' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={model.displayName}
                            secondary={model.summary?.substring(0, 60) + '...'}
                            primaryTypographyProps={{ color: currentTheme.text }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {searchResults.datasets.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                    Datasets
                  </Typography>
                  <List>
                    {searchResults.datasets.map((dataset) => (
                      <ListItem
                        key={dataset.id}
                        disablePadding
                        secondaryAction={
                          isPinned(dataset.id, 'dataset') ? (
                            <Chip label="Pinned" size="small" sx={{ bgcolor: alpha('#37ABBF', 0.1), color: '#37ABBF' }} />
                          ) : (
                            <IconButton
                              edge="end"
                              onClick={() => handlePin({ id: dataset.id, type: 'dataset', name: dataset.name })}
                              sx={{ color: '#37ABBF' }}
                            >
                              <PinDropIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemButton onClick={() => handleNavigate(dataset)}>
                          <ListItemIcon>
                            <AccountTreeIcon sx={{ color: '#37ABBF' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={dataset.name}
                            secondary={dataset.description?.substring(0, 60) + '...'}
                            primaryTypographyProps={{ color: currentTheme.text }}
                            secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {searchResults.products.length === 0 &&
                searchResults.models.length === 0 &&
                searchResults.datasets.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      No results found
                    </Typography>
                  </Box>
                )}
            </Box>
          )}

          {!searchQuery.trim() && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SearchIcon sx={{ fontSize: 48, color: currentTheme.textSecondary, mb: 2, opacity: 0.5 }} />
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                Start typing to search for items to pin
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${currentTheme.border}` }}>
          <Button
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            sx={{ color: currentTheme.textSecondary }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HomePage;
