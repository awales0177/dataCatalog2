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
} from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  PushPin as PinIcon,
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
import DataModelCard from '../components/DataModelCard';
import ProductAgreementCard from '../components/ProductAgreementCard';
import DomainCard from '../components/DomainCard';
import ApplicationCard from '../components/ApplicationCard';
import GlossaryCard from '../components/GlossaryCard';
import DataPolicyCard from '../components/DataPolicyCard';
import ToolkitPinnedCard, { findToolkitItemForPin } from '../components/ToolkitPinnedCard';
import StickyPageIntro from '../components/StickyPageIntro';
import PageWithFixedHeader from '../components/PageWithFixedHeader';
import { catalogStaticPaperSx, catalogInteractivePaperSx } from '../theme/catalogSurfaces';
import modelsData from '../data/models.json';
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

function entityMatchesPinId(entity, pinId) {
  if (!entity) return false;
  const pid = String(pinId);
  return ['uuid', 'id', 'shortName', 'name', 'term'].some((k) => {
    const v = entity[k];
    if (v == null) return false;
    const s = String(v);
    return s === pid || encodeURIComponent(s) === pid;
  });
}

function lexiconTermForGlossaryCard(lex) {
  return {
    ...lex,
    term: lex.term,
    definition: lex.definition,
    category: Array.isArray(lex.domains) && lex.domains.length ? lex.domains[0] : undefined,
    taggedModels: [],
  };
}

const HomePage = () => {
  const navigate = useNavigate();
  const { currentTheme } = useContext(ThemeContext);
  const { canEdit } = useAuth();
  const [pinCatalog, setPinCatalog] = useState(EMPTY_PIN_CATALOG);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(PINNED_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map(migrateLegacyPin).filter(Boolean);
        if (migrated.length !== parsed.length) {
          localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(migrated));
        }
        setPinnedItems(migrated);
      } catch (e) {
        console.error('Error loading pinned items:', e);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [
          agreementData,
          appData,
          domainsData,
          policiesData,
          glossaryData,
          lexiconData,
          toolkitData,
          modelsApiData,
        ] = await Promise.all([
          fetchAgreements().catch(() => ({ agreements: [] })),
          fetchData('applications').catch(() => ({ applications: [] })),
          fetchDomains().catch(() => ({ domains: [] })),
          fetchData('policies').catch(() => ({ policies: [] })),
          fetchData('glossary').catch(() => ({ terms: [] })),
          fetchData('lexicon').catch(() => ({ terms: [] })),
          fetchData('toolkit').catch(() => null),
          fetchData('models').catch(() => ({ models: [] })),
        ]);
        if (cancelled) return;
        const rawModels = modelsApiData?.models ?? modelsApiData;
        const apiModels = Array.isArray(rawModels) ? rawModels : [];
        setPinCatalog({
          agreements: agreementData.agreements || [],
          applications: appData.applications || [],
          domains: domainsData.domains || [],
          policies: policiesData.policies || [],
          glossaryTerms: glossaryData.terms || [],
          lexiconTerms: lexiconData.terms || [],
          toolkit: toolkitData,
          apiModels,
        });
      } catch {
        if (!cancelled) setPinCatalog(EMPTY_PIN_CATALOG);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const savePinnedItems = useCallback((items) => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(items));
    setPinnedItems(items);
  }, []);

  const isPinned = useCallback(
    (id, searchType) =>
      pinnedItems.some((item) => String(item.id) === String(id) && item.searchType === searchType),
    [pinnedItems]
  );

  const handlePin = useCallback(
    (pin) => {
      if (isPinned(pin.id, pin.searchType)) return;
      savePinnedItems([...pinnedItems, pin]);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    },
    [isPinned, pinnedItems, savePinnedItems]
  );

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

  const handleUnpin = (id, searchType) => {
    savePinnedItems(
      pinnedItems.filter((item) => !(String(item.id) === String(id) && item.searchType === searchType))
    );
  };

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

  const openPinned = (pin) => {
    if (pin.path) navigate(pin.path);
  };

  const renderPinnedItem = (item) => {
    const pinKey = `${item.searchType}-${item.id}`;
    const unpin = (e) => {
      e.stopPropagation();
      handleUnpin(item.id, item.searchType);
    };

    const pinShell = (child) => (
      <Box key={pinKey} sx={{ position: 'relative', overflow: 'visible', width: '100%' }}>
        <IconButton
          size="small"
          onClick={unpin}
          aria-label="Unpin"
          sx={{
            position: 'absolute',
            bottom: 12,
            right: -16,
            zIndex: 20,
            bgcolor: currentTheme.primary,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px 0 0 4px',
            boxShadow: `0 2px 8px ${alpha(currentTheme.primary, 0.3)}`,
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)',
            '&:hover': {
              bgcolor: currentTheme.primaryHover,
              boxShadow: `0 2px 12px ${alpha(currentTheme.primary, 0.4)}`,
            },
          }}
        >
          <PinIcon sx={{ color: 'white', fontSize: 18 }} />
        </IconButton>
        <Box
          sx={{
            '& .MuiCard-root': { height: 'auto' },
          }}
        >
          {child}
        </Box>
      </Box>
    );

    if (item.searchType === 'models') {
      const staticList = Array.isArray(modelsData) ? modelsData : modelsData.models || [];
      const model =
        staticList.find((m) => String(m.uuid || m.shortName || m.id) === String(item.id)) ||
        pinCatalog.apiModels.find((m) => entityMatchesPinId(m, item.id));
      if (model) {
        return pinShell(<DataModelCard model={model} currentTheme={currentTheme} />);
      }
    }

    if (item.searchType === 'dataAgreements') {
      const agreement = pinCatalog.agreements.find((a) => entityMatchesPinId(a, item.id));
      if (agreement) {
        return pinShell(
          <ProductAgreementCard
            agreement={agreement}
            currentTheme={currentTheme}
            applications={pinCatalog.applications}
          />
        );
      }
    }

    if (item.searchType === 'domains') {
      const domain = pinCatalog.domains.find(
        (d) => entityMatchesPinId(d, item.id) || String(d.name) === String(item.name)
      );
      if (domain) {
        return pinShell(
          <DomainCard domain={domain} onClick={() => openPinned(item)} currentTheme={currentTheme} />
        );
      }
    }

    if (item.searchType === 'applications') {
      const application = pinCatalog.applications.find((a) => entityMatchesPinId(a, item.id));
      if (application) {
        const target =
          item.path && item.path !== '/applications'
            ? item.path
            : `/applications/edit/${encodeURIComponent(application.uuid || application.id)}`;
        return pinShell(
          <Box onClick={() => navigate(target)} sx={{ cursor: 'pointer' }}>
            <ApplicationCard application={application} currentTheme={currentTheme} />
          </Box>
        );
      }
    }

    if (item.searchType === 'policies') {
      const policy = pinCatalog.policies.find((p) => entityMatchesPinId(p, item.id));
      if (policy) {
        return pinShell(
          <Box onClick={() => openPinned(item)} sx={{ cursor: 'pointer' }}>
            <DataPolicyCard
              policy={policy}
              currentTheme={currentTheme}
              sx={{ height: 'auto', minHeight: 0 }}
            />
          </Box>
        );
      }
    }

    if (item.searchType === 'glossary') {
      const term = pinCatalog.glossaryTerms.find((t) => entityMatchesPinId(t, item.id));
      if (term) {
        return pinShell(
          <Box onClick={() => openPinned(item)} sx={{ cursor: 'pointer' }}>
            <GlossaryCard
              term={term}
              currentTheme={currentTheme}
              dataModels={pinCatalog.apiModels}
              canEdit={canEdit()}
            />
          </Box>
        );
      }
    }

    if (item.searchType === 'lexicon') {
      const lex = pinCatalog.lexiconTerms.find((t) => entityMatchesPinId(t, item.id));
      if (lex) {
        return pinShell(
          <Box onClick={() => openPinned(item)} sx={{ cursor: 'pointer' }}>
            <GlossaryCard
              term={lexiconTermForGlossaryCard(lex)}
              currentTheme={currentTheme}
              dataModels={pinCatalog.apiModels}
              canEdit={false}
            />
          </Box>
        );
      }
    }

    if (item.searchType === 'toolkit') {
      const tkItem = findToolkitItemForPin(pinCatalog.toolkit, item);
      if (tkItem) {
        return pinShell(<ToolkitPinnedCard pin={item} item={tkItem} currentTheme={currentTheme} />);
      }
    }

    return pinShell(
      <Paper
        elevation={0}
        onClick={() => openPinned(item)}
        sx={{
          p: 2,
          minHeight: 140,
          cursor: 'pointer',
          position: 'relative',
          ...catalogInteractivePaperSx(currentTheme),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: currentTheme.primary, display: 'flex', alignItems: 'center' }}>
            {getTypeIcon(item.searchType)}
          </Box>
          <Chip
            size="small"
            label={getSearchTypeLabel(item.searchType)}
            variant="outlined"
            sx={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
          />
        </Box>
        <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600, mb: 0.5 }}>
          {item.name}
        </Typography>
        <Typography variant="caption" sx={{ color: currentTheme.textSecondary, wordBreak: 'break-all' }}>
          {item.path}
        </Typography>
      </Paper>
    );
  };

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
        ) : (
          <Masonry columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
            {itemsToShow.map((item) => renderPinnedItem(item)).filter(Boolean)}
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
