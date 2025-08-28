import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
  Alert,
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
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        const data = await fetchDomains();
        setDomains(data.domains);
      } catch (error) {
        setError('Failed to load data domains');
        console.error('Error loading domains:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDomains();
  }, []);

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

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         domain.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
          xl: 'repeat(5, 1fr)'
        },
        gap: { xs: 0.75, sm: 1, md: 1.25 },
        px: { xs: 0.5, sm: 0.75 },
        py: 1.5
      }}>
        {filteredDomains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            onClick={() => setSelectedDomain(domain)}
            currentTheme={currentTheme}
          />
        ))}
      </Box>

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