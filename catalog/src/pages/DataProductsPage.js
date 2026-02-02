import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Fab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import dataProductsData from '../data/dataProducts.json';
import Pagination from '../components/Pagination';
import DataProductCard from '../components/DataProductCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ITEMS_PER_PAGE = 12;

const DataProductsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { canCreate } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadDataProducts = () => {
      try {
        const products = dataProductsData.products || dataProductsData.items || [];
        setOriginalData(products);
        setFilteredData(products);
        setError(null);
      } catch (err) {
        setError('Failed to load data products');
        // Set empty array on error to prevent crashes
        setOriginalData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    loadDataProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = originalData.filter(item =>
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.id && item.id.toString().toLowerCase().includes(searchLower))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(originalData);
    }
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, originalData]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error && originalData.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Products
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Discover and manage data products. Browse curated data assets that are ready for consumption across your organization.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search data products..."
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
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      )}

      {filteredData.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: currentTheme.textSecondary, mb: 2 }}>
            No data products found
          </Typography>
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            {searchQuery ? 'Try adjusting your search query' : 'Get started by creating your first data product'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedData.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id || index}>
                <DataProductCard
                  product={item}
                  onClick={() => navigate(`/data-products/${item.id}`)}
                  currentTheme={currentTheme}
                />
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
        </>
      )}

      {canCreate() && (
        <Fab
          color="primary"
          aria-label="add new data product"
          onClick={() => navigate('/data-products/create')}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: currentTheme.primary,
            color: currentTheme.background,
            '&:hover': {
              bgcolor: currentTheme.primaryDark || currentTheme.primary,
            },
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default DataProductsPage;
