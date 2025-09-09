import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  DataObject as ModelIcon,
  Description as AgreementIcon,
  Folder as DomainIcon,
  Apps as ApplicationIcon,
  LibraryBooks as ReferenceIcon,
  Build as ToolkitIcon,
  Policy as PolicyIcon,
  MenuBook as LexiconIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { globalSearch, getSearchSuggestions, getSearchStats } from '../services/api';

const GlobalSearch = ({ open, onClose, currentTheme, darkMode }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchStats, setSearchStats] = useState(null);
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Load search stats on mount
  useEffect(() => {
    loadSearchStats();
  }, []);

  const loadSearchStats = async () => {
    try {
      const stats = await getSearchStats();
      setSearchStats(stats);
    } catch (error) {
      console.error('Error loading search stats:', error);
    }
  };

  const getTypeIcon = (type) => {
    const iconMap = {
      'models': <ModelIcon />,
      'dataAgreements': <AgreementIcon />,
      'domains': <DomainIcon />,
      'applications': <ApplicationIcon />,
      'reference': <ReferenceIcon />,
      'toolkit': <ToolkitIcon />,
      'policies': <PolicyIcon />,
      'lexicon': <LexiconIcon />
    };
    return iconMap[type] || <SearchIcon />;
  };

  const getTypeLabel = (type) => {
    const labelMap = {
      'models': 'Data Model',
      'dataAgreements': 'Agreement',
      'domains': 'Domain',
      'applications': 'Application',
      'reference': 'Reference Data',
      'toolkit': 'Toolkit',
      'policies': 'Policy',
      'lexicon': 'Lexicon'
    };
    return labelMap[type] || type;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      'models': 'primary',
      'dataAgreements': 'secondary',
      'domains': 'success',
      'applications': 'info',
      'reference': 'warning',
      'toolkit': 'error',
      'policies': 'default',
      'lexicon': 'primary'
    };
    return colorMap[type] || 'default';
  };

  const getItemTitle = (item) => {
    return String(item.name || item.shortName || item.title || item.id || 'Untitled');
  };

  const getItemDescription = (item) => {
    return String(item.description || item.extendedDescription || item.status || '');
  };

  const getItemPath = (item, type) => {
    let id;
    switch (type) {
      case 'models':
        // For models, prioritize shortName over id
        id = item.shortName || item.id || item.name;
        return `/models/${id}`;
      case 'dataAgreements':
        id = item.id || item.shortName || item.name;
        return `/agreements/${id}`;
      case 'domains':
        return `/domains`;
      case 'applications':
        return `/applications`;
      case 'reference':
        id = item.id || item.shortName || item.name;
        return `/reference/${id}`;
      case 'toolkit':
        // For toolkit, check if it's a function and route accordingly
        id = item.id || item.shortName || item.name;
        if (item.type === 'functions') {
          return `/toolkit/function/${id}`;
        }
        return `/toolkit`;
      case 'policies':
        return `/policies`;
      case 'lexicon':
        return `/lexicon`;
      default:
        id = item.id || item.shortName || item.name;
        return '/';
    }
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const data = await globalSearch(searchQuery, { limit: 20 });
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestions = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const data = await getSearchSuggestions(searchQuery, 10);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const handleQueryChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value);
        handleSuggestions(value);
      } else {
        setResults([]);
        setSuggestions([]);
      }
    }, 300);
  };

  const handleItemClick = (item, type) => {
    const path = getItemPath(item, type);
    navigate(path);
    onClose();
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const highlightText = (text, query) => {
    if (!query || !text || typeof text !== 'string') return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark 
          key={index} 
          style={{ 
            backgroundColor: darkMode ? '#ffd54f' : '#ffeb3b',
            color: darkMode ? '#000' : '#000',
            padding: '0 2px',
            borderRadius: '2px'
          }}
        >
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          borderRadius: 2,
          bgcolor: currentTheme?.card || '#ffffff',
          color: currentTheme?.text || '#000000'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, color: currentTheme?.text || '#000000' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SearchIcon sx={{ color: currentTheme?.primary || '#3498db' }} />
            <Typography variant="h6" sx={{ color: currentTheme?.text || '#000000' }}>Global Search</Typography>
            {searchStats && (
              <Chip
                size="small"
                label={`${searchStats.total_documents} items indexed`}
                sx={{
                  color: currentTheme?.primary || '#3498db',
                  borderColor: currentTheme?.primary || '#3498db'
                }}
                variant="outlined"
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: currentTheme?.text || '#000000' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            ref={inputRef}
            fullWidth
            placeholder="Search across all data models, agreements, domains..."
            value={query}
            onChange={handleQueryChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? <CircularProgress size={20} sx={{ color: currentTheme?.primary || '#3498db' }} /> : <SearchIcon sx={{ color: currentTheme?.textSecondary || '#7f8c8d' }} />}
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClear} size="small" sx={{ color: currentTheme?.textSecondary || '#7f8c8d' }}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ 
              mb: 1,
              '& .MuiOutlinedInput-root': {
                color: currentTheme?.text || '#000000',
                '& fieldset': {
                  borderColor: currentTheme?.border || 'rgba(0, 0, 0, 0.08)',
                },
                '&:hover fieldset': {
                  borderColor: currentTheme?.primary || '#3498db',
                },
                '&.Mui-focused fieldset': {
                  borderColor: currentTheme?.primary || '#3498db',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: currentTheme?.textSecondary || '#7f8c8d',
                opacity: 1,
              },
            }}
          />
        </Box>

        {showSuggestions && suggestions.length > 0 && (
          <Paper sx={{ 
            mx: 2, 
            mb: 1,
            bgcolor: currentTheme?.card || '#ffffff',
            border: 1,
            borderColor: currentTheme?.border || 'rgba(0, 0, 0, 0.08)'
          }}>
            <Typography variant="subtitle2" sx={{ p: 1, pb: 0, color: currentTheme?.textSecondary || '#7f8c8d' }}>
              Suggestions
            </Typography>
            <List dense>
              {suggestions.map((suggestion, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{ 
                    py: 0.5,
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: currentTheme?.textSecondary || '#7f8c8d' }}>
                    <SearchIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={highlightText(String(suggestion), query)}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      sx: { color: currentTheme?.text || '#000000' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {results.length > 0 && (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: currentTheme?.textSecondary || '#7f8c8d' }}>
              Results ({results.length})
            </Typography>
            <List>
              {results.map((item, index) => {
                const type = item._search_type;
                const title = getItemTitle(item);
                const description = getItemDescription(item);
                const score = item._search_score;
                const matchedTerms = item._matched_terms || [];
                const path = getItemPath(item, type);

                return (
                  <React.Fragment key={`${type}-${item._search_id}-${index}`}>
                    <ListItem
                      button
                      onClick={() => handleItemClick(item, type)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: currentTheme?.primary || '#3498db' }}>
                        {getTypeIcon(type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" sx={{ color: currentTheme?.text || '#000000' }}>
                              {highlightText(title, query)}
                            </Typography>
                            <Chip
                              size="small"
                              label={getTypeLabel(type)}
                              sx={{
                                color: currentTheme?.primary || '#3498db',
                                borderColor: currentTheme?.primary || '#3498db'
                              }}
                              variant="outlined"
                            />
                            {score && (
                              <Chip
                                size="small"
                                label={`${Math.round(score * 100)}%`}
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  color: currentTheme?.textSecondary || '#7f8c8d',
                                  borderColor: currentTheme?.border || 'rgba(0, 0, 0, 0.08)'
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {description && (
                              <Typography variant="body2" sx={{ mb: 0.5, color: currentTheme?.textSecondary || '#7f8c8d' }}>
                                {highlightText(description, query)}
                              </Typography>
                            )}
                            {matchedTerms.length > 0 && (
                              <Box display="flex" gap={0.5} flexWrap="wrap">
                                {matchedTerms.slice(0, 5).map((term, termIndex) => (
                                  <Chip
                                    key={termIndex}
                                    size="small"
                                    label={term}
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: '0.7rem', 
                                      height: 20,
                                      color: currentTheme?.textSecondary || '#7f8c8d',
                                      borderColor: currentTheme?.border || 'rgba(0, 0, 0, 0.08)'
                                    }}
                                  />
                                ))}
                              </Box>
                            )}
                            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: currentTheme?.textSecondary || '#7f8c8d' }}>
                              Path: {path}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < results.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
        )}

        {query && !loading && results.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: currentTheme?.textSecondary || '#7f8c8d' }}>
              No results found for "{query}"
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: currentTheme?.textSecondary || '#7f8c8d' }}>
              Try different keywords or check your spelling
            </Typography>
          </Box>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
