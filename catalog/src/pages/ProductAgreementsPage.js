import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Fab,
  useTheme,
  Tabs,
  Tab,
  Badge,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayArrowIcon,
  RateReview as RateReviewIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchAgreements } from '../services/api';
import ProductAgreementCard from '../components/ProductAgreementCard';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

const ProductAgreementsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [allAgreements, setAllAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [page, setPage] = useState(1);
  const theme = useTheme();

  useEffect(() => {
    const loadAgreements = async () => {
      try {
        console.log('Fetching agreements...');
        const data = await fetchAgreements();
        console.log('API Response:', data);
        const validAgreements = (data?.agreements || []).filter(agreement => 
          agreement && typeof agreement === 'object'
        );
        console.log('Valid agreements:', validAgreements);
        setAllAgreements(validAgreements);
        setError(null);
      } catch (err) {
        console.error('Error loading agreements:', err);
        setError('Failed to load agreements');
      } finally {
        setLoading(false);
      }
    };

    loadAgreements();
  }, []);

  // Get unique owners from all agreements
  const getUniqueOwners = () => {
    const owners = new Set();
    allAgreements.forEach(agreement => {
      if (agreement && agreement.owner) {
        if (Array.isArray(agreement.owner)) {
          agreement.owner.forEach(owner => {
            if (owner && owner.trim()) {
              owners.add(owner.trim());
            }
          });
        } else if (agreement.owner.trim()) {
          owners.add(agreement.owner.trim());
        }
      }
    });
    const sortedOwners = Array.from(owners).sort();
    
    // Check if there are any agreements without owners
    const hasAbandonedAgreements = allAgreements.some(agreement => {
      if (!agreement || !agreement.owner) return true;
      if (Array.isArray(agreement.owner)) {
        return agreement.owner.length === 0 || agreement.owner.every(owner => !owner || !owner.trim());
      }
      return !agreement.owner.trim();
    });
    
    // Add "Abandoned" tab if there are agreements without owners
    if (hasAbandonedAgreements) {
      sortedOwners.push('Abandoned');
    }
    
    return sortedOwners;
  };

  const uniqueOwners = getUniqueOwners();

  // Filter agreements based on search and tab selection
  const getFilteredAgreements = () => {
    let filtered = [...allAgreements];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      
      filtered = filtered.filter(agreement => {
        if (!agreement) return false;

        let searchStr = '';
        
        if (agreement.name) searchStr += agreement.name + ' ';
        if (agreement.description) searchStr += agreement.description + ' ';
        if (agreement.owner) {
          if (Array.isArray(agreement.owner)) {
            agreement.owner.forEach(owner => {
              if (owner) searchStr += owner + ' ';
            });
          } else {
            searchStr += agreement.owner + ' ';
          }
        }
        if (agreement.dataProducer) {
          if (Array.isArray(agreement.dataProducer)) {
            agreement.dataProducer.forEach(producer => {
              if (producer) searchStr += producer + ' ';
            });
          } else {
            searchStr += agreement.dataProducer + ' ';
          }
        }
        if (agreement.dataConsumer) {
          if (Array.isArray(agreement.dataConsumer)) {
            agreement.dataConsumer.forEach(consumer => {
              if (consumer) searchStr += consumer + ' ';
            });
          } else {
            searchStr += agreement.dataConsumer + ' ';
          }
        }
        if (agreement.modelShortName) searchStr += agreement.modelShortName + ' ';
        if (agreement.status) searchStr += agreement.status + ' ';
        if (agreement.network) {
          if (Array.isArray(agreement.network)) {
            agreement.network.forEach(network => {
              if (network) searchStr += network + ' ';
            });
          } else {
            searchStr += agreement.network + ' ';
          }
        }
        if (agreement.sensitivityLevel) {
          if (Array.isArray(agreement.sensitivityLevel)) {
            agreement.sensitivityLevel.forEach(level => {
              if (level) searchStr += level + ' ';
            });
          } else {
            searchStr += agreement.sensitivityLevel + ' ';
          }
        }
        
        if (agreement.tags) {
          for (let i = 0; i < agreement.tags.length; i++) {
            if (agreement.tags[i]) {
              searchStr += agreement.tags[i] + ' ';
            }
          }
        }

        return searchStr.toLowerCase().includes(searchLower);
      });
    }

    // Apply tab filter by owner
    if (selectedTab < uniqueOwners.length) {
      const selectedOwner = uniqueOwners[selectedTab];
      
      if (selectedOwner === 'Abandoned') {
        // Filter for agreements without owners
        filtered = filtered.filter(agreement => {
          if (!agreement || !agreement.owner) return true;
          if (Array.isArray(agreement.owner)) {
            return agreement.owner.length === 0 || agreement.owner.every(owner => !owner || !owner.trim());
          }
          return !agreement.owner.trim();
        });
      } else {
        // Filter for agreements with the selected owner
        filtered = filtered.filter(agreement => {
          if (!agreement || !agreement.owner) return false;
          
          if (Array.isArray(agreement.owner)) {
            return agreement.owner.some(owner => 
              owner && owner.trim() === selectedOwner
            );
          } else {
            return agreement.owner.trim() === selectedOwner;
          }
        });
      }
    }

    return filtered;
  };

  const filteredAgreements = getFilteredAgreements();

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleCreateNewAgreement = () => {
    const tempId = `temp_${Date.now()}`;
    const newAgreement = {
      id: tempId,
      name: '',
      description: '',
      status: 'draft',
      owner: [],
      specificationMaintainer: '',
      parentSystem: '',
      dataProducer: [''],
      dataValidator: '',
      dataConsumer: [],
      modelShortName: '',
      contractVersion: '1.0.0',
      deliveredVersion: ['1.0.0'],
      deliveryFrequency: ['One-Time'],
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      fileFormat: 'JSON',
      restricted: false,
      network: ['internet'],
      sensitivityLevel: ['public'],
      location: {},
      todo: {
        date: new Date().toISOString(),
        items: ['Initial setup tasks']
      },
      changelog: [
        {
          version: '1.0.0',
          date: new Date().toISOString().slice(0, 10),
          changes: ['Initial agreement creation']
        }
      ],
      
      lastUpdated: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    localStorage.setItem('newAgreementTemplate', JSON.stringify(newAgreement));
    navigate('/agreements/create');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'in_review':
        return '#ff9800';
      case 'expired':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const totalPages = Math.ceil(filteredAgreements.length / ITEMS_PER_PAGE);
  const paginatedAgreements = filteredAgreements.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [selectedTab]);

  // Reset tab when owners change (in case of data refresh)
  useEffect(() => {
    if (selectedTab >= uniqueOwners.length) {
      setSelectedTab(0);
    }
  }, [uniqueOwners.length, selectedTab]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Product Agreements
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Manage and monitor product agreements grouped by owners. Track agreement status and compliance across your data ecosystem.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search product agreements..."
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
              backgroundColor: currentTheme.card,
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

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: currentTheme.textSecondary,
                '&.Mui-selected': {
                  color: currentTheme.primary,
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: currentTheme.primary,
              },
              '& .MuiTabs-scrollButtons': {
                color: currentTheme.primary,
                '&.Mui-disabled': {
                  color: currentTheme.textSecondary,
                  opacity: 0.3,
                },
              },
              '& .MuiBadge-badge': {
                color: 'white',
                '&.MuiBadge-colorPrimary': {
                  backgroundColor: currentTheme.primary,
                },
                '&.MuiBadge-colorError': {
                  backgroundColor: currentTheme.error,
                },
              },
            }}
          >
            {uniqueOwners.map((owner, index) => (
              <Tab
                key={owner}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography 
                      sx={{ 
                        color: owner === 'Abandoned' ? currentTheme.error : 'inherit',
                        fontWeight: owner === 'Abandoned' ? 600 : 'normal'
                      }}
                    >
                      {owner}
                    </Typography>
                    <Badge 
                      badgeContent={
                        owner === 'Abandoned' 
                          ? allAgreements.filter(agreement => {
                              if (!agreement || !agreement.owner) return true;
                              if (Array.isArray(agreement.owner)) {
                                return agreement.owner.length === 0 || agreement.owner.every(o => !o || !o.trim());
                              }
                              return !agreement.owner.trim();
                            }).length
                          : allAgreements.filter(agreement => {
                              if (!agreement || !agreement.owner) return false;
                              if (Array.isArray(agreement.owner)) {
                                return agreement.owner.some(o => o && o.trim() === owner);
                              } else {
                                return agreement.owner.trim() === owner;
                              }
                            }).length
                      } 
                      color={owner === 'Abandoned' ? 'error' : 'primary'}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {paginatedAgreements.map((agreement) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={agreement.id}>
            <ProductAgreementCard agreement={agreement} currentTheme={currentTheme} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.max(totalPages, 1)}
          page={page}
          onChange={handlePageChange}
          currentTheme={currentTheme}
        />
      </Box>

      {/* Floating Action Button for creating new agreements */}
      <Fab
        color="primary"
        aria-label="add new agreement"
        onClick={handleCreateNewAgreement}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: currentTheme.primary,
          color: currentTheme.background,
          '&:hover': {
            bgcolor: currentTheme.primaryDark || currentTheme.primary
          },
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default ProductAgreementsPage; 