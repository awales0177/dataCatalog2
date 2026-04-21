import React, { useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DeleteModal from '../components/DeleteModal';
import { ThemeContext } from '../contexts/ThemeContext';
import { modelApiRef } from '../utils/catalogModelLookup';

export function UnsavedChangesDialog({ open, onClose, onDiscard }) {
  const { currentTheme } = useContext(ThemeContext);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: currentTheme.card,
          color: currentTheme.text,
          border: `1px solid ${currentTheme.border}`,
        },
      }}
    >
      <DialogTitle sx={{ color: currentTheme.text }}>Unsaved Changes</DialogTitle>
      <DialogContent sx={{ color: currentTheme.text }}>
        <Typography sx={{ color: currentTheme.text }}>
          You have unsaved changes. Are you sure you want to discard them?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: currentTheme.text }}>
          Continue Editing
        </Button>
        <Button onClick={onDiscard} color="error">
          Discard Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ShortNameChangeDialog({
  open,
  onClose,
  model,
  editedModel,
  updateAssociatedLinks,
  onUpdateAssociatedLinksChange,
  onConfirm,
}) {
  const { currentTheme } = useContext(ThemeContext);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="shortname-change-dialog-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: currentTheme.card,
          color: currentTheme.text,
          border: `1px solid ${currentTheme.border}`,
        },
      }}
    >
      <DialogTitle id="shortname-change-dialog-title" sx={{ color: currentTheme.text }}>
        Confirm ShortName Change
      </DialogTitle>
      <DialogContent sx={{ color: currentTheme.text }}>
        <Typography sx={{ mb: 2 }}>
          You are about to change the shortName from <strong>"{model?.shortName}"</strong> to{' '}
          <strong>"{editedModel?.shortName}"</strong>.
        </Typography>

        <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'warning.dark', mb: 1, fontWeight: 'bold' }}>
            ⚠️ Important: Choose how to handle existing agreements
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={updateAssociatedLinks}
                onChange={(e) => onUpdateAssociatedLinksChange(e.target.checked)}
                color="warning"
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  Update associated agreements
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  All existing agreements will be updated to reference the new shortName
                </Typography>
              </Box>
            }
            sx={{ mb: 1 }}
          />

          {!updateAssociatedLinks && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: 'info.dark', fontWeight: 'bold' }}>
                ℹ️ Note: Existing agreements will continue to reference "{model?.shortName}"
              </Typography>
              <Typography variant="caption" sx={{ color: 'info.dark', display: 'block', mt: 0.5 }}>
                This creates a redirect scenario where both old and new shortNames work
              </Typography>
            </Box>
          )}
        </Box>

        <Typography sx={{ mb: 2 }}>This will:</Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li">
            Change the URL for this model to /models/{modelApiRef(editedModel)}
          </Typography>
          {updateAssociatedLinks && (
            <Typography component="li">Update all agreements that reference this model</Typography>
          )}
          <Typography component="li">
            Require updating any external references to use the new shortName
          </Typography>
        </Box>
        <Typography sx={{ color: 'warning.main', fontWeight: 'bold' }}>
          Are you sure you want to proceed?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          {updateAssociatedLinks
            ? 'Yes, Change ShortName & Update Links'
            : 'Yes, Change ShortName Only'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function SelectionDialog({ open, onClose, availableOptions, onSelect }) {
  const { currentTheme } = useContext(ThemeContext);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="selection-dialog-title"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: currentTheme.card,
          color: currentTheme.text,
          border: `1px solid ${currentTheme.border}`,
        },
      }}
    >
      <DialogTitle id="selection-dialog-title" sx={{ color: currentTheme.text }}>
        📚 Select Reference Data
      </DialogTitle>
      <DialogContent sx={{ color: currentTheme.text }}>
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: 'info.light',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'info.main',
          }}
        >
          <Typography variant="body2" sx={{ color: 'info.dark', fontSize: '0.875rem' }}>
            ℹ️ <strong>Note:</strong> Selected items will be read-only and cannot be manually
            edited. Use the delete button to remove items if needed.
          </Typography>
        </Box>
        <Typography sx={{ mb: 2 }}>Choose from available reference data items:</Typography>

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {availableOptions.map((option, index) => (
            <Button
              key={index}
              fullWidth
              variant="outlined"
              onClick={() => onSelect(option.value)}
              sx={{
                mb: 1,
                justifyContent: 'flex-start',
                textAlign: 'left',
                color: currentTheme.text,
                borderColor: currentTheme.border,
                '&:hover': {
                  bgcolor: currentTheme.primary,
                  color: currentTheme.background,
                  borderColor: currentTheme.primary,
                },
              }}
            >
              {option.label}
            </Button>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: currentTheme.text }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ToolkitToolPickerDialog({
  open,
  onClose,
  search,
  onSearchChange,
  filteredOptions,
  allOptions,
  onSelect,
}) {
  const { currentTheme } = useContext(ThemeContext);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: currentTheme.card,
          color: currentTheme.text,
          border: `1px solid ${currentTheme.border}`,
        },
      }}
    >
      <DialogTitle
        sx={{ color: currentTheme.text, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <AddIcon />
        Link tool from toolkit
      </DialogTitle>
      <DialogContent sx={{ color: currentTheme.text }}>
        <Typography variant="body2" sx={{ mb: 2, color: currentTheme.textSecondary }}>
          Choose a technology from the toolkit workbench. The link uses documentation or GitHub when
          available; otherwise it opens the technology page in this catalog.
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search toolkit or technology…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: currentTheme.text,
              '& fieldset': { borderColor: currentTheme.border },
            },
            '& .MuiInputLabel-root': { color: currentTheme.textSecondary },
          }}
        />
        <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
          {filteredOptions.length === 0 ? (
            <Typography variant="body2" sx={{ color: currentTheme.textSecondary, py: 2 }}>
              {allOptions.length === 0
                ? 'No technologies found in the toolkit catalog.'
                : 'No matches. Try a different search.'}
            </Typography>
          ) : (
            filteredOptions.map((opt) => (
              <Button
                key={`${opt.toolkitId}:${opt.technologyId}`}
                fullWidth
                variant="outlined"
                onClick={() => onSelect(opt)}
                sx={{
                  mb: 1,
                  py: 1.25,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  color: currentTheme.text,
                  borderColor: currentTheme.border,
                  '&:hover': {
                    bgcolor: currentTheme.primary,
                    color: currentTheme.background,
                    borderColor: currentTheme.primary,
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {opt.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.85,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}
                >
                  {opt.url}
                </Typography>
              </Button>
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: currentTheme.text }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function DeleteFieldModal({ open, onClose, onConfirm, label, displayName, isTool, toolName }) {
  return (
    <DeleteModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmMode="simple"
      title="Confirm deletion"
      itemType={isTool ? 'tool' : String(label || 'item').toLowerCase()}
      itemName={isTool ? toolName : displayName || 'this entry'}
    />
  );
}

export function DeleteModelModal({ open, onClose, onConfirm, modelName }) {
  return (
    <DeleteModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Model"
      itemName={modelName}
      itemType="model"
    >
      <Typography sx={{ mb: 2 }}>This will:</Typography>
      <Box component="ul" sx={{ pl: 2, mb: 3 }}>
        <Typography component="li">Permanently delete the model "{modelName}"</Typography>
        <Typography component="li">Remove all model data and configurations</Typography>
        <Typography component="li">
          Break any existing agreements that reference this model
        </Typography>
        <Typography component="li">Require manual cleanup of external references</Typography>
      </Box>
    </DeleteModal>
  );
}
