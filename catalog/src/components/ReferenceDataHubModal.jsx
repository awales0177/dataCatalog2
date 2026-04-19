import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
} from '@mui/material';
import {
  Close as CloseIcon,
  Api as ApiIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  EditNote as EditNoteIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { ThemeContext } from '../contexts/ThemeContext';
import referenceJson from '../data/reference.json';
import QueryEngine from '../pages/query/QueryEngine';
import { exportReferenceDatasetToExcel } from '../utils/referenceExcelIO';
import { appendImportHistory } from '../utils/referenceExcelImportHistory';
import { datasetOriginMeta } from '../utils/referenceDataOrigin';
import ReferenceExcelImportModal from './ReferenceExcelImportModal';
import { useAuth } from '../contexts/AuthContext';
import { submitFeedback } from '../services/api';

const GRID_OVERRIDE_STORAGE_KEY = 'catalog_reference_grid_overrides_v1';

function loadGridOverrides() {
  try {
    const raw = localStorage.getItem(GRID_OVERRIDE_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === 'object' && !Array.isArray(p)) return p;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function persistGridOverrides(obj) {
  try {
    localStorage.setItem(GRID_OVERRIDE_STORAGE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
}

function deepCloneJson(x) {
  try {
    return JSON.parse(JSON.stringify(x));
  } catch {
    return x;
  }
}

/** Full HERD child-table snapshot (replaces JSON childTables for this ref when present). */
const CHILD_TABLES_OVERRIDE_SUFFIX = '::__childTables__';

function mergeReferenceWithOverrides(items, overrides) {
  return (items || []).map((ref) => {
    const refId = String(ref.id ?? ref.name ?? '');
    const structKey = `${refId}${CHILD_TABLES_OVERRIDE_SUFFIX}`;
    const structOverride = overrides[structKey];
    if (structOverride?.tables && Array.isArray(structOverride.tables)) {
      return { ...ref, childTables: deepCloneJson(structOverride.tables) };
    }
    return {
      ...ref,
      childTables: (ref.childTables || []).map((t) => {
        const tid = String(t.id ?? t.name ?? '');
        const k = `${refId}::${tid}`;
        const o = overrides[k];
        if (o && Array.isArray(o.rows)) {
          return {
            ...t,
            rows: deepCloneJson(o.rows),
            rowCount: o.rows.length,
            ...(Array.isArray(o.columns) && o.columns.length > 0
              ? { columns: deepCloneJson(o.columns) }
              : {}),
          };
        }
        return t;
      }),
    };
  });
}

/** Slug for query workbench three-part name from reference domain / table labels */
function refSqlSlug(s) {
  return (
    String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'unnamed'
  );
}

function ReferenceDatasetOriginBanner({ item, border, theme, darkMode, onExportExcel, onImportExcelClick }) {
  const o = datasetOriginMeta(item);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        mb: 1.5,
        pb: 1.5,
        borderBottom: `1px solid ${border}`,
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
        <Tooltip title={o.tooltip}>
          <Box
            component="img"
            src={o.src}
            alt=""
            sx={{
              width: o.origin === 'herd' ? 40 : 32,
              height: o.origin === 'herd' ? 40 : 32,
              flexShrink: 0,
              borderRadius: 1,
              objectFit: 'contain',
              objectPosition: 'center',
            }}
          />
        </Tooltip>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: theme?.textSecondary, display: 'block', lineHeight: 1.2 }}>
            Data origin
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: theme?.text }}>
            {o.label}
          </Typography>
        </Box>
      </Box>
      {o.origin === 'herd' ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          <Tooltip title="Download all child tables as an Excel workbook (one sheet per table)">
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExportExcel}
              aria-label="Export to Excel"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Export to Excel
            </Button>
          </Tooltip>
          <Tooltip title="Import from Excel: see recent uploads, drag and drop, or pick a file. Saved in this browser.">
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={onImportExcelClick}
              aria-label="Import from Excel"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Import from Excel
            </Button>
          </Tooltip>
        </Box>
      ) : null}
    </Box>
  );
}

function sortReferenceItemsByDatasetName(items) {
  return [...(items || [])].sort((a, b) => {
    const na = String(a?.name ?? a?.id ?? '').toLocaleLowerCase();
    const nb = String(b?.name ?? b?.id ?? '').toLocaleLowerCase();
    return na.localeCompare(nb, undefined, { sensitivity: 'base' });
  });
}

/** Domain-like slug for query SQL from a reference item (no domain sidebar). */
function domainSlugForReferenceItem(ref) {
  if (!ref) return 'general';
  if (Array.isArray(ref.domain) && ref.domain.length > 0) {
    return refSqlSlug(ref.domain[0]);
  }
  return refSqlSlug(ref.category || ref.name || 'general');
}

const ReferenceDataHubModal = ({ open, onClose }) => {
  const { currentTheme: theme } = useContext(ThemeContext);
  const muiTheme = useTheme();
  const darkMode = Boolean(theme?.darkMode);
  const { user } = useAuth();
  const uploadedByLabel = user?.full_name || user?.username || user?.email || '';
  const [gridOverrides, setGridOverrides] = useState(loadGridOverrides);
  const mergedItems = useMemo(
    () => mergeReferenceWithOverrides(referenceJson.items || [], gridOverrides),
    [gridOverrides]
  );
  const sortedDatasets = useMemo(() => sortReferenceItemsByDatasetName(mergedItems), [mergedItems]);

  const [selectedRef, setSelectedRef] = useState(null);
  /** Query workbench context for inline {@link QueryEngine} (same as main query modal). */
  const [referenceQueryContext, setReferenceQueryContext] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '' });
  const [importExcelModalOpen, setImportExcelModalOpen] = useState(false);
  const [requestChangeOpen, setRequestChangeOpen] = useState(false);
  const [requestChangeMessage, setRequestChangeMessage] = useState('');
  const [requestChangeSubmitting, setRequestChangeSubmitting] = useState(false);
  const [requestChangeError, setRequestChangeError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedRef(sortedDatasets[0] || null);
    setReferenceQueryContext(null);
    // Only reset list selection when opening the modal, not when merged data refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sortedDatasets read at open time
  }, [open]);

  useEffect(() => {
    setReferenceQueryContext(null);
  }, [selectedRef?.id, selectedRef?.name]);

  useEffect(() => {
    setSelectedRef((prev) => {
      if (!prev) return prev;
      const pid = prev.id ?? prev.name;
      const next = sortedDatasets.find((it) => (it.id ?? it.name) === pid);
      return next || prev;
    });
  }, [gridOverrides, sortedDatasets]);

  const showCopy = useCallback((message) => {
    setSnack({ open: true, message });
  }, []);

  const apiPathForRef = (ref) => {
    if (!ref?.id) return '/api/reference';
    return `/api/reference/${encodeURIComponent(ref.id)}`;
  };

  const handleCopyApi = async (ref) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}${apiPathForRef(ref)}`;
    try {
      await navigator.clipboard.writeText(url);
      showCopy('API URL copied to clipboard');
    } catch {
      showCopy(url);
    }
  };

  const openRequestChangeDialog = useCallback(() => {
    setRequestChangeError('');
    setRequestChangeMessage('');
    setRequestChangeOpen(true);
  }, []);

  const closeRequestChangeDialog = useCallback(() => {
    setRequestChangeOpen(false);
    setRequestChangeMessage('');
    setRequestChangeError('');
  }, []);

  /** Persist full childTables (Excel import or legacy overrides). */
  const commitChildTables = useCallback((ref, tables, opts) => {
    const refId = String(ref.id ?? ref.name ?? '');
    const key = `${refId}${CHILD_TABLES_OVERRIDE_SUFFIX}`;
    setGridOverrides((prev) => {
      const next = { ...prev, [key]: { tables: deepCloneJson(tables) } };
      persistGridOverrides(next);
      return next;
    });
    if (!opts?.skipSnack) showCopy('Table data saved in this browser');
  }, [showCopy]);

  const handleExportExcel = useCallback(() => {
    if (!selectedRef) return;
    try {
      exportReferenceDatasetToExcel(selectedRef, selectedRef.childTables || []);
      showCopy('Excel file downloaded');
    } catch (e) {
      showCopy(e?.message || 'Export failed');
    }
  }, [selectedRef, showCopy]);

  const handleImportExcelClick = useCallback(() => {
    setImportExcelModalOpen(true);
  }, []);

  const handleExcelImportSuccess = useCallback(
    (tables, meta) => {
      if (!selectedRef) return;
      const refId = String(selectedRef.id ?? selectedRef.name ?? '');
      const by = uploadedByLabel || 'Unknown';
      commitChildTables(selectedRef, tables, { skipSnack: true });
      appendImportHistory(refId, {
        fileName: meta?.fileName ?? '',
        tableCount: meta?.tableCount ?? tables.length,
        by,
      });
      showCopy(`Imported “${meta?.fileName || 'workbook'}” — saved in this browser`);
    },
    [selectedRef, uploadedByLabel, commitChildTables, showCopy]
  );

  const cardBg = theme?.card || '#fff';
  const border = theme?.border || '#e0e0e0';

  const outlineBtnSx = {
    textTransform: 'none',
    fontWeight: 600,
    borderColor: theme?.primary,
    color: theme?.primary,
    whiteSpace: 'nowrap',
    '&:hover': {
      borderColor: theme?.primary,
      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(8, 145, 178, 0.08)',
    },
  };

  const listItemSx = {
    '&:hover': {
      bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    '&.Mui-selected': {
      bgcolor: darkMode ? alpha(theme?.primary || '#d4d4d4', 0.14) : alpha(theme?.primary || '#0891b2', 0.1),
      borderLeft: `3px solid ${theme?.primary}`,
      '&:hover': {
        bgcolor: darkMode ? alpha(theme?.primary || '#d4d4d4', 0.2) : alpha(theme?.primary || '#0891b2', 0.14),
      },
    },
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: cardBg,
            color: theme?.text,
            overflow: 'hidden',
            m: 2,
            height: 'calc(100vh - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            width: 'calc(100% - 32px)',
            minHeight: 560,
            borderRadius: 2,
            boxShadow: muiTheme.shadows[darkMode ? 16 : 8],
          },
        }}
        BackdropProps={{
          sx: { bgcolor: 'rgba(0,0,0,0.5)' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${border}`,
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box component="img" src="/rd.png" alt="Reference data" sx={{ height: 48, width: 'auto' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme?.text, lineHeight: 1.3 }}>
                  Reference Data Hub
                </Typography>
                <Typography variant="caption" sx={{ color: theme?.textSecondary, display: 'block' }}>
                  Datasets sorted A–Z, inline SQL, and API.
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Close">
              <IconButton
                onClick={onClose}
                aria-label="Close Reference Data Hub"
                edge="end"
                sx={{
                  color: theme?.textSecondary,
                  '&:hover': {
                    bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    color: theme?.text,
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Paper
                elevation={0}
                sx={{
                  width: 260,
                  minWidth: 260,
                  flexShrink: 0,
                  borderRight: `1px solid ${border}`,
                  borderRadius: 0,
                  overflowY: 'auto',
                  bgcolor: cardBg,
                }}
              >
                <Typography variant="overline" sx={{ px: 2, pt: 2, color: theme?.textSecondary }}>
                  Datasets
                </Typography>
                <List dense disablePadding>
                  {sortedDatasets.map((it) => {
                    const o = datasetOriginMeta(it);
                    return (
                      <ListItemButton
                        key={it.id || it.name}
                        selected={(selectedRef?.id ?? selectedRef?.name) === (it.id ?? it.name)}
                        onClick={() => setSelectedRef(it)}
                        sx={listItemSx}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%', minWidth: 0, py: 0.25 }}>
                          <Tooltip title={o.tooltip}>
                            <Box
                              component="img"
                              src={o.src}
                              alt=""
                              sx={{
                                width: o.origin === 'herd' ? 28 : 22,
                                height: o.origin === 'herd' ? 28 : 22,
                                flexShrink: 0,
                                borderRadius: 0.75,
                                mt: 0.2,
                                objectFit: 'contain',
                                objectPosition: 'center',
                              }}
                            />
                          </Tooltip>
                          <ListItemText
                            primary={it.name || 'Untitled'}
                            secondary={
                              it.description?.trim()
                                ? it.description.trim()
                                : 'No description'
                            }
                            primaryTypographyProps={{
                              sx: { color: theme?.text, fontWeight: 600 },
                            }}
                            secondaryTypographyProps={{
                              sx: {
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.35,
                                color: theme?.textSecondary,
                              },
                            }}
                            sx={{ my: 0 }}
                          />
                        </Box>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Paper>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  bgcolor: cardBg,
                }}
              >
                {selectedRef ? (
                  <>
                    <Box
                      sx={{
                        flexShrink: 0,
                        overflowY: 'auto',
                        maxHeight: { xs: '38vh', sm: '40vh' },
                        p: 2,
                        borderBottom: `1px solid ${border}`,
                      }}
                    >
                    <ReferenceDatasetOriginBanner
                      item={selectedRef}
                      border={border}
                      theme={theme}
                      darkMode={darkMode}
                      onExportExcel={handleExportExcel}
                      onImportExcelClick={handleImportExcelClick}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 0.75,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: theme?.textSecondary, fontWeight: 600 }}>
                        Description
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="Copy REST URL for this reference set">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ApiIcon />}
                            onClick={() => handleCopyApi(selectedRef)}
                            sx={{ ...outlineBtnSx, flexShrink: 0 }}
                          >
                            API
                          </Button>
                        </Tooltip>
                        <Tooltip title="Ask the catalog team to correct or extend this reference dataset">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditNoteIcon />}
                            onClick={openRequestChangeDialog}
                            sx={{ ...outlineBtnSx, flexShrink: 0 }}
                          >
                            Request change
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: theme?.text, lineHeight: 1.55, mb: 1.5 }}>
                      {selectedRef.description?.trim()
                        ? selectedRef.description.trim()
                        : 'No description for this dataset.'}
                    </Typography>
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.25,
                        borderRadius: 1,
                        border: `1px solid ${border}`,
                        bgcolor: darkMode ? alpha(theme?.primary || '#d4d4d4', 0.06) : alpha(theme?.primary || '#0891b2', 0.04),
                      }}
                    >
                      <Typography variant="caption" sx={{ color: theme?.textSecondary, fontWeight: 600, display: 'block', mb: 0.35 }}>
                        Maintainer
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme?.text, lineHeight: 1.5 }}>
                        {String(selectedRef.maintainer ?? selectedRef.owner ?? '').trim() || 'Not specified'}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme?.text }}>
                      Tables in this dataset
                    </Typography>
                    {(selectedRef.childTables || []).length === 0 ? (
                      <Typography variant="body2" sx={{ mb: 2, color: theme?.textSecondary }}>
                        No child tables listed — open the full reference page for files or detail.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {selectedRef.childTables.map((t) => {
                          const domainSlug = domainSlugForReferenceItem(selectedRef);
                          const tableSlug = refSqlSlug(t.name);
                          const fullName = `${domainSlug}.reference.${tableSlug}`;
                          const tid = t.id || t.name;
                          const selected =
                            referenceQueryContext &&
                            String(referenceQueryContext.table?.id) === String(tid);
                          return (
                            <Tooltip key={tid} title={`Load query editor: SELECT * FROM ${fullName} …`}>
                              <Button
                                variant={selected ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => {
                                  setReferenceQueryContext({
                                    domainName: domainSlug,
                                    dbName: 'reference',
                                    table: { id: tid, name: tableSlug },
                                    isLocked: false,
                                  });
                                }}
                                sx={{
                                  ...outlineBtnSx,
                                  textTransform: 'none',
                                  ...(selected
                                    ? {
                                        borderColor: theme?.primary,
                                        bgcolor: theme?.primary,
                                        color: theme?.primaryContrastText || '#fff',
                                        '&:hover': {
                                          bgcolor: theme?.primaryHover || theme?.primary,
                                          borderColor: theme?.primaryHover || theme?.primary,
                                        },
                                      }
                                    : {}),
                                }}
                              >
                                {t.name}
                              </Button>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    )}
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 220, minWidth: 0, p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                      <QueryEngine
                        key={selectedRef?.id ?? selectedRef?.name ?? 'ref'}
                        selectedContext={referenceQueryContext}
                        currentTheme={theme}
                        darkMode={darkMode}
                        minimal
                      />
                    </Box>
                  </>
                ) : (
                  <Typography sx={{ color: theme?.textSecondary, p: 2 }}>Select a dataset.</Typography>
                )}
              </Box>
            </Box>
        </Box>
      </Dialog>

      <ReferenceExcelImportModal
        open={importExcelModalOpen}
        onClose={() => setImportExcelModalOpen(false)}
        referenceItem={selectedRef}
        uploadedByLabel={uploadedByLabel}
        theme={theme}
        darkMode={darkMode}
        border={border}
        onImportSuccess={handleExcelImportSuccess}
      />

      <Dialog
        open={requestChangeOpen}
        onClose={requestChangeSubmitting ? undefined : closeRequestChangeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '14px',
            bgcolor: theme?.card,
            color: theme?.text,
            border: `1px solid ${border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pr: 5, color: theme?.text }}>
          Request a change
        </DialogTitle>
        <IconButton
          aria-label="Close"
          onClick={closeRequestChangeDialog}
          disabled={requestChangeSubmitting}
          sx={{ position: 'absolute', right: 8, top: 8, color: theme?.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <Typography variant="body2" sx={{ color: theme?.textSecondary, mb: 2 }}>
            {selectedRef
              ? (
                <>
                  Describe the update you need for{' '}
                  <strong>{selectedRef.name || selectedRef.id || 'this dataset'}</strong>
                  {selectedRef.id ? ` (id: ${selectedRef.id})` : ''}. Your message is sent to the catalog team like general feedback.
                </>
              )
              : 'Select a dataset first.'}
          </Typography>
          {requestChangeError ? (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                ...(darkMode && {
                  bgcolor: alpha(muiTheme.palette.error.main, 0.14),
                  color: theme?.text,
                  border: `1px solid ${alpha(muiTheme.palette.error.main, 0.4)}`,
                  '& .MuiAlert-icon': { color: muiTheme.palette.error.light },
                }),
              }}
              onClose={() => setRequestChangeError('')}
            >
              {requestChangeError}
            </Alert>
          ) : null}
          <TextField
            multiline
            minRows={5}
            fullWidth
            placeholder="e.g. Wrong code list for column X, missing table Y, description should say…"
            value={requestChangeMessage}
            onChange={(e) => setRequestChangeMessage(e.target.value)}
            disabled={requestChangeSubmitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: theme?.text,
                bgcolor: darkMode ? alpha('#fff', 0.04) : alpha('#0f172a', 0.02),
                '& fieldset': { borderColor: border },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={closeRequestChangeDialog}
            disabled={requestChangeSubmitting}
            sx={{ textTransform: 'none', color: theme?.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!requestChangeMessage.trim() || requestChangeSubmitting || !selectedRef}
            onClick={async () => {
              if (!selectedRef) return;
              setRequestChangeError('');
              setRequestChangeSubmitting(true);
              try {
                const page = typeof window !== 'undefined' ? window.location.href : '';
                const refName = selectedRef.name || selectedRef.id || 'unknown';
                const refId = selectedRef.id != null ? String(selectedRef.id) : '';
                const text = [
                  'Reference data — change request',
                  `Dataset: ${refName}${refId ? ` (id: ${refId})` : ''}`,
                  '',
                  requestChangeMessage.trim(),
                  '',
                  '---',
                  `Page: ${page}`,
                ].join('\n');
                const userId =
                  user && user.id != null && String(user.id).trim()
                    ? String(user.id).trim()
                    : undefined;
                await submitFeedback({ userId, feedbackText: text });
                closeRequestChangeDialog();
                showCopy('Change request sent');
              } catch (err) {
                setRequestChangeError(err?.message || 'Could not send request');
              } finally {
                setRequestChangeSubmitting(false);
              }
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: theme?.primary,
              color: theme?.primaryContrastText || '#fff',
            }}
          >
            {requestChangeSubmitting ? 'Sending…' : 'Send request'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert
          severity="info"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{
            width: '100%',
            ...(darkMode && {
              bgcolor: alpha(theme?.primary || '#38bdf8', 0.18),
              color: theme?.text,
              border: `1px solid ${alpha(theme?.primary || '#38bdf8', 0.45)}`,
              '& .MuiAlert-icon': { color: theme?.primary },
            }),
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReferenceDataHubModal;
