import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Typography,
  Tooltip,
  Button,
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { ThemeContext } from '../../contexts/ThemeContext';
import { fetchModels } from '../../services/api';
import ModelRuleBuilder from '../../components/ModelRuleBuilder';
import { fontStackSans } from '../../theme/theme';
import { RULE_BUILDER_MODEL_SHORT_NAME_KEY } from '../../constants/workbenchPaths';

const RuleBuilderModal = ({ open, onClose, currentTheme, darkMode }) => {
  const location = useLocation();
  const { currentTheme: contextTheme } = useContext(ThemeContext);
  const theme = currentTheme || contextTheme;

  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState('');

  const presetModelShort = location.state?.[RULE_BUILDER_MODEL_SHORT_NAME_KEY];

  useEffect(() => {
    if (!open) {
      setSelectedModel(null);
      setPickerOpen(false);
      setPickerValue('');
      return;
    }
    setSelectedModel(null);
    setPickerValue('');
    setPickerOpen(!presetModelShort);
    let cancelled = false;
    setModelsLoading(true);
    fetchModels()
      .then((data) => {
        if (!cancelled) setModels(data?.models || []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, presetModelShort]);

  useEffect(() => {
    if (!open || modelsLoading || !models.length) return;
    const sn = presetModelShort;
    if (!sn || typeof sn !== 'string' || !String(sn).trim()) return;
    const needle = String(sn).trim().toLowerCase();
    const m = models.find((x) => String(x.shortName || '').trim().toLowerCase() === needle);
    if (m) {
      setSelectedModel(m);
      setPickerOpen(false);
    } else {
      setPickerOpen(true);
    }
  }, [open, models, modelsLoading, presetModelShort]);

  const sortedModels = [...models].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
  );

  const handleConfirmModel = () => {
    if (!pickerValue) return;
    const m = models.find((x) => String(x.id) === String(pickerValue));
    if (m) {
      setSelectedModel(m);
      setPickerOpen(false);
      setPickerValue('');
    }
  };

  const handlePickerClose = () => {
    setPickerOpen(false);
    onClose();
  };

  const handleBackFromEditor = () => {
    setSelectedModel(null);
    setPickerOpen(true);
    setPickerValue('');
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
            bgcolor: theme?.card || '#fff',
            color: theme?.text,
            overflow: 'hidden',
            m: 2,
            height: 'calc(100vh - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            width: 'calc(100% - 32px)',
            minHeight: 560,
            borderRadius: 2,
            ...(darkMode
              ? {
                  bgcolor: theme?.card || '#1e1e22',
                  border: '1px solid rgba(255,255,255,0.1)',
                }
              : {}),
          },
        }}
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.5)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme?.border || '#e0e0e0'}`,
              ...(darkMode ? { borderBottomColor: 'rgba(255,255,255,0.1)' } : {}),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <Box
                component="img"
                src="/builder.svg"
                alt=""
                sx={{ height: 40, width: 40, flexShrink: 0, opacity: darkMode ? 0.95 : 1 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: theme?.text, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Rule Builder
                </Typography>
                {selectedModel ? (
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ color: theme?.textSecondary, fontFamily: fontStackSans, mt: 0.25 }}
                  >
                    {selectedModel.name} · {selectedModel.shortName}
                  </Typography>
                ) : null}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 'auto' }}>
              <Tooltip title="Close">
                <IconButton
                  onClick={onClose}
                  aria-label="Close rule builder"
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
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {selectedModel ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <ModelRuleBuilder
                  selectedModel={selectedModel}
                  onBack={handleBackFromEditor}
                  inModal
                  associationOnly
                  models={models}
                  onModelChange={(m) => setSelectedModel(m)}
                  modelsLoading={modelsLoading}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                  color: theme?.textSecondary,
                }}
              >
                {modelsLoading ? (
                  <CircularProgress />
                ) : (
                  <Typography variant="body2" sx={{ textAlign: 'center' }}>
                    Select a data model to open the rule editor.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={open && pickerOpen}
        onClose={handlePickerClose}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            bgcolor: theme?.card || '#fff',
            color: theme?.text,
            border: `1px solid ${theme?.border || '#e0e0e0'}`,
            boxShadow: 'none',
            ...(darkMode
              ? {
                  borderColor: 'rgba(255,255,255,0.12)',
                }
              : {}),
          },
        }}
      >
        <DialogTitle sx={{ color: theme?.text, textAlign: 'center', pb: 1 }}>
          Select data model
        </DialogTitle>
        <DialogContent sx={{ color: theme?.text, pt: 1 }}>
          <Typography
            variant="body2"
            sx={{ mb: 2, textAlign: 'center', color: theme?.textSecondary, fontFamily: fontStackSans }}
          >
            Choose which model&apos;s rules you want to edit.
          </Typography>
          {modelsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Autocomplete
              fullWidth
              options={sortedModels}
              value={sortedModels.find((m) => String(m.id) === String(pickerValue)) || null}
              onChange={(e, newValue) => {
                setPickerValue(newValue ? String(newValue.id) : '');
              }}
              isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
              getOptionLabel={(m) => (m?.shortName ? `${m.name} (${m.shortName})` : m?.name || '')}
              filterOptions={(options, state) => {
                const q = state.inputValue.trim().toLowerCase();
                if (!q) return options;
                return options.filter((m) => {
                  const name = (m.name || '').toLowerCase();
                  const sn = (m.shortName || '').toLowerCase();
                  return name.includes(q) || sn.includes(q);
                });
              }}
              renderOption={(props, model) => (
                <Box component="li" {...props}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: theme?.text }}>
                    {model.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme?.textSecondary, fontFamily: fontStackSans, display: 'block' }}
                  >
                    {model.shortName}
                  </Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Data model"
                  placeholder="Search by name or short name…"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: theme?.textSecondary, fontSize: 22 }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: theme?.text,
                      '& fieldset': { borderColor: theme?.border },
                      '&:hover fieldset': { borderColor: theme?.primary },
                      '&.Mui-focused fieldset': { borderColor: theme?.primary },
                    },
                    '& .MuiInputLabel-root': {
                      color: theme?.textSecondary,
                      '&.Mui-focused': { color: theme?.primary },
                    },
                  }}
                />
              )}
              componentsProps={{
                paper: {
                  sx: {
                    bgcolor: theme?.card,
                    color: theme?.text,
                    border: `1px solid ${theme?.border}`,
                  },
                },
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0, gap: 1, justifyContent: 'space-between' }}>
          <Button
            onClick={handlePickerClose}
            sx={{ textTransform: 'none', color: theme?.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!pickerValue || modelsLoading}
            onClick={handleConfirmModel}
            sx={{ textTransform: 'none' }}
          >
            Open editor
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RuleBuilderModal;
