import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Paper,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  LocalOffer as LocalOfferIcon,
  AccountTree as AccountTreeIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { ThemeContext } from '../contexts/ThemeContext';
import { ruleTagsList } from '../utils/ruleTags';
import { normalizeRuleStage, ruleStageColor } from '../utils/ruleStage';
import { normalizeRuleZone, ruleZoneColor, ruleZoneLabel } from '../utils/ruleZone';
import { fontStackSans } from '../theme/theme';
import { maintainerToTeamSelectorSelection } from '../utils/maintainerTeamSelection';

function buildOrderedRules(rules) {
  const list = [...rules];
  const byId = Object.fromEntries(list.map((r) => [r.id, r]));
  const roots = list.filter((r) => !r.parentRuleId || !byId[r.parentRuleId]);
  const out = [];
  const walk = (id) => {
    const r = byId[id];
    if (!r || out.includes(r)) return;
    out.push(r);
    list
      .filter((c) => c.parentRuleId === id)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
      .forEach((c) => walk(c.id));
  };
  roots.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  roots.forEach((r) => walk(r.id));
  list.forEach((r) => {
    if (!out.includes(r)) out.push(r);
  });
  return out;
}

function buildDepthByRuleId(rules) {
  const byId = Object.fromEntries(rules.map((r) => [r.id, r]));
  const memo = {};
  const depthOf = (id) => {
    if (memo[id] != null) return memo[id];
    const r = byId[id];
    if (!r || !r.parentRuleId || !byId[r.parentRuleId]) {
      memo[id] = 0;
      return 0;
    }
    const d = 1 + depthOf(r.parentRuleId);
    memo[id] = Math.min(d, 40);
    return memo[id];
  };
  rules.forEach((r) => depthOf(r.id));
  return memo;
}

/**
 * Shared rules table: flat data-model table with expand/collapse for parent → subrules.
 */
const ModelRulesTable = ({
  rules = [],
  loading = false,
  emptyMessage = 'No rules.',
  /** Reset expanded rows when this key changes (e.g. model id). */
  expandResetKey,
  /** Hide edit / delete / parent; docs icon only. */
  readOnly = false,
  /** Rule builder modal: parent + edit, no delete. */
  associationOnly = false,
  /** Scrollable max height (e.g. rule builder modal). */
  denseModal = false,
  currentTheme: themeProp,
  darkMode: darkProp,
  onEditRule,
  onDeleteRule,
  onOpenParentRule,
  /** Show Expand all / Collapse all above the table when any row has children. */
  showHierarchyControls = true,
  /** Resolve legacy numeric maintainer ids to application names (optional). */
  applications = [],
}) => {
  const ctx = useContext(ThemeContext);
  const currentTheme = themeProp ?? ctx?.currentTheme;
  const darkMode = darkProp ?? ctx?.darkMode ?? false;
  const [expandedRuleIds, setExpandedRuleIds] = useState(() => new Set());

  useEffect(() => {
    setExpandedRuleIds(new Set());
  }, [expandResetKey]);

  const orderedRules = useMemo(() => buildOrderedRules(rules), [rules]);
  const depthByRuleId = useMemo(() => buildDepthByRuleId(rules), [rules]);
  const rulesById = useMemo(() => Object.fromEntries(rules.map((r) => [r.id, r])), [rules]);

  const ruleHasChildren = useMemo(() => {
    const s = new Set();
    rules.forEach((r) => {
      if (r.parentRuleId) s.add(String(r.parentRuleId));
    });
    return (ruleId) => s.has(String(ruleId));
  }, [rules]);

  const visibleOrderedRules = useMemo(() => {
    return orderedRules.filter((rule) => {
      let pid = rule.parentRuleId;
      while (pid) {
        if (!expandedRuleIds.has(String(pid))) return false;
        const p = rulesById[pid];
        if (!p) break;
        pid = p.parentRuleId;
      }
      return true;
    });
  }, [orderedRules, rulesById, expandedRuleIds]);

  const hasAnyExpandable = useMemo(
    () => rules.some((r) => ruleHasChildren(r.id)),
    [rules, ruleHasChildren],
  );

  const toggleRuleExpanded = (ruleId) => {
    const key = String(ruleId);
    setExpandedRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getRuleTypeColor = (ruleType) => {
    const colorMap = {
      validation: {
        bgcolor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        color: darkMode ? '#81c784' : '#2e7d32',
        border: darkMode ? 'rgba(76, 175, 80, 0.5)' : '#4caf50',
      },
      transformation: {
        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(8, 145, 178, 0.1)',
        color: darkMode ? (currentTheme?.primary || '#e5e5e5') : '#0891b2',
        border: darkMode ? 'rgba(255, 255, 255, 0.35)' : '#0891b2',
      },
      business: {
        bgcolor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
        color: darkMode ? '#ba68c8' : '#6a1b9a',
        border: darkMode ? 'rgba(156, 39, 176, 0.5)' : '#9c27b0',
      },
      quality: {
        bgcolor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        color: darkMode ? '#ffb74d' : '#e65100',
        border: darkMode ? 'rgba(255, 152, 0, 0.5)' : '#ff9800',
      },
    };
    return (
      colorMap[ruleType] || {
        bgcolor: currentTheme?.background,
        color: currentTheme?.text,
        border: currentTheme?.border,
      }
    );
  };

  if (loading && rules.length === 0) {
    return null;
  }

  if (!loading && rules.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: currentTheme?.textSecondary, textAlign: 'center', py: 3 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Box>
      {showHierarchyControls && hasAnyExpandable ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              const s = new Set();
              rules.forEach((r) => {
                if (ruleHasChildren(r.id)) s.add(String(r.id));
              });
              setExpandedRuleIds(s);
            }}
            sx={{ textTransform: 'none', color: currentTheme?.primary, minWidth: 0 }}
          >
            Expand all
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => setExpandedRuleIds(new Set())}
            sx={{ textTransform: 'none', color: currentTheme?.textSecondary, minWidth: 0 }}
          >
            Collapse all
          </Button>
        </Box>
      ) : null}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: `1px solid ${currentTheme?.border}`,
          borderRadius: 2,
          bgcolor: currentTheme?.card,
          overflowX: 'auto',
          maxHeight: denseModal ? 'min(60vh, 560px)' : undefined,
          overflowY: denseModal ? 'auto' : undefined,
        }}
      >
        <Table
          size="medium"
          stickyHeader
          sx={{
            minWidth: readOnly ? 1000 : 1120,
            '& td': { fontFamily: fontStackSans, verticalAlign: 'middle' },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{
                  width: 44,
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                }}
              />
              <TableCell
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                }}
              >
                Rule
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                  width: 150,
                  minWidth: 130,
                }}
              >
                Rule ID
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                  width: 120,
                  minWidth: 100,
                  maxWidth: 160,
                }}
              >
                Maintainer
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                  width: 120,
                }}
              >
                Type
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                  width: 100,
                }}
              >
                Stage
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                  width: 100,
                }}
              >
                Zone
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                  width: 80,
                }}
              >
                On
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: currentTheme?.card,
                  color: currentTheme?.textSecondary,
                  fontWeight: 700,
                  borderBottom: `2px solid ${currentTheme?.border}`,
                }}
              >
                Tags
              </TableCell>
              {!readOnly ? (
                <TableCell
                  align="right"
                  sx={{
                    bgcolor: currentTheme?.card,
                    color: currentTheme?.textSecondary,
                    fontWeight: 700,
                    borderBottom: `2px solid ${currentTheme?.border}`,
                    width: 168,
                  }}
                >
                  Actions
                </TableCell>
              ) : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleOrderedRules.map((rule) => {
              const typeStyle = getRuleTypeColor(rule.ruleType);
              const stage = normalizeRuleStage(rule.stage);
              const stageHex = ruleStageColor(stage);
              const zone = normalizeRuleZone(rule.ruleZone);
              const zoneHex = ruleZoneColor(zone);
              const tags = ruleTagsList(rule);
              const depth = depthByRuleId[rule.id] || 0;
              const hasKids = ruleHasChildren(rule.id);
              const isOpen = expandedRuleIds.has(String(rule.id));
              const maintainerLabel =
                rule.maintainer != null && String(rule.maintainer).trim() !== ''
                  ? maintainerToTeamSelectorSelection(rule.maintainer, applications)[0] || rule.maintainer
                  : '';
              const compactChip = {
                height: 22,
                maxWidth: 100,
                fontSize: '0.7rem',
                '& .MuiChip-icon': { fontSize: 14, marginLeft: '4px' },
                '& .MuiChip-label': { px: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' },
              };
              return (
                <TableRow
                  key={rule.id}
                  hover
                  sx={{
                    '&:nth-of-type(even)': {
                      bgcolor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    },
                  }}
                >
                  <TableCell padding="checkbox" sx={{ width: 44, py: 1 }}>
                    {hasKids ? (
                      <IconButton
                        size="small"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? 'Collapse subrules' : 'Expand subrules'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRuleExpanded(rule.id);
                        }}
                        sx={{
                          color: currentTheme?.textSecondary,
                          p: 0.25,
                        }}
                      >
                        {isOpen ? (
                          <KeyboardArrowDownIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowRightIcon fontSize="small" />
                        )}
                      </IconButton>
                    ) : (
                      <Box sx={{ width: 34, height: 34 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1, pl: 1 + depth * 2, maxWidth: 360 }}>
                    <Typography variant="body2" sx={{ color: currentTheme?.text, fontWeight: 600 }}>
                      {rule.name}
                    </Typography>
                    {rule.description ? (
                      <Typography
                        variant="body2"
                        component="div"
                        title={rule.description}
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: currentTheme?.textSecondary,
                          fontSize: '0.8125rem',
                          lineHeight: 1.4,
                          mt: 0.25,
                          fontWeight: 400,
                        }}
                      >
                        {rule.description}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ py: 1, maxWidth: 180 }}>
                    {rule.id ? (
                      <Typography
                        variant="body2"
                        component="span"
                        title={String(rule.id)}
                        sx={{
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.75rem',
                          color: currentTheme?.textSecondary,
                          wordBreak: 'break-all',
                          display: 'block',
                        }}
                      >
                        {rule.id}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1, maxWidth: 160 }}>
                    {maintainerLabel ? (
                      <Typography
                        variant="body2"
                        title={maintainerLabel}
                        sx={{
                          color: currentTheme?.textSecondary,
                          fontSize: '0.8125rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {maintainerLabel}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: currentTheme?.textSecondary }}>
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={rule.ruleType}
                      size="small"
                      sx={{
                        ...typeStyle,
                        ...compactChip,
                        height: 24,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                      }}
                    />
                    {!rule.enabled && (
                      <Chip
                        label="Off"
                        size="small"
                        sx={{
                          ...compactChip,
                          height: 22,
                          mt: 0.5,
                          display: 'block',
                          bgcolor: darkMode ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)',
                          color: currentTheme?.textSecondary,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={stage}
                      size="small"
                      sx={{
                        ...compactChip,
                        height: 24,
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        bgcolor: `${stageHex}22`,
                        color: stageHex,
                        border: `1px solid ${stageHex}44`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip
                      label={ruleZoneLabel(zone)}
                      size="small"
                      sx={{
                        ...compactChip,
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: `${zoneHex}22`,
                        color: zoneHex,
                        border: `1px solid ${zoneHex}44`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
                    {rule.enabled !== false ? (
                      <Chip size="small" label="Yes" color="success" variant="outlined" sx={{ height: 24 }} />
                    ) : (
                      <Chip size="small" label="No" variant="outlined" sx={{ height: 24 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', maxWidth: 280 }}>
                      {tags.slice(0, 5).map((tag, idx) => (
                        <Tooltip key={`${tag}-${idx}`} title={tag}>
                          <Chip
                            icon={<LocalOfferIcon sx={{ fontSize: 14 }} />}
                            label={tag}
                            size="small"
                            sx={{
                              ...compactChip,
                              height: 22,
                              fontSize: '0.7rem',
                              bgcolor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                              color: currentTheme?.text,
                              border: `1px solid ${currentTheme?.border}`,
                            }}
                          />
                        </Tooltip>
                      ))}
                      {tags.length > 5 && (
                        <Chip
                          label={`+${tags.length - 5}`}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  {!readOnly ? (
                    <TableCell align="right" sx={{ py: 1 }} onClick={(e) => e.stopPropagation()}>
                      {rule.documentation && (
                        <Tooltip title="View Documentation">
                          <IconButton
                            size="small"
                            onClick={() => window.open(rule.documentation, '_blank')}
                            sx={{ color: currentTheme?.textSecondary }}
                          >
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!associationOnly && onOpenParentRule && (
                        <Tooltip title="Set parent rule (relationships)">
                          <IconButton
                            size="small"
                            onClick={() => onOpenParentRule(rule)}
                            sx={{ color: currentTheme?.textSecondary }}
                          >
                            <AccountTreeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onEditRule && (
                        <Tooltip title={associationOnly ? 'Set parent rule' : 'Edit rule'}>
                          <IconButton
                            size="small"
                            onClick={() => onEditRule(rule)}
                            sx={{ color: currentTheme?.textSecondary }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!associationOnly && onDeleteRule && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteRule(rule.id)}
                            sx={{ color: currentTheme?.textSecondary }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ModelRulesTable;
