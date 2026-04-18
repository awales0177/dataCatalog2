import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  ListItem,
  ListItemText,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { importReferenceExcelFromFile } from '../utils/referenceExcelIO';
import { getImportHistoryForRef } from '../utils/referenceExcelImportHistory';

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(iso ?? '');
  }
}

/**
 * Modal: recent Excel imports + drag-and-drop + file picker for reference dataset.
 */
const ReferenceExcelImportModal = ({
  open,
  onClose,
  referenceItem,
  uploadedByLabel,
  theme,
  darkMode,
  border,
  onImportSuccess,
}) => {
  const [history, setHistory] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);

  const refId = referenceItem ? String(referenceItem.id ?? referenceItem.name ?? '') : '';

  const refreshHistory = useCallback(() => {
    if (!refId) {
      setHistory([]);
      return;
    }
    setHistory(getImportHistoryForRef(refId));
  }, [refId]);

  useEffect(() => {
    if (open) {
      refreshHistory();
      setError('');
    }
  }, [open, refreshHistory]);

  const processFile = useCallback(
    async (file) => {
      if (!file || !referenceItem || !refId) return;
      const lower = file.name?.toLowerCase() ?? '';
      if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
        setError('Please choose an Excel file (.xlsx or .xls).');
        return;
      }
      setError('');
      setBusy(true);
      try {
        const tables = await importReferenceExcelFromFile(file);
        onImportSuccess?.(tables, {
          fileName: file.name,
          tableCount: tables.length,
        });
        refreshHistory();
        onClose?.();
      } catch (err) {
        setError(err?.message || 'Import failed');
      } finally {
        setBusy(false);
      }
    },
    [referenceItem, refId, onImportSuccess, onClose, refreshHistory]
  );

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragOver(false);
    }
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const subtitle = referenceItem?.name || referenceItem?.id || 'Dataset';

  return (
    <Dialog
      open={open && Boolean(referenceItem)}
      onClose={busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: theme?.card,
          color: theme?.text,
          border: `1px solid ${border}`,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          pr: 1,
          borderBottom: `1px solid ${border}`,
          pb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme?.text }}>
            Import from Excel
          </Typography>
          <Typography variant="caption" sx={{ color: theme?.textSecondary, display: 'block', mt: 0.5 }}>
            {subtitle}
            {uploadedByLabel ? ` · uploads recorded as: ${uploadedByLabel}` : null}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          sx={{ color: theme?.textSecondary }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box>
          <Typography variant="overline" sx={{ color: theme?.textSecondary, fontWeight: 700, letterSpacing: 0.08 }}>
            Recent uploads (this browser)
          </Typography>
          {history.length === 0 ? (
            <Typography variant="body2" sx={{ color: theme?.textSecondary, mt: 1, py: 1 }}>
              No uploads recorded yet. After you import a file, the time, file name, and who was signed in appear here.
            </Typography>
          ) : (
            <List
              dense
              disablePadding
              sx={{
                mt: 1,
                maxHeight: 220,
                overflow: 'auto',
                border: `1px solid ${border}`,
                borderRadius: 1,
                bgcolor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              }}
            >
              {history.map((row) => (
                <ListItem
                  key={row.id}
                  divider
                  sx={{ alignItems: 'flex-start', borderBottomColor: border }}
                >
                  <ListItemText
                    primary={row.fileName || 'Excel file'}
                    secondary={
                      <>
                        <Typography component="span" variant="caption" sx={{ display: 'block', color: theme?.textSecondary }}>
                          {formatWhen(row.at)} · by {row.by}
                          {row.tableCount > 0 ? ` · ${row.tableCount} table${row.tableCount === 1 ? '' : 's'}` : ''}
                        </Typography>
                      </>
                    }
                    primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 600, color: theme?.text } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Box>
          <Typography variant="overline" sx={{ color: theme?.textSecondary, fontWeight: 700, letterSpacing: 0.08 }}>
            Add file
          </Typography>
          <Box
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            sx={{
              mt: 1,
              border: `2px dashed ${dragOver ? theme?.primary : border}`,
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: busy ? 'default' : 'pointer',
              bgcolor: dragOver
                ? darkMode
                  ? alpha(theme?.primary || '#d4d4d4', 0.12)
                  : alpha(theme?.primary || '#0891b2', 0.08)
                : darkMode
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(15,23,42,0.03)',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
            onClick={() => !busy && fileInputRef.current?.click()}
            role="presentation"
          >
            <CloudUploadIcon sx={{ fontSize: 40, color: theme?.primary, opacity: 0.9, mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme?.text, mb: 0.5 }}>
              Drag and drop an Excel file here
            </Typography>
            <Typography variant="caption" sx={{ color: theme?.textSecondary, display: 'block', mb: 1.5 }}>
              One sheet per table · first row = column headers
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FolderOpenIcon />}
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme?.border,
                color: theme?.text,
                '&:hover': { borderColor: theme?.primary, color: theme?.primary },
              }}
            >
              Choose from your computer
            </Button>
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) processFile(f);
            }}
          />
        </Box>

        {error ? (
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            {error}
          </Typography>
        ) : null}

        {busy ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" sx={{ color: theme?.textSecondary }}>
              Reading workbook…
            </Typography>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${border}` }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ textTransform: 'none', color: theme?.textSecondary }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReferenceExcelImportModal;
