import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
} from '@mui/icons-material';
import DomainCard from '../components/DomainCard';
import DomainModal from '../components/DomainModal';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchDomains } from '../services/api';

const DataDomainsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const domainsResponse = await fetchDomains();
        const domainsData = domainsResponse.domains || [];
        setDomains(domainsData);
      } catch (error) {
        setError('Failed to load data domains');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter domains based on search query
  const getFilteredDomains = () => {
    if (!searchQuery.trim()) {
      return domains;
    }

    const query = searchQuery.toLowerCase();
    return domains.filter(domain => {
        return domain.name.toLowerCase().includes(query) ||
             (domain.description && domain.description.toLowerCase().includes(query)) ||
             (domain.owner && domain.owner.toLowerCase().includes(query));
    });
  };

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: currentTheme.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          {error}
        </Alert>
      </Box>
    );
  }

  const filteredDomains = getFilteredDomains();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Domains
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Organize and manage your data domains. View domain ownership, relationships, and associated data assets across your organization.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search domains..."
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
        />
      </Box>

      {filteredDomains.length > 0 ? (
        <Grid container spacing={2}>
          {filteredDomains.map((domain) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={domain.id || domain.name}>
              <DomainCard
                domain={domain}
                onClick={() => handleDomainClick(domain)}
              currentTheme={currentTheme}
            />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            color: currentTheme.textSecondary,
          }}
        >
          <Typography variant="body1">
            No domains found matching your search.
          </Typography>
        </Box>
      )}

      <DomainModal
        open={Boolean(selectedDomain)}
        onClose={() => setSelectedDomain(null)}
        domain={selectedDomain}
        currentTheme={currentTheme}
      />
    </Container>
  );
};

export default DataDomainsPage; 
