import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Paper,
  Divider,
  useMediaQuery,
  Button,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close as CloseIcon } from '@mui/icons-material';
import { ThemeContext } from '../../contexts/ThemeContext';
import { fetchModels, fetchCatalogDatasets } from '../../services/api';
import QueryExplorerTree from './QueryExplorerTree';
import QueryEngine from './QueryEngine';

const QueryModal = ({
  open,
  onClose,
  currentTheme,
  darkMode,
  splitMode = false,
  onOpenModeling,
  modelingOpen = false,
}) => {
  const { currentTheme: contextTheme } = useContext(ThemeContext);
  const theme = currentTheme || contextTheme;
  const muiTheme = useTheme();
  const isMdUp = useMediaQuery(muiTheme.breakpoints.up('md'));
  const isSplit = Boolean(splitMode) && isMdUp;
  const [modelsResponse, setModelsResponse] = useState(null);
  const [datasetsList, setDatasetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContext, setSelectedContext] = useState(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setSelectedContext(null);
    Promise.all([
      fetchModels().catch(() => ({})),
      fetchCatalogDatasets().catch(() => []),
    ])
      .then(([models, ds]) => {
        if (!cancelled) {
          setModelsResponse(models);
          setDatasetsList(ds);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open]);

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
          bgcolor: theme?.card || '#fff',
          color: theme?.text,
          overflow: 'hidden',
          ...(isSplit ? { pointerEvents: 'auto' } : undefined),
          ...(isSplit
            ? {
                position: 'fixed',
                m: 0,
                left: 16,
                top: 16,
                right: 'auto',
                width: 'calc((100vw - 40px) / 2)',
                maxWidth: 'none',
                height: 'calc(100vh - 32px)',
                maxHeight: 'calc(100vh - 32px)',
                minHeight: 400,
                borderRadius: '12px 0 0 12px',
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
              }),
        },
      }}
      BackdropProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.5)',
        },
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
            borderBottom: `1px solid ${theme?.border || '#e0e0e0'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box component="img" src="/trino.png" alt="Trino" sx={{ height: 48, width: 'auto' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
            {onOpenModeling && !modelingOpen && (
              <Tooltip title="Open Data modeling side-by-side on wide screens">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onOpenModeling}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme?.primary,
                    color: theme?.primary,
                    whiteSpace: 'nowrap',
                    px: 1.25,
                    '&:hover': {
                      borderColor: theme?.primary,
                      bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(8, 145, 178, 0.08)',
                    },
                  }}
                >
                  Data modeling
                </Button>
              </Tooltip>
            )}
            <Tooltip title={isSplit ? 'Close query engine (other pane stays open)' : 'Close'}>
              <IconButton
                onClick={onClose}
                aria-label="Close query engine"
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
              width: 280,
              minWidth: 280,
              borderRight: `1px solid ${theme?.border || '#e0e0e0'}`,
              borderRadius: 0,
              overflow: 'auto',
              bgcolor: theme?.cardBackground || (darkMode ? 'rgba(0,0,0,0.2)' : 'grey.50'),
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, color: theme?.textSecondary, fontWeight: 600 }}>
              Model → Datasets → Tables
            </Typography>
            <Divider sx={{ borderColor: theme?.border }} />
            <QueryExplorerTree
              modelsResponse={modelsResponse}
              datasetsPayload={datasetsList}
              loading={loading}
              onSelectTable={setSelectedContext}
              selectedTableKey={selectedContext ? `${selectedContext.domainName}-${selectedContext.dbName}-${selectedContext.table?.id}` : null}
              currentTheme={theme}
              darkMode={darkMode}
            />
          </Paper>
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {selectedContext?.table?.id && selectedContext.table.id !== '_placeholder' ? (
              <QueryEngine
                selectedContext={selectedContext}
                currentTheme={theme}
                darkMode={darkMode}
              />
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: 520,
                  mx: 'auto',
                  textAlign: 'center',
                  mt: -10,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Box component="img" src="/trino.png" alt="Trino" sx={{ height: 80, width: 'auto' }} />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme?.textSecondary,
                    lineHeight: 1.6,
                    mb: 2,
                  }}
                >
                  The query workbench is your unified data query experience. Pick a model, dataset, and table from the sidebar, then write SQL or ask questions in natural language to query your data. Results are returned in the catalog so you can inspect, share, and govern access.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme?.textSecondary,
                    opacity: 0.9,
                  }}
                >
                  Select a table from the tree to start querying.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default QueryModal;
