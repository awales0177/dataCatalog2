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
  Chip,
  Fab,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../App';
import { fetchAgreements } from '../services/api';
import ProductAgreementCard from '../components/ProductAgreementCard';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 12;

const ProductAgreementsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [allAgreements, setAllAgreements] = useState([]);
  const [filteredAgreements, setFilteredAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
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
        setFilteredAgreements(validAgreements);
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

  useEffect(() => {
    let filtered = [...allAgreements];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      
      filtered = filtered.filter(agreement => {
        if (!agreement) return false;

        let searchStr = '';
        
        if (agreement.name) searchStr += agreement.name + ' ';
        if (agreement.description) searchStr += agreement.description + ' ';
        if (agreement.dataProducer) searchStr += agreement.dataProducer + ' ';
        if (agreement.dataConsumer) searchStr += agreement.dataConsumer + ' ';
        if (agreement.modelShortName) searchStr += agreement.modelShortName + ' ';
        if (agreement.status) searchStr += agreement.status + ' ';
        
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

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(agreement => 
        agreement && agreement.status === selectedStatus
      );
    }

    setFilteredAgreements(filtered);
    setPage(1);
  }, [searchQuery, selectedStatus, allAgreements]);

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
      specificationMaintainer: '',
      parentSystem: '',
      dataProducer: '',
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
      nextUpdate: '',
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

  const statusOptions = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'in_review', label: 'In Review' },
    { id: 'expired', label: 'Expired' }
  ];

  const totalPages = Math.ceil(filteredAgreements.length / ITEMS_PER_PAGE);
  const paginatedAgreements = filteredAgreements.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
        Manage and monitor product agreements between producers and consumers. Track agreement status and compliance across your data ecosystem.
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

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {statusOptions.map((status) => (
            <Chip
              key={status.id}
              label={status.label}
              onClick={() => setSelectedStatus(status.id)}
              sx={{
                backgroundColor: selectedStatus === status.id ? getStatusColor(status.id) : 'transparent',
                color: selectedStatus === status.id ? 'white' : getStatusColor(status.id),
                border: `1px solid ${getStatusColor(status.id)}`,
                '&:hover': {
                  backgroundColor: selectedStatus === status.id ? getStatusColor(status.id) : `${getStatusColor(status.id)}20`,
                },
                transition: 'all 0.2s ease-in-out',
              }}
            />
          ))}
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