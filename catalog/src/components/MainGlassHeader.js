import React from 'react';
import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Home as HomeIcon,
  GitHub as GitHubIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mainHeaderGlassSx, mainHeaderRestSx } from '../theme/glassStyle';
import { portalColors } from '../theme/portalTokens';

const BANNER_TEXT = 'new website';
const SCROLL_THRESHOLD_PX = 8;

export default function MainGlassHeader({
  currentTheme,
  darkMode,
  onThemeToggle,
  onOpenSearch,
  onDrawerToggle,
  onInfoSidebarToggle,
  scrollContainerRef,
}) {
  const theme = useTheme();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = React.useState(false);
  const isDark = Boolean(darkMode);
  const pageSurface = currentTheme.background || (isDark ? '#0f0f0f' : '#f5f5f5');
  const SIDEBAR_TEXT = isDark ? currentTheme.text : '#1e293b';
  const SIDEBAR_BORDER = isDark
    ? currentTheme.border || 'rgba(255, 255, 255, 0.1)'
    : 'rgba(44, 52, 69, 0.1)';
  const SIDEBAR_HOVER = alpha(currentTheme?.primary || portalColors.accent, 0.06);
  const navCardShadow = isDark
    ? '0 10px 36px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255,255,255,0.06)'
    : '0 10px 36px rgba(44, 52, 69, 0.1), 0 0 0 1px rgba(44, 52, 69, 0.06)';

  const controlIconSx = {
    bgcolor: pageSurface,
    border: `1px solid ${SIDEBAR_BORDER}`,
    width: 28,
    height: 28,
    color: SIDEBAR_TEXT,
    boxShadow: navCardShadow,
    '&:hover': { bgcolor: SIDEBAR_HOVER },
  };

  const syncScrolled = React.useCallback(() => {
    const el = scrollContainerRef?.current;
    if (!el) return;
    setScrolled(el.scrollTop > SCROLL_THRESHOLD_PX);
  }, [scrollContainerRef]);

  React.useEffect(() => {
    const el = scrollContainerRef?.current;
    if (!el) return undefined;
    syncScrolled();
    el.addEventListener('scroll', syncScrolled, { passive: true });
    return () => el.removeEventListener('scroll', syncScrolled);
  }, [scrollContainerRef, syncScrolled]);

  React.useEffect(() => {
    syncScrolled();
  }, [location.pathname, syncScrolled]);

  const gray = isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(100, 116, 139, 0.85)';

  const glassLayer = scrolled ? mainHeaderGlassSx(currentTheme, darkMode) : mainHeaderRestSx();

  return (
    <Box
      component="header"
      aria-label="Site header"
      sx={{
        position: 'sticky',
        top: 0,
        isolation: 'isolate',
        zIndex: theme.zIndex.drawer - 10,
        flexShrink: 0,
        mb: 0,
        pl: { xs: 1.5, sm: 2 },
        pr: (t) => t.spacing(3),
        py: { xs: 1, sm: 1.125 },
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minHeight: 44,
        width: '100%',
        maxWidth: '100%',
        transition: theme.transitions.create(['backdrop-filter', 'background-color', 'box-shadow', 'border-color'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...glassLayer,
      }}
    >
      <Tooltip title="Menu" placement="bottom">
        <IconButton
          onClick={onDrawerToggle}
          size="small"
          aria-label="open navigation"
          sx={{
            ...controlIconSx,
            position: 'absolute',
            left: { xs: 12, sm: 16 },
            display: { xs: 'inline-flex', sm: 'none' },
          }}
        >
          <MenuIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>

      <Typography
        component="span"
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          color: gray,
          fontSize: '0.8125rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'lowercase',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          maxWidth: { xs: 'calc(100% - 200px)', sm: 'calc(100% - 280px)' },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
        }}
      >
        {BANNER_TEXT}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
        <Tooltip title="Home" placement="bottom" arrow>
          <IconButton component={Link} to="/" size="small" sx={controlIconSx} aria-label="Home">
            <HomeIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="View on GitHub" placement="bottom" arrow>
          <IconButton
            component="a"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={controlIconSx}
            aria-label="GitHub"
          >
            <GitHubIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        {isAuthenticated?.() && onOpenSearch ? (
          <Tooltip title="Search (Ctrl+K)" placement="bottom" arrow>
            <IconButton size="small" onClick={onOpenSearch} sx={controlIconSx}>
              <SearchIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        ) : null}
        {onThemeToggle ? (
          <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'} placement="bottom" arrow>
            <IconButton size="small" onClick={onThemeToggle} sx={controlIconSx}>
              {darkMode ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        ) : null}
        {onInfoSidebarToggle ? (
          <Tooltip title="Information" placement="bottom" arrow>
            <IconButton
              size="small"
              onClick={onInfoSidebarToggle}
              sx={controlIconSx}
              aria-label="Open information panel"
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
    </Box>
  );
}
