import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Chip,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  ViewModule as GridViewIcon,
  TableRows as TableViewIcon,
  Visibility as VisibilityIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ArrowDropUp as ArrowDropUpIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DataModelCard from '../components/DataModelCard';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData, trackModelClick } from '../services/api';
import Pagination from '../components/Pagination';
import { fontStackSans } from '../theme/theme';
import { useCatalogPreferences } from '../contexts/CatalogPreferencesContext';
import StickyPageIntro from '../components/StickyPageIntro';
import PageWithFixedHeader from '../components/PageWithFixedHeader';

const ITEMS_PER_PAGE_GRID = 12;
const ITEMS_PER_PAGE_TABLE = 20;

const SORT_OPTIONS = [
  { id: 'name-asc', label: 'Name (A–Z)' },
  { id: 'name-desc', label: 'Name (Z–A)' },
  { id: 'shortName-asc', label: 'Short name (A–Z)' },
  { id: 'shortName-desc', label: 'Short name (Z–A)' },
  { id: 'domain-asc', label: 'Domain (A–Z)' },
  { id: 'domain-desc', label: 'Domain (Z–A)' },
  { id: 'updated-desc', label: 'Last updated (newest)' },
  { id: 'updated-asc', label: 'Last updated (oldest)' },
  { id: 'tier-desc', label: 'Tier (best first)' },
  { id: 'tier-asc', label: 'Tier (lowest first)' },
  { id: 'verified-desc', label: 'Verified (yes first)' },
  { id: 'verified-asc', label: 'Verified (no first)' },
];

const TABLE_SORT_COLUMNS = ['name', 'shortName', 'domain', 'tier', 'updated', 'verified'];

function parseSortBy(sortByStr) {
  const parts = sortByStr.split('-');
  if (parts.length < 2) return { key: 'name', dir: 'asc' };
  const dir = parts[parts.length - 1] === 'desc' ? 'desc' : 'asc';
  const key = parts.slice(0, -1).join('-') || 'name';
  return { key, dir };
}

function DataModelsSortableHeadCell({ column, label, align, sortBy, onSort, currentTheme }) {
  const { key, dir } = parseSortBy(sortBy);
  const active = key === column;
  const upOn = active && dir === 'asc';
  const downOn = active && dir === 'desc';
  const cellAlign = align || 'left';
  const iconSx = { fontSize: 14, display: 'block', opacity: 1 };
  return (
    <TableCell
      align={cellAlign}
      sortDirection={active ? dir : false}
      sx={{
        fontWeight: 700,
        color: currentTheme.text,
        bgcolor: currentTheme.cardBackground || currentTheme.card,
        borderBottom: `2px solid ${currentTheme.border}`,
        py: 1.25,
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => onSort(column)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: cellAlign === 'center' ? 'center' : 'flex-start',
          width: cellAlign === 'center' ? '100%' : 'auto',
          gap: 0.25,
          cursor: 'pointer',
          border: 'none',
          background: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'inherit',
          '&:hover': { opacity: 0.85 },
        }}
      >
        <span>{label}</span>
        <Box
          component="span"
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0, flexShrink: 0 }}
          aria-hidden
        >
          <ArrowDropUpIcon sx={{ ...iconSx, opacity: upOn ? 1 : 0.28, mb: -0.75 }} />
          <ArrowDropDownIcon sx={{ ...iconSx, opacity: downOn ? 1 : 0.28, mt: -0.75 }} />
        </Box>
      </Box>
    </TableCell>
  );
}

const TIER_ORDER = { gold: 3, silver: 2, bronze: 1 };

const DataModelsPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { listViewMode: viewMode, setListViewMode } = useCatalogPreferences();
  const navigate = useNavigate();
  const [allModels, setAllModels] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadDataModels = async () => {
      try {
        const data = await fetchData('models');
        setAllModels(data.models || []);
        setFilteredModels(data.models || []);
        setError(null);
      } catch (err) {
        setError('Failed to load data models');
      } finally {
        setLoading(false);
      }
    };

    loadDataModels();
  }, []);

  const uniqueDomains = useMemo(() => {
    const set = new Set();
    allModels.forEach((m) => {
      if (!m) return;
      (m.domain || []).forEach((d) => set.add(d));
    });
    return Array.from(set).sort((a, b) => String(a).localeCompare(b));
  }, [allModels]);

  useEffect(() => {
    let filtered = [...allModels];

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((model) => {
        if (!model) return false;
        const searchableText = [
          model.name,
          model.description,
          model.shortName,
          Array.isArray(model.tags) ? model.tags.join(' ') : '',
          model.meta?.tier || '',
          model.meta?.verified ? 'verified' : '',
        ]
          .map((item) => String(item || ''))
          .join(' ')
          .toLowerCase();
        return searchableText.includes(searchLower);
      });
    }

    if (selectedQuality !== 'all') {
      filtered = filtered.filter((model) => {
        if (selectedQuality === 'verified') return model.meta?.verified === true;
        return model.meta?.tier?.toLowerCase() === selectedQuality;
      });
    }

    if (verifiedOnly) {
      filtered = filtered.filter((model) => model.meta?.verified === true);
    }

    if (selectedDomains.length > 0) {
      filtered = filtered.filter((model) => {
        const modelDomains = model.domain || [];
        return selectedDomains.some((d) => modelDomains.includes(d));
      });
    }

    const tierRank = (t) => TIER_ORDER[t?.toLowerCase()] ?? 0;
    const { key: sortKey, dir: sortDir } = parseSortBy(sortBy);
    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = String(a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' });
      } else if (sortKey === 'shortName') {
        cmp = String(a?.shortName || '').localeCompare(b?.shortName || '', undefined, { sensitivity: 'base' });
      } else if (sortKey === 'domain') {
        const da = (Array.isArray(a?.domain) ? a.domain : []).join(', ');
        const db = (Array.isArray(b?.domain) ? b.domain : []).join(', ');
        cmp = da.localeCompare(db, undefined, { sensitivity: 'base' });
      } else if (sortKey === 'updated') {
        const da = new Date(a?.lastUpdated || 0).getTime();
        const db = new Date(b?.lastUpdated || 0).getTime();
        cmp = da - db;
      } else if (sortKey === 'tier') {
        cmp = tierRank(a?.meta?.tier) - tierRank(b?.meta?.tier);
      } else if (sortKey === 'verified') {
        cmp = (a?.meta?.verified === true ? 1 : 0) - (b?.meta?.verified === true ? 1 : 0);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    setFilteredModels(filtered);
    setPage(1);
  }, [searchQuery, selectedQuality, selectedDomains, verifiedOnly, sortBy, allModels]);

  useEffect(() => {
    setPage(1);
  }, [viewMode]);

  const handleFavoriteToggle = (modelId) => {
    setFavorites((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId],
    );
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleTableColumnSort = (column) => {
    if (!TABLE_SORT_COLUMNS.includes(column)) return;
    const { key, dir } = parseSortBy(sortBy);
    let newDir;
    if (key === column) {
      newDir = dir === 'asc' ? 'desc' : 'asc';
    } else {
      newDir = column === 'updated' || column === 'tier' ? 'desc' : 'asc';
    }
    setSortBy(`${column}-${newDir}`);
  };

  const handleCreateNewModel = () => {
    const tempId = `temp_${Date.now()}`;

    const newModel = {
      id: tempId,
      shortName: '',
      name: '',
      version: '1.0.0',
      description: '',
      extendedDescription: '',
      lastUpdated: new Date().toISOString().slice(0, 19).replace('T', ' '),
      specMaintainer: '',
      domain: [],
      referenceData: [],
      meta: {
        tier: 'bronze',
        verified: false,
      },
      changelog: [
        {
          version: '1.0.0',
          date: new Date().toISOString().slice(0, 10),
          changes: ['Initial model creation'],
        },
      ],
      versionHistory: [
        {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          updatedBy: 'System',
          changeDescription: 'Initial model creation',
          changedFields: ['name', 'description', 'version'],
        },
      ],
      resources: {
        code: '',
        documentation: '',
        rules: '',
        tools: {},
        git: '',
        validation: '',
      },
      users: [],
      markdowns: [],
    };

    localStorage.setItem('newModelTemplate', JSON.stringify(newModel));
    navigate('/models/new/edit');
  };

  const modelsWithShortName = useMemo(
    () => (filteredModels || []).filter((m) => m?.shortName),
    [filteredModels],
  );

  const pageSize = viewMode === 'table' ? ITEMS_PER_PAGE_TABLE : ITEMS_PER_PAGE_GRID;
  const totalPages = Math.ceil(modelsWithShortName.length / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedModels = modelsWithShortName.slice(startIndex, startIndex + pageSize);

  const qualityLevels = [
    { id: 'all', label: 'All' },
    { id: 'bronze', label: 'Bronze' },
    { id: 'silver', label: 'Silver' },
    { id: 'gold', label: 'Gold' },
    { id: 'verified', label: 'Verified' },
  ];

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

  const inputBg = currentTheme.inputBackground || currentTheme.cardBackground || currentTheme.card;
  const inputBorder = currentTheme.inputBorder || currentTheme.border;

  return (
    <PageWithFixedHeader
      header={
        <StickyPageIntro sx={{ mb: 0 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
            Data Models
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, maxWidth: 720 }}>
            Explore and manage your data models. Use grid or table view, sort columns, and filter by domain or tier.
          </Typography>
        </StickyPageIntro>
      }
    >
      <Container maxWidth="xl" sx={{ py: 4, pt: 2 }}>
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search data models..."
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
              bgcolor: inputBg,
              '& fieldset': {
                borderColor: inputBorder,
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

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          {qualityLevels.map((level) => (
            <Chip
              key={level.id}
              label={level.label}
              onClick={() => setSelectedQuality(level.id)}
              sx={{
                backgroundColor: selectedQuality === level.id ? currentTheme.primary : currentTheme.background,
                color: selectedQuality === level.id ? currentTheme.background : currentTheme.text,
                '&:hover': {
                  backgroundColor: selectedQuality === level.id ? currentTheme.primaryDark : currentTheme.background,
                },
                flexShrink: 0,
              }}
            />
          ))}
          <Chip
            icon={<FilterListIcon sx={{ fontSize: 18 }} />}
            label={showFilters ? 'Hide filters' : 'More filters'}
            onClick={() => setShowFilters((v) => !v)}
            variant="outlined"
            sx={{
              borderColor: currentTheme.border,
              color: currentTheme.textSecondary,
              ml: 1,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200, ml: { xs: 0, sm: 'auto' } }}>
            <InputLabel id="data-models-sort-label" sx={{ color: currentTheme.textSecondary }}>
              Sort by
            </InputLabel>
            <Select
              labelId="data-models-sort-label"
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{
                color: currentTheme.text,
                bgcolor: inputBg,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: inputBorder },
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => {
              if (v) setListViewMode(v);
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: currentTheme.textSecondary,
                borderColor: currentTheme.border,
                px: 1.25,
              },
              '& .Mui-selected': {
                bgcolor: `${currentTheme.primary}22`,
                color: currentTheme.primary,
                borderColor: `${currentTheme.primary}55 !important`,
              },
            }}
          >
            <ToggleButton value="grid" aria-label="Grid view">
              <Tooltip title="Card grid">
                <GridViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <Tooltip title="Table">
                <TableViewIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Collapse in={showFilters}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 1,
              border: `1px solid ${inputBorder}`,
              bgcolor:
                currentTheme.cardBackground || (currentTheme.darkMode ? 'rgba(0,0,0,0.2)' : 'grey.50'),
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: currentTheme.textSecondary, width: '100%', mb: 0.5 }}>
              Domain
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {uniqueDomains.map((domain) => {
                const selected = selectedDomains.includes(domain);
                return (
                  <Chip
                    key={domain}
                    label={domain}
                    onClick={() =>
                      setSelectedDomains((prev) =>
                        selected ? prev.filter((d) => d !== domain) : [...prev, domain],
                      )
                    }
                    size="small"
                    sx={{
                      bgcolor: selected ? currentTheme.primary : 'transparent',
                      color: selected ? currentTheme.background : currentTheme.text,
                      border: `1px solid ${selected ? currentTheme.primary : currentTheme.border}`,
                    }}
                  />
                );
              })}
              {selectedDomains.length > 0 && (
                <Chip
                  label="Clear"
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedDomains([])}
                  sx={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
                />
              )}
            </Box>
            <Chip
              label="Verified only"
              onClick={() => setVerifiedOnly((v) => !v)}
              sx={{
                bgcolor: verifiedOnly ? currentTheme.primary : 'transparent',
                color: verifiedOnly ? currentTheme.background : currentTheme.text,
                border: `1px solid ${verifiedOnly ? currentTheme.primary : currentTheme.border}`,
              }}
            />
            <Button
              size="small"
              onClick={() => {
                setSelectedDomains([]);
                setVerifiedOnly(false);
                setSelectedQuality('all');
                setSearchQuery('');
              }}
              sx={{ color: currentTheme.textSecondary }}
            >
              Clear all filters
            </Button>
          </Box>
        </Collapse>
      </Box>

      {viewMode === 'grid' ? (
        paginatedModels.length === 0 ? (
          <Typography sx={{ color: currentTheme.textSecondary, py: 6, textAlign: 'center' }}>
            No data models match your filters.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {paginatedModels.map((model) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={model.id}>
                <DataModelCard
                  model={model}
                  isFavorite={favorites.includes(model.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  currentTheme={currentTheme}
                />
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: `1px solid ${currentTheme.border}`,
            borderRadius: 2,
            bgcolor: currentTheme.card,
            overflowX: 'auto',
          }}
        >
          <Table size="medium" stickyHeader sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <DataModelsSortableHeadCell
                  column="name"
                  label="Name"
                  sortBy={sortBy}
                  onSort={handleTableColumnSort}
                  currentTheme={currentTheme}
                />
                <DataModelsSortableHeadCell
                  column="shortName"
                  label="Short name"
                  sortBy={sortBy}
                  onSort={handleTableColumnSort}
                  currentTheme={currentTheme}
                />
                <DataModelsSortableHeadCell
                  column="domain"
                  label="Domain"
                  sortBy={sortBy}
                  onSort={handleTableColumnSort}
                  currentTheme={currentTheme}
                />
                <DataModelsSortableHeadCell
                  column="tier"
                  label="Tier"
                  sortBy={sortBy}
                  onSort={handleTableColumnSort}
                  currentTheme={currentTheme}
                />
                <DataModelsSortableHeadCell
                  column="updated"
                  label="Updated"
                  sortBy={sortBy}
                  onSort={handleTableColumnSort}
                  currentTheme={currentTheme}
                />
                <DataModelsSortableHeadCell
                  column="verified"
                  label="Verified"
                  align="center"
                  sortBy={sortBy}
                  onSort={handleTableColumnSort}
                  currentTheme={currentTheme}
                />
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    color: currentTheme.text,
                    bgcolor: currentTheme.cardBackground || currentTheme.card,
                    borderBottom: `2px solid ${currentTheme.border}`,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ color: currentTheme.textSecondary, py: 4, textAlign: 'center' }}>
                    No data models match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedModels.map((model) => {
                  const tier = model.meta?.tier || '—';
                  const tierLc = String(tier).toLowerCase();
                  const tierColor =
                    tierLc === 'gold'
                      ? '#b8860b'
                      : tierLc === 'silver'
                        ? '#708090'
                        : tierLc === 'bronze'
                          ? '#a0522d'
                          : currentTheme.textSecondary;
                  const domains = Array.isArray(model.domain) ? model.domain : [];
                  const openModel = async () => {
                    const sn = model.shortName;
                    if (!sn) return;
                    const sessionKey = `model_clicked_${sn.toLowerCase()}`;
                    if (!sessionStorage.getItem(sessionKey)) {
                      try {
                        await trackModelClick(sn);
                        sessionStorage.setItem(sessionKey, 'true');
                      } catch {
                        /* ignore */
                      }
                    }
                    navigate(`/models/${encodeURIComponent(sn.toLowerCase())}`);
                  };
                  return (
                    <TableRow
                      key={model.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:nth-of-type(even)': {
                          bgcolor: currentTheme.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        },
                      }}
                      onClick={openModel}
                    >
                      <TableCell sx={{ color: currentTheme.text, fontWeight: 600, maxWidth: 220 }}>
                        {model.name || model.shortName}
                      </TableCell>
                      <TableCell
                        sx={{ color: currentTheme.textSecondary, fontFamily: fontStackSans, fontSize: '0.875rem' }}
                      >
                        {model.shortName}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {domains.slice(0, 3).map((d) => (
                            <Chip key={d} label={d} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                          ))}
                          {domains.length > 3 && (
                            <Chip
                              label={`+${domains.length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                          )}
                          {domains.length === 0 && (
                            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                              —
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tier}
                          size="small"
                          sx={{
                            height: 24,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            bgcolor: `${tierColor}22`,
                            color: tierColor,
                            border: `1px solid ${tierColor}44`,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: currentTheme.textSecondary, whiteSpace: 'nowrap' }}>
                        {model.lastUpdated
                          ? String(model.lastUpdated).replace('T', ' ').slice(0, 16)
                          : '—'}
                      </TableCell>
                      <TableCell align="center">
                        {model.meta?.verified ? (
                          <Chip label="Yes" size="small" color="success" variant="outlined" sx={{ height: 24 }} />
                        ) : (
                          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Favorite">
                          <IconButton
                            size="small"
                            aria-label="favorite"
                            onClick={() => handleFavoriteToggle(model.id)}
                            sx={{ color: favorites.includes(model.id) ? '#ffc107' : currentTheme.textSecondary }}
                          >
                            {favorites.includes(model.id) ? (
                              <StarIcon fontSize="small" />
                            ) : (
                              <StarBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open">
                          <IconButton size="small" aria-label="open model" onClick={openModel} sx={{ color: currentTheme.primary }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={Math.max(totalPages, 1)} page={page} onChange={handlePageChange} currentTheme={currentTheme} />
      </Box>

      <Fab
        color="primary"
        aria-label="add new model"
        onClick={handleCreateNewModel}
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
      </Container>
    </PageWithFixedHeader>
  );
};

export default DataModelsPage;
