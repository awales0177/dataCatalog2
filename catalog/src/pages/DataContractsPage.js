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
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../App';
import { fetchContracts } from '../services/api';
import DataContractCard from '../components/DataContractCard';
import Pagination from '../components/Pagination';

const ITEMS_PER_PAGE = 12;

const DataContractsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [allContracts, setAllContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const theme = useTheme();

  useEffect(() => {
    const loadContracts = async () => {
      try {
        const data = await fetchContracts();
        const validContracts = (data?.contracts || []).filter(contract => 
          contract && typeof contract === 'object'
        );
        setAllContracts(validContracts);
        setFilteredContracts(validContracts);
        setError(null);
      } catch (err) {
        setError('Failed to load contracts');
        console.error('Error loading contracts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, []);

  useEffect(() => {
    let filtered = [...allContracts];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      
      // Simple string-based search without array methods
      filtered = filtered.filter(contract => {
        // Skip invalid contracts
        if (!contract) return false;

        // Build search string manually
        let searchStr = '';
        
        // Add each field if it exists
        if (contract.name) searchStr += contract.name + ' ';
        if (contract.description) searchStr += contract.description + ' ';
        if (contract.producer) searchStr += contract.producer + ' ';
        if (contract.consumer) searchStr += contract.consumer + ' ';
        if (contract.modelShortName) searchStr += contract.modelShortName + ' ';
        if (contract.status) searchStr += contract.status + ' ';
        
        // Handle tags without using array methods
        if (contract.tags) {
          for (let i = 0; i < contract.tags.length; i++) {
            if (contract.tags[i]) {
              searchStr += contract.tags[i] + ' ';
            }
          }
        }

        // Convert to lowercase and check
        return searchStr.toLowerCase().includes(searchLower);
      });
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(contract => 
        contract && contract.status === selectedStatus
      );
    }

    setFilteredContracts(filtered);
    setPage(1);
  }, [searchQuery, selectedStatus, allContracts]);

  const handlePageChange = (event, value) => {
    setPage(value);
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

  const totalPages = Math.ceil(filteredContracts.length / ITEMS_PER_PAGE);
  const paginatedContracts = filteredContracts.slice(
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
        Data Contracts
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Manage and monitor data contracts between producers and consumers. Track contract status and compliance across your data ecosystem.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search data contracts..."
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
        {paginatedContracts.map((contract) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={contract.id}>
            <DataContractCard contract={contract} currentTheme={currentTheme} />
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
    </Container>
  );
};

export default DataContractsPage; 