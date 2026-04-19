/** Multi-tab markdown docs on data models (`markdowns` array on each model). */

import { alpha } from '@mui/material/styles';

function slugId(raw, fallback) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return s || fallback;
}

/**
 * @returns {{ id: string, title: string, content: string }[]}
 */
export function normalizeModelMarkdowns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    const fallbackId = `md_${i}`;
    const id = slugId(item?.id, slugId(item?.title, fallbackId));
    const title = String(item?.title ?? '').trim() || `Tab ${i + 1}`;
    const content =
      typeof item?.content === 'string'
        ? item.content
        : typeof item?.body === 'string'
          ? item.body
          : '';
    return { id, title, content };
  });
}

/** Tabs with non-empty title or body (for display). */
export function modelMarkdownsForDisplay(model) {
  return normalizeModelMarkdowns(model?.markdowns).filter((t) => t.title || t.content.trim());
}

/** Route to full-page markdown editor for a model tab (matches toolkit README pattern). */
export function dataModelMarkdownEditPath(modelRef, tabId) {
  const sn = encodeURIComponent(String(modelRef || '').trim());
  const tid = encodeURIComponent(String(tabId || '').trim());
  return `/models/${sn}/markdown/${tid}`;
}

/** Shared prose styles for ReactMarkdown (matches glossary / toolkit). */
export function modelMarkdownProseSx(currentTheme) {
  const darkMode = currentTheme.darkMode;
  return {
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      color: currentTheme.text,
      marginTop: 2,
      marginBottom: 1,
    },
    '& p': {
      color: currentTheme.textSecondary,
      marginBottom: 1.5,
    },
    '& code': {
      bgcolor: darkMode ? alpha(currentTheme.primary, 0.2) : alpha(currentTheme.primary, 0.1),
      color: darkMode ? '#a5d6ff' : currentTheme.primary,
      padding: '2px 6px',
      borderRadius: 1,
      fontSize: '0.9em',
      fontFamily: 'monospace',
    },
    '& pre': {
      bgcolor: darkMode ? '#1e1e1e' : currentTheme.card,
      padding: 2,
      borderRadius: 1,
      overflow: 'auto',
      border: `1px solid ${currentTheme.border}`,
      '& code': {
        bgcolor: 'transparent',
        padding: 0,
        color: darkMode ? '#d4d4d4' : currentTheme.text,
      },
    },
    '& ul, & ol': {
      color: currentTheme.textSecondary,
      paddingLeft: 3,
    },
    '& a': {
      color: currentTheme.primary,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    },
    '& blockquote': {
      borderLeft: `4px solid ${currentTheme.primary}`,
      paddingLeft: 2,
      marginLeft: 0,
      color: currentTheme.textSecondary,
      fontStyle: 'italic',
      bgcolor: darkMode ? alpha(currentTheme.primary, 0.05) : 'transparent',
      padding: 1,
      borderRadius: '0 4px 4px 0',
    },
    '& hr': {
      borderColor: currentTheme.border,
      borderWidth: '1px 0 0 0',
      marginTop: 2,
      marginBottom: 2,
    },
    '& img': {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: 1,
      border: `1px solid ${currentTheme.border}`,
    },
    '& strong': { color: currentTheme.text, fontWeight: 600 },
    '& em': { color: currentTheme.textSecondary, fontStyle: 'italic' },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: 2,
      marginBottom: 2,
      display: 'table',
      border: `1px solid ${currentTheme.border}`,
      borderRadius: 1,
      overflow: 'hidden',
    },
    '& thead': { display: 'table-header-group' },
    '& tbody': { display: 'table-row-group' },
    '& tr': {
      display: 'table-row',
      borderBottom: `1px solid ${currentTheme.border}`,
      '&:last-child': { borderBottom: 'none' },
    },
    '& th, & td': {
      display: 'table-cell',
      border: `1px solid ${currentTheme.border}`,
      padding: 1.5,
      textAlign: 'left',
      verticalAlign: 'top',
    },
    '& th': {
      bgcolor: darkMode ? alpha(currentTheme.primary, 0.2) : alpha(currentTheme.primary, 0.1),
      fontWeight: 600,
      color: currentTheme.text,
    },
    '& td': {
      color: currentTheme.textSecondary,
      bgcolor: darkMode ? alpha(currentTheme.background, 0.5) : 'transparent',
    },
    '& tr:nth-of-type(even) td': {
      bgcolor: darkMode ? alpha(currentTheme.background, 0.3) : alpha(currentTheme.primary, 0.02),
    },
  };
}
