/**
 * ModelingModal – Data modeling and schema design.
 * Left: Dataset → Tables → Schemas (columns), from GET /api/datasets (Postgres).
 * Right: Simple data model – drag and drop tables/schemas to build a model.
 */

import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  CircularProgress,
  Chip,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  ViewColumn as ColumnIcon,
  Folder as FolderIcon,
  Save as SaveIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../../contexts/ThemeContext';
import modelsData from '../../data/models.json';
import { fetchCatalogDatasets } from '../../services/api';
import { fontStackSans, fontStackMono } from '../../theme/theme';

// Same table icon as query sidebar – purple table SVG
const TableLogo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9.5H21M3 14.5H21M8 4.5V19.5M6.2 19.5H17.8C18.9201 19.5 19.4802 19.5 19.908 19.282C20.2843 19.0903 20.5903 18.7843 20.782 18.408C21 17.9802 21 17.4201 21 16.3V7.7C21 6.5799 21 6.01984 20.782 5.59202C20.5903 5.21569 20.2843 4.90973 19.908 4.71799C19.4802 4.5 18.9201 4.5 17.8 4.5H6.2C5.0799 4.5 4.51984 4.5 4.09202 4.71799C3.71569 4.90973 3.40973 5.21569 3.21799 5.59202C3 6.01984 3 6.57989 3 7.7V16.3C3 17.4201 3 17.9802 3.21799 18.408C3.40973 18.7843 3.71569 19.0903 4.09202 19.282C4.51984 19.5 5.07989 19.5 6.2 19.5Z" stroke="#7c3c7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DRAG_TYPE = 'application/x-modeling-node';
const MAPPINGS_STORAGE_KEY = 'modelingMappings';

function migrateMappingToTables(m) {
  if (!m || typeof m !== 'object') return m;
  if (Array.isArray(m.tables) && m.tables.length > 0) return m;
  if (m.tableName != null) {
    return {
      ...m,
      tables: [{ tableName: m.tableName, tableLabel: m.tableLabel || m.tableName }],
    };
  }
  return { ...m, tables: [] };
}

function mappingTablesList(m) {
  const x = migrateMappingToTables(m);
  return Array.isArray(x.tables) ? x.tables : [];
}

function formatMappingTablesSubtitle(m, maxLen = 80) {
  const parts = mappingTablesList(m).map((t) => t.tableLabel || t.tableName || '');
  const s = parts.join(', ');
  if (s.length <= maxLen) return s || '—';
  return `${s.slice(0, maxLen - 1)}…`;
}

/** Small off-screen preview so the browser doesn’t use the full row as the drag ghost */
function createTableDragPreview(tableName, { darkMode, primary, textColor }) {
  const wrap = document.createElement('div');
  wrap.setAttribute('data-modeling-drag-ghost', '1');
  const accent = primary || '#0891b2';
  Object.assign(wrap.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    padding: '6px 12px',
    borderRadius: '10px',
    background: darkMode ? '#2d2d32' : '#ffffff',
    color: textColor,
    border: `2px solid ${accent}`,
    boxShadow: darkMode ? '0 8px 28px rgba(0,0,0,0.65)' : '0 6px 20px rgba(0,0,0,0.14)',
    font: '600 12px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: '260px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxSizing: 'border-box',
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M3 9.5H21M3 14.5H21M8 4.5V19.5M6.2 19.5H17.8C18.9201 19.5 19.4802 19.5 19.908 19.282C20.2843 19.0903 20.5903 18.7843 20.782 18.408C21 17.9802 21 17.4201 21 16.3V7.7C21 6.5799 21 6.01984 20.782 5.59202C20.5903 5.21569 20.2843 4.90973 19.908 4.71799C19.4802 4.5 18.9201 4.5 17.8 4.5H6.2C5.0799 4.5 4.51984 4.5 4.09202 4.71799C3.71569 4.90973 3.40973 5.21569 3.21799 5.59202C3 6.01984 3 6.57989 3 7.7V16.3C3 17.4201 3 17.9802 3.21799 18.408C3.40973 18.7843 3.71569 19.0903 4.09202 19.282C4.51984 19.5 5.07989 19.5 6.2 19.5Z'
  );
  path.setAttribute('stroke', accent);
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  const label = document.createElement('span');
  const short = tableName.length > 36 ? `${tableName.slice(0, 36)}…` : tableName;
  label.textContent = short || 'Table';
  Object.assign(label.style, {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: '0',
  });

  wrap.appendChild(svg);
  wrap.appendChild(label);
  document.body.appendChild(wrap);
  return wrap;
}

const ModelingModal = ({
  open,
  onClose,
  currentTheme,
  darkMode,
  splitMode = false,
  onOpenAgora,
  agoraOpen = false,
}) => {
  const { currentTheme: contextTheme } = useContext(ThemeContext);
  const theme = currentTheme || contextTheme;
  const muiTheme = useTheme();
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const isSplit = Boolean(splitMode) && isMdUp;

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDatasets, setExpandedDatasets] = useState({});
  const [expandedTables, setExpandedTables] = useState({});
  const [modelItems, setModelItems] = useState([]);
  const [dropHighlight, setDropHighlight] = useState(false);
  const [savedMappings, setSavedMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState(null);
  /** Data model shortName from models.json */
  const [selectedCatalogModelShortName, setSelectedCatalogModelShortName] = useState('');
  const [dropMessage, setDropMessage] = useState({ severity: 'warning', text: '' });

  const catalogModels = useMemo(() => {
    const raw = Array.isArray(modelsData) ? modelsData : modelsData?.models || [];
    return [...raw]
      .filter((m) => m && m.shortName)
      .sort((a, b) =>
        String(a.name || a.shortName || '').localeCompare(String(b.name || b.shortName || ''), undefined, {
          sensitivity: 'base',
        })
      );
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MAPPINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const list = Array.isArray(parsed) ? parsed : [];
        setSavedMappings(list.map(migrateMappingToTables));
      }
    } catch (_) {}
  }, [open]);

  useEffect(() => {
    if (!dropMessage.text) return undefined;
    const t = setTimeout(() => setDropMessage((prev) => ({ ...prev, text: '' })), 4500);
    return () => clearTimeout(t);
  }, [dropMessage.text]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setModelItems([]);
    setSelectedMappingId(null);
    setSelectedCatalogModelShortName('');
    setExpandedDatasets({});
    setExpandedTables({});
    fetchCatalogDatasets()
      .then((list) => {
        if (!cancelled) setDatasets(list);
      })
      .catch(() => {
        if (!cancelled) setDatasets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const tree = useMemo(() => {
    return datasets
      .filter((d) => d.tables && d.tables.length > 0)
      .map((ds) => ({
        id: ds.id,
        name: ds.name || `Dataset ${ds.id}`,
        tables: (ds.tables || []).map((t) => ({
          name: t.name || 'Unnamed table',
          columns: Array.isArray(t.columns) ? t.columns : [],
        })),
      }));
  }, [datasets]);

  const mappingsByDataset = useMemo(() => {
    const map = new Map();
    for (const m of savedMappings) {
      const id = m.datasetId ?? 'unknown';
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(m);
    }
    return map;
  }, [savedMappings]);

  const toggleDataset = (id) => {
    setExpandedDatasets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTable = (key) => {
    setExpandedTables((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getTableKey = (datasetId, tableName) => `${datasetId}-${tableName}`;

  const handleDragStart = useCallback(
    (e, payload, displayName) => {
      e.dataTransfer.setData(DRAG_TYPE, JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
      const primary = theme?.primary || '#0891b2';
      const textColor = darkMode ? '#f4f4f5' : '#18181b';
      let preview;
      try {
        preview = createTableDragPreview(displayName || payload.label || payload.tableName || 'Table', {
          darkMode: !!darkMode,
          primary,
          textColor,
        });
        const w = preview.offsetWidth;
        const h = preview.offsetHeight;
        e.dataTransfer.setDragImage(preview, Math.min(48, w / 2), Math.min(20, h / 2));
      } catch {
        /* fallback: default browser ghost */
      }
      const cleanup = () => {
        try {
          preview?.remove();
        } catch {
          /* ignore */
        }
      };
      document.addEventListener('dragend', cleanup, { once: true });
    },
    [darkMode, theme?.primary]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropHighlight(true);
  };

  const handleDragLeave = () => {
    setDropHighlight(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDropHighlight(false);
    const raw = e.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (payload.type !== 'table') return;
      const incoming = {
        ...payload,
        id: `drop-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      setModelItems((prev) => {
        if (prev.length > 0) {
          const existingDs = prev[0].datasetId;
          if (payload.datasetId !== existingDs) {
            queueMicrotask(() =>
              setDropMessage({
                severity: 'warning',
                text: 'Only tables from the same dataset can be in one model. Remove tables or clear the pane to use a different dataset.',
              })
            );
            return prev;
          }
          const dup = prev.some(
            (p) => p.tableName === payload.tableName && p.datasetId === payload.datasetId
          );
          if (dup) {
            queueMicrotask(() =>
              setDropMessage({ severity: 'info', text: 'That table is already in the model.' })
            );
            return prev;
          }
        }
        queueMicrotask(() => {
          setDropMessage({ severity: 'info', text: '' });
          setSelectedMappingId(null);
        });
        return [...prev, incoming];
      });
    } catch (_) {}
  };

  const removeModelItem = (id) => {
    setModelItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedMappingId(null);
  };

  const getItemLabel = (item) => item.tableName || item.label || 'Table';

  const saveMapping = () => {
    if (!selectedCatalogModelShortName || modelItems.length < 1) return;
    const dm = catalogModels.find(
      (m) => String(m.shortName).toLowerCase() === String(selectedCatalogModelShortName).toLowerCase()
    );
    if (!dm) return;
    const datasetId = modelItems[0].datasetId;
    const mapping = {
      id: `mapping-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      modelName: dm.name || dm.shortName,
      modelShortName: dm.shortName,
      datasetId,
      tables: modelItems.map((item) => ({
        tableName: item.tableName,
        tableLabel: getItemLabel(item),
      })),
    };
    const next = [...savedMappings, mapping];
    setSavedMappings(next);
    try {
      localStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
    setSelectedMappingId(mapping.id);
    setSelectedCatalogModelShortName('');
  };

  const openMapping = (mapping) => {
    const m = migrateMappingToTables(mapping);
    const tables = mappingTablesList(m);
    setModelItems(
      tables.map((t, i) => ({
        id: `${m.id}-row-${i}-${t.tableName}`,
        type: 'table',
        datasetId: m.datasetId,
        tableName: t.tableName,
        label: t.tableLabel || t.tableName,
      }))
    );
    setSelectedMappingId(m.id);
  };

  const deleteMapping = (e, id) => {
    e.stopPropagation();
    const next = savedMappings.filter((m) => m.id !== id);
    setSavedMappings(next);
    try {
      localStorage.setItem(MAPPINGS_STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
    if (selectedMappingId === id) {
      setModelItems([]);
      setSelectedMappingId(null);
    }
  };

  const currentMapping = selectedMappingId ? savedMappings.find((m) => m.id === selectedMappingId) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      hideBackdrop={isSplit}
      disableScrollLock={isSplit}
      disableEnforceFocus={isSplit}
      disableAutoFocus={isSplit}
      sx={
        isSplit
          ? {
              pointerEvents: 'none',
              '& .MuiDialog-container': { pointerEvents: 'none' },
            }
          : undefined
      }
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#1e1e22' : (theme?.card || '#fff'),
          color: theme?.text,
          overflow: 'hidden',
          border: darkMode ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${theme?.border || 'rgba(0,0,0,0.08)'}`,
          ...(isSplit ? { pointerEvents: 'auto' } : undefined),
          ...(isSplit
            ? {
                position: 'fixed',
                m: 0,
                right: 16,
                left: 'auto',
                top: 16,
                width: 'calc((100vw - 40px) / 2)',
                maxWidth: 'none',
                height: 'calc(100vh - 32px)',
                maxHeight: 'calc(100vh - 32px)',
                minHeight: 400,
                borderRadius: '0 12px 12px 0',
                boxShadow: muiTheme.shadows[16],
                zIndex: 1400,
              }
            : {
                m: 2,
                height: 'calc(100vh - 32px)',
                maxHeight: 'calc(100vh - 32px)',
                width: 'calc(100% - 32px)',
                minHeight: 560,
                borderRadius: 2,
                boxShadow: darkMode ? '0 24px 80px rgba(0,0,0,0.55)' : undefined,
              }),
        },
      }}
      BackdropProps={{
        sx: {
          bgcolor: darkMode ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : theme?.border || '#e0e0e0'}`,
            bgcolor: darkMode ? 'rgba(0,0,0,0.25)' : 'transparent',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box component="img" src="/modeling-svgrepo-com.svg" alt="Modeling" sx={{ height: 36, width: 36, opacity: darkMode ? 0.92 : 1, flexShrink: 0 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme?.text, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Data modeling and schema design
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
            {onOpenAgora && !agoraOpen && (
              <Tooltip title="Open Agora query engine side-by-side on wide screens">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onOpenAgora}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme?.primary,
                    color: theme?.primary,
                    whiteSpace: 'nowrap',
                    px: 1.25,
                    '&:hover': {
                      borderColor: theme?.primary,
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(8, 145, 178, 0.08)',
                    },
                  }}
                >
                  Query engine
                </Button>
              </Tooltip>
            )}
            <Tooltip title={isSplit ? 'Close data modeling (other pane stays open)' : 'Close'}>
              <IconButton
                onClick={onClose}
                aria-label="Close data modeling"
                edge="end"
                sx={{
                  color: theme?.textSecondary,
                  '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: theme?.text },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <Paper
            elevation={0}
            sx={{
              width: 320,
              minWidth: 320,
              borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : theme?.border || '#e0e0e0'}`,
              borderRadius: 0,
              overflow: 'auto',
              bgcolor: darkMode ? '#161618' : (theme?.cardBackground || 'grey.50'),
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, color: darkMode ? 'rgba(255,255,255,0.75)' : theme?.textSecondary, fontWeight: 600 }}>
              Dataset → Tables → Schemas
            </Typography>
            <Typography variant="caption" sx={{ px: 2, pb: 1, color: darkMode ? 'rgba(255,255,255,0.55)' : theme?.textSecondary, display: 'block' }}>
              Drag one table at a time into the model (no single fields)
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} sx={{ color: theme?.primary }} />
              </Box>
            ) : (
              <List dense sx={{ py: 0 }}>
                {tree.map((ds) => {
                  const dsExpanded = expandedDatasets[ds.id] === true;
                  const dsMappings = mappingsByDataset.get(ds.id) || [];
                  return (
                    <Box key={ds.id}>
                      <ListItemButton
                        onClick={() => toggleDataset(ds.id)}
                        sx={{ py: 0.5 }}
                      >
                        {dsExpanded ? (
                          <ExpandMoreIcon sx={{ color: theme?.textSecondary, fontSize: 20, mr: 0.5 }} />
                        ) : (
                          <ChevronRightIcon sx={{ color: theme?.textSecondary, fontSize: 20, mr: 0.5 }} />
                        )}
                        <ListItemText
                          primary={`${ds.id}`}
                          secondary={ds.name}
                          primaryTypographyProps={{ fontSize: '0.875rem', fontFamily: fontStackMono, fontWeight: 600, color: theme?.text }}
                          secondaryTypographyProps={{ fontSize: '0.7rem', noWrap: true, color: darkMode ? 'rgba(255,255,255,0.55)' : undefined }}
                        />
                      </ListItemButton>
                      <Collapse in={dsExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : theme?.border || '#e0e0e0'}`,
                            }}
                          >
                            <Typography variant="caption" sx={{ px: 0.5, fontWeight: 600, color: darkMode ? 'rgba(255,255,255,0.7)' : theme?.textSecondary, display: 'block', mb: 0.5 }}>
                              Tables
                            </Typography>
                            <List component="div" disablePadding dense sx={{ py: 0 }}>
                              {ds.tables.map((table) => {
                                const tableKey = getTableKey(ds.id, table.name);
                                const tableExpanded = expandedTables[tableKey] === true;
                                return (
                                  <Box key={tableKey}>
                                    <ListItemButton
                                      sx={{
                                        pl: 1.5,
                                        py: 0.25,
                                        borderRadius: 1,
                                        '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                                      }}
                                      onClick={() => toggleTable(tableKey)}
                                      draggable
                                      onDragStart={(e) =>
                                        handleDragStart(
                                          e,
                                          {
                                            type: 'table',
                                            datasetId: ds.id,
                                            tableName: table.name,
                                            label: table.name,
                                          },
                                          table.name
                                        )
                                      }
                                    >
                                      {tableExpanded ? (
                                        <ExpandMoreIcon sx={{ color: theme?.textSecondary, fontSize: 18, mr: 0.5 }} />
                                      ) : (
                                        <ChevronRightIcon sx={{ color: theme?.textSecondary, fontSize: 18, mr: 0.5 }} />
                                      )}
                                      <Box component="span" sx={{ display: 'inline-flex', mr: 0.5 }}><TableLogo size={16} /></Box>
                                      <ListItemText
                                        primary={table.name}
                                        primaryTypographyProps={{ fontSize: '0.8rem', color: theme?.text }}
                                      />
                                    </ListItemButton>
                                    <Collapse in={tableExpanded} timeout="auto" unmountOnExit>
                                      <List component="div" disablePadding dense>
                                        {table.columns.map((col, ci) => {
                                          const label =
                                            col && typeof col === 'object'
                                              ? [col.name, col.type].filter(Boolean).join(' · ')
                                              : String(col ?? '');
                                          const ckey =
                                            col && typeof col === 'object' ? col.name || `col-${ci}` : `col-${ci}-${label}`;
                                          return (
                                            <ListItemButton key={ckey} sx={{ pl: 3.5, py: 0.25 }} disabled>
                                              <ColumnIcon sx={{ fontSize: 14, mr: 0.5, color: theme?.textSecondary }} />
                                              <ListItemText
                                                primary={label}
                                                primaryTypographyProps={{ fontSize: '0.75rem', fontFamily: fontStackMono }}
                                              />
                                            </ListItemButton>
                                          );
                                        })}
                                      </List>
                                    </Collapse>
                                  </Box>
                                );
                              })}
                            </List>
                          </Paper>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : theme?.border || '#e0e0e0'}`,
                            }}
                          >
                            <Typography variant="caption" sx={{ px: 0.5, fontWeight: 600, color: darkMode ? 'rgba(255,255,255,0.7)' : theme?.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <FolderIcon sx={{ fontSize: 14 }} />
                              Mapped models
                            </Typography>
                            {dsMappings.length === 0 ? (
                              <Typography variant="caption" sx={{ px: 1.5, py: 0.5, color: darkMode ? 'rgba(255,255,255,0.5)' : theme?.textSecondary, display: 'block' }}>
                                None yet. Drop tables (same dataset) and save a mapping.
                              </Typography>
                            ) : (
                              <List component="div" disablePadding dense sx={{ py: 0 }}>
                                {dsMappings.map((m) => (
                                  <ListItemButton
                                    key={m.id}
                                    selected={selectedMappingId === m.id}
                                    onClick={() => openMapping(m)}
                                    sx={{
                                      py: 0.25,
                                      pl: 1.5,
                                      borderRadius: 1,
                                      '&.Mui-selected': {
                                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(8, 145, 178,0.12)',
                                        '&:hover': { bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(8, 145, 178,0.18)' },
                                      },
                                    }}
                                  >
                                    <ListItemText
                                      primary={m.modelName}
                                      secondary={formatMappingTablesSubtitle(m)}
                                      primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 600, color: theme?.text }}
                                      secondaryTypographyProps={{
                                        fontSize: '0.7rem',
                                        color: darkMode ? 'rgba(255,255,255,0.55)' : undefined,
                                        sx: { whiteSpace: 'normal', wordBreak: 'break-word' },
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={(e) => deleteMapping(e, m.id)}
                                      sx={{ color: theme?.textSecondary, ml: 0.5 }}
                                      aria-label="Delete mapping"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </ListItemButton>
                                ))}
                              </List>
                            )}
                          </Paper>
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </List>
            )}
          </Paper>

          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              minWidth: 0,
              bgcolor: darkMode ? '#121214' : theme?.background,
              borderLeft: dropHighlight
                ? `3px solid ${theme?.primary || '#0891b2'}`
                : darkMode
                  ? '1px solid rgba(255,255,255,0.06)'
                  : 'none',
              transition: 'border-color 0.2s, border-width 0.2s',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme?.text, mb: 1 }}>
              Simple data model
            </Typography>
            <Typography variant="body2" sx={{ color: darkMode ? 'rgba(255,255,255,0.65)' : theme?.textSecondary, mb: 2 }}>
              Drag tables from the left into this pane. You can add <strong>multiple tables</strong> as long as they are from the{' '}
              <strong>same dataset</strong>. Columns are not draggable.
            </Typography>
            {dropMessage.text ? (
              <Alert severity={dropMessage.severity} sx={{ mb: 2, py: 0.5 }} onClose={() => setDropMessage((p) => ({ ...p, text: '' }))}>
                {dropMessage.text}
              </Alert>
            ) : null}
            {modelItems.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: `2px dashed ${dropHighlight ? theme?.primary || '#0891b2' : darkMode ? 'rgba(255, 255, 255, 0.28)' : theme?.border || '#c4c4c4'}`,
                  borderRadius: 2,
                  bgcolor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0,0,0,0.02)',
                  transition: 'border-color 0.2s, background-color 0.2s',
                }}
              >
                <Typography variant="body2" sx={{ color: darkMode ? 'rgba(255,255,255,0.6)' : theme?.textSecondary }}>
                  Drop zone — add one or more tables from the same dataset
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" sx={{ color: darkMode ? 'rgba(255,255,255,0.5)' : theme?.textSecondary }}>
                  Dataset: <strong style={{ color: theme?.primary || '#0891b2' }}>{String(modelItems[0]?.datasetId ?? '')}</strong>
                  {' · '}
                  Drop more tables here (same dataset only)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {modelItems.map((item) => (
                    <Paper
                      key={item.id}
                      elevation={0}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        bgcolor: darkMode ? '#1c1c20' : theme?.card,
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : theme?.border || '#e0e0e0'}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TableLogo size={18} />
                        <Typography variant="body2" sx={{ color: theme?.text }}>{getItemLabel(item)}</Typography>
                        <Chip
                          size="small"
                          label="Table"
                          variant="outlined"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            borderColor: darkMode ? 'rgba(255,255,255,0.25)' : undefined,
                            color: darkMode ? 'rgba(255,255,255,0.85)' : undefined,
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeModelItem(item.id)}
                        sx={{ color: theme?.textSecondary }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
                {currentMapping ? (
                  <Chip
                    icon={<FolderIcon />}
                    label={`Mapped to: ${currentMapping.modelName} (${mappingTablesList(currentMapping).length} table${mappingTablesList(currentMapping).length === 1 ? '' : 's'})`}
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      fontWeight: 600,
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
                      color: darkMode ? (theme?.text || '#fafafa') : undefined,
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : undefined,
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                    <FormControl
                      size="small"
                      sx={{
                        minWidth: 280,
                        '& .MuiInputBase-root': {
                          bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : '#fff',
                          color: theme?.text,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkMode ? 'rgba(255,255,255,0.2)' : undefined,
                        },
                        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkMode ? 'rgba(255, 255, 255, 0.35)' : undefined,
                        },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme?.primary || '#0891b2',
                        },
                      }}
                    >
                      <InputLabel
                        id="modeling-map-to-model-label"
                        shrink
                        sx={{ color: theme?.textSecondary }}
                      >
                        Map to data model
                      </InputLabel>
                      <Select
                        labelId="modeling-map-to-model-label"
                        label="Map to data model"
                        value={selectedCatalogModelShortName}
                        onChange={(e) => setSelectedCatalogModelShortName(e.target.value)}
                        displayEmpty
                        notched
                        inputProps={{ 'aria-label': 'Map to data model' }}
                        renderValue={(val) => {
                          if (!val) {
                            return (
                              <Typography component="span" variant="body2" sx={{ color: theme?.textSecondary }}>
                                Select a model…
                              </Typography>
                            );
                          }
                          const m = catalogModels.find((x) => x.shortName === val);
                          if (!m) return val;
                          return `${m.name || m.shortName} (${m.shortName})`;
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 320,
                              bgcolor: darkMode ? '#2a2a2e' : theme?.card,
                              '& .MuiMenuItem-root': { color: theme?.text },
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>Select a model…</em>
                        </MenuItem>
                        {catalogModels.map((m) => (
                          <MenuItem key={m.shortName} value={m.shortName}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 0.25 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: theme?.text }}>
                                {m.name || m.shortName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme?.textSecondary, fontFamily: fontStackSans }}>
                                {m.shortName}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={saveMapping}
                      disabled={!selectedCatalogModelShortName || modelItems.length < 1 || catalogModels.length === 0}
                    >
                      Map
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ModelingModal;
