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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { getAllModelRules, createRule } from '../services/api';
import { ruleTagsList, normalizeTagList } from '../utils/ruleTags';
import { fontStackSans } from '../theme/theme';

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

  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [libraryForm, setLibraryForm] = useState({
    name: '',
    description: '',
    documentation: '',
    ruleType: 'validation',
    enabled: true,
    tags: [],
  });

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
      if (r.description?.toLowerCase().includes(q)) return true;
      if (r.ruleType?.toLowerCase().includes(q)) return true;
      if (entry.modelsWithLineage.some((m) => m.toLowerCase().includes(q))) return true;
      if (entry.hasLibrary && 'library'.includes(q)) return true;
      return ruleTagsList(r).some((t) => t.toLowerCase().includes(q));
    });
  }, [lineageRows, search]);

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
        ruleType: normalizeRuleType(libraryForm.ruleType),
        enabled: libraryForm.enabled,
        tags: normalizeTagList(libraryForm.tags),
      });
      setSnackbar({ open: true, message: 'Library rule created', severity: 'success' });
      setLibraryDialogOpen(false);
      setLibraryForm({
        name: '',
        description: '',
        documentation: '',
        ruleType: 'validation',
        enabled: true,
        tags: [],
      });
      load();
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Create failed', severity: 'error' });
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
          Data Rules
        </Typography>
        <Typography variant="body1" sx={{ color: currentTheme?.textSecondary, maxWidth: 720 }}>
          Library rules are not tied to a model. Use the workbench <strong>Rule Builder</strong> (Workspaces) to copy
          rules onto a model. Edit model-scoped rules in Rule Builder or on the model&apos;s Quality Rules tab.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search name, model, tags…"
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
              minWidth: 560,
              '& td': { fontFamily: fontStackSans, verticalAlign: 'middle' },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Name</TableCell>
                <TableCell sx={{ ...headCellSx, minWidth: 200, maxWidth: 360 }}>Model</TableCell>
                <TableCell sx={{ ...headCellSx, width: 140 }}>Type</TableCell>
                <TableCell sx={{ ...headCellSx, width: 88 }} align="center">
                  On
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: currentTheme?.textSecondary, textAlign: 'center', py: 4 }}>
                    No rules match.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((entry) => {
                  const rule = entry.representative;
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLibraryDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLibrary}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

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
