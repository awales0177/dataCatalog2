import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Popover,
  TextField,
} from '@mui/material';
import { PlayArrow as RunIcon, Lock as LockIcon, AutoAwesome as NaturalLanguageIcon } from '@mui/icons-material';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { ThemeContext } from '../../contexts/ThemeContext';
import { sampleTableColumns, sampleTableRows } from './sampleTableData';
import { BasketIcon } from '../../constants/navigation';
import { fetchNaturalLanguageQuery } from '../../services/api';
import { fontStackMono } from '../../theme/theme';

const NL_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

/** Client-side fallback: generate a simple SQL from natural language and table context. */
function generateSqlFromNaturalLanguage(question, fullTableName, columns) {
  const q = (question || '').toLowerCase().trim();
  const hasCount = /\bcount\b|\bhow many\b|\bnumber of\b/.test(q);
  const hasFilter = /\bwhere\b|\bfilter\b|\bactive\b|\bstatus\b|\bonly\b/.test(q);
  const hasLimit = /\blimit\b|\bfirst\b|\btop\b|\blatest\b/.test(q);
  const limitNum = (q.match(/(?:first|top|limit)\s*(\d+)/i) || [])[1] || (hasLimit ? '10' : null);
  if (hasCount) {
    return `SELECT COUNT(*) AS cnt FROM ${fullTableName};`;
  }
  let sql = `SELECT * FROM ${fullTableName}`;
  if (hasFilter && columns.includes('status')) {
    sql += ` WHERE status = 'active'`;
  }
  sql += ' ';
  if (limitNum) sql += `LIMIT ${limitNum}`;
  else sql += 'LIMIT 100';
  return sql + ';';
}

const QueryEngine = ({ selectedContext, currentTheme, darkMode, minimal = false }) => {
  const { currentTheme: contextTheme } = useContext(ThemeContext);
  const theme = currentTheme || contextTheme;
  const isLocked = selectedContext?.isLocked === true;
  const [sqlValue, setSqlValue] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [resultRows, setResultRows] = useState([]);
  const [resultColumns, setResultColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [nlAnchorEl, setNlAnchorEl] = useState(null);
  const [nlInput, setNlInput] = useState('');
  const [nlModel, setNlModel] = useState(NL_MODELS[0].id);
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState(null);

  useEffect(() => {
    if (selectedContext?.table?.id && selectedContext.table.id !== '_placeholder') {
      setSqlValue(`SELECT * FROM ${selectedContext.domainName}.${selectedContext.dbName}.${selectedContext.table.name} LIMIT 100;`);
      if (selectedContext?.isLocked) {
        setResultRows([]);
        setResultColumns([]);
        setSelectedColumns([]);
      }
    }
  }, [selectedContext?.domainName, selectedContext?.dbName, selectedContext?.table?.id, selectedContext?.table?.name, selectedContext?.isLocked]);

  const handleRun = async () => {
    setError(null);
    setResultRows([]);
    setResultColumns([]);
    setRunning(true);
    try {
      // Placeholder: simulate running a query (no backend execution in this demo)
      await new Promise((r) => setTimeout(r, 600));
      if (!sqlValue.trim()) {
        setError('Enter a SQL query to run.');
        return;
      }
      // Use same sample table data for every table (demo mode)
      setResultColumns(sampleTableColumns);
      setResultRows(sampleTableRows);
      setSelectedColumns(sampleTableColumns);
    } catch (err) {
      setError(err.message || 'Query failed.');
    } finally {
      setRunning(false);
    }
  };

  const fullTableName = selectedContext?.table?.id && selectedContext.table.id !== '_placeholder'
    ? `${selectedContext.domainName}.${selectedContext.dbName}.${selectedContext.table.name}`
    : null;

  const handleNlOpen = (e) => {
    setNlError(null);
    setNlInput('');
    setNlAnchorEl(e.currentTarget);
  };

  const handleNlClose = () => {
    setNlAnchorEl(null);
    setNlInput('');
    setNlError(null);
  };

  const handleNlSubmit = async () => {
    const question = nlInput.trim();
    if (!question) return;
    setNlError(null);
    setNlLoading(true);
    try {
      if (fullTableName) {
        try {
          const data = await fetchNaturalLanguageQuery(question, fullTableName, sampleTableColumns, nlModel);
          const sql = typeof data === 'string' ? data : (data?.sql ?? '');
          if (sql) {
            setSqlValue(sql);
            handleNlClose();
            return;
          }
        } catch (apiErr) {
          // Fall back to client-side generation
        }
      }
      const generated = fullTableName
        ? generateSqlFromNaturalLanguage(question, fullTableName, sampleTableColumns)
        : `-- ${question}\n-- Select a table from the tree to generate SQL.`;
      setSqlValue(generated);
      handleNlClose();
    } catch (err) {
      setNlError(err.message || 'Could not generate SQL.');
    } finally {
      setNlLoading(false);
    }
  };

  const codeHeight = minimal ? '220px' : '200px';
  const tableMaxHeight = minimal ? 320 : 280;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {!minimal && selectedContext?.table?.id && selectedContext.table.id !== '_placeholder' && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: darkMode ? 'rgba(0,0,0,0.15)' : 'grey.50', border: `1px solid ${theme?.border || '#e0e0e0'}`, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: theme?.text, fontWeight: 600, mb: 0.5 }}>
              {selectedContext.table.name}
            </Typography>
            <Typography variant="body2" sx={{ color: theme?.textSecondary, lineHeight: 1.5 }}>
              {selectedContext.table.description || 'No description available.'}
            </Typography>
            <Typography variant="caption" sx={{ color: theme?.textSecondary, mt: 1, display: 'block', mb: 0.5 }}>
              Schema:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {sampleTableColumns.map((col) => (
                <Chip
                  key={col}
                  label={col}
                  size="small"
                  sx={{
                    fontFamily: fontStackMono,
                    fontSize: '0.7rem',
                    height: 22,
                    bgcolor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: theme?.textSecondary,
                    border: `1px solid ${theme?.border || 'rgba(0,0,0,0.12)'}`,
                  }}
                />
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', p: 0.5, minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center', ...(isLocked && { opacity: 0.6 }) }}>
              <Box component="img" src="/fastapi.svg" alt="FastAPI" sx={{ height: 28, width: 'auto' }} />
              {isLocked && (
                <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1 }}>
                  <LockIcon sx={{ color: '#fff', fontSize: 18 }} />
                </Box>
              )}
            </Box>
            <BasketIcon style={{ width: 28, height: 28, color: theme?.primary || theme?.text }} />
          </Box>
        </Box>
      )}
      {!minimal && (
        <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: theme?.textSecondary }}>
          SQL Query
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<NaturalLanguageIcon />}
          onClick={handleNlOpen}
          disabled={isLocked}
          sx={{
            textTransform: 'none',
            borderColor: theme?.border,
            color: theme?.textSecondary,
            '&:hover': { borderColor: theme?.primary, color: theme?.primary },
          }}
        >
          Ask in natural language
        </Button>
      </Box>
      <Popover
        open={Boolean(nlAnchorEl)}
        anchorEl={nlAnchorEl}
        onClose={handleNlClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 2,
            minWidth: 320,
            maxWidth: 420,
            bgcolor: theme?.card,
            border: `1px solid ${theme?.border || '#e0e0e0'}`,
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ color: theme?.text, mb: 1.5 }}>
          Natural language query
        </Typography>
        <Typography variant="caption" sx={{ color: theme?.textSecondary, display: 'block', mb: 1 }}>
          Describe what you want; the generated SQL will appear in the editor below.
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel id="query-nlq-model-label" sx={{ color: theme?.textSecondary }}>
            Model
          </InputLabel>
          <Select
            labelId="query-nlq-model-label"
            label="Model"
            value={nlModel}
            onChange={(e) => setNlModel(e.target.value)}
            disabled={nlLoading}
            sx={{
              color: theme?.text,
              bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'grey.50',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: theme?.border },
            }}
          >
            {NL_MODELS.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          placeholder="e.g. Show me all active records, or count rows"
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          disabled={nlLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleNlSubmit();
            }
          }}
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'grey.50',
              color: theme?.text,
            },
          }}
        />
        {nlError && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setNlError(null)}>
            {nlError}
          </Alert>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button size="small" onClick={handleNlClose} sx={{ color: theme?.textSecondary }}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleNlSubmit}
            disabled={nlLoading || !nlInput.trim()}
            sx={{ bgcolor: theme?.primary, color: '#fff', textTransform: 'none' }}
          >
            {nlLoading ? 'Generating…' : 'Generate SQL'}
          </Button>
        </Box>
      </Popover>
        </>
      )}
      <Box sx={{ position: 'relative', border: `1px solid ${theme?.border || 'rgba(0,0,0,0.23)'}`, borderRadius: 1, overflow: 'hidden', '& .cm-editor': { fontSize: '0.875rem' }, '& .cm-scroller': { fontFamily: fontStackMono }, ...(isLocked && { opacity: 0.7, pointerEvents: 'none' }) }}>
        {isLocked && (
          <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.4)', zIndex: 2 }}>
            <LockIcon sx={{ color: '#fff', fontSize: 32 }} />
          </Box>
        )}
        <CodeMirror
          value={sqlValue}
          height={codeHeight}
          theme={darkMode ? 'dark' : 'light'}
          extensions={[sql()]}
          onChange={(val) => setSqlValue(val)}
          placeholder={
            minimal
              ? selectedContext?.table?.id && selectedContext.table.id !== '_placeholder'
                ? '-- SQL for this reference table'
                : '-- Write SQL here, or pick a table above for a starter query'
              : '-- Select a table from the tree or write your SQL here'
          }
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
          readOnly={isLocked}
        />
      </Box>
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<RunIcon />}
          onClick={handleRun}
          disabled={running || isLocked}
          sx={{
            bgcolor: theme?.primary || '#0891b2',
            color: '#fff',
            textTransform: 'none',
            '&:hover': { bgcolor: theme?.primaryHover || theme?.primaryDark || '#0e7490', opacity: 0.9 },
          }}
        >
          {running ? 'Running…' : 'Run'}
        </Button>
        {!minimal && selectedContext && (
          <Typography variant="caption" sx={{ color: theme?.textSecondary }}>
            {selectedContext.domainName}.{selectedContext.dbName}.{selectedContext.table?.name}
          </Typography>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {resultColumns.length > 0 && !isLocked && (
        <Box sx={{ mt: minimal ? 1.5 : 2, flex: 1, minHeight: 120 }}>
          {!minimal && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ color: theme?.textSecondary }}>
                Result
              </Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="query-select-columns-label" sx={{ color: theme?.textSecondary }}>
                  Select columns
                </InputLabel>
                <Select
                  labelId="query-select-columns-label"
                  label="Select columns"
                  multiple
                  value={selectedColumns}
                  onChange={(e) => setSelectedColumns(e.target.value)}
                  renderValue={(val) => (val.length === resultColumns.length ? 'All columns' : `${val.length} column${val.length !== 1 ? 's' : ''}`)}
                  sx={{
                    color: theme?.text,
                    fontFamily: fontStackMono,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme?.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme?.primary },
                  }}
                >
                  {resultColumns.map((col) => (
                    <MenuItem key={col} value={col}>
                      <Checkbox checked={selectedColumns.indexOf(col) > -1} size="small" sx={{ color: theme?.primary }} />
                      <ListItemText primary={col} primaryTypographyProps={{ fontFamily: fontStackMono }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: tableMaxHeight,
              overflow: 'auto',
              bgcolor: darkMode ? 'rgba(255,255,255,0.03)' : theme?.card,
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : (theme?.border || '#e0e0e0')}`,
              boxShadow: 'none',
              borderRadius: 1,
            }}
          >
            <Table size="small" stickyHeader sx={{ borderCollapse: 'collapse' }}>
              <TableHead>
                <TableRow>
                  {(selectedColumns.length > 0 ? selectedColumns : resultColumns).map((col) => (
                    <TableCell
                      key={col}
                      sx={{
                        fontWeight: 600,
                        fontFamily: fontStackMono,
                        letterSpacing: '0.5px',
                        color: darkMode ? 'rgba(255,255,255,0.9)' : theme?.text,
                        bgcolor: darkMode ? 'rgba(30,30,30,0.98)' : (theme?.cardBackground || '#fafafa'),
                        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : (theme?.border || '#e0e0e0')}`,
                        py: 1,
                        px: 1.5,
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        boxShadow: darkMode ? '0 1px 0 0 rgba(255,255,255,0.08)' : '0 1px 0 0 rgba(0,0,0,0.08)',
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {resultRows.map((row, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      '&:nth-of-type(even)': darkMode ? { bgcolor: 'rgba(255,255,255,0.02)' } : {},
                    }}
                  >
                    {(selectedColumns.length > 0 ? selectedColumns : resultColumns).map((col) => (
                      <TableCell
                        key={col}
                        sx={{
                          fontFamily: fontStackMono,
                          letterSpacing: '0.5px',
                          color: darkMode ? 'rgba(255,255,255,0.85)' : theme?.text,
                          border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : (theme?.border || '#e0e0e0')}`,
                          py: 1,
                          px: 1.5,
                        }}
                      >
                        {String(row[col] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default QueryEngine;
