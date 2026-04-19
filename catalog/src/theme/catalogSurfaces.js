import { alpha } from '@mui/material/styles';

/** Matches `HomeWorkspaceSection` tiles — default elevation */
export function catalogCardRestShadow(isDark) {
  return isDark
    ? '0 4px 20px rgba(0, 0, 0, 0.25)'
    : '0 4px 16px rgba(15, 35, 52, 0.08)';
}

export function catalogCardHoverShadow(isDark, primary) {
  return isDark
    ? '0 6px 24px rgba(0, 0, 0, 0.35)'
    : `0 8px 24px ${alpha(primary, 0.18)}`;
}

/** `Paper` at rest only (no hover) — matches workspace outline + shadow. */
export function catalogStaticPaperSx(currentTheme) {
  const isDark = Boolean(currentTheme?.darkMode);
  return {
    bgcolor: currentTheme.card,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: 2,
    boxShadow: catalogCardRestShadow(isDark),
    transition: (theme) =>
      theme.transitions.create(['box-shadow', 'border-color'], {
        duration: theme.transitions.duration.short,
      }),
  };
}

/** `sx` merge for clickable `Paper` tiles (same outline + shadow as workspace cards). */
export function catalogInteractivePaperSx(currentTheme) {
  const isDark = Boolean(currentTheme?.darkMode);
  const primary = currentTheme?.primary ?? '#37ABBF';
  return {
    bgcolor: currentTheme.card,
    border: `1px solid ${currentTheme.border}`,
    borderRadius: 2,
    boxShadow: catalogCardRestShadow(isDark),
    transition: (theme) =>
      theme.transitions.create(['box-shadow', 'border-color', 'opacity'], {
        duration: theme.transitions.duration.short,
      }),
    '&:hover': {
      borderColor: primary,
      boxShadow: catalogCardHoverShadow(isDark, primary),
    },
  };
}

/** `createTheme({ components })` fragment for `MuiCard`. */
export function catalogMuiCardOverrides() {
  return {
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme }) => {
          const isDark = theme.palette.mode === 'dark';
          return {
            borderRadius: theme.spacing(2),
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: catalogCardRestShadow(isDark),
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            overflow: 'visible',
            transition: theme.transitions.create(['box-shadow', 'border-color'], {
              duration: theme.transitions.duration.short,
            }),
            '&:hover': {
              borderColor: theme.palette.primary.main,
              boxShadow: catalogCardHoverShadow(isDark, theme.palette.primary.main),
            },
          };
        },
      },
    },
  };
}
