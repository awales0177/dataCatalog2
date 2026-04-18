import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../../contexts/ThemeContext';

const LOCKED_DOMAIN_NAMES = ['Tax'];

const FolderLogo = ({ expanded, theme }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={expanded ? (theme?.primary || '#0891b2') : '#ff9500'} strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

/** Middle tier: dataset (same cylinder glyph as former “database”) */
const DatabaseLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 7C20 9.20914 16.4183 11 12 11C7.58172 11 4 9.20914 4 7C4 4.79086 7.58172 3 12 3C16.4183 3 20 4.79086 20 7Z" stroke="#55ce22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 12C20 14.2091 16.4183 16 12 16C7.58172 16 4 14.2091 4 12" stroke="#55ce22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 7V17C4 19.2091 7.58172 21 12 21C16.4183 21 20 19.2091 20 17V7" stroke="#55ce22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TableLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9.5H21M3 14.5H21M8 4.5V19.5M6.2 19.5H17.8C18.9201 19.5 19.4802 19.5 19.908 19.282C20.2843 19.0903 20.5903 18.7843 20.782 18.408C21 17.9802 21 17.4201 21 16.3V7.7C21 6.5799 21 6.01984 20.782 5.59202C20.5903 5.21569 20.2843 4.90973 19.908 4.71799C19.4802 4.5 18.9201 4.5 17.8 4.5H6.2C5.0799 4.5 4.51984 4.5 4.09202 4.71799C3.71569 4.90973 3.40973 5.21569 3.21799 5.59202C3 6.01984 3 6.57989 3 7.7V16.3C3 17.4201 3 17.9802 3.21799 18.408C3.40973 18.7843 3.71569 19.0903 4.09202 19.282C4.51984 19.5 5.07989 19.5 6.2 19.5Z" stroke="#7c3c7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function modelMatchesDataset(model, row) {
  const mid = String(model.shortName || model.id || '').toUpperCase();
  const ms = String(row.modelShortName || '').toUpperCase();
  if (ms && ms === mid) return true;
  if (row.modelId != null && String(row.modelId) === String(model.id)) return true;
  return false;
}

function isModelTaxLocked(model) {
  const tags = model.domain || [];
  return tags.some((d) =>
    LOCKED_DOMAIN_NAMES.some((ln) => String(ln).toLowerCase() === String(d).toLowerCase())
  );
}

export function buildModelDatasetTree(modelsResponse, datasetsPayload) {
  let models = Array.isArray(modelsResponse) ? modelsResponse : modelsResponse?.models || [];
  const rawList = Array.isArray(datasetsPayload) ? datasetsPayload : datasetsPayload?.datasets || [];

  if (!models.length && rawList.length) {
    const seen = new Set();
    const fallback = [];
    for (const d of rawList) {
      const sn = String(d.modelShortName || '').trim();
      if (!sn || seen.has(sn.toUpperCase())) continue;
      seen.add(sn.toUpperCase());
      fallback.push({
        id: sn,
        shortName: sn,
        name: sn,
        domain: [],
      });
    }
    models = fallback;
  }

  return models.map((model) => {
    const mid = String(model.shortName || model.id || '');
    const modelDatasets = rawList.filter((row) => modelMatchesDataset(model, row));
    const datasets =
      modelDatasets.length > 0
        ? modelDatasets.map((ds) => {
            const sqlSchema = ds.sqlSchema || String(ds.id || '').replace(/-/g, '_');
            const tbls = Array.isArray(ds.tables) ? ds.tables : [];
            return {
              id: ds.id,
              name: ds.name || ds.id,
              sqlSchema,
              tables:
                tbls.length > 0
                  ? tbls.map((t) => ({
                      id: t.id || t.name,
                      name: t.name || t.id,
                      description: t.description,
                    }))
                  : [{ id: '_placeholder', name: '(No tables)', description: null }],
            };
          })
        : [
            {
              id: `${mid || 'model'}-no-datasets`,
              name: '(No datasets)',
              sqlSchema: 'placeholder',
              tables: [{ id: '_placeholder', name: '(No tables)', description: null }],
            },
          ];

    return {
      id: mid || String(model.id),
      name: model.name || model.shortName || mid,
      shortName: model.shortName || mid,
      domainTags: model.domain || [],
      isLocked: isModelTaxLocked(model),
      datasets,
    };
  });
}

const datasetExpandKey = (modelId, datasetId) => `${modelId}::${datasetId}`;

const AgoraExplorerTree = ({
  modelsResponse,
  datasetsPayload,
  loading,
  onSelectTable,
  selectedTableKey,
  currentTheme,
  darkMode,
}) => {
  const { currentTheme: contextTheme } = useContext(ThemeContext);
  const theme = currentTheme || contextTheme;
  const tree = buildModelDatasetTree(modelsResponse, datasetsPayload);
  const [expandedModels, setExpandedModels] = useState({});
  const [expandedDatasets, setExpandedDatasets] = useState({});

  const treeLength = tree.length;
  const firstModelId = tree[0]?.id;
  const firstDatasetId = tree[0]?.datasets?.[0]?.id;
  useEffect(() => {
    if (treeLength === 0 || !firstModelId) return;
    setExpandedModels((prev) => (Object.keys(prev).length === 0 ? { [firstModelId]: true } : prev));
    const dk = firstDatasetId ? datasetExpandKey(firstModelId, firstDatasetId) : null;
    setExpandedDatasets((prev) =>
      dk && Object.keys(prev).length === 0 ? { [dk]: true } : prev
    );
  }, [treeLength, firstModelId, firstDatasetId]);

  const toggleModel = (id) => {
    setExpandedModels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDataset = (modelId, datasetId) => {
    const k = datasetExpandKey(modelId, datasetId);
    setExpandedDatasets((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const handleTableClick = (table, modelShortName, sqlSchema, isLocked) => {
    if (table.id === '_placeholder' || sqlSchema === 'placeholder') return;
    onSelectTable?.({ table, domainName: modelShortName, dbName: sqlSchema, isLocked });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={24} sx={{ color: theme?.primary || '#0891b2' }} />
      </Box>
    );
  }

  if (!tree.length) {
    return (
      <Typography variant="body2" sx={{ color: theme?.textSecondary, p: 2 }}>
        No models loaded.
      </Typography>
    );
  }

  return (
    <List dense sx={{ py: 0 }}>
      {tree.map((model) => {
        const modelExpanded = expandedModels[model.id];
        const isLocked = model.isLocked;
        return (
          <React.Fragment key={model.id}>
            <ListItemButton
              onClick={() => toggleModel(model.id)}
              sx={{
                py: 0.5,
                color: theme?.text,
                '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {modelExpanded ? (
                  <ExpandMoreIcon fontSize="small" sx={{ color: theme?.textSecondary }} />
                ) : (
                  <ChevronRightIcon fontSize="small" sx={{ color: theme?.textSecondary }} />
                )}
              </ListItemIcon>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <FolderLogo expanded={modelExpanded} theme={theme} />
              </ListItemIcon>
              <ListItemText primary={model.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
            </ListItemButton>
            <Collapse in={modelExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 2 }}>
                {model.datasets.map((ds) => {
                  const dk = datasetExpandKey(model.id, ds.id);
                  const dsExpanded = expandedDatasets[dk];
                  return (
                    <React.Fragment key={ds.id}>
                      <ListItemButton
                        onClick={() => toggleDataset(model.id, ds.id)}
                        sx={{
                          py: 0.5,
                          color: isLocked ? theme?.textSecondary : theme?.text,
                          opacity: isLocked ? 0.85 : 1,
                          '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {dsExpanded ? (
                            <ExpandMoreIcon fontSize="small" sx={{ color: theme?.textSecondary }} />
                          ) : (
                            <ChevronRightIcon fontSize="small" sx={{ color: theme?.textSecondary }} />
                          )}
                        </ListItemIcon>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <DatabaseLogo />
                        </ListItemIcon>
                        <ListItemText primary={ds.name} primaryTypographyProps={{ variant: 'body2' }} />
                        {isLocked && (
                          <Tooltip title="No access">
                            <Box component="span" sx={{ display: 'inline-flex', ml: 0.5 }}>
                              <LockIcon sx={{ color: '#ef4444', fontSize: 14 }} />
                            </Box>
                          </Tooltip>
                        )}
                      </ListItemButton>
                      <Collapse in={dsExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 2 }}>
                          {ds.tables.map((table) => {
                            const modelKey = model.shortName || model.id;
                            const rowKey = `${modelKey}-${ds.sqlSchema}-${table.id}`;
                            return (
                              <ListItemButton
                                key={table.id}
                                selected={selectedTableKey === rowKey}
                                onClick={() => handleTableClick(table, modelKey, ds.sqlSchema, isLocked)}
                                sx={{
                                  py: 0.5,
                                  color: theme?.textSecondary,
                                  '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                                  '&.Mui-selected': {
                                    bgcolor: theme?.primary ? `${theme.primary}20` : 'rgba(25, 118, 210, 0.12)',
                                    color: theme?.primary,
                                  },
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 32 }} />
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <TableLogo />
                                </ListItemIcon>
                                <ListItemText primary={table.name} primaryTypographyProps={{ variant: 'body2' }} />
                                {isLocked && (
                                  <Tooltip title="No access">
                                    <Box component="span" sx={{ display: 'inline-flex', ml: 0.5 }}>
                                      <LockIcon sx={{ color: '#ef4444', fontSize: 14 }} />
                                    </Box>
                                  </Tooltip>
                                )}
                              </ListItemButton>
                            );
                          })}
                        </List>
                      </Collapse>
                    </React.Fragment>
                  );
                })}
              </List>
            </Collapse>
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default AgoraExplorerTree;
