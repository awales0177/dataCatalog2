import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { Paper, Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { catalogInteractivePaperSx, catalogStaticPaperSx } from '../theme/catalogSurfaces';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Compact card: avatar slot, title, short description (clamped), optional chip / footer / trailing.
 * Use for model Tools tab, Product agreements, etc.
 */
export default function MiniCard({
  title,
  description,
  avatar,
  chip = null,
  trailing = null,
  footer = null,
  /** Router link */
  to,
  /** External / anchor */
  href,
  target,
  rel,
  onClick,
  descriptionVariant = 'body2',
  descriptionLines = 2,
  descriptionSx = {},
  sx: sxProp = {},
}) {
  const { currentTheme } = useContext(ThemeContext);
  const clickable = Boolean(to || href || onClick);
  const darkMode = Boolean(currentTheme?.darkMode);

  const cardSx = {
    p: 2,
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
    cursor: clickable ? 'pointer' : 'default',
    ...(clickable ? catalogInteractivePaperSx(currentTheme) : catalogStaticPaperSx(currentTheme)),
    ...sxProp,
  };

  const content = (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(currentTheme?.primary || '#37ABBF', darkMode ? 0.2 : 0.12),
          color: currentTheme?.primary,
          overflow: 'hidden',
        }}
      >
        {avatar}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: description || footer ? 0.5 : 0,
          }}
        >
          <Typography
            variant="subtitle1"
            component="span"
            sx={{ color: currentTheme.text, fontWeight: 600, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {chip}
        </Box>
        {description ? (
          <Typography
            variant={descriptionVariant}
            component="div"
            sx={{
              color: currentTheme.textSecondary,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: descriptionLines,
              WebkitBoxOrient: 'vertical',
              ...descriptionSx,
            }}
          >
            {description}
          </Typography>
        ) : null}
        {footer ? <Box sx={{ mt: description ? 1 : 0.5 }}>{footer}</Box> : null}
      </Box>
      {trailing ? (
        <Box sx={{ flexShrink: 0, pt: 0.25, color: currentTheme.textSecondary }}>{trailing}</Box>
      ) : null}
    </Box>
  );

  if (to) {
    return (
      <Paper component={RouterLink} to={to} elevation={0} sx={cardSx} onClick={onClick}>
        {content}
      </Paper>
    );
  }
  if (href) {
    return (
      <Paper
        component="a"
        href={href}
        target={target}
        rel={rel}
        elevation={0}
        sx={cardSx}
        onClick={onClick}
      >
        {content}
      </Paper>
    );
  }
  return (
    <Paper elevation={0} sx={cardSx} onClick={onClick}>
      {content}
    </Paper>
  );
}
