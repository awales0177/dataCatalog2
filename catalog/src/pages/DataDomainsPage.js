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
import ZoneCard from '../components/ZoneCard';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchDomains, fetchZones } from '../services/api';

const DataDomainsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [zones, setZones] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch zones from API (zones.json is the source of truth)
        let zonesData = [];
        let domainsData = [];
        
        try {
          const zonesResponse = await fetchZones({ forceRefresh: true });
          zonesData = zonesResponse.zones || [];
          console.log('Zones loaded from API (zones.json):', zonesData.length, 'zones');
          
          if (zonesData.length === 0) {
            console.warn('No zones found in zones.json - zones must be defined in zones.json');
          }
        } catch (zonesError) {
          console.error('Failed to load zones from API:', zonesError);
          setError('Failed to load zones. Zones must be defined in zones.json');
        }

        // Always fetch domains
        const domainsResponse = await fetchDomains();
        domainsData = domainsResponse.domains || [];

        // Use zones from API (zones.json) - this is the source of truth
        // Domains that don't match any zone in zones.json will be in the "Unzoned" zone
        if (zonesData.length > 0) {
          setZones(zonesData);
        } else {
          // If no zones are defined, show error message
          setZones([]);
        }

        setDomains(domainsData);
      } catch (error) {
        setError('Failed to load data zones and domains');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter zones and their domains based on search query
  const getFilteredZones = () => {
    if (!searchQuery.trim()) {
      return zones;
    }

    const query = searchQuery.toLowerCase();
    return zones.map(zone => {
      const matchesZone = zone.name.toLowerCase().includes(query) ||
                         (zone.description && zone.description.toLowerCase().includes(query));
      
      const filteredDomains = zone.domains?.filter(domain => {
        return domain.name.toLowerCase().includes(query) ||
               (domain.description && domain.description.toLowerCase().includes(query));
      }) || [];

      // Include zone if it matches or has matching domains
      if (matchesZone || filteredDomains.length > 0) {
        return {
          ...zone,
          domains: filteredDomains
        };
      }
      return null;
    }).filter(zone => zone !== null);
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

  const filteredZones = getFilteredZones();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, color: currentTheme.text }}>
        Data Domains
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: currentTheme.textSecondary }}>
        Organize and manage your data zones and domains. Data zones are higher-level constructs that group related data domains together. View zone ownership, relationships, and associated data assets across your organization.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search zones and domains..."
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

      {filteredZones.length > 0 ? (
        <Box>
          {filteredZones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              currentTheme={currentTheme}
            />
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            color: currentTheme.textSecondary,
          }}
        >
          <Typography variant="body1">
            No zones or domains found matching your search.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default DataDomainsPage; 