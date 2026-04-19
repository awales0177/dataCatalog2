import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  alpha,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Cancel as CancelIcon,
  DeleteForever as DeleteForeverIcon,
  FolderSpecial as ToolkitOverviewIcon,
  ChevronRight as ChevronRightIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import DeleteModal from '../components/DeleteModal';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  fetchData,
  updateToolkitComponent,
  createToolkitComponent,
  deleteToolkitComponent,
} from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  findWorkbenchToolkit,
  workbenchEditPath,
  workbenchPath,
} from '../utils/toolkitWorkbench';
import {
  TOOLKIT_EVAL_PRO_OPTIONS,
  TOOLKIT_EVAL_CON_OPTIONS,
  TOOLKIT_LANGUAGE_OPTIONS,
} from '../data/toolkitEvalIcons';
import {
  looksLikeDatabaseToolkitId,
  normalizeEvalLabels,
  normalizeTechnologyStatus,
  technologyToApiPayload,
} from '../utils/toolkitDbPayload';
import {
  mergeMarkdownTabStateFromTech,
  normalizeMarkdownTabId,
} from '../utils/toolkitMarkdownTabs';
import TeamSelector from '../components/TeamSelector';
import { maintainerToTeamSelectorSelection } from '../utils/maintainerTeamSelection';

const TOOLKIT_PANE_ID = '__toolkit__';

function slugifyTabId(title) {
  let base = String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!base) base = 'tab';
  if (!/^[a-z]/.test(base)) base = `t_${base}`;
  return base.slice(0, 63);
}

function uniqueTabId(base, existingIds) {
  const set = new Set(existingIds);
  let id = base;
  let n = 2;
  while (set.has(id)) {
    const suffix = `_${n}`;
    id = `${base.slice(0, Math.max(1, 63 - suffix.length))}${suffix}`;
    n += 1;
  }
  return id;
}

const withTechStatus = (t) => {
  const m = mergeMarkdownTabStateFromTech(t);
  return {
    ...t,
    status: normalizeTechnologyStatus(t?.status),
    languages: Array.isArray(t.languages)
      ? t.languages
      : Array.isArray(t.details?.languages)
        ? [...t.details.languages]
        : [],
    markdownTabs: m.markdownTabs,
  };
};

const EditToolkitPage = () => {
  const { toolkitId } = useParams();
  const navigate = useNavigate();
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const { canEdit } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteToolkitModal, setShowDeleteToolkitModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [canonicalId, setCanonicalId] = useState(null);
  const [editedToolkit, setEditedToolkit] = useState(null);
  const [originalToolkit, setOriginalToolkit] = useState(null);
  const [technologies, setTechnologies] = useState([]);
  const [originalTechnologiesJson, setOriginalTechnologiesJson] = useState('[]');
  const [rightPane, setRightPane] = useState(TOOLKIT_PANE_ID);
  const [tagInput, setTagInput] = useState('');
  const [newMarkdownTabTitle, setNewMarkdownTabTitle] = useState('');
  const [applications, setApplications] = useState([]);

  const isNewToolkit = !toolkitId || toolkitId === 'create';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetchData('applications');
        if (!cancelled) setApplications(response.applications || []);
      } catch (e) {
        console.error('Error loading applications:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canEdit()) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to edit toolkits',
        severity: 'error',
      });
      navigate('/toolkit');
      return;
    }

    const loadData = async () => {
      try {
        if (isNewToolkit) {
          const newToolkit = {
            name: '',
            displayName: '',
            description: '',
            category: '',
            tags: [],
            cardImage: null,
            rankingDisabled: false,
            multipleTechnologies: false,
          };
          setCanonicalId(null);
          setEditedToolkit(newToolkit);
          setOriginalToolkit(JSON.parse(JSON.stringify(newToolkit)));
          const initialTech = {
            id: `tech-${Date.now()}`,
            name: '',
            description: '',
            rank: 1,
            status: 'production',
            maintainerTeamId: '',
            pros: [],
            cons: [],
            languages: [],
            ...mergeMarkdownTabStateFromTech({}),
          };
          setTechnologies([initialTech]);
          setOriginalTechnologiesJson(JSON.stringify([initialTech]));
          setRightPane(initialTech.id);
        } else {
          const data = await fetchData('toolkit');
          const toolkits = data.toolkit?.toolkits || [];
          const resolved = findWorkbenchToolkit(toolkits, toolkitId);
          if (resolved && resolved.canonicalId !== String(toolkitId)) {
            navigate(workbenchEditPath(resolved.canonicalId), { replace: true });
            return;
          }
          const toolkit = resolved?.toolkit ?? null;
          if (!toolkit) {
            setSnackbar({
              open: true,
              message: `Toolkit with ID ${toolkitId} not found`,
              severity: 'error',
            });
            navigate('/toolkit');
            return;
          }

          const cid = resolved.canonicalId;
          setCanonicalId(cid);
          setEditedToolkit(toolkit);
          setOriginalToolkit(JSON.parse(JSON.stringify(toolkit)));
          const merged = [...(toolkit.technologies || [])]
            .map(withTechStatus)
            .sort((a, b) => (a.rank || 0) - (b.rank || 0));
          const singleTechMode = toolkit.multipleTechnologies === false;
          if (singleTechMode) {
            const one = merged.length
              ? [
                  {
                    ...merged[0],
                    name: toolkit.name ?? merged[0].name ?? '',
                    description: toolkit.description ?? merged[0].description ?? '',
                    rank: 1,
                  },
                ]
              : [
                  {
                    id: `tech-${Date.now()}`,
                    name: toolkit.name || '',
                    description: toolkit.description || '',
                    rank: 1,
                    status: 'production',
                    maintainerTeamId: '',
                    pros: [],
                    cons: [],
                    languages: [],
                    ...mergeMarkdownTabStateFromTech({}),
                  },
                ];
            setTechnologies(one);
            setOriginalTechnologiesJson(JSON.stringify(one));
            setRightPane(one[0].id);
          } else {
            setTechnologies(merged);
            setOriginalTechnologiesJson(JSON.stringify(merged));
            if (merged.length > 0) {
              setRightPane(merged[0].id);
            } else {
              setRightPane(TOOLKIT_PANE_ID);
            }
          }
        }
      } catch (error) {
        console.error('Error loading toolkit:', error);
        setSnackbar({ open: true, message: 'Error loading toolkit', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toolkitId, isNewToolkit, navigate, canEdit]);

  const handleFieldChange = (field, value) => {
    setEditedToolkit((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMultipleTechnologiesChange = (checked) => {
    setEditedToolkit((prev) => ({
      ...prev,
      multipleTechnologies: checked ? true : false,
    }));
    if (!checked) {
      setTechnologies((prev) => {
        if (prev.length === 0) {
          const empty = {
            id: `tech-${Date.now()}`,
            name: '',
            description: '',
            rank: 1,
            status: 'production',
            maintainerTeamId: '',
            pros: [],
            cons: [],
            languages: [],
            ...mergeMarkdownTabStateFromTech({}),
          };
          setRightPane(empty.id);
          return [empty];
        }
        const first = [{ ...prev[0], rank: 1 }];
        setRightPane(first[0].id);
        return first;
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !editedToolkit.tags.includes(tagInput.trim())) {
      setEditedToolkit((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedToolkit((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  const toolkitHasChanges =
    JSON.stringify(editedToolkit) !== JSON.stringify(originalToolkit);

  const techListDirty = JSON.stringify(technologies) !== originalTechnologiesJson;
  const hasUnsavedChanges = toolkitHasChanges || techListDirty;

  const isMultiTech = editedToolkit?.multipleTechnologies !== false;

  // Single-technology toolkits: technology name/description always match the toolkit.
  useEffect(() => {
    if (!editedToolkit || isMultiTech) return;
    const name = editedToolkit.name ?? '';
    const description = editedToolkit.description ?? '';
    setTechnologies((prev) => {
      if (!prev[0]) return prev;
      const t = prev[0];
      if (t.name === name && t.description === description) return prev;
      return [{ ...t, name, description }];
    });
  }, [isMultiTech, editedToolkit?.name, editedToolkit?.description]);

  const selectedTech = useMemo(() => {
    if (!isMultiTech) return technologies[0] ?? null;
    return technologies.find((t) => t.id === rightPane);
  }, [technologies, rightPane, isMultiTech]);

  function resolveWorkbenchId() {
    return canonicalId || editedToolkit?.id || toolkitId;
  }

  const updateSelectedTechField = (field, value) => {
    const targetId = isMultiTech ? rightPane : technologies[0]?.id;
    if (!targetId || (isMultiTech && rightPane === TOOLKIT_PANE_ID)) return;
    setTechnologies((prev) =>
      prev.map((t) => (t.id === targetId ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTechnology = () => {
    if (!isMultiTech) return;
    const maxRank = technologies.reduce((m, t) => Math.max(m, t.rank || 0), 0);
    const newTech = {
      id: `tech-${Date.now()}`,
      name: '',
      description: '',
      rank: maxRank + 1,
      status: 'production',
      maintainerTeamId: '',
      pros: [],
      cons: [],
      languages: [],
      ...mergeMarkdownTabStateFromTech({}),
    };
    setTechnologies((prev) => [...prev, newTech]);
    setRightPane(newTech.id);
  };

  const handleRemoveTechnology = (techId, e) => {
    e?.stopPropagation?.();
    if (!isMultiTech) return;
    setTechnologies((prev) => {
      const next = prev.filter((t) => t.id !== techId);
      return next.map((t, i) => ({ ...t, rank: i + 1 }));
    });
    setRightPane((current) => (current === techId ? TOOLKIT_PANE_ID : current));
  };

  const mutateSelectedTech = (fn) => {
    const targetId = isMultiTech ? rightPane : technologies[0]?.id;
    if (!targetId || (isMultiTech && rightPane === TOOLKIT_PANE_ID)) return;
    setTechnologies((prev) =>
      prev.map((t) => (t.id === targetId ? fn(t) : t))
    );
  };

  const toggleProOption = (option) => {
    mutateSelectedTech((t) => {
      const raw = Array.isArray(t.pros) ? [...t.pros] : [];
      const lc = option.label.toLowerCase();
      const has = raw.some((p) => String(p).trim().toLowerCase() === lc);
      if (has) {
        return { ...t, pros: raw.filter((p) => String(p).trim().toLowerCase() !== lc) };
      }
      return { ...t, pros: [...raw, option.label] };
    });
  };

  const toggleConOption = (option) => {
    mutateSelectedTech((t) => {
      const raw = Array.isArray(t.cons) ? [...t.cons] : [];
      const lc = option.label.toLowerCase();
      const has = raw.some((p) => String(p).trim().toLowerCase() === lc);
      if (has) {
        return { ...t, cons: raw.filter((p) => String(p).trim().toLowerCase() !== lc) };
      }
      return { ...t, cons: [...raw, option.label] };
    });
  };

  const isProOptionSelected = (option) => {
    const raw = Array.isArray(selectedTech?.pros) ? selectedTech.pros : [];
    const lc = option.label.toLowerCase();
    return raw.some((p) => String(p).trim().toLowerCase() === lc);
  };

  const isConOptionSelected = (option) => {
    const raw = Array.isArray(selectedTech?.cons) ? selectedTech.cons : [];
    const lc = option.label.toLowerCase();
    return raw.some((p) => String(p).trim().toLowerCase() === lc);
  };

  const toggleLanguageOption = (option) => {
    mutateSelectedTech((t) => {
      const raw = Array.isArray(t.languages) ? [...t.languages] : [];
      const lc = option.label.toLowerCase();
      const has = raw.some((p) => String(p).trim().toLowerCase() === lc);
      if (has) {
        return { ...t, languages: raw.filter((p) => String(p).trim().toLowerCase() !== lc) };
      }
      return { ...t, languages: [...raw, option.label] };
    });
  };

  const isLanguageOptionSelected = (option) => {
    const raw = Array.isArray(selectedTech?.languages) ? selectedTech.languages : [];
    const lc = option.label.toLowerCase();
    return raw.some((p) => String(p).trim().toLowerCase() === lc);
  };

  const updateMarkdownTabTitle = (tabId, title) => {
    mutateSelectedTech((t) => ({
      ...t,
      markdownTabs: (t.markdownTabs || []).map((tab) =>
        tab.id === tabId ? { ...tab, title } : tab,
      ),
    }));
  };

  const removeMarkdownTab = (tabId) => {
    mutateSelectedTech((t) => ({
      ...t,
      markdownTabs: (t.markdownTabs || []).filter((tab) => tab.id !== tabId),
    }));
  };

  const addMarkdownTabFromTitle = () => {
    const title = newMarkdownTabTitle.trim();
    if (!title) return;
    mutateSelectedTech((t) => {
      const existing = (t.markdownTabs || []).map((x) => x.id);
      const base = slugifyTabId(title);
      let id = normalizeMarkdownTabId(base) || `tab_${Date.now()}`;
      id = uniqueTabId(id, existing);
      return {
        ...t,
        markdownTabs: [...(t.markdownTabs || []), { id, title }],
      };
    });
    setNewMarkdownTabTitle('');
  };

  const refetchTechnologiesFromApi = async () => {
    const data = await fetchData('toolkit', { forceRefresh: true });
    const toolkits = data.toolkit?.toolkits || [];
    const resolved = findWorkbenchToolkit(toolkits, canonicalId || toolkitId);
    const toolkit = resolved?.toolkit ?? null;
    const techs = toolkit?.technologies || [];
    const sorted = [...techs].map(withTechStatus).sort((a, b) => (a.rank || 0) - (b.rank || 0));
    const singleOnly = toolkit?.multipleTechnologies === false;
    if (singleOnly) {
      const one = sorted.length ? [{ ...sorted[0], rank: 1 }] : [];
      setTechnologies(one);
      setOriginalTechnologiesJson(JSON.stringify(one));
    } else {
      setTechnologies(sorted);
      setOriginalTechnologiesJson(JSON.stringify(sorted));
    }
  };

  const handleSaveToolkit = async () => {
    if (!editedToolkit.name || !editedToolkit.description) {
      setSnackbar({
        open: true,
        message: 'Name and description are required',
        severity: 'error',
      });
      return;
    }

    if (isNewToolkit) {
      for (const t of technologies) {
        if (!t.name?.trim() || !t.description?.trim()) {
          setSnackbar({
            open: true,
            message: `Each technology needs a name and description (fix “${t.name || t.id || 'untitled'}” or remove it).`,
            severity: 'error',
          });
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (isNewToolkit) {
        const normalizedTechs = technologies.map((t) => ({
          ...t,
          pros: normalizeEvalLabels(t.pros, TOOLKIT_EVAL_PRO_OPTIONS),
          cons: normalizeEvalLabels(t.cons, TOOLKIT_EVAL_CON_OPTIONS),
          languages: normalizeEvalLabels(t.languages, TOOLKIT_LANGUAGE_OPTIONS),
        }));
        const result = await createToolkitComponent({
          type: 'toolkits',
          name: editedToolkit.name,
          displayName: editedToolkit.displayName || editedToolkit.name,
          description: editedToolkit.description,
          category: editedToolkit.category || '',
          tags: Array.isArray(editedToolkit.tags) ? editedToolkit.tags : [],
          technologies: normalizedTechs.map(technologyToApiPayload),
          rankingDisabled: Boolean(editedToolkit.rankingDisabled),
          multipleTechnologies: editedToolkit.multipleTechnologies !== false,
        });
        const newId = result.id;
        setSnackbar({
          open: true,
          message: 'Toolkit created successfully!',
          severity: 'success',
        });
        setSaving(false);
        setTimeout(() => navigate(workbenchPath(newId)), 400);
        return;
      }

      await updateToolkitComponent('toolkits', editedToolkit.id, {
        name: editedToolkit.name,
        displayName: editedToolkit.displayName || editedToolkit.name,
        description: editedToolkit.description,
        category: editedToolkit.category || '',
        tags: Array.isArray(editedToolkit.tags) ? editedToolkit.tags : [],
        cardImage: editedToolkit.cardImage ?? null,
        rankingDisabled: Boolean(editedToolkit.rankingDisabled),
        multipleTechnologies: editedToolkit.multipleTechnologies !== false,
      });
      setOriginalToolkit(JSON.parse(JSON.stringify(editedToolkit)));
      setSnackbar({
        open: true,
        message: 'Toolkit updated successfully!',
        severity: 'success',
      });
      setSaving(false);
      setTimeout(() => {
        navigate(workbenchPath(resolveWorkbenchId()));
      }, 400);
    } catch (error) {
      console.error('Error saving toolkit:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error saving toolkit',
        severity: 'error',
      });
      setSaving(false);
    }
  };

  const handleSaveTechnologies = async () => {
    const cid = canonicalId || editedToolkit?.id;
    if (!cid) return;

    for (const t of technologies) {
      if (!t.name?.trim() || !t.description?.trim()) {
        setSnackbar({
          open: true,
          message: `Name and description are required for every technology (${t.name || t.id || 'untitled'})`,
          severity: 'error',
        });
        return;
      }
    }

    const normalizedTechs = technologies.map((t) => ({
      ...t,
      pros: normalizeEvalLabels(t.pros, TOOLKIT_EVAL_PRO_OPTIONS),
      cons: normalizeEvalLabels(t.cons, TOOLKIT_EVAL_CON_OPTIONS),
      languages: normalizeEvalLabels(t.languages, TOOLKIT_LANGUAGE_OPTIONS),
    }));

    if (!looksLikeDatabaseToolkitId(cid)) {
      setSnackbar({
        open: true,
        message: 'Save the toolkit overview first to obtain a catalog id, then save technologies.',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      await updateToolkitComponent('toolkits', cid, {
        rankingDisabled: Boolean(editedToolkit.rankingDisabled),
        multipleTechnologies: editedToolkit.multipleTechnologies !== false,
        technologies: normalizedTechs.map(technologyToApiPayload),
      });
      await refetchTechnologiesFromApi();
      setSnackbar({
        open: true,
        message:
          normalizedTechs.length > 0
            ? 'Technologies saved to catalog'
            : 'Technologies cleared in catalog',
        severity: 'success',
      });
      setTimeout(() => navigate(workbenchPath(cid)), 400);
    } catch (error) {
      console.error('Error saving technologies:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save technologies',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingleModeCombined = async () => {
    if (!editedToolkit.name || !editedToolkit.description) {
      setSnackbar({
        open: true,
        message: 'Name and description are required',
        severity: 'error',
      });
      return;
    }
    for (const t of technologies) {
      if (!t.name?.trim() || !t.description?.trim()) {
        setSnackbar({
          open: true,
          message: `Technology needs a name and description (${t.name || t.id || 'untitled'})`,
          severity: 'error',
        });
        return;
      }
    }

    if (isNewToolkit) {
      await handleSaveToolkit();
      return;
    }

    const cid = canonicalId || editedToolkit?.id;
    if (!looksLikeDatabaseToolkitId(cid)) {
      setSnackbar({
        open: true,
        message: 'Invalid toolkit id; reload and try again.',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const normalizedTechs = technologies.map((t) => ({
        ...t,
        rank: 1,
        pros: normalizeEvalLabels(t.pros, TOOLKIT_EVAL_PRO_OPTIONS),
        cons: normalizeEvalLabels(t.cons, TOOLKIT_EVAL_CON_OPTIONS),
        languages: normalizeEvalLabels(t.languages, TOOLKIT_LANGUAGE_OPTIONS),
      }));
      await updateToolkitComponent('toolkits', editedToolkit.id, {
        name: editedToolkit.name,
        displayName: editedToolkit.displayName || editedToolkit.name,
        description: editedToolkit.description,
        category: editedToolkit.category || '',
        tags: Array.isArray(editedToolkit.tags) ? editedToolkit.tags : [],
        cardImage: editedToolkit.cardImage ?? null,
        rankingDisabled: Boolean(editedToolkit.rankingDisabled),
        multipleTechnologies: editedToolkit.multipleTechnologies !== false,
        technologies: normalizedTechs.map(technologyToApiPayload),
      });
      setOriginalToolkit(JSON.parse(JSON.stringify(editedToolkit)));
      setOriginalTechnologiesJson(JSON.stringify(technologies));
      setSnackbar({
        open: true,
        message: 'Toolkit saved',
        severity: 'success',
      });
      setTimeout(() => navigate(workbenchPath(resolveWorkbenchId())), 400);
    } catch (error) {
      console.error('Error saving toolkit:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error saving toolkit',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const goToWorkbenchView = () => {
    if (isNewToolkit) {
      navigate('/toolkit');
      return;
    }
    navigate(workbenchPath(resolveWorkbenchId()));
  };

  const handleCancelNavigation = () => {
    if (hasUnsavedChanges) {
      setShowSaveDialog(true);
    } else {
      goToWorkbenchView();
    }
  };

  const handleBack = () => {
    handleCancelNavigation();
  };

  const handleDiscardUnsaved = () => {
    setShowSaveDialog(false);
    goToWorkbenchView();
  };

  const handleDeleteToolkit = () => {
    setShowDeleteToolkitModal(true);
  };

  const confirmDeleteToolkit = async () => {
    const id = canonicalId || editedToolkit?.id;
    if (!id || !looksLikeDatabaseToolkitId(String(id))) {
      setSnackbar({
        open: true,
        message: 'Cannot delete: toolkit has no saved catalog id yet.',
        severity: 'error',
      });
      return;
    }
    setDeleting(true);
    try {
      await deleteToolkitComponent('toolkits', String(id));
      setSnackbar({
        open: true,
        message: `Toolkit "${editedToolkit.displayName || editedToolkit.name}" deleted successfully`,
        severity: 'success',
      });
      setTimeout(() => navigate('/toolkit'), 1200);
    } catch (error) {
      console.error('Error deleting toolkit:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete toolkit',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress sx={{ color: currentTheme.primary }} />
        </Box>
      </Container>
    );
  }

  if (!editedToolkit) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ bgcolor: currentTheme.card, color: currentTheme.text }}>
          Toolkit not found
        </Alert>
      </Container>
    );
  }

  const paperBorder = darkMode ? 'rgba(255, 255, 255, 0.1)' : currentTheme.border;
  const paperBg = darkMode ? '#1E1E1E' : currentTheme.card;

  const renderToolkitPropertiesGrid = () => (
    <>
      <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600 }}>
        Toolkit properties
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name *"
            value={editedToolkit.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            required
            placeholder="e.g., ocr-toolkit"
            sx={textFieldSx(currentTheme)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Display name"
            value={editedToolkit.displayName || ''}
            onChange={(e) => handleFieldChange('displayName', e.target.value)}
            sx={textFieldSx(currentTheme)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description *"
            value={editedToolkit.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            required
            sx={textFieldSx(currentTheme)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
            Card image
          </Typography>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1 }}>
            Shown top-right on the toolkit list card. JPEG/PNG/WebP, max 1.5&nbsp;MB.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" component="label" disabled={saving}>
              {editedToolkit.cardImage ? 'Replace image' : 'Upload image'}
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  const max = 1.5 * 1024 * 1024;
                  if (f.size > max) {
                    setSnackbar({
                      open: true,
                      message: 'Image must be 1.5 MB or smaller.',
                      severity: 'error',
                    });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result;
                    if (typeof dataUrl === 'string') {
                      handleFieldChange('cardImage', dataUrl);
                    }
                  };
                  reader.readAsDataURL(f);
                }}
              />
            </Button>
            {editedToolkit.cardImage ? (
              <>
                <Box
                  component="img"
                  src={editedToolkit.cardImage}
                  alt=""
                  sx={{
                    width: 96,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: `1px solid ${currentTheme.border}`,
                  }}
                />
                <Button variant="text" color="inherit" onClick={() => handleFieldChange('cardImage', null)}>
                  Remove image
                </Button>
              </>
            ) : null}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Category"
            value={editedToolkit.category || ''}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            sx={textFieldSx(currentTheme)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Add tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Enter — press Enter"
            sx={textFieldSx(currentTheme)}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {editedToolkit.tags?.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                sx={{
                  bgcolor: alpha(currentTheme.primary, 0.1),
                  color: currentTheme.primary,
                }}
              />
            ))}
            {(!editedToolkit.tags || editedToolkit.tags.length === 0) && (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                No tags yet
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 1, fontWeight: 600 }}>
            Workbench display
          </Typography>
          <Stack spacing={1} sx={{ pl: 0.5 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(editedToolkit.rankingDisabled)}
                  onChange={(e) => handleFieldChange('rankingDisabled', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ color: currentTheme.text }}>
                    Disable ranking
                  </Typography>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block' }}>
                    Hide rank numbers and reorder controls on the toolkit page.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', ml: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editedToolkit.multipleTechnologies !== false}
                  onChange={(e) => handleMultipleTechnologiesChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ color: currentTheme.text }}>
                    Multiple technologies
                  </Typography>
                  <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block' }}>
                    Off: one form for toolkit and technology. On: list on the left and separate panes.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', ml: 0 }}
            />
          </Stack>
        </Grid>
      </Grid>
    </>
  );

  const renderTechnologyFields = (hideRank) => {
    if (!selectedTech) {
      return (
        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
          Add a technology to continue.
        </Typography>
      );
    }
    return (
      <>
        <Typography variant="subtitle1" sx={{ color: currentTheme.text, fontWeight: 600 }}>
          Technology
        </Typography>
        {!isMultiTech ? (
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            Name and description are the same as the toolkit fields above.
          </Typography>
        ) : (
          <>
            <TextField
              fullWidth
              label="Name *"
              value={selectedTech.name || ''}
              onChange={(e) => updateSelectedTechField('name', e.target.value)}
              sx={textFieldSx(currentTheme)}
            />
            <TextField
              fullWidth
              label="Description *"
              multiline
              rows={4}
              value={selectedTech.description || ''}
              onChange={(e) => updateSelectedTechField('description', e.target.value)}
              sx={textFieldSx(currentTheme)}
            />
          </>
        )}
        {!hideRank ? (
          <TextField
            fullWidth
            type="number"
            label="Rank"
            inputProps={{ min: 1 }}
            value={selectedTech.rank ?? ''}
            onChange={(e) => updateSelectedTechField('rank', parseInt(e.target.value, 10) || 1)}
            sx={textFieldSx(currentTheme)}
          />
        ) : null}
        <FormControl fullWidth sx={textFieldSx(currentTheme)}>
          <InputLabel id="tech-status-label">Status</InputLabel>
          <Select
            labelId="tech-status-label"
            label="Status"
            value={normalizeTechnologyStatus(selectedTech.status)}
            onChange={(e) => updateSelectedTechField('status', e.target.value)}
          >
            <MenuItem value="development">Development</MenuItem>
            <MenuItem value="production">Production</MenuItem>
            <MenuItem value="evaluated">Evaluated</MenuItem>
          </Select>
        </FormControl>
        <TeamSelector
          selectedTeams={maintainerToTeamSelectorSelection(selectedTech.maintainerTeamId, applications)}
          onTeamsChange={(teams) => {
            updateSelectedTechField('maintainerTeamId', teams.length > 0 ? teams[0] : '');
          }}
          currentTheme={currentTheme}
          label="Maintainer"
          showLabel={true}
          maxSelections={1}
          placeholder="No maintainer selected"
        />

        <Box>
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 0.5, fontWeight: 600 }}>
            Pros
          </Typography>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1.5 }}>
            Click an icon to add or remove. Same options as the workbench detail view.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {TOOLKIT_EVAL_PRO_OPTIONS.map((opt) => {
              const selected = isProOptionSelected(opt);
              return (
                <Box
                  key={opt.label}
                  component="button"
                  type="button"
                  onClick={() => toggleProOption(opt)}
                  sx={{
                    width: 100,
                    p: 1,
                    border: '2px solid',
                    borderColor: selected ? currentTheme.primary : currentTheme.border,
                    borderRadius: 2,
                    bgcolor: selected ? alpha(currentTheme.primary, darkMode ? 0.2 : 0.08) : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    color: currentTheme.text,
                    font: 'inherit',
                    transition: 'border-color 0.15s, background-color 0.15s',
                    '&:hover': {
                      borderColor: currentTheme.primary,
                      bgcolor: alpha(currentTheme.primary, darkMode ? 0.12 : 0.06),
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={opt.icon}
                    alt=""
                    sx={{
                      width: opt.size === 'large' ? 40 : 32,
                      height: opt.size === 'large' ? 40 : 32,
                      objectFit: 'contain',
                      filter: opt.invert && darkMode ? 'invert(1)' : 'none',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: 'center',
                      lineHeight: 1.2,
                      fontWeight: selected ? 600 : 400,
                      color: currentTheme.text,
                    }}
                  >
                    {opt.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 0.5, fontWeight: 600 }}>
            Cons
          </Typography>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1.5 }}>
            Click an icon to toggle. Selected cons use the red accent in the workbench.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {TOOLKIT_EVAL_CON_OPTIONS.map((opt) => {
              const selected = isConOptionSelected(opt);
              return (
                <Box
                  key={opt.label}
                  component="button"
                  type="button"
                  onClick={() => toggleConOption(opt)}
                  sx={{
                    width: 100,
                    p: 1,
                    border: '2px solid',
                    borderColor: selected ? '#f44336' : currentTheme.border,
                    borderRadius: 2,
                    bgcolor: selected ? alpha('#f44336', darkMode ? 0.22 : 0.1) : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    color: currentTheme.text,
                    font: 'inherit',
                    transition: 'border-color 0.15s, background-color 0.15s',
                    '&:hover': {
                      borderColor: '#f44336',
                      bgcolor: alpha('#f44336', darkMode ? 0.14 : 0.06),
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={opt.icon}
                    alt=""
                    sx={{
                      width: 36,
                      height: 36,
                      objectFit: 'contain',
                      filter: opt.invert && darkMode ? 'invert(1)' : 'none',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: 'center',
                      lineHeight: 1.2,
                      fontWeight: selected ? 600 : 400,
                      color: currentTheme.text,
                    }}
                  >
                    {opt.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 0.5, fontWeight: 600 }}>
            Languages
          </Typography>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1.5 }}>
            Click an icon to add or remove. Same layout as pros and cons.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {TOOLKIT_LANGUAGE_OPTIONS.map((opt) => {
              const selected = isLanguageOptionSelected(opt);
              return (
                <Box
                  key={opt.label}
                  component="button"
                  type="button"
                  onClick={() => toggleLanguageOption(opt)}
                  sx={{
                    width: 100,
                    p: 1,
                    border: '2px solid',
                    borderColor: selected ? currentTheme.primary : currentTheme.border,
                    borderRadius: 2,
                    bgcolor: selected ? alpha(currentTheme.primary, darkMode ? 0.2 : 0.08) : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    color: currentTheme.text,
                    font: 'inherit',
                    transition: 'border-color 0.15s, background-color 0.15s',
                    '&:hover': {
                      borderColor: currentTheme.primary,
                      bgcolor: alpha(currentTheme.primary, darkMode ? 0.12 : 0.06),
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={opt.icon}
                    alt=""
                    sx={{
                      width: opt.size === 'large' ? 40 : 32,
                      height: opt.size === 'large' ? 40 : 32,
                      objectFit: 'contain',
                      filter: opt.invert && darkMode ? 'invert(1)' : 'none',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: 'center',
                      lineHeight: 1.2,
                      fontWeight: selected ? 600 : 400,
                      color: currentTheme.text,
                    }}
                  >
                    {opt.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: currentTheme.text, mb: 0.5, fontWeight: 600 }}>
            Documentation (markdown) tabs
          </Typography>
          <Typography variant="caption" sx={{ color: currentTheme.textSecondary, display: 'block', mb: 1.5 }}>
            Configure documentation tabs for the workbench. Each tab has a stable id (for URLs) and a display title.
            Content is edited per tab on the workbench. You can add custom tabs or remove any tab, including defaults.
          </Typography>
          <Stack spacing={1.5}>
            {(selectedTech.markdownTabs || []).length === 0 ? (
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, fontStyle: 'italic' }}>
                No tabs — add a tab below to show documentation on the workbench.
              </Typography>
            ) : (
              (selectedTech.markdownTabs || []).map((tab) => (
                <Box key={tab.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    size="small"
                    fullWidth
                    label={`Title (${tab.id})`}
                    placeholder={tab.title || tab.id}
                    value={tab.title ?? ''}
                    onChange={(e) => updateMarkdownTabTitle(tab.id, e.target.value)}
                    sx={textFieldSx(currentTheme)}
                  />
                  <Tooltip title="Remove tab from workbench">
                    <IconButton
                      size="small"
                      aria-label={`Remove ${tab.id} tab`}
                      onClick={() => removeMarkdownTab(tab.id)}
                      sx={{ color: currentTheme.textSecondary, mt: 0.5 }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))
            )}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="New tab title"
                placeholder="e.g. Architecture"
                value={newMarkdownTabTitle}
                onChange={(e) => setNewMarkdownTabTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMarkdownTabFromTitle();
                  }
                }}
                sx={{ ...textFieldSx(currentTheme), flex: '1 1 200px', minWidth: 180 }}
              />
              <Button variant="outlined" size="small" onClick={addMarkdownTabFromTitle} sx={{ mt: 0.5 }}>
                Add tab
              </Button>
            </Box>
          </Stack>
        </Box>
      </>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                color: currentTheme.textSecondary,
                '&:hover': { color: currentTheme.primary },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                {isNewToolkit ? 'Register Tool' : `Edit · ${editedToolkit.displayName || editedToolkit.name || 'Toolkit'}`}
              </Typography>
              <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 0.5 }}>
                {!isMultiTech
                  ? 'Toolkit and technology'
                  : rightPane === TOOLKIT_PANE_ID
                    ? 'Toolkit properties'
                    : selectedTech
                      ? `Technology: ${selectedTech.name || 'Untitled'}`
                      : 'Select an item'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancelNavigation}
              startIcon={<CancelIcon />}
              sx={{ color: currentTheme.text, borderColor: currentTheme.border }}
            >
              Cancel
            </Button>
            {!isNewToolkit && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteToolkit}
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteForeverIcon />}
                sx={{
                  color: 'error.main',
                  borderColor: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'white',
                  },
                }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>

        {!isMultiTech ? (
          <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  bgcolor: paperBg,
                  border: `1px solid ${paperBorder}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  {renderToolkitPropertiesGrid()}
                  <Divider sx={{ borderColor: currentTheme.border }} />
                  {renderTechnologyFields(true)}
                  <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${currentTheme.border}` }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveSingleModeCombined}
                      disabled={saving || (!toolkitHasChanges && !techListDirty)}
                      sx={{
                        bgcolor: currentTheme.primary,
                        color: currentTheme.background,
                        '&:hover': { bgcolor: currentTheme.primaryHover || currentTheme.primary },
                      }}
                    >
                      {saving ? 'Saving…' : isNewToolkit ? 'Register Tool' : 'Save'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        ) : (
        <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Grid
            item
            xs={12}
            md={5}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                bgcolor: paperBg,
                border: `1px solid ${paperBorder}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ p: 2, borderBottom: `1px solid ${currentTheme.border}`, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                      Technologies ({technologies.length})
                    </Typography>
                    <Typography variant="body2" sx={{ color: currentTheme.textSecondary, mt: 0.5 }}>
                      Select a row to edit on the right
                    </Typography>
                  </Box>
                  <Tooltip title="Add technology">
                    <IconButton
                      size="small"
                      onClick={handleAddTechnology}
                      sx={{
                        color: currentTheme.primary,
                        bgcolor: alpha(currentTheme.primary, 0.1),
                        '&:hover': { bgcolor: alpha(currentTheme.primary, 0.2) },
                        border: `1px solid ${alpha(currentTheme.primary, 0.3)}`,
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                <List sx={{ p: 0 }}>
                  <ListItem
                    button
                    selected={rightPane === TOOLKIT_PANE_ID}
                    onClick={() => setRightPane(TOOLKIT_PANE_ID)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      border:
                        rightPane === TOOLKIT_PANE_ID
                          ? `1px solid ${currentTheme.primary}`
                          : '1px solid transparent',
                      bgcolor:
                        rightPane === TOOLKIT_PANE_ID
                          ? alpha(currentTheme.primary, 0.1)
                          : 'transparent',
                      '&:hover': {
                        bgcolor: alpha(currentTheme.primary, 0.05),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <ToolkitOverviewIcon sx={{ color: currentTheme.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ color: currentTheme.text, fontWeight: 600 }}>
                          Toolkit overview
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                          Name, description, tags
                        </Typography>
                      }
                    />
                    <ChevronRightIcon sx={{ color: currentTheme.textSecondary, fontSize: 20 }} />
                  </ListItem>
                  <Divider sx={{ my: 1, borderColor: currentTheme.border }} />
                  {technologies.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: currentTheme.textSecondary, textAlign: 'center', py: 2, px: 1 }}
                    >
                      No technologies yet. Use + to add one.
                    </Typography>
                  ) : (
                    technologies.map((tech) => (
                      <ListItem
                        key={tech.id}
                        button
                        selected={rightPane === tech.id}
                        onClick={() => setRightPane(tech.id)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          border:
                            rightPane === tech.id
                              ? `1px solid ${currentTheme.primary}`
                              : '1px solid transparent',
                          bgcolor:
                            rightPane === tech.id
                              ? alpha(currentTheme.primary, 0.1)
                              : 'transparent',
                          '&:hover': {
                            bgcolor: alpha(currentTheme.primary, 0.05),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box
                            sx={{
                              minWidth: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: currentTheme.primary,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                            }}
                          >
                            {editedToolkit.rankingDisabled
                              ? String(tech.name || '?')
                                  .slice(0, 1)
                                  .toUpperCase()
                              : `#${tech.rank}`}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ color: currentTheme.text, fontWeight: 500 }}>
                              {tech.name || 'Untitled technology'}
                            </Typography>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              sx={{
                                color: currentTheme.textSecondary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {tech.description || '—'}
                            </Typography>
                          }
                        />
                        <Tooltip title="Remove technology">
                          <IconButton
                            size="small"
                            aria-label={`Remove ${tech.name || 'technology'}`}
                            onClick={(e) => handleRemoveTechnology(tech.id, e)}
                            sx={{
                              color: currentTheme.textSecondary,
                              flexShrink: 0,
                              '&:hover': { color: 'error.main', bgcolor: alpha('#f44336', 0.08) },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>
            </Paper>
          </Grid>

          <Grid
            item
            xs={12}
            md={7}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 'auto', md: 480 },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                bgcolor: paperBg,
                border: `1px solid ${paperBorder}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
              }}
            >
              {rightPane === TOOLKIT_PANE_ID ? (
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  {renderToolkitPropertiesGrid()}
                  <Box sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${currentTheme.border}` }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveToolkit}
                      disabled={saving || !toolkitHasChanges}
                      sx={{
                        bgcolor: currentTheme.primary,
                        color: currentTheme.background,
                        '&:hover': { bgcolor: currentTheme.primaryHover || currentTheme.primary },
                      }}
                    >
                      {saving ? 'Saving…' : isNewToolkit ? 'Register Tool' : 'Save toolkit'}
                    </Button>
                  </Box>
                </Box>
              ) : selectedTech ? (
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  {renderTechnologyFields(false)}
                  <Box sx={{ pt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveTechnologies}
                      disabled={!techListDirty || saving || isNewToolkit}
                      sx={{
                        bgcolor: currentTheme.primary,
                        color: currentTheme.background,
                        '&:hover': { bgcolor: currentTheme.primaryHover || currentTheme.primary },
                      }}
                    >
                      Save technologies
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
                    Select an item from the left.
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
        )}
      </Box>

      <Dialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: currentTheme.card,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
          },
        }}
      >
        <DialogTitle sx={{ color: currentTheme.text }}>Unsaved changes</DialogTitle>
        <DialogContent sx={{ color: currentTheme.text }}>
          <Typography sx={{ color: currentTheme.text }}>
            You have unsaved changes. Are you sure you want to discard them?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)} sx={{ color: currentTheme.text }}>
            Continue editing
          </Button>
          <Button onClick={handleDiscardUnsaved} color="error">
            Discard changes
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteModal
        open={showDeleteToolkitModal}
        onClose={() => setShowDeleteToolkitModal(false)}
        onConfirm={confirmDeleteToolkit}
        title="Delete toolkit"
        itemName={editedToolkit.displayName || editedToolkit.name || 'toolkit'}
        itemType="toolkit"
        theme={currentTheme}
      >
        <Typography sx={{ mb: 2 }}>This will:</Typography>
        <Box component="ul" sx={{ pl: 2, mb: 0 }}>
          <Typography component="li">
            Permanently delete this workbench and all its technologies
          </Typography>
          <Typography component="li">Remove associated documentation stored in the catalog</Typography>
        </Box>
      </DeleteModal>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', bgcolor: currentTheme.card, color: currentTheme.text }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

function textFieldSx(currentTheme) {
  return {
    '& .MuiOutlinedInput-root': {
      color: currentTheme.text,
      '& fieldset': { borderColor: currentTheme.border },
      '&:hover fieldset': { borderColor: currentTheme.primary },
      '&.Mui-focused fieldset': { borderColor: currentTheme.primary },
    },
    '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
  };
}

export default EditToolkitPage;
