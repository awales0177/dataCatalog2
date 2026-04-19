import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Container,
  Fab,
  InputAdornment,
  IconButton,
  Tooltip,
  Autocomplete,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  LocalOffer as LocalOfferIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { getAllModelRules, createRule, updateRule, deleteRule, fetchData } from '../services/api';
import TeamSelector from './TeamSelector';
import { maintainerToTeamSelectorSelection } from '../utils/maintainerTeamSelection';
import { ruleTagsList, normalizeTagList } from '../utils/ruleTags';
import { RULE_STAGE_OPTIONS, normalizeRuleStage, ruleStageColor } from '../utils/ruleStage';
import { RULE_ZONE_OPTIONS, normalizeRuleZone, ruleZoneColor, ruleZoneLabel } from '../utils/ruleZone';
import { fontStackSans } from '../theme/theme';
import DeleteModal from './DeleteModal';

const RULE_TYPE_OPTIONS = [
  { value: 'validation', label: 'Validation' },
  { value: 'transformation', label: 'Transformation' },
];

const normalizeRuleType = (t) =>
  RULE_TYPE_OPTIONS.some((o) => o.value === t) ? t : 'validation';

function isLibraryRule(r) {
  if (!r) return false;
  if (r.isLibrary === true) return true;
  if (r.isLibrary === false) return false;
  return !r.modelShortName || String(r.modelShortName).trim() === '';
}

function ruleLineageId(r) {
  if (!r) return '';
  const lr = r.libraryRuleId;
  if (lr != null && String(lr).trim() !== '') return String(lr).trim().toLowerCase();
  return String(r.id || '').trim().toLowerCase();
}

function rulesArrayFromApiResponse(data) {
  if (Array.isArray(data?.rules)) return data.rules;
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Master catalog of model rules: library (no model) + all assignments.
 * Matches UUX dh `/rules` layout.
 */
const RulesMasterList = () => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [applications, setApplications] = useState([]);

  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [libraryForm, setLibraryForm] = useState({
    name: '',
    description: '',
    documentation: '',
    maintainer: '',
    ruleType: 'validation',
    stage: 'bronze',
    ruleZone: 'value',
    enabled: true,
    tags: [],
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteRuleFromEditOpen, setDeleteRuleFromEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    documentation: '',
    maintainer: '',
    ruleType: 'validation',
    stage: 'bronze',
    ruleZone: 'value',
    enabled: true,
    tags: [],
  });

  const tagSuggestions = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => {
      if (editingRule && r.id === editingRule.id) return;
      ruleTagsList(r).forEach((t) => s.add(t));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rows, editingRule]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getAllModelRules({ forceRefresh: true });
      setRows(rulesArrayFromApiResponse(data));
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: e.message || 'Failed to load rules', severity: 'error' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchData('applications');
        if (!cancelled) setApplications(response.applications || []);
      } catch {
        if (!cancelled) setApplications([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** One table row per rule lineage (merged copies across models). */
  const lineageRows = useMemo(() => {
    const byLineage = new Map();
    for (const r of rows) {
      const lid = ruleLineageId(r);
      if (!lid) continue;
      if (!byLineage.has(lid)) byLineage.set(lid, { rules: [] });
      byLineage.get(lid).rules.push(r);
    }
    const out = [];
    for (const [lineageId, { rules: groupRules }] of byLineage) {
      const modelsSet = new Set();
      let hasLibrary = false;
      for (const r of groupRules) {
        if (isLibraryRule(r)) hasLibrary = true;
        else if (r.modelShortName) modelsSet.add(r.modelShortName);
      }
      const libraryRule = groupRules.find(isLibraryRule) || null;
      const representative =
        libraryRule ||
        [...groupRules].sort((a, b) =>
          (a.modelShortName || '').localeCompare(b.modelShortName || '', undefined, { sensitivity: 'base' }),
        )[0];
      out.push({
        lineageId,
        representative,
        hasLibrary,
        modelsWithLineage: Array.from(modelsSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
      });
    }
    return out;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lineageRows;
    return lineageRows.filter((entry) => {
      const r = entry.representative;
      if (r.name?.toLowerCase().includes(q)) return true;
      if (String(r.id || '').toLowerCase().includes(q)) return true;
      if (r.description?.toLowerCase().includes(q)) return true;
      if (r.ruleType?.toLowerCase().includes(q)) return true;
      const maintRaw = String(r.maintainer || '').toLowerCase();
      const maintResolved = (
        maintainerToTeamSelectorSelection(r.maintainer, applications)[0] || ''
      ).toLowerCase();
      if (maintRaw.includes(q) || maintResolved.includes(q)) return true;
      if (normalizeRuleStage(r.stage).includes(q)) return true;
      if (normalizeRuleZone(r.ruleZone).includes(q)) return true;
      if (ruleZoneLabel(r.ruleZone).toLowerCase().includes(q)) return true;
      if (entry.modelsWithLineage.some((m) => m.toLowerCase().includes(q))) return true;
      if (entry.hasLibrary && 'library'.includes(q)) return true;
      return ruleTagsList(r).some((t) => t.toLowerCase().includes(q));
    });
  }, [lineageRows, search, applications]);

  const sortedRows = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const ma = (a.representative.modelShortName || '\u0000').toLowerCase();
      const mb = (b.representative.modelShortName || '\u0000').toLowerCase();
      if (ma !== mb) return ma.localeCompare(mb);
      return (a.representative.name || '').localeCompare(b.representative.name || '', undefined, {
        sensitivity: 'base',
      });
    });
  }, [filtered]);

  const handleCreateLibrary = async () => {
    if (!libraryForm.name?.trim()) {
      setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
      return;
    }
    try {
      await createRule({
        name: libraryForm.name.trim(),
        description: libraryForm.description || '',
        documentation: libraryForm.documentation || '',
        maintainer: (libraryForm.maintainer || '').trim(),
        ruleType: normalizeRuleType(libraryForm.ruleType),
        stage: normalizeRuleStage(libraryForm.stage),
        ruleZone: normalizeRuleZone(libraryForm.ruleZone),
        enabled: libraryForm.enabled,
        tags: normalizeTagList(libraryForm.tags),
      });
      setSnackbar({ open: true, message: 'Library rule created', severity: 'success' });
      setLibraryDialogOpen(false);
      setLibraryForm({
        name: '',
        description: '',
        documentation: '',
        maintainer: '',
        ruleType: 'validation',
        stage: 'bronze',
        ruleZone: 'value',
        enabled: true,
        tags: [],
      });
      load();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Create failed', severity: 'error' });
    }
  };

  const openEditDialog = (entry) => {
    const rule = entry.representative;
    if (!rule?.id) {
      setSnackbar({ open: true, message: 'This rule has no ID and cannot be edited.', severity: 'error' });
      return;
    }
    setEditingRule(rule);
    setEditForm({
      name: rule.name || '',
      description: rule.description || '',
      documentation: rule.documentation || '',
      maintainer: rule.maintainer || '',
      ruleType: normalizeRuleType(rule.ruleType),
      stage: normalizeRuleStage(rule.stage),
      ruleZone: normalizeRuleZone(rule.ruleZone),
      enabled: rule.enabled !== false,
      tags: ruleTagsList(rule),
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRule?.id) return;
    if (!editForm.name?.trim()) {
      setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
      return;
    }
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description || '',
        documentation: editForm.documentation || '',
        maintainer: (editForm.maintainer || '').trim(),
        ruleType: normalizeRuleType(editForm.ruleType),
        stage: normalizeRuleStage(editForm.stage),
        ruleZone: normalizeRuleZone(editForm.ruleZone),
        enabled: editForm.enabled,
        tags: normalizeTagList(editForm.tags),
        modelShortName: isLibraryRule(editingRule)
          ? ''
          : editingRule.modelShortName || '',
        parentRuleId: editingRule.parentRuleId ? editingRule.parentRuleId : null,
      };
      await updateRule(editingRule.id, payload);
      setSnackbar({ open: true, message: 'Rule updated', severity: 'success' });
      setEditDialogOpen(false);
      setEditingRule(null);
      load();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Update failed', severity: 'error' });
    }
  };

  const handleOpenDeleteRuleModal = () => {
    if (editingRule?.id) setDeleteRuleFromEditOpen(true);
  };

  const confirmDeleteEditingRule = async () => {
    if (!editingRule?.id) return;
    try {
      await deleteRule(editingRule.id);
      setSnackbar({ open: true, message: 'Rule deleted', severity: 'success' });
      setEditDialogOpen(false);
      setEditingRule(null);
      load();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Delete failed', severity: 'error' });
    }
  };

  const headCellSx = {
    bgcolor: currentTheme?.card,
    color: currentTheme?.textSecondary,
    fontWeight: 700,
    borderBottom: `2px solid ${currentTheme?.border}`,
  };

  if (loading && rows.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: currentTheme?.text, fontWeight: 700, mb: 1 }}>
          Data Quality Rules
        </Typography>
        <Typography variant="body1" sx={{ color: currentTheme?.textSecondary, maxWidth: 720 }}>
          Library rules are not tied to a model. Use <strong>Edit</strong> in the table to change a rule (the library
          copy when one exists, otherwise the listed model instance). Use the workbench <strong>Rule Builder</strong>{' '}
          (Workspaces) to copy rules onto a model.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search name, model, maintainer, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: currentTheme?.textSecondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: currentTheme?.card,
            '& .MuiOutlinedInput-root': {
              color: currentTheme?.text,
              '& fieldset': { borderColor: currentTheme?.border },
              '&:hover fieldset': { borderColor: currentTheme?.primary },
              '&.Mui-focused fieldset': { borderColor: currentTheme?.primary },
            },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: `1px solid ${currentTheme?.border}`,
            borderRadius: 2,
            bgcolor: currentTheme?.card,
            overflowX: 'auto',
          }}
        >
          <Table
            size="medium"
            stickyHeader
            sx={{
              minWidth: 840,
              '& td': { fontFamily: fontStackSans, verticalAlign: 'middle' },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Name</TableCell>
                <TableCell sx={{ ...headCellSx, width: 160, minWidth: 140 }}>Rule ID</TableCell>
                <TableCell sx={{ ...headCellSx, width: 120, minWidth: 100, maxWidth: 180 }}>Maintainer</TableCell>
                <TableCell sx={{ ...headCellSx, minWidth: 200, maxWidth: 360 }}>Model</TableCell>
                <TableCell sx={{ ...headCellSx, width: 140 }}>Type</TableCell>
                <TableCell sx={{ ...headCellSx, width: 100 }}>Stage</TableCell>
                <TableCell sx={{ ...headCellSx, width: 100 }}>Zone</TableCell>
                <TableCell sx={{ ...headCellSx, width: 88 }} align="center">
                  On
                </TableCell>
                <TableCell sx={{ ...headCellSx, width: 72 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ color: currentTheme?.textSecondary, textAlign: 'center', py: 4 }}>
                    No rules match.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((entry) => {
                  const rule = entry.representative;
                  const maintainerLabel =
                    rule.maintainer != null && String(rule.maintainer).trim() !== ''
                      ? maintainerToTeamSelectorSelection(rule.maintainer, applications)[0] || rule.maintainer
                      : '';
                  return (
                    <TableRow
                      key={entry.lineageId}
                      hover
                      sx={{
                        '&:nth-of-type(even)': {
                          bgcolor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                        },
                      }}
                    >
                      <TableCell sx={{ color: currentTheme?.text, fontWeight: 600 }}>{rule.name}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        {rule.id ? (
                          <Typography
                            variant="body2"
                            component="span"
                            title={String(rule.id)}
                            sx={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: '0.8125rem',
                              color: currentTheme?.textSecondary,
                              wordBreak: 'break-all',
                            }}
                          >
                            {rule.id}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        {maintainerLabel ? (
                          <Typography
                            variant="body2"
                            title={maintainerLabel}
                            sx={{
                              color: currentTheme?.textSecondary,
                              fontSize: '0.8125rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {maintainerLabel}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                          {entry.hasLibrary ? (
                            <Chip
                              size="small"
                              label="Library"
                              variant="outlined"
                              sx={{ borderColor: currentTheme?.border }}
                            />
                          ) : null}
                          {entry.modelsWithLineage.map((m) => (
                            <Chip
                              key={m}
                              size="small"
                              label={m}
                              sx={{ fontFamily: fontStackSans }}
                              variant="filled"
                            />
                          ))}
                          {!entry.hasLibrary && entry.modelsWithLineage.length === 0 ? (
                            <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                              —
                            </Typography>
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: currentTheme?.textSecondary }}>{rule.ruleType || '—'}</TableCell>
                      <TableCell sx={{ py: 1 }}>
                        {(() => {
                          const st = normalizeRuleStage(rule.stage);
                          const c = ruleStageColor(st);
                          return (
                            <Chip
                              label={st}
                              size="small"
                              sx={{
                                height: 24,
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                bgcolor: `${c}22`,
                                color: c,
                                border: `1px solid ${c}44`,
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        {(() => {
                          const z = normalizeRuleZone(rule.ruleZone);
                          const c = ruleZoneColor(z);
                          return (
                            <Chip
                              label={ruleZoneLabel(z)}
                              size="small"
                              sx={{
                                height: 24,
                                fontWeight: 600,
                                bgcolor: `${c}22`,
                                color: c,
                                border: `1px solid ${c}44`,
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        {rule.enabled !== false ? (
                          <Chip size="small" label="Yes" color="success" variant="outlined" />
                        ) : (
                          <Chip size="small" label="No" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        {rule.id ? (
                          <Tooltip title="Edit rule">
                            <IconButton
                              size="small"
                              aria-label="Edit rule"
                              onClick={() => openEditDialog(entry)}
                              sx={{ color: currentTheme?.textSecondary }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Fab
        color="primary"
        aria-label="new library rule"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: currentTheme?.primary,
          color: '#fff',
          boxShadow: 'none',
          '&:hover': {
            bgcolor: currentTheme?.primary,
            opacity: 0.9,
            transform: 'scale(1.05)',
          },
          transition: 'transform 0.2s, opacity 0.2s',
          zIndex: 1000,
        }}
        onClick={() => setLibraryDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={libraryDialogOpen} onClose={() => setLibraryDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` } }}>
        <DialogTitle sx={{ color: currentTheme?.text }}>New library rule</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={libraryForm.name}
            onChange={(e) => setLibraryForm({ ...libraryForm, name: e.target.value })}
            sx={{ mt: 1, mb: 2, input: { color: currentTheme?.text } }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={libraryForm.description}
            onChange={(e) => setLibraryForm({ ...libraryForm, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2, input: { color: currentTheme?.text } }}
          />
          <TextField
            fullWidth
            label="Documentation URL"
            value={libraryForm.documentation}
            onChange={(e) => setLibraryForm({ ...libraryForm, documentation: e.target.value })}
            sx={{ mb: 2, input: { color: currentTheme?.text } }}
          />
          <TeamSelector
            selectedTeams={maintainerToTeamSelectorSelection(libraryForm.maintainer, applications)}
            onTeamsChange={(teams) =>
              setLibraryForm({ ...libraryForm, maintainer: teams.length > 0 ? teams[0] : '' })
            }
            currentTheme={currentTheme}
            label="Maintainer"
            showLabel
            maxSelections={1}
            placeholder="No maintainer selected"
          />
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Rule type</InputLabel>
            <Select
              label="Rule type"
              value={libraryForm.ruleType}
              onChange={(e) => setLibraryForm({ ...libraryForm, ruleType: e.target.value })}
            >
              {RULE_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Stage</InputLabel>
            <Select
              label="Stage"
              value={normalizeRuleStage(libraryForm.stage)}
              onChange={(e) => setLibraryForm({ ...libraryForm, stage: e.target.value })}
            >
              {RULE_STAGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Rule zone</InputLabel>
            <Select
              label="Rule zone"
              value={normalizeRuleZone(libraryForm.ruleZone)}
              onChange={(e) => setLibraryForm({ ...libraryForm, ruleZone: e.target.value })}
            >
              {RULE_ZONE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLibraryDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLibrary}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingRule(null);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` } }}
      >
        <DialogTitle
          component="div"
          sx={{
            color: currentTheme?.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pr: 1,
          }}
        >
          <Typography component="h2" variant="h6" sx={{ color: currentTheme?.text, fontSize: '1.25rem', fontWeight: 600, m: 0 }}>
            Edit rule
          </Typography>
          {editingRule?.id ? (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Delete rule"
                onClick={handleOpenDeleteRuleModal}
                sx={{ color: currentTheme?.textSecondary }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            sx={{ mt: 1, mb: 2, input: { color: currentTheme?.text } }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2, input: { color: currentTheme?.text } }}
          />
          <TextField
            fullWidth
            label="Documentation URL"
            value={editForm.documentation}
            onChange={(e) => setEditForm({ ...editForm, documentation: e.target.value })}
            sx={{ mb: 2, input: { color: currentTheme?.text } }}
          />
          <TeamSelector
            selectedTeams={maintainerToTeamSelectorSelection(editForm.maintainer, applications)}
            onTeamsChange={(teams) =>
              setEditForm({ ...editForm, maintainer: teams.length > 0 ? teams[0] : '' })
            }
            currentTheme={currentTheme}
            label="Maintainer"
            showLabel
            maxSelections={1}
            placeholder="No maintainer selected"
          />
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Rule type</InputLabel>
            <Select
              label="Rule type"
              value={editForm.ruleType}
              onChange={(e) => setEditForm({ ...editForm, ruleType: e.target.value })}
            >
              {RULE_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Stage</InputLabel>
            <Select
              label="Stage"
              value={normalizeRuleStage(editForm.stage)}
              onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
            >
              {RULE_STAGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Rule zone</InputLabel>
            <Select
              label="Rule zone"
              value={normalizeRuleZone(editForm.ruleZone)}
              onChange={(e) => setEditForm({ ...editForm, ruleZone: e.target.value })}
            >
              {RULE_ZONE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={editForm.enabled}
                onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                color="primary"
              />
            }
            label="Enabled"
            sx={{ color: currentTheme?.text, mb: 1, display: 'block' }}
          />
          <Autocomplete
            multiple
            freeSolo
            options={tagSuggestions}
            value={editForm.tags}
            onChange={(event, newValue) => {
              const normalized = normalizeTagList(
                newValue.map((x) => (typeof x === 'string' ? x : String(x))),
              );
              setEditForm({ ...editForm, tags: normalized });
            }}
            filterSelectedOptions
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={`${option}-${index}`}
                  icon={<LocalOfferIcon sx={{ fontSize: 14 }} />}
                  label={option}
                  sx={{
                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(8, 145, 178, 0.1)',
                    color: currentTheme?.text,
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Type and press Enter"
                helperText="Free-text tags for objects, columns, functions, or anything else"
                sx={{
                  mb: 0,
                  '& .MuiOutlinedInput-root': {
                    color: currentTheme?.text,
                    '& fieldset': { borderColor: currentTheme?.border },
                    '&:hover fieldset': { borderColor: currentTheme?.primary },
                    '&.Mui-focused fieldset': { borderColor: currentTheme?.primary },
                  },
                  '& .MuiInputLabel-root': {
                    color: currentTheme?.textSecondary,
                    '&.Mui-focused': { color: currentTheme?.primary },
                  },
                  '& .MuiFormHelperText-root': { color: currentTheme?.textSecondary },
                }}
              />
            )}
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: currentTheme?.textSecondary },
              '& .MuiAutocomplete-clearIndicator': { color: currentTheme?.textSecondary },
            }}
            PaperComponent={({ children, ...other }) => (
              <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                {children}
              </Paper>
            )}
          />
          {editingRule?.id ? (
            <Typography variant="caption" sx={{ color: currentTheme?.textSecondary, display: 'block', mt: 1 }}>
              Rule ID: {editingRule.id}
              {isLibraryRule(editingRule) ? ' · Library' : editingRule.modelShortName ? ` · Model: ${editingRule.modelShortName}` : ''}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingRule(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteModal
        open={deleteRuleFromEditOpen}
        onClose={() => setDeleteRuleFromEditOpen(false)}
        onConfirm={confirmDeleteEditingRule}
        confirmMode="simple"
        title="Delete rule"
        itemName={editingRule?.name?.trim() || (editingRule?.id ? `Rule ${editingRule.id}` : '')}
        itemType="rule"
        theme={currentTheme}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        ContentProps={{
          sx: { bgcolor: snackbar.severity === 'error' ? 'error.dark' : 'grey.900' },
        }}
      />
    </Container>
  );
};

export default RulesMasterList;
