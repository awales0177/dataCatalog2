import React, { useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Tabs,
  Tab,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  PinDrop as PinDropIcon,
  Add as AddIcon,
  Storage as StorageIcon,
  DataObject as ModelIcon,
  Description as AgreementIcon,
  Folder as DomainIcon,
  Apps as ApplicationIcon,
  Build as ToolkitIcon,
  Policy as PolicyIcon,
  MenuBook as LexiconIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import HomePinnedMasonryItem from '../components/HomePinnedMasonryItem';
import StickyPageIntro from '../components/StickyPageIntro';
import PageWithFixedHeader from '../components/PageWithFixedHeader';
import { catalogStaticPaperSx } from '../theme/catalogSurfaces';
import { globalSearch, fetchAgreements, fetchDomains, fetchData } from '../services/api';
import {
  getSearchResultPath,
  getSearchResultTitle,
  getSearchResultDescription,
  getSearchTypeLabel,
} from '../utils/catalogSearchNavigation';

const PINNED_STORAGE_KEY = 'pinnedItems';

const PIN_TAB_ORDER = [
  'models',
  'dataAgreements',
  'toolkit',
  'policies',
  'glossary',
  'domains',
  'applications',
  'lexicon',
];

function migrateLegacyPin(p) {
  if (p.searchType && p.id != null && p.path) return p;
  if (p.type === 'model') {
    const id = String(p.id);
    return {
      searchType: 'models',
      id,
      name: p.name || id,
      path: `/models/${encodeURIComponent(id)}`,
    };
  }
  if (p.type === 'tool') {
    const id = String(p.id);
    return {
      searchType: 'toolkit',
      id,
      name: p.name || id,
      path: p.path || `/toolkit/function/${encodeURIComponent(id)}`,
    };
  }
  return null;
}

function getTypeIcon(type) {
  const iconMap = {
    models: <ModelIcon />,
    dataAgreements: <AgreementIcon />,
    domains: <DomainIcon />,
    applications: <ApplicationIcon />,
    toolkit: <ToolkitIcon />,
    policies: <PolicyIcon />,
    lexicon: <LexiconIcon />,
    glossary: <LexiconIcon />,
  };
  return iconMap[type] || <StorageIcon />;
}

const EMPTY_PIN_CATALOG = {
  agreements: [],
  applications: [],
  domains: [],
  policies: [],
  glossaryTerms: [],
  lexiconTerms: [],
  toolkit: null,
  apiModels: [],
};

function readInitialPinnedItems() {
  try {
    const stored = localStorage.getItem(PINNED_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map(migrateLegacyPin).filter(Boolean);
  } catch {
    return [];
  }
}

const HomePage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const { canEdit } = useAuth();
  const [pinCatalog, setPinCatalog] = useState(EMPTY_PIN_CATALOG);
  const [pinnedItems, setPinnedItems] = useState(readInitialPinnedItems);
  const [pinCatalogLoading, setPinCatalogLoading] = useState(() => readInitialPinnedItems().length > 0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PINNED_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const migrated = parsed.map(migrateLegacyPin).filter(Boolean);
      if (migrated.length !== parsed.length) {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(migrated));
      }
    } catch (e) {
      console.error('Error migrating pinned items:', e);
    }
  }, []);

  const pinDataNeeds = useMemo(() => {
    const types = new Set();
    pinnedItems.forEach((p) => {
      if (p.searchType) types.add(p.searchType);
    });
    return {
      agreements: types.has('dataAgreements'),
      applications: types.has('dataAgreements') || types.has('applications'),
      domains: types.has('domains'),
      policies: types.has('policies'),
      glossary: types.has('glossary'),
      lexicon: types.has('lexicon'),
      toolkit: types.has('toolkit'),
      models: types.has('models') || types.has('glossary') || types.has('lexicon'),
    };
  }, [pinnedItems]);

  useEffect(() => {
    let cancelled = false;
    const n = pinDataNeeds;
    if (!Object.values(n).some(Boolean)) {
      setPinCatalog(EMPTY_PIN_CATALOG);
      setPinCatalogLoading(false);
      return undefined;
    }

    setPinCatalogLoading(true);
    (async () => {
      try {
        const tasks = [];
        if (n.agreements) {
          tasks.push(
            fetchAgreements()
              .catch(() => ({ agreements: [] }))
              .then((d) => ['agreements', d])
          );
        }
        if (n.applications) {
          tasks.push(
            fetchData('applications')
              .catch(() => ({ applications: [] }))
              .then((d) => ['applications', d])
          );
        }
        if (n.domains) {
          tasks.push(
            fetchDomains()
              .catch(() => ({ domains: [] }))
              .then((d) => ['domains', d])
          );
        }
        if (n.policies) {
          tasks.push(
            fetchData('policies')
              .catch(() => ({ policies: [] }))
              .then((d) => ['policies', d])
          );
        }
        if (n.glossary) {
          tasks.push(
            fetchData('glossary')
              .catch(() => ({ terms: [] }))
              .then((d) => ['glossary', d])
          );
        }
        if (n.lexicon) {
          tasks.push(
            fetchData('lexicon')
              .catch(() => ({ terms: [] }))
              .then((d) => ['lexicon', d])
          );
        }
        if (n.toolkit) {
          tasks.push(
            fetchData('toolkit')
              .catch(() => null)
              .then((d) => ['toolkit', d])
          );
        }
        if (n.models) {
          tasks.push(
            fetchData('models')
              .catch(() => ({ models: [] }))
              .then((d) => ['models', d])
          );
        }

        const settled = await Promise.all(tasks);
        if (cancelled) return;

        const next = {
          agreements: [],
          applications: [],
          domains: [],
          policies: [],
          glossaryTerms: [],
          lexiconTerms: [],
          toolkit: null,
          apiModels: [],
        };
        for (const [key, data] of settled) {
          switch (key) {
            case 'agreements':
              next.agreements = data.agreements || [];
              break;
            case 'applications':
              next.applications = data.applications || [];
              break;
            case 'domains':
              next.domains = data.domains || [];
              break;
            case 'policies':
              next.policies = data.policies || [];
              break;
            case 'glossary':
              next.glossaryTerms = data.terms || [];
              break;
            case 'lexicon':
              next.lexiconTerms = data.terms || [];
              break;
            case 'toolkit':
              next.toolkit = data;
              break;
            case 'models': {
              const raw = data?.models ?? data;
              next.apiModels = Array.isArray(raw) ? raw : [];
              break;
            }
            default:
              break;
          }
        }
        setPinCatalog(next);
      } catch {
        if (!cancelled) setPinCatalog(EMPTY_PIN_CATALOG);
      } finally {
        if (!cancelled) setPinCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pinDataNeeds]);

  const isPinned = useCallback(
    (id, searchType) =>
      pinnedItems.some((item) => String(item.id) === String(id) && item.searchType === searchType),
    [pinnedItems]
  );

  const handlePin = useCallback((pin) => {
    setPinnedItems((prev) => {
      if (prev.some((item) => String(item.id) === String(pin.id) && item.searchType === pin.searchType)) {
        return prev;
      }
      const next = [...prev, pin];
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const handlePinFromSearchHit = useCallback(
    (hit) => {
      const searchType = hit._search_type;
      if (!searchType || searchType === 'reference') return;
      const path = getSearchResultPath(hit, searchType);
      const pin = {
        searchType,
        id: String(hit._search_id),
        name: getSearchResultTitle(hit),
        path,
      };
      if (searchType === 'toolkit' && hit._toolkit_type) {
        pin.toolkitSubtype = hit._toolkit_type;
      }
      handlePin(pin);
    },
    [handlePin]
  );

  const handleUnpin = useCallback((id, searchType) => {
    setPinnedItems((prev) => {
      const next = prev.filter(
        (item) => !(String(item.id) === String(id) && item.searchType === searchType)
      );
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }
    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(searchQuery, { limit: 30 });
        const raw = data.results || [];
        setSearchResults(raw.filter((r) => r._search_type && r._search_type !== 'reference'));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const groupedPins = useMemo(() => {
    const g = {};
    pinnedItems.forEach((p) => {
      const k = p.searchType || 'models';
      if (!g[k]) g[k] = [];
      g[k].push(p);
    });
    return g;
  }, [pinnedItems]);

  const typesWithPins = useMemo(
    () => PIN_TAB_ORDER.filter((t) => (groupedPins[t]?.length || 0) > 0),
    [groupedPins]
  );

  const tabKeys = useMemo(() => ['all', ...typesWithPins], [typesWithPins]);

  useEffect(() => {
    if (activeTab >= tabKeys.length) {
      setActiveTab(0);
    }
  }, [activeTab, tabKeys.length]);

  const itemsToShow = useMemo(() => {
    const key = tabKeys[activeTab] || 'all';
    if (key === 'all') return pinnedItems;
    return groupedPins[key] || [];
  }, [activeTab, tabKeys, groupedPins, pinnedItems]);

  const openPinned = useCallback(
    (pin) => {
      if (pin.path) navigate(pin.path);
    },
    [navigate]
  );

  const canEditGlossary = canEdit();

  const resultsByType = useMemo(() => {
    const m = {};
    searchResults.forEach((hit) => {
      const t = hit._search_type;
      if (!m[t]) m[t] = [];
      m[t].push(hit);
    });
    return m;
  }, [searchResults]);

  const orderedResultTypes = useMemo(() => {
    const keys = Object.keys(resultsByType).filter((k) => resultsByType[k]?.length);
    const ordered = PIN_TAB_ORDER.filter((t) => keys.includes(t));
    const rest = keys.filter((k) => !PIN_TAB_ORDER.includes(k)).sort();
    return [...ordered, ...rest];
  }, [resultsByType]);

  return (
    <PageWithFixedHeader
      header={
        <StickyPageIntro sx={{ mb: 0 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1, color: currentTheme.text, fontWeight: 600 }}>
            My Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: currentTheme.textSecondary, maxWidth: 720 }}>
            Pin your frequently accessed items for quick access
          </Typography>
        </StickyPageIntro>
      }
    >
      <Container maxWidth="xl" sx={{ py: 2, pb: 4 }}>
        {pinnedItems.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  color: currentTheme.textSecondary,
                  '&.Mui-selected': {
                    color: currentTheme.primary,
                  },
                },
                '& .MuiTabs-indicator': {
                  bgcolor: currentTheme.primary,
                },
              }}
            >
              <Tab label={`All (${pinnedItems.length})`} />
              {typesWithPins.map((t) => (
                <Tab key={t} label={`${getSearchTypeLabel(t)} (${groupedPins[t].length})`} />
              ))}
            </Tabs>
          </Box>
        )}

        {pinnedItems.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              ...catalogStaticPaperSx(currentTheme),
              border: `1px dashed ${currentTheme.border}`,
            }}
          >
            <PinDropIcon sx={{ fontSize: 64, color: currentTheme.textSecondary, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ color: currentTheme.text, mb: 1 }}>
              No pinned items yet
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
              Use the + button to search the catalog and pin models, agreements, toolkit items, and more
            </Typography>
          </Paper>
        ) : pinCatalogLoading ? (
          <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
            {itemsToShow.map((_, i) => (
              <Box key={`pin-skel-${i}`} sx={{ width: '100%' }}>
                <Skeleton
                  variant="rounded"
                  height={200}
                  sx={{ borderRadius: 2, bgcolor: alpha(currentTheme.text, 0.08) }}
                />
              </Box>
            ))}
          </Masonry>
        ) : (
          <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
            {itemsToShow.map((item) => (
              <HomePinnedMasonryItem
                key={`${item.searchType}-${item.id}`}
                item={item}
                pinCatalog={pinCatalog}
                
                onUnpin={handleUnpin}
                onOpenPinned={openPinned}
                canEditGlossary={canEditGlossary}
              />
            ))}
          </Masonry>
        )}

        <Dialog
          open={searchOpen}
          onClose={() => {
            setSearchOpen(false);
            setSearchQuery('');
            setSearchResults([]);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: currentTheme.card,
              border: `1px solid ${currentTheme.border}`,
            },
          }}
        >
          <DialogTitle sx={{ color: currentTheme.text, pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Pin items</Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                sx={{ color: currentTheme.textSecondary }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              placeholder="Search models, agreements, toolkit, standards, glossary…"
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
                  bgcolor: currentTheme.background,
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
              }}
            />

            {searchLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={32} sx={{ color: currentTheme.primary }} />
              </Box>
            )}

            {!searchLoading && searchQuery.trim() && (
              <Box>
                {searchResults.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                      No results found
                    </Typography>
                  </Box>
                ) : (
                  orderedResultTypes.map((type) => (
                    <Box key={type} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
                        {getSearchTypeLabel(type)}
                      </Typography>
                      <List dense disablePadding>
                        {resultsByType[type].map((hit, idx) => {
                          const id = String(hit._search_id);
                          const title = getSearchResultTitle(hit);
                          const desc = getSearchResultDescription(hit);
                          const pinned = isPinned(id, type);
                          return (
                            <ListItem
                              key={`${type}-${id}-${idx}`}
                              disablePadding
                              secondaryAction={
                                pinned ? (
                                  <Chip
                                    label="Pinned"
                                    size="small"
                                    sx={{
                                      bgcolor: alpha(currentTheme.primary, 0.1),
                                      color: currentTheme.primary,
                                    }}
                                  />
                                ) : (
                                  <IconButton
                                    edge="end"
                                    aria-label="Pin"
                                    onClick={() => handlePinFromSearchHit(hit)}
                                    sx={{ color: currentTheme.primary }}
                                  >
                                    <PinDropIcon />
                                  </IconButton>
                                )
                              }
                            >
                              <ListItemButton
                                onClick={() => {
                                  navigate(getSearchResultPath(hit, type));
                                  setSearchOpen(false);
                                }}
                              >
                                <ListItemIcon sx={{ color: currentTheme.primary, minWidth: 40 }}>
                                  {getTypeIcon(type)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={title}
                                  secondary={desc ? `${desc.substring(0, 72)}${desc.length > 72 ? '…' : ''}` : null}
                                  primaryTypographyProps={{ color: currentTheme.text }}
                                  secondaryTypographyProps={{ color: currentTheme.textSecondary }}
                                />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  ))
                )}
              </Box>
            )}

            {!searchQuery.trim() && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <SearchIcon sx={{ fontSize: 48, color: currentTheme.textSecondary, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                  Start typing to search the catalog (same index as global search)
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${currentTheme.border}` }}>
            <Button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              sx={{ color: currentTheme.textSecondary }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Fab
          color="primary"
          aria-label="add pin"
          onClick={() => setSearchOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: currentTheme.primary,
            color: currentTheme.background,
            '&:hover': {
              bgcolor: currentTheme.primaryHover || currentTheme.primary,
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

export default HomePage;
