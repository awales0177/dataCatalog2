import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  alpha,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import MermaidDiagram from './MermaidDiagram';
import { modelMarkdownProseSx } from '../utils/modelMarkdowns';

const markdownCodeComponent = ({ inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const isMermaid = match && match[1] === 'mermaid';

  if (isMermaid && !inline) {
    const codeContent = Array.isArray(children) ? children.join('') : String(children);
    return (
      <MermaidDiagram className={className}>
        {codeContent}
      </MermaidDiagram>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

/**
 * Editor chrome (preview toggle, textarea, actions). For loading spinner + snackbar, route pages use
 * MarkdownEditorScreen, which wraps this component.
 */
const MarkdownEditorLayout = ({
  backButtonLabel,
  onBack,
  title,
  subtitle,
  showPreview,
  onTogglePreview,
  /** Shown in the toolbar when not previewing (e.g. "Markdown" vs "Markdown Editor"). */
  editorToolbarLabel = 'Markdown Editor',
  previewToolbarLabel = 'Preview',
  markdown,
  onMarkdownChange,
  placeholder = 'Enter markdown content here...',
  textFieldRows = 20,
  saving,
  hasChanges,
  onSave,
  onCancel,
  saveLabel = 'Save',
  savingLabel = 'Saving...',
  /** Optional content below subtitle (e.g. model edit link). */
  headerExtra,
}) => {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const themeForProse = { ...currentTheme, darkMode };
  const proseSx = modelMarkdownProseSx(themeForProse);

  const outlinedBtnSx = {
    borderColor: currentTheme.border,
    color: currentTheme.text,
    '&:hover': {
      borderColor: currentTheme.primary,
      bgcolor: alpha(currentTheme.primary, 0.1),
    },
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={outlinedBtnSx}
          >
            {backButtonLabel}
          </Button>
        </Box>

        <Box>
          <Typography variant="h4" sx={{ color: currentTheme.text, fontWeight: 600, mb: 1 }}>
            {title}
          </Typography>
          {subtitle != null ? (
            <Typography component="div" variant="body1" sx={{ color: currentTheme.textSecondary }}>
              {subtitle}
            </Typography>
          ) : null}
          {headerExtra}
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          bgcolor: currentTheme.card,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: currentTheme.text }}>
            {showPreview ? previewToolbarLabel : editorToolbarLabel}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={onTogglePreview}
            sx={outlinedBtnSx}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
        </Box>

        {showPreview ? (
          <Box
            sx={{
              minHeight: 400,
              p: 3,
              bgcolor: currentTheme.background,
              borderRadius: 1,
              border: `1px solid ${currentTheme.border}`,
              color: currentTheme.text,
              ...proseSx,
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkEmoji]}
              components={{ code: markdownCodeComponent }}
            >
              {markdown || '*No content yet*'}
            </ReactMarkdown>
          </Box>
        ) : (
          <TextField
            fullWidth
            multiline
            rows={textFieldRows}
            value={markdown}
            onChange={(e) => onMarkdownChange(e.target.value)}
            placeholder={placeholder}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: currentTheme.text,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                '& fieldset': { borderColor: currentTheme.border },
                '&:hover fieldset': { borderColor: currentTheme.primary },
                '&.Mui-focused fieldset': { borderColor: currentTheme.primary },
              },
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
              },
            }}
          />
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mt: 4,
            pt: 3,
            borderTop: `1px solid ${currentTheme.border}`,
          }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={saving}
            sx={outlinedBtnSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={saving || !hasChanges}
            sx={{
              bgcolor: currentTheme.primary,
              color: currentTheme.background,
              '&:hover': {
                bgcolor: currentTheme.primaryHover || currentTheme.primary,
              },
              '&:disabled': {
                bgcolor: alpha(currentTheme.primary, 0.3),
              },
            }}
          >
            {saving ? savingLabel : saveLabel}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default MarkdownEditorLayout;
