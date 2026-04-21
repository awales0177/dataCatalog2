import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Fab,
  FormControl,
  InputLabel,
  InputAdornment,
  Select,
  MenuItem,
  Switch,
  CircularProgress,
  Snackbar,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  LocalOffer as LocalOfferIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  getRulesForModel,
  getAllModelRules,
  assignRuleToModel,
  createRule,
  updateRule,
  deleteRule,
  fetchData,
} from '../services/api';
import { modelApiRef } from '../utils/catalogModelLookup';
import TeamSelector from './TeamSelector';
import { maintainerToTeamSelectorSelection } from '../utils/maintainerTeamSelection';
import { ruleTagsList, normalizeTagList } from '../utils/ruleTags';
import { RULE_STAGE_OPTIONS, normalizeRuleStage } from '../utils/ruleStage';
import { RULE_ZONE_OPTIONS, normalizeRuleZone, ruleZoneLabel } from '../utils/ruleZone';
import { fontStackSans } from '../theme/theme';
import ModelRulesTable from './ModelRulesTable';
import DeleteModal from './DeleteModal';

/** API may still return legacy types; UI only offers these two. */
const RULE_TYPE_OPTIONS = [
  { value: 'validation', label: 'Validation' },
  { value: 'transformation', label: 'Transformation' },
];

const normalizeRuleType = (t) =>
  RULE_TYPE_OPTIONS.some((o) => o.value === t) ? t : 'validation';

/** Library rules have no data model (data_model_id NULL); API sets isLibrary or omits modelShortName. */
function isLibraryRule(r) {
  if (!r) return false;
  if (r.isLibrary === true) return true;
  if (r.isLibrary === false) return false;
  return !r.modelShortName || String(r.modelShortName).trim() === '';
}

/** Stable lineage for duplicate detection: canonical library id, or source rule id if model-only. */
function ruleLineageId(r) {
  if (!r) return '';
  const lr = r.libraryRuleId;
  if (lr != null && String(lr).trim() !== '') return String(lr).trim().toLowerCase();
  return String(r.id || '').trim().toLowerCase();
}

function descendantRuleIds(rootId, rulesList) {
  const byParent = new Map();
  for (const r of rulesList) {
    const p = r.parentRuleId;
    if (!p) continue;
    const k = String(p);
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(String(r.id));
  }
  const out = new Set();
  const stack = [...(byParent.get(String(rootId)) || [])];
  while (stack.length) {
    const id = stack.pop();
    if (out.has(id)) continue;
    out.add(id);
    for (const kid of byParent.get(id) || []) stack.push(kid);
  }
  return out;
}

/** Delete order: children before parents (all rules on this model sharing the lineage). */
function orderRuleIdsToDeleteForLineage(rulesOnModel, lineageId) {
  const lid = String(lineageId || '').trim().toLowerCase();
  const subset = (rulesOnModel || []).filter((r) => ruleLineageId(r) === lid);
  if (subset.length === 0) return [];
  const remaining = new Set(subset.map((r) => String(r.id)));
  const ordered = [];
  while (remaining.size > 0) {
    const leaves = [...remaining].filter(
      (id) =>
        !subset.some(
          (r) =>
            remaining.has(String(r.id)) &&
            r.parentRuleId != null &&
            String(r.parentRuleId) === String(id),
        ),
    );
    if (leaves.length === 0) {
      [...remaining].forEach((id) => ordered.push(id));
      break;
    }
    leaves.forEach((id) => {
      ordered.push(id);
      remaining.delete(id);
    });
  }
  return ordered;
}

const ModelRuleBuilder = ({
  selectedModel,
  onBack,
  inModal = false,
  /** Header modal: associate catalog rules to the model and set parent/child links — no create, delete, or full edit. */
  associationOnly = false,
  models,
  onModelChange,
  modelsLoading = false,
}) => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const showModelSwitcher = Boolean(
    inModal && typeof onModelChange === 'function' && Array.isArray(models) && models.length > 0
  );
  
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  /** Full builder: open dialog with only parent/child fields (same as association-only modal). */
  const [ruleDialogParentOnly, setRuleDialogParentOnly] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [libraryAttachOpen, setLibraryAttachOpen] = useState(false);
  const [libraryMasterRows, setLibraryMasterRows] = useState([]);
  const [masterListSearch, setMasterListSearch] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  /** Lineage ids selected in Associate to model dialog (rules not yet on this model). */
  const [catalogAssocLineageIds, setCatalogAssocLineageIds] = useState(() => new Set());
  /** Confirm removing catalog lineage from current model (uncheck "On model"). */
  const [dissociateDialog, setDissociateDialog] = useState(null);
  const [ruleDeleteTarget, setRuleDeleteTarget] = useState(null);
  const [applications, setApplications] = useState([]);

  // Rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    documentation: '',
    maintainer: '',
    modelShortName: '',
    tags: [],
    ruleType: 'validation',
    stage: 'bronze',
    ruleZone: 'value',
    enabled: true,
    parentRuleId: '',
  });

  const tagSuggestions = useMemo(() => {
    const s = new Set();
    rules.forEach((r) => {
      if (editingRule && r.id === editingRule.id) return;
      ruleTagsList(r).forEach((t) => s.add(t));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [rules, editingRule]);

  /** Lineage keys already present on the selected model (one row per model per lineage). */
  const lineageIdsOnSelectedModel = useMemo(() => {
    const s = new Set();
    (rules || []).forEach((r) => s.add(ruleLineageId(r)));
    return s;
  }, [rules]);

  /** One row per lineage in the associate modal; merges copies across models. */
  const catalogLineageEntries = useMemo(() => {
    const byLineage = new Map();
    for (const r of libraryMasterRows) {
      const lid = ruleLineageId(r);
      if (!lid) continue;
      if (!byLineage.has(lid)) byLineage.set(lid, { rules: [] });
      byLineage.get(lid).rules.push(r);
    }
    const entries = [];
    for (const [lineageId, { rules: groupRules }] of byLineage) {
      const modelsSet = new Set();
      for (const r of groupRules) {
        if (!isLibraryRule(r) && r.modelShortName) modelsSet.add(r.modelShortName);
      }
      const representative =
        groupRules.find(isLibraryRule) ||
        [...groupRules].sort((a, b) =>
          (a.modelShortName || '').localeCompare(b.modelShortName || '', undefined, { sensitivity: 'base' }),
        )[0];
      entries.push({
        lineageId,
        representative,
        modelsWithLineage: Array.from(modelsSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
      });
    }
    return entries;
  }, [libraryMasterRows]);

  const catalogEntryCanAssociate = (entry) => {
    if (!modelApiRef(selectedModel) || !entry) return false;
    return !lineageIdsOnSelectedModel.has(entry.lineageId);
  };

  const catalogEntriesFilteredSorted = useMemo(() => {
    const q = masterListSearch.trim().toLowerCase();
    let list = catalogLineageEntries;
    if (q) {
      list = catalogLineageEntries.filter((e) => {
        const r = e.representative;
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
        if (e.modelsWithLineage.some((m) => m.toLowerCase().includes(q))) return true;
        return ruleTagsList(r).some((t) => t.toLowerCase().includes(q));
      });
    }
    return [...list].sort((a, b) => {
      const ma = (a.representative.modelShortName || '\u0000').toLowerCase();
      const mb = (b.representative.modelShortName || '\u0000').toLowerCase();
      if (ma !== mb) return ma.localeCompare(mb);
      return (a.representative.name || '').localeCompare(b.representative.name || '', undefined, { sensitivity: 'base' });
    });
  }, [catalogLineageEntries, masterListSearch, applications]);

  const loadRules = useCallback(async () => {
    if (!selectedModel) return;
    try {
      setLoading(true);
      const data = await getRulesForModel(modelApiRef(selectedModel));
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error loading rules:', error);
      const errorMessage = error.message || 'Failed to load rules';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedModel) {
      loadRules();
    }
  }, [selectedModel, loadRules]);

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

  const openLibraryAttach = async () => {
    setLibraryAttachOpen(true);
    setMasterListSearch('');
    setCatalogAssocLineageIds(new Set());
    setLibraryLoading(true);
    try {
      const data = await getAllModelRules({ forceRefresh: true });
      setLibraryMasterRows(Array.isArray(data.rules) ? data.rules : []);
    } catch (error) {
      console.error(error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load rule catalog',
        severity: 'error',
      });
      setLibraryMasterRows([]);
    } finally {
      setLibraryLoading(false);
    }
  };

  const refreshCatalogRows = async () => {
    try {
      const data = await getAllModelRules({ forceRefresh: true });
      setLibraryMasterRows(Array.isArray(data.rules) ? data.rules : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchAssociateFromCatalog = async () => {
    if (!modelApiRef(selectedModel)) return;
    const entries = Array.from(catalogAssocLineageIds)
      .map((lid) => catalogLineageEntries.find((e) => String(e.lineageId) === String(lid)))
      .filter((e) => e && catalogEntryCanAssociate(e));
    if (!entries.length) {
      setSnackbar({
        open: true,
        message: 'Choose at least one rule that is not already on this model.',
        severity: 'warning',
      });
      return;
    }
    setLibraryLoading(true);
    let ok = 0;
    const errors = [];
    try {
      for (const entry of entries) {
        try {
          await assignRuleToModel(entry.representative.id, modelApiRef(selectedModel));
          ok++;
        } catch (err) {
          console.error(err);
          errors.push({
            name: entry.representative?.name || entry.lineageId,
            message: err.message || String(err),
          });
        }
      }
      setCatalogAssocLineageIds(new Set());
      await loadRules();
      if (libraryAttachOpen) await refreshCatalogRows();
      if (errors.length === 0) {
        setSnackbar({
          open: true,
          message: ok === 1 ? 'Rule associated with this model' : `${ok} rules associated with this model`,
          severity: 'success',
        });
        setLibraryAttachOpen(false);
      } else if (ok > 0) {
        setSnackbar({
          open: true,
          message: `${ok} associated, ${errors.length} failed (${errors[0].message})`,
          severity: 'warning',
        });
      } else {
        setSnackbar({
          open: true,
          message: errors[0]?.message || 'Failed to associate rules',
          severity: 'error',
        });
      }
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleConfirmDissociateFromCatalog = async () => {
    if (!dissociateDialog?.orderedRuleIds?.length) {
      setDissociateDialog(null);
      return;
    }
    try {
      setLibraryLoading(true);
      const msn = modelApiRef(selectedModel);
      for (const id of dissociateDialog.orderedRuleIds) {
        await deleteRule(id, { modelShortName: msn });
      }
      setSnackbar({ open: true, message: 'Rule removed from this model', severity: 'success' });
      setDissociateDialog(null);
      await loadRules();
      if (libraryAttachOpen) await refreshCatalogRows();
    } catch (error) {
      console.error('Error removing rule:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to remove rule from model',
        severity: 'error',
      });
    } finally {
      setLibraryLoading(false);
    }
  };

  const closeRuleDialog = () => {
    setRuleDialogOpen(false);
    setRuleDialogParentOnly(false);
  };

  const handleCreateRule = () => {
    if (associationOnly) return;
    setRuleDialogParentOnly(false);
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      documentation: '',
      maintainer: '',
      modelShortName: modelApiRef(selectedModel),
      tags: [],
      ruleType: 'validation',
      stage: 'bronze',
      ruleZone: 'value',
      enabled: true,
      parentRuleId: '',
    });
    setRuleDialogOpen(true);
  };

  const handleOpenParentOnlyRule = (rule) => {
    if (associationOnly) return;
    setRuleDialogParentOnly(true);
    setEditingRule(rule);
    setRuleForm({
      name: rule.name || '',
      description: rule.description || '',
      documentation: rule.documentation || '',
      maintainer: rule.maintainer || '',
      modelShortName: rule.modelShortName || modelApiRef(selectedModel),
      tags: ruleTagsList(rule),
      ruleType: normalizeRuleType(rule.ruleType || 'validation'),
      stage: normalizeRuleStage(rule.stage),
      ruleZone: normalizeRuleZone(rule.ruleZone),
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      parentRuleId: rule.parentRuleId || '',
    });
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule) => {
    if (associationOnly) {
      setRuleDialogParentOnly(false);
      setEditingRule(rule);
      setRuleForm({
        name: rule.name || '',
        description: rule.description || '',
        documentation: rule.documentation || '',
        maintainer: rule.maintainer || '',
        modelShortName: rule.modelShortName || modelApiRef(selectedModel),
        tags: ruleTagsList(rule),
        ruleType: normalizeRuleType(rule.ruleType || 'validation'),
        stage: normalizeRuleStage(rule.stage),
        ruleZone: normalizeRuleZone(rule.ruleZone),
        enabled: rule.enabled !== undefined ? rule.enabled : true,
        parentRuleId: rule.parentRuleId || '',
      });
      setRuleDialogOpen(true);
      return;
    }
    setRuleDialogParentOnly(false);
    setEditingRule(rule);
    setRuleForm({
      name: rule.name || '',
      description: rule.description || '',
      documentation: rule.documentation || '',
      maintainer: rule.maintainer || '',
      modelShortName: rule.modelShortName || modelApiRef(selectedModel),
      tags: ruleTagsList(rule),
      ruleType: normalizeRuleType(rule.ruleType || 'validation'),
      stage: normalizeRuleStage(rule.stage),
      ruleZone: normalizeRuleZone(rule.ruleZone),
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      parentRuleId: rule.parentRuleId || '',
    });
    setRuleDialogOpen(true);
  };

  const requestDeleteRule = (rule) => {
    if (associationOnly || !rule?.id) return;
    setRuleDeleteTarget(rule);
  };

  const confirmDeleteRule = async () => {
    const ruleId = ruleDeleteTarget?.id;
    if (!ruleId) return;
    try {
      setLoading(true);
      await deleteRule(ruleId, {
        modelShortName:
          ruleDeleteTarget.modelShortName != null && String(ruleDeleteTarget.modelShortName).trim() !== ''
            ? ruleDeleteTarget.modelShortName
            : modelApiRef(selectedModel) || '',
      });
      setSnackbar({ open: true, message: 'Rule deleted successfully', severity: 'success' });
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      setSnackbar({ open: true, message: 'Failed to delete rule', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    try {
      setLoading(true);

      if ((associationOnly || ruleDialogParentOnly) && editingRule) {
        await updateRule(editingRule.id, {
          parentRuleId: ruleForm.parentRuleId ? ruleForm.parentRuleId : null,
          modelShortName:
            ruleForm.modelShortName ||
            editingRule.modelShortName ||
            modelApiRef(selectedModel) ||
            '',
        });
        setSnackbar({ open: true, message: 'Parent rule updated', severity: 'success' });
        closeRuleDialog();
        loadRules();
        return;
      }

      const ruleData = {
        name: ruleForm.name,
        description: ruleForm.description,
        documentation: ruleForm.documentation || '',
        maintainer: (ruleForm.maintainer || '').trim(),
        modelShortName: ruleForm.modelShortName || modelApiRef(selectedModel),
        ruleType: normalizeRuleType(ruleForm.ruleType),
        stage: normalizeRuleStage(ruleForm.stage),
        ruleZone: normalizeRuleZone(ruleForm.ruleZone),
        enabled: ruleForm.enabled,
        tags: normalizeTagList(ruleForm.tags),
        parentRuleId: ruleForm.parentRuleId ? ruleForm.parentRuleId : null,
      };

      if (editingRule) {
        await updateRule(editingRule.id, ruleData);
        setSnackbar({ open: true, message: 'Rule updated successfully', severity: 'success' });
      } else {
        await createRule(ruleData);
        setSnackbar({ open: true, message: 'Rule created successfully', severity: 'success' });
      }
      closeRuleDialog();
      loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      setSnackbar({ open: true, message: 'Failed to save rule', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const showParentOnlyDialog = Boolean(
    editingRule && (associationOnly || ruleDialogParentOnly),
  );

  const getRuleTypeColor = (ruleType) => {
    const colorMap = {
      'validation': {
        bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        color: darkMode ? '#81c784' : '#2e7d32',
        border: darkMode ? 'rgba(76, 175, 80, 0.5)' : '#4caf50'
      },
      'transformation': {
        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 135, 180, 0.1)',
        color: darkMode ? (currentTheme?.primary || '#e5e5e5') : '#0b87b4',
        border: darkMode ? 'rgba(255, 255, 255, 0.35)' : '#0b87b4'
      },
      'business': {
        bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
        color: darkMode ? '#ba68c8' : '#6a1b9a',
        border: darkMode ? 'rgba(156, 39, 176, 0.5)' : '#9c27b0'
      },
      'quality': {
        bgcolor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        color: darkMode ? '#ffb74d' : '#e65100',
        border: darkMode ? 'rgba(255, 152, 0, 0.5)' : '#ff9800'
      }
    };
    return colorMap[ruleType] || {
      bgcolor: currentTheme?.background,
      color: currentTheme?.text,
      border: currentTheme?.border
    };
  };

  const rulesToolbarRow = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 1,
        flexWrap: 'wrap',
        mb: 2,
      }}
    >
      <Typography
        variant={inModal ? 'subtitle1' : 'h6'}
        sx={{ fontWeight: 600, color: currentTheme?.text }}
      >
        {inModal ? 'Rules' : `Rules (${rules.length})`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={openLibraryAttach}
          disabled={loading}
          sx={{
            textTransform: 'none',
            borderColor: currentTheme?.border,
            color: currentTheme?.text,
          }}
        >
          Associate to model
        </Button>
        <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
          {rules.length} rule{rules.length === 1 ? '' : 's'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={
        inModal
          ? {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              height: '100%',
              position: 'relative',
            }
          : { p: 3 }
      }
    >
      {showModelSwitcher ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            flexShrink: 0,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            rowGap: 1,
            borderBottom: `1px solid ${currentTheme?.border}`,
          }}
        >
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ color: currentTheme?.textSecondary, flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            All models
          </Button>
          <Box
            sx={{
              flex: { xs: '1 1 100%', md: '1 1 auto' },
              order: { xs: 3, md: 0 },
              display: 'flex',
              justifyContent: 'center',
              minWidth: 0,
              maxWidth: { xs: '100%', md: 440 },
              mx: { xs: 0, md: 'auto' },
            }}
          >
            <Autocomplete
              size="small"
              disabled={modelsLoading}
              options={models}
              value={selectedModel && models.some((x) => String(x.id) === String(selectedModel.id)) ? selectedModel : null}
              onChange={(e, newValue) => {
                if (newValue && onModelChange) onModelChange(newValue);
              }}
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              getOptionLabel={(m) => {
                if (!m) return '';
                return m.shortName ? `${m.name || ''} · ${m.shortName}` : m.name || '';
              }}
              filterOptions={(options, state) => {
                const q = state.inputValue.trim().toLowerCase();
                if (!q) return options;
                return options.filter((m) => {
                  const name = (m.name || '').toLowerCase();
                  const sn = (m.shortName || '').toLowerCase();
                  return name.includes(q) || sn.includes(q);
                });
              }}
              renderOption={(props, m) => (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: currentTheme?.text }}>
                    {m.name}
                  </Typography>
                  {m.shortName ? (
                    <Typography
                      variant="caption"
                      sx={{ color: currentTheme?.textSecondary, fontFamily: fontStackSans }}
                    >
                      {m.shortName}
                    </Typography>
                  ) : null}
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Data model"
                  InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: currentTheme?.textSecondary, fontSize: 20 }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    width: '100%',
                    minWidth: 0,
                    maxWidth: 440,
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme?.text,
                      bgcolor: currentTheme?.card,
                      '& fieldset': { borderColor: currentTheme?.border },
                      '&:hover fieldset': { borderColor: currentTheme?.primary },
                      '&.Mui-focused fieldset': { borderColor: currentTheme?.primary },
                    },
                    '& .MuiInputLabel-root': { color: currentTheme?.textSecondary },
                  }}
                />
              )}
              sx={{ width: '100%', minWidth: 0, maxWidth: 440 }}
              componentsProps={{
                paper: {
                  sx: {
                    bgcolor: currentTheme?.card,
                    color: currentTheme?.text,
                    border: `1px solid ${currentTheme?.border}`,
                  },
                },
              }}
            />
          </Box>
          <Chip
            label={`${rules.length} rule${rules.length === 1 ? '' : 's'}`}
            size="small"
            variant="outlined"
            sx={{
              flexShrink: 0,
              order: { xs: 2, md: 0 },
              borderColor: currentTheme?.border,
              color: currentTheme?.textSecondary,
            }}
          />
        </Box>
      ) : null}

      <Box
        sx={
          inModal
            ? { px: 3, pt: showModelSwitcher ? 2 : 3, flexShrink: 0 }
            : {}
        }
      >
        {!showModelSwitcher && (
          <Box sx={{ mb: 3 }}>
            <Button
              onClick={onBack}
              sx={{ mb: 1, color: currentTheme?.textSecondary }}
            >
              ← Back to Model Selection
            </Button>
            <Typography variant="h4" sx={{ color: currentTheme?.text }}>
              Rule Builder: {selectedModel?.name}
            </Typography>
            <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, fontFamily: fontStackSans }}>
              {selectedModel?.shortName}
            </Typography>
          </Box>
        )}
        {inModal ? rulesToolbarRow : null}
      </Box>

      {/* Rules list: in the modal, only the table scrolls so button hover is not clipped by overflow */}
      <Box
        sx={
          inModal
            ? {
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                position: 'relative',
                px: 3,
                pb: 10,
              }
            : {}
        }
      >
        {!inModal ? (
          <Box sx={{ mb: 3 }}>
            {rulesToolbarRow}
            {loading && rules.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ModelRulesTable
                rules={rules}
                loading={loading}
                applications={applications}
                emptyMessage={
                  associationOnly
                    ? 'No rules on this model yet. Use Associate to model to copy a rule here (library or from another model), then use Set parent rule on each row to define hierarchy.'
                    : 'No rules yet. Use Associate to model to copy a rule onto this model, use + to create one, or open Edit on a rule to set its parent and define relationships.'
                }
                expandResetKey={selectedModel?.id}
                readOnly={false}
                associationOnly={associationOnly}
                denseModal={inModal}
                onEditRule={handleEditRule}
                onDeleteRule={!associationOnly ? requestDeleteRule : undefined}
                onOpenParentRule={!associationOnly ? handleOpenParentOnlyRule : undefined}
              />
            )}
          </Box>
        ) : loading && rules.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ModelRulesTable
            rules={rules}
            loading={loading}
            applications={applications}
            emptyMessage={
              associationOnly
                ? 'No rules on this model yet. Use Associate to model to copy a rule here (library or from another model), then use Set parent rule on each row to define hierarchy.'
                : 'No rules yet. Use Associate to model to copy a rule onto this model, use + to create one, or open Edit on a rule to set its parent and define relationships.'
            }
            expandResetKey={selectedModel?.id}
            readOnly={false}
            associationOnly={associationOnly}
            denseModal={inModal}
            onEditRule={handleEditRule}
            onDeleteRule={!associationOnly ? requestDeleteRule : undefined}
            onOpenParentRule={!associationOnly ? handleOpenParentOnlyRule : undefined}
          />
        )}
      </Box>

      {inModal && !associationOnly && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleCreateRule}
          sx={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            zIndex: 10,
            bgcolor: currentTheme?.primary,
            boxShadow: darkMode ? '0 4px 18px rgba(0,0,0,0.45)' : 4,
            '&:hover': {
              bgcolor: currentTheme?.primary,
              opacity: 0.9,
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Rule Editor Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={closeRuleDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme?.card,
            color: currentTheme?.text,
            border: `1px solid ${currentTheme?.border}`
          }
        }}
      >
        <DialogTitle sx={{ color: currentTheme?.text, borderBottom: `1px solid ${currentTheme?.border}`, pb: 2 }}>
          {showParentOnlyDialog
            ? 'Set parent rule'
            : editingRule
              ? 'Edit Rule'
              : 'Create New Rule'}
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme?.text }}>
          {showParentOnlyDialog ? (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, color: currentTheme?.textSecondary }}>
                Choose a parent for <strong>{editingRule.name}</strong>. Only rules on this model are listed.
                Leave empty for a top-level rule.
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel
                  id="assoc-parent-lbl"
                  sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}
                >
                  Parent rule (same model)
                </InputLabel>
                <Select
                  labelId="assoc-parent-lbl"
                  label="Parent rule (same model)"
                  value={ruleForm.parentRuleId || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, parentRuleId: e.target.value })}
                  sx={{
                    color: currentTheme?.text,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme?.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme?.primary },
                    '& .MuiSvgIcon-root': { color: currentTheme?.textSecondary },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: currentTheme?.card,
                        color: currentTheme?.text,
                        border: `1px solid ${currentTheme?.border}`,
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>None (top-level)</em>
                  </MenuItem>
                  {(() => {
                    const graph = rules.map((r) =>
                      r.id === editingRule.id
                        ? { ...r, parentRuleId: ruleForm.parentRuleId || null }
                        : r,
                    );
                    const invalid = new Set([
                      String(editingRule.id),
                      ...descendantRuleIds(editingRule.id, graph),
                    ]);
                    return rules
                      .filter((r) => !invalid.has(String(r.id)))
                      .sort((a, b) =>
                        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
                      )
                      .map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ));
                  })()}
                </Select>
              </FormControl>
            </Box>
          ) : (
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Rule Name"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: currentTheme?.text,
                  '& fieldset': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme?.primary
                  }
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme?.textSecondary,
                  '&.Mui-focused': {
                    color: currentTheme?.primary
                  }
                }
              }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={ruleForm.description}
              onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              multiline
              rows={3}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: currentTheme?.text,
                  '& fieldset': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme?.primary
                  }
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme?.textSecondary,
                  '&.Mui-focused': {
                    color: currentTheme?.primary
                  }
                }
              }}
            />
            <TextField
              fullWidth
              label="Documentation Link"
              placeholder="https://example.com/docs"
              value={ruleForm.documentation || ''}
              onChange={(e) => setRuleForm({ ...ruleForm, documentation: e.target.value })}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: currentTheme?.text,
                  '& fieldset': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover fieldset': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: currentTheme?.primary
                  }
                },
                '& .MuiInputLabel-root': {
                  color: currentTheme?.textSecondary,
                  '&.Mui-focused': {
                    color: currentTheme?.primary
                  }
                },
                '& .MuiInputBase-input::placeholder': {
                  color: currentTheme?.textSecondary,
                  opacity: 1
                }
              }}
            />
            <TeamSelector
              selectedTeams={maintainerToTeamSelectorSelection(ruleForm.maintainer, applications)}
              onTeamsChange={(teams) =>
                setRuleForm({ ...ruleForm, maintainer: teams.length > 0 ? teams[0] : '' })
              }
              label="Maintainer"
              showLabel
              maxSelections={1}
              placeholder="No maintainer selected"
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel
                id="model-rule-parent-lbl"
                sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}
              >
                Parent rule (same model)
              </InputLabel>
              <Select
                labelId="model-rule-parent-lbl"
                label="Parent rule (same model)"
                value={ruleForm.parentRuleId || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, parentRuleId: e.target.value })}
                sx={{
                  color: currentTheme?.text,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme?.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentTheme?.primary },
                  '& .MuiSvgIcon-root': { color: currentTheme?.textSecondary },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme?.card,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>None (top-level)</em>
                </MenuItem>
                {rules
                  .filter((r) => !editingRule || r.id !== editingRule.id)
                  .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
                  .map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                Rule Type
              </InputLabel>
              <Select
                value={normalizeRuleType(ruleForm.ruleType)}
                onChange={(e) => setRuleForm({ ...ruleForm, ruleType: e.target.value })}
                label="Rule Type"
                sx={{
                  color: currentTheme?.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '& .MuiSvgIcon-root': {
                    color: currentTheme?.textSecondary
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme?.card,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                      '& .MuiMenuItem-root': {
                        color: currentTheme?.text,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }
                    }
                  }
                }}
              >
                {RULE_TYPE_OPTIONS.map(({ value, label }) => {
                  const tc = getRuleTypeColor(value);
                  return (
                    <MenuItem key={value} value={value} sx={{ color: tc.color }}>
                      {label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                Stage
              </InputLabel>
              <Select
                value={normalizeRuleStage(ruleForm.stage)}
                onChange={(e) => setRuleForm({ ...ruleForm, stage: e.target.value })}
                label="Stage"
                sx={{
                  color: currentTheme?.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '& .MuiSvgIcon-root': {
                    color: currentTheme?.textSecondary
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme?.card,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                      '& .MuiMenuItem-root': {
                        color: currentTheme?.text,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }
                    }
                  }
                }}
              >
                {RULE_STAGE_OPTIONS.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: currentTheme?.textSecondary, '&.Mui-focused': { color: currentTheme?.primary } }}>
                Rule zone
              </InputLabel>
              <Select
                value={normalizeRuleZone(ruleForm.ruleZone)}
                onChange={(e) => setRuleForm({ ...ruleForm, ruleZone: e.target.value })}
                label="Rule zone"
                sx={{
                  color: currentTheme?.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.border
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme?.primary
                  },
                  '& .MuiSvgIcon-root': {
                    color: currentTheme?.textSecondary
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: currentTheme?.card,
                      color: currentTheme?.text,
                      border: `1px solid ${currentTheme?.border}`,
                      '& .MuiMenuItem-root': {
                        color: currentTheme?.text,
                        '&:hover': {
                          bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }
                    }
                  }
                }}
              >
                {RULE_ZONE_OPTIONS.map(({ value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              freeSolo
              options={tagSuggestions}
              value={ruleForm.tags}
              onChange={(event, newValue) => {
                const normalized = normalizeTagList(
                  newValue.map((x) => (typeof x === 'string' ? x : String(x)))
                );
                setRuleForm({ ...ruleForm, tags: normalized });
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
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 135, 180, 0.1)',
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
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      color: currentTheme?.text,
                      '& fieldset': {
                        borderColor: currentTheme?.border
                      },
                      '&:hover fieldset': {
                        borderColor: currentTheme?.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: currentTheme?.primary
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: currentTheme?.textSecondary,
                      '&.Mui-focused': {
                        color: currentTheme?.primary
                      }
                    },
                    '& .MuiFormHelperText-root': {
                      color: currentTheme?.textSecondary
                    }
                  }}
                />
              )}
              sx={{
                mb: 0,
                '& .MuiAutocomplete-popupIndicator': {
                  color: currentTheme?.textSecondary
                },
                '& .MuiAutocomplete-clearIndicator': {
                  color: currentTheme?.textSecondary
                }
              }}
              PaperComponent={({ children, ...other }) => (
                <Paper {...other} elevation={0} sx={{ bgcolor: currentTheme?.card, border: `1px solid ${currentTheme?.border}` }}>
                  {children}
                </Paper>
              )}
            />

            {/* Enabled Switch */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Switch
                checked={ruleForm.enabled}
                onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: currentTheme?.primary
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: currentTheme?.primary
                  }
                }}
              />
              <Typography variant="body2" sx={{ color: currentTheme?.text }}>
                Enabled
              </Typography>
            </Box>
          </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${currentTheme?.border}`, p: 2 }}>
          <Button
            onClick={closeRuleDialog}
            sx={{ color: currentTheme?.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveRule}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || (!showParentOnlyDialog && !ruleForm.name?.trim())}
            sx={{ 
              bgcolor: currentTheme?.primary,
              color: '#fff',
              '&:hover': {
                bgcolor: currentTheme?.primary,
                opacity: 0.9
              },
              '&:disabled': {
                bgcolor: currentTheme?.textSecondary,
                color: currentTheme?.text
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={libraryAttachOpen}
        onClose={() => {
          if (!libraryLoading) {
            setLibraryAttachOpen(false);
            setCatalogAssocLineageIds(new Set());
          }
        }}
        maxWidth="lg"
        fullWidth
        disableEnforceFocus
        disableAutoFocus
        disableScrollLock
        PaperProps={{
          sx: {
            bgcolor: currentTheme?.card,
            color: currentTheme?.text,
            border: `1px solid ${currentTheme?.border}`,
            maxHeight: 'calc(100vh - 64px)',
          },
        }}
      >
        <DialogTitle sx={{ color: currentTheme?.text, borderBottom: `1px solid ${currentTheme?.border}` }}>
          Associate to model
        </DialogTitle>
        <DialogContent sx={{ color: currentTheme?.text, pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, fontFamily: fontStackSans }}>
            Same catalog as <strong>Data Quality Rules</strong>, one row per rule (copies on different models are merged).
            Models that already have this rule show as chips. Check any rules not yet on{' '}
            <strong>{selectedModel?.name || 'this model'}</strong>, then <strong>Associate</strong> (you can select
            several).
          </Typography>
          {!libraryLoading &&
          catalogLineageEntries.length > 0 &&
          !catalogLineageEntries.some((e) => catalogEntryCanAssociate(e)) ? (
            <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, bgcolor: darkMode ? 'rgba(255,193,7,0.08)' : 'rgba(255,152,0,0.12)', borderRadius: 1, p: 1.5 }}>
              Every rule in the catalog is already represented on this model (same lineage). Nothing left to associate.
            </Typography>
          ) : null}
          <TextField
            fullWidth
            size="small"
            placeholder="Search name, model, tags…"
            value={masterListSearch}
            onChange={(e) => setMasterListSearch(e.target.value)}
            disabled={libraryLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: currentTheme?.textSecondary, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: currentTheme?.card,
                color: currentTheme?.text,
                '& fieldset': { borderColor: currentTheme?.border },
              },
            }}
          />
          {libraryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : libraryMasterRows.length === 0 ? (
            <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
              No rules in catalog.
            </Typography>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: `1px solid ${currentTheme?.border}`,
                maxHeight: 'min(420px, 50vh)',
                bgcolor: darkMode ? 'rgba(255,255,255,0.02)' : currentTheme?.card,
              }}
            >
              <Table size="small" stickyHeader sx={{ '& td': { fontFamily: fontStackSans } }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      padding="checkbox"
                      sx={{ color: currentTheme?.textSecondary, fontWeight: 600, bgcolor: currentTheme?.card }}
                    >
                      On model
                    </TableCell>
                    <TableCell sx={{ color: currentTheme?.textSecondary, fontWeight: 600, bgcolor: currentTheme?.card }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ color: currentTheme?.textSecondary, fontWeight: 600, bgcolor: currentTheme?.card }}>
                      Present on
                    </TableCell>
                    <TableCell sx={{ color: currentTheme?.textSecondary, fontWeight: 600, bgcolor: currentTheme?.card }}>
                      Rule ID
                    </TableCell>
                    <TableCell sx={{ color: currentTheme?.textSecondary, fontWeight: 600, bgcolor: currentTheme?.card }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ color: currentTheme?.textSecondary, fontWeight: 600, bgcolor: currentTheme?.card }} align="center">
                      On
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {catalogEntriesFilteredSorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ color: currentTheme?.textSecondary, textAlign: 'center', py: 4 }}>
                        No rules match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    catalogEntriesFilteredSorted.map((entry) => {
                      const rule = entry.representative;
                      const canAssoc = catalogEntryCanAssociate(entry);
                      const isOnCurrentModel = !canAssoc;
                      const lidKey = String(entry.lineageId);
                      const selectedForAdd = catalogAssocLineageIds.has(lidKey);
                      const checkboxChecked = isOnCurrentModel || selectedForAdd;
                      return (
                        <TableRow
                          key={entry.lineageId}
                          hover
                          selected={selectedForAdd && canAssoc}
                          onClick={() => {
                            if (canAssoc) {
                              setCatalogAssocLineageIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(lidKey)) next.delete(lidKey);
                                else next.add(lidKey);
                                return next;
                              });
                            }
                          }}
                          sx={{
                            cursor: canAssoc ? 'pointer' : 'default',
                            ...(canAssoc && selectedForAdd
                              ? {
                                  bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(11, 135, 180, 0.08)',
                                }
                              : {}),
                          }}
                        >
                          <TableCell
                            padding="checkbox"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              size="small"
                              checked={checkboxChecked}
                              onChange={(e) => {
                                const nextChecked = e.target.checked;
                                if (isOnCurrentModel && !nextChecked) {
                                  const orderedRuleIds = orderRuleIdsToDeleteForLineage(rules, entry.lineageId);
                                  if (!orderedRuleIds.length) {
                                    setSnackbar({
                                      open: true,
                                      message: 'Could not find this rule on the model to remove.',
                                      severity: 'warning',
                                    });
                                    return;
                                  }
                                  setDissociateDialog({
                                    ruleName: rule.name || 'this rule',
                                    orderedRuleIds,
                                  });
                                  return;
                                }
                                if (!isOnCurrentModel) {
                                  setCatalogAssocLineageIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(lidKey)) next.delete(lidKey);
                                    else next.add(lidKey);
                                    return next;
                                  });
                                }
                              }}
                              inputProps={{
                                'aria-label': isOnCurrentModel
                                  ? `Associated with this model — uncheck to remove: ${rule.name}`
                                  : selectedForAdd
                                    ? `Selected to associate: ${rule.name}`
                                    : `Not on this model — select to associate: ${rule.name}`,
                              }}
                              sx={{ color: currentTheme?.primary, p: 0.5 }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: currentTheme?.text, fontWeight: 600 }}>{rule.name}</TableCell>
                          <TableCell sx={{ maxWidth: 280 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                              {entry.modelsWithLineage.map((m) => {
                                const ref = modelApiRef(selectedModel);
                                const onCurrent =
                                  Boolean(selectedModel) &&
                                  (m === selectedModel.shortName || (ref && m === ref));
                                return (
                                  <Chip
                                    key={m}
                                    size="small"
                                    label={m}
                                    sx={{ fontFamily: fontStackSans }}
                                    color={onCurrent ? 'primary' : 'default'}
                                    variant="filled"
                                  />
                                );
                              })}
                              {entry.modelsWithLineage.length === 0 ? (
                                <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                                  —
                                </Typography>
                              ) : null}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            {rule.id ? (
                              <Typography
                                variant="body2"
                                component="span"
                                title={String(rule.id)}
                                sx={{
                                  fontFamily:
                                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  fontSize: '0.75rem',
                                  color: currentTheme?.textSecondary,
                                  wordBreak: 'break-all',
                                  display: 'block',
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
                          <TableCell sx={{ color: currentTheme?.textSecondary }}>{rule.ruleType || '—'}</TableCell>
                          <TableCell align="center">
                            {rule.enabled !== false ? (
                              <Chip size="small" label="Yes" color="success" variant="outlined" />
                            ) : (
                              <Chip size="small" label="No" variant="outlined" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `1px solid ${currentTheme?.border}`,
            p: 2,
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'space-between',
          }}
        >
          <Button
            onClick={() => {
              setLibraryAttachOpen(false);
              setCatalogAssocLineageIds(new Set());
            }}
            disabled={libraryLoading}
            sx={{ color: currentTheme?.textSecondary, textTransform: 'none' }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            disabled={libraryLoading || catalogAssocLineageIds.size === 0}
            onClick={handleBatchAssociateFromCatalog}
            sx={{
              textTransform: 'none',
              color: '#fff',
              bgcolor: currentTheme?.primary,
              '&:hover': {
                color: '#fff',
                bgcolor: currentTheme?.primaryHover || currentTheme?.primary,
              },
              '&:disabled': {
                color: 'rgba(255,255,255,0.72)',
              },
            }}
          >
            {catalogAssocLineageIds.size > 1
              ? `Associate ${catalogAssocLineageIds.size} rules with ${selectedModel?.name || 'model'}`
              : `Associate with ${selectedModel?.name || 'model'}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(dissociateDialog)}
        onClose={() => {
          if (!libraryLoading) setDissociateDialog(null);
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: currentTheme?.card,
            color: currentTheme?.text,
            border: `1px solid ${currentTheme?.border}`,
          },
        }}
      >
        <DialogTitle sx={{ color: currentTheme?.text }}>Remove rule from model?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: currentTheme?.textSecondary }}>
            Remove <strong>{dissociateDialog?.ruleName}</strong> from{' '}
            <strong>{selectedModel?.name || selectedModel?.shortName || 'this model'}</strong>? This deletes the
            model&apos;s copy of the rule. Subrules on this model under that copy are removed first. The library or other
            models are not affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${currentTheme?.border}`, p: 2 }}>
          <Button
            onClick={() => setDissociateDialog(null)}
            disabled={libraryLoading}
            sx={{ color: currentTheme?.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={libraryLoading}
            onClick={handleConfirmDissociateFromCatalog}
            sx={{ textTransform: 'none' }}
          >
            Remove from model
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB (full page only — modal uses absolute FAB on modal pane) */}
      {!inModal && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleCreateRule}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: currentTheme?.primary,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: currentTheme?.primary,
              opacity: 0.9,
            },
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <DeleteModal
        open={Boolean(ruleDeleteTarget)}
        onClose={() => setRuleDeleteTarget(null)}
        onConfirm={confirmDeleteRule}
        confirmMode="simple"
        title="Delete rule"
        itemName={ruleDeleteTarget?.name?.trim() || `Rule ${ruleDeleteTarget?.id ?? ''}`}
        itemType="rule"
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ModelRuleBuilder;

