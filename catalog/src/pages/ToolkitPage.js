import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Chip,
  alpha,
  CircularProgress,
  Alert,
  Fab,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  ViewModule as ResourceIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { normalizeTechnologyStatus } from '../utils/toolkitStatus';
import { workbenchPath, workbenchCanonicalRef } from '../utils/toolkitWorkbench';

const TECH_STATUS_ORDER = ['production', 'development', 'evaluated'];

function toolkitCardStatusChips(toolkit) {
  const techs = toolkit?.technologies || [];
  const raw = techs.map((t) => normalizeTechnologyStatus(t?.status));
  const unique = [...new Set(raw)].sort(
    (a, b) => TECH_STATUS_ORDER.indexOf(a) - TECH_STATUS_ORDER.indexOf(b)
  );
  return unique;
}

function techStatusChipLabel(s) {
  if (s === 'development') return 'Development';
  if (s === 'evaluated') return 'Evaluated';
  return 'Production';
}

function techStatusChipColor(s, themePrimary) {
  if (s === 'development') return '#ff9800';
  if (s === 'evaluated') return '#4caf50';
  return themePrimary;
}

const TAB_ALL = 0;
const TAB_PACKAGES = 1;
const TAB_CONTAINERS = 2;

const RESOURCE_KIND_LABEL = {
  package: 'Package',
  container: 'Container',
};

const resourceDetailPath = (kind, item) => {
  const pid = item?.id || item?.name;
  switch (kind) {
    case 'package':
      return `/toolkit/package/${encodeURIComponent(pid)}`;
    case 'container':
      return `/toolkit/container/${item.id}`;
    default:
      return '/toolkit';
  }
};

const matchesSearch = (searchLower, ...fields) =>
  fields.some((f) => f && String(f).toLowerCase().includes(searchLower));

const ToolkitPage = () => {
  const { currentTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const [toolkitData, setToolkitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_ALL);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData('toolkit');
        const baseToolkits = data.toolkit?.toolkits || [];

        const allStorageKeys = Object.keys(localStorage);
        const toolkitKeys = allStorageKeys.filter(
          (key) =>
            key.startsWith('toolkit_') &&
            !key.includes('_tech_') &&
            !key.includes('_reactions') &&
            !key.includes('_evaluation') &&
            !key.includes('_installation') &&
            !key.includes('_usage')
        );

        const savedToolkits = toolkitKeys
          .map((key) => {
            try {
              return JSON.parse(localStorage.getItem(key));
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);

        const mergedToolkits = baseToolkits.map((base) => {
          const saved = savedToolkits.find((s) => s.id === base.id);
          return saved ? { ...base, ...saved } : base;
        });

        savedToolkits.forEach((saved) => {
          if (!mergedToolkits.find((t) => t.id === saved.id)) {
            mergedToolkits.push(saved);
          }
        });

        setToolkitData({
          ...data,
          toolkit: {
            ...data.toolkit,
            toolkits: mergedToolkits,
          },
        });
      } catch (err) {
        setError('Failed to load toolkit data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toolkits = toolkitData?.toolkit?.toolkits || [];
  const packages = toolkitData?.toolkit?.packages || [];
  const containers = toolkitData?.toolkit?.containers || [];

  const searchLower = searchTerm.trim().toLowerCase();

  const filterToolkits = (list) => {
    if (!searchLower) return list;
    return list.filter((t) =>
      matchesSearch(
        searchLower,
        t.displayName,
        t.name,
        t.description,
        ...(t.tags || []).map(String)
      )
    );
  };

  const filterPackages = (list) => {
    if (!searchLower) return list;
    return list.filter((p) =>
      matchesSearch(searchLower, p.displayName, p.name, p.description, p.id, ...(p.tags || []).map(String))
    );
  };

  const filterContainers = (list) => {
    if (!searchLower) return list;
    return list.filter((c) =>
      matchesSearch(searchLower, c.displayName, c.name, c.description, c.id, ...(c.tags || []).map(String))
    );
  };

  const filteredToolkits = filterToolkits(toolkits);
  const filteredPackages = filterPackages(packages);
  const filteredContainers = filterContainers(containers);

  const allTabRows = useMemo(() => {
    const rows = [];
    filteredToolkits.forEach((item) => rows.push({ rowType: 'toolkit', item }));
    filteredPackages.forEach((item) => rows.push({ rowType: 'package', item }));
    filteredContainers.forEach((item) => rows.push({ rowType: 'container', item }));
    return rows;
  }, [filteredToolkits, filteredPackages, filteredContainers]);

  const tabRows = useMemo(() => {
    switch (activeTab) {
      case TAB_ALL:
        return allTabRows;
      case TAB_PACKAGES:
        return filteredPackages.map((item) => ({ rowType: 'package', item }));
      case TAB_CONTAINERS:
        return filteredContainers.map((item) => ({ rowType: 'container', item }));
      default:
        return [];
    }
  }, [activeTab, allTabRows, filteredPackages, filteredContainers]);

  const counts = useMemo(
    () => ({
      all: toolkits.length + packages.length + containers.length,
      packages: packages.length,
      containers: containers.length,
    }),
    [toolkits, packages, containers]
  );

  const renderToolkitCard = (toolkit) => {
    const handleCardClick = () => navigate(workbenchPath(workbenchCanonicalRef(toolkit)));
    const statusKeys = toolkitCardStatusChips(toolkit);

    return (
      <Card
        key={`tk-${toolkit.uuid || toolkit.id}`}
        onClick={handleCardClick}
        sx={{ height: '100%', cursor: 'pointer', overflow: 'hidden' }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: currentTheme.text,
                fontWeight: 600,
                flex: 1,
                minWidth: 0,
                lineHeight: 1.3,
              }}
            >
              {toolkit.displayName || toolkit.name}
            </Typography>
            {toolkit.cardImage ? (
              <Box
                component="img"
                src={toolkit.cardImage}
                alt=""
                sx={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 1,
                  flexShrink: 0,
                  border: `1px solid ${currentTheme.border}`,
                }}
              />
            ) : null}
          </Box>
          {statusKeys.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {statusKeys.map((s) => {
                const c = techStatusChipColor(s, currentTheme.primary);
                return (
                  <Chip
                    key={s}
                    size="small"
                    label={techStatusChipLabel(s)}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: alpha(c, 0.12),
                      color: c,
                      border: `1px solid ${alpha(c, 0.35)}`,
                    }}
                  />
                );
              })}
            </Box>
          ) : null}
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            {toolkit.description}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderUnifiedResourceCard = (kind, item) => {
    const path = resourceDetailPath(kind, item);
    const title = item.displayName || item.name || item.id || 'Untitled';
    const readmePreview =
      typeof item.readme === 'string' ? item.readme.slice(0, 160) : '';
    const description =
      item.description || item.usage || readmePreview || 'Toolkit resource';
    const tags = item.tags || [];

    return (
      <Card
        key={`res-${kind}-${item.id ?? item.name}`}
        onClick={() => navigate(path)}
        sx={{ height: '100%', cursor: 'pointer', overflow: 'hidden' }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ResourceIcon sx={{ fontSize: 22, color: currentTheme.primary }} />
            <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: currentTheme.textSecondary,
              mb: 2,
              minHeight: 40,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
            {tags.slice(0, 4).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.08),
                  color: currentTheme.primary,
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip
              label={RESOURCE_KIND_LABEL[kind] || kind}
              size="small"
              sx={{ bgcolor: alpha(currentTheme.primary, 0.12), color: currentTheme.primary }}
            />
            {item.category ? (
              <Chip
                label={item.category}
                size="small"
                variant="outlined"
                sx={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
              />
            ) : null}
            {item.version ? (
              <Chip
                label={`v${String(item.version).replace(/^v/i, '')}`}
                size="small"
                variant="outlined"
                sx={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
              />
            ) : null}
            {item.language ? (
              <Chip
                label={item.language}
                size="small"
                variant="outlined"
                sx={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
              />
            ) : null}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderRow = ({ rowType, item }) => {
    if (rowType === 'toolkit') {
      return renderToolkitCard(item);
    }
    if (rowType === 'package') {
      return renderUnifiedResourceCard('package', item);
    }
    if (rowType === 'container') {
      return renderUnifiedResourceCard('container', item);
    }
    return null;
  };

  const emptyMessage = () => {
    if (searchTerm.trim()) return 'No items match your search.';
    switch (activeTab) {
      case TAB_ALL:
        return 'No toolkit items yet.';
      case TAB_PACKAGES:
        return 'No packages yet.';
      case TAB_CONTAINERS:
        return 'No containers yet.';
      default:
        return 'No items.';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: currentTheme.text, fontWeight: 700, mb: 1 }}>
          Toolkit
        </Typography>
        <Typography variant="body1" sx={{ color: currentTheme.textSecondary, maxWidth: 720 }}>
          Packages and containers for data work.
        </Typography>
      </Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme.textSecondary }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: currentTheme.textSecondary }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: currentTheme.card,
              '& fieldset': { borderColor: currentTheme.border },
              '&:hover fieldset': { borderColor: currentTheme.primary },
              '&.Mui-focused fieldset': { borderColor: currentTheme.primary },
            },
            '& .MuiInputBase-input': { color: currentTheme.text },
          }}
        />

        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              color: currentTheme.textSecondary,
              '&.Mui-selected': { color: currentTheme.primary },
            },
            '& .MuiTabs-indicator': { bgcolor: currentTheme.primary },
          }}
        >
          <Tab label={`All (${counts.all})`} />
          <Tab label={`Packages (${counts.packages})`} />
          <Tab label={`Containers (${counts.containers})`} />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {tabRows.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1" sx={{ color: currentTheme.textSecondary, textAlign: 'center', py: 4 }}>
              {emptyMessage()}
            </Typography>
          </Grid>
        ) : (
          tabRows.map((row, idx) => (
            <Grid item xs={12} sm={6} md={6} lg={4} key={`${row.rowType}-${row.item?.id ?? 'x'}-${idx}`}>
              {renderRow(row)}
            </Grid>
          ))
        )}
      </Grid>

      {canEdit() && (
        <Fab
          color="primary"
          aria-label="add new toolkit"
          onClick={() => navigate('/toolkit/create')}
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

export default ToolkitPage;
