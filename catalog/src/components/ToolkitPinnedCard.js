import React from 'react';
import { Box, Card, CardContent, Typography, Chip, alpha } from '@mui/material';
import { ViewModule as ResourceIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { normalizeTechnologyStatus } from '../utils/toolkitStatus';
import { workbenchPath, workbenchCanonicalRef } from '../utils/toolkitWorkbench';
import { getSearchResultPath } from '../utils/catalogSearchNavigation';

const TECH_STATUS_ORDER = ['production', 'development', 'evaluated'];

function toolkitCardStatusChips(toolkit) {
  const techs = toolkit?.technologies || [];
  const raw = techs.map((t) => normalizeTechnologyStatus(t?.status));
  const unique = [...new Set(raw)].sort(
    (a, b) => TECH_STATUS_ORDER.indexOf(a) - TECH_STATUS_ORDER.indexOf(b)
  );
  return unique;
}

function techStatusChipLabel(s) {
  if (s === 'development') return 'Development';
  if (s === 'evaluated') return 'Evaluated';
  return 'Production';
}

function techStatusChipColor(s, themePrimary) {
  if (s === 'development') return '#ff9800';
  if (s === 'evaluated') return '#4caf50';
  return themePrimary;
}

const RESOURCE_KIND_LABEL = {
  package: 'Package',
  container: 'Container',
  function: 'Function',
  infrastructure: 'Infrastructure',
};

function toolkitPathForPin(pin, item) {
  if (pin.path && pin.path !== '/toolkit') return pin.path;
  const sub = pin.toolkitSubtype || inferToolkitSubtypeFromPath(pin.path);
  if (sub === 'toolkits') {
    const ref = workbenchCanonicalRef(item);
    return ref ? workbenchPath(ref) : '/toolkit';
  }
  if (sub === 'package') {
    const pid = item?.id || item?.name;
    return pid ? `/toolkit/package/${encodeURIComponent(pid)}` : '/toolkit';
  }
  return getSearchResultPath({ ...item, _toolkit_type: sub }, 'toolkit');
}

export function inferToolkitSubtypeFromPath(path) {
  const p = String(path || '');
  if (p.includes('/toolkit/container/')) return 'containers';
  if (p.includes('/toolkit/function/')) return 'functions';
  if (p.includes('/toolkit/infrastructure/')) return 'infrastructure';
  if (p.includes('/toolkit/package/')) return 'package';
  return 'toolkits';
}

/**
 * Same visuals as ToolkitPage: workbench card for hub toolkits, unified resource card for packages/containers/functions/infrastructure.
 */
const ToolkitPinnedCard = ({ pin, item, currentTheme }) => {
  const navigate = useNavigate();
  if (!item) return null;

  const subtype = pin.toolkitSubtype || inferToolkitSubtypeFromPath(pin.path);
  const go = () => navigate(toolkitPathForPin(pin, item));

  if (subtype === 'toolkits') {
    const statusKeys = toolkitCardStatusChips(item);
    return (
      <Card onClick={go} sx={{ cursor: 'pointer', overflow: 'hidden' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: currentTheme.text,
                fontWeight: 600,
                flex: 1,
                minWidth: 0,
                lineHeight: 1.3,
              }}
            >
              {item.displayName || item.name}
            </Typography>
            {item.cardImage ? (
              <Box
                component="img"
                src={item.cardImage}
                alt=""
                sx={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 1,
                  flexShrink: 0,
                  border: `1px solid ${currentTheme.border}`,
                }}
              />
            ) : null}
          </Box>
          {statusKeys.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {statusKeys.map((s) => {
                const c = techStatusChipColor(s, currentTheme.primary);
                return (
                  <Chip
                    key={s}
                    size="small"
                    label={techStatusChipLabel(s)}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: alpha(c, 0.12),
                      color: c,
                      border: `1px solid ${alpha(c, 0.35)}`,
                    }}
                  />
                );
              })}
            </Box>
          ) : null}
          <Typography variant="body2" sx={{ color: currentTheme.textSecondary }}>
            {item.description}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const kind =
    subtype === 'containers'
      ? 'container'
      : subtype === 'functions'
        ? 'function'
        : subtype === 'infrastructure' || subtype === 'terraform'
          ? 'infrastructure'
          : subtype === 'package'
            ? 'package'
            : 'container';

  const title = item.displayName || item.name || item.id || 'Untitled';
  const readmePreview = typeof item.readme === 'string' ? item.readme.slice(0, 160) : '';
  const description = item.description || item.usage || readmePreview || 'Toolkit resource';
  const tags = item.tags || [];

  return (
    <Card onClick={go} sx={{ cursor: 'pointer', overflow: 'hidden' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ResourceIcon sx={{ fontSize: 22, color: currentTheme.primary }} />
          <Typography variant="h6" sx={{ color: currentTheme.text, fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: currentTheme.textSecondary,
            mb: 2,
            minHeight: 40,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
          {tags.slice(0, 4).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              sx={{
                bgcolor: alpha(currentTheme.primary, 0.08),
                color: currentTheme.primary,
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label={RESOURCE_KIND_LABEL[kind] || kind}
            size="small"
            sx={{ bgcolor: alpha(currentTheme.primary, 0.12), color: currentTheme.primary }}
          />
          {item.category ? (
            <Chip
              label={item.category}
              size="small"
              variant="outlined"
              sx={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
            />
          ) : null}
          {item.version ? (
            <Chip
              label={`v${String(item.version).replace(/^v/i, '')}`}
              size="small"
              variant="outlined"
              sx={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
            />
          ) : null}
          {item.language ? (
            <Chip
              label={item.language}
              size="small"
              variant="outlined"
              sx={{ borderColor: currentTheme.border, color: currentTheme.textSecondary }}
            />
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
};

export function findToolkitItemForPin(toolkitResponse, pin) {
  const tk = toolkitResponse?.toolkit;
  if (!tk || typeof tk !== 'object') return null;
  const pid = String(pin.id).trim();
  const sub = pin.toolkitSubtype || inferToolkitSubtypeFromPath(pin.path);

  const match = (item) => {
    if (!item) return false;
    const ids = [item.uuid, item.id, item.name, item.shortName].filter(Boolean).map(String);
    return ids.some((x) => x === pid || encodeURIComponent(x) === pid);
  };

  const pickFrom = (arr) => (Array.isArray(arr) ? arr.find(match) : null);

  if (sub === 'toolkits') return pickFrom(tk.toolkits);
  if (sub === 'functions') return pickFrom(tk.functions);
  if (sub === 'containers') return pickFrom(tk.containers);
  if (sub === 'infrastructure' || sub === 'terraform') {
    return pickFrom(tk.infrastructure) || pickFrom(tk.terraform);
  }
  if (sub === 'package') return pickFrom(tk.packages);

  return (
    pickFrom(tk.toolkits) ||
    pickFrom(tk.functions) ||
    pickFrom(tk.containers) ||
    pickFrom(tk.packages) ||
    pickFrom(tk.infrastructure) ||
    pickFrom(tk.terraform)
  );
}

export default ToolkitPinnedCard;
