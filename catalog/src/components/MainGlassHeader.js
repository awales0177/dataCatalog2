import React, { useContext } from 'react';
import { Box, IconButton, Paper, Tooltip, Typography, useTheme } from '@mui/material';
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
import { ThemeContext } from '../contexts/ThemeContext';
import { mainHeaderGlassSx, mainHeaderRestSx } from '../theme/glassStyle';
import { portalColors } from '../theme/portalTokens';
import { sidebarBorderRadius, sidebarFloatInset } from '../constants/navigation';

const BANNER_TEXT = 'new website';
const SCROLL_THRESHOLD_PX = 8;

export default function MainGlassHeader({
  onThemeToggle,
  onOpenSearch,
  onDrawerToggle,
  onInfoSidebarToggle,
  scrollContainerRef,
}) {
  const { currentTheme, darkMode } = useContext(ThemeContext);
  const theme = useTheme();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = React.useState(false);
  const isDark = Boolean(darkMode);
  /** Match NavigationDrawer `Paper`: elevated card in dark mode, page background in light. */
  const pageSurface = isDark
    ? currentTheme.card || currentTheme.background || '#1e1e1e'
    : currentTheme.background || '#f5f5f5';
  /** Same outer radius as the sidebar `Paper` (smaller control overall, identical corner shape). */
  const trayCornerRadius = sidebarBorderRadius;
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

  /** Same surface recipe as `NavigationDrawer` `paperBody` `Paper` (floating rail card). */
  const iconTraySx = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.5,
    px: 1,
    py: 0.625,
    borderRadius: `${trayCornerRadius}px`,
    bgcolor: pageSurface,
    color: SIDEBAR_TEXT,
    border: `1px solid ${SIDEBAR_BORDER}`,
    boxShadow: navCardShadow,
    flexShrink: 0,
    overflow: 'hidden',
    backgroundImage: 'none',
  };

  /** Collapsed-rail list items use `borderRadius: 10px` and ~square hit targets. */
  const trayIconSx = {
    width: 36,
    height: 36,
    color: 'inherit',
    bgcolor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    borderRadius: '10px',
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
  const floatTopPx = `${sidebarFloatInset}px`;
  const floatZ = theme.zIndex.drawer + 1;

  return (
    <>
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
          px: { xs: 2, sm: 3 },
          py: { xs: 0.375, sm: 0.5 },
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: 30, sm: 32 },
          width: '100%',
          maxWidth: '100%',
          transition: theme.transitions.create(['backdrop-filter', 'background-color', 'box-shadow', 'border-color'], {
            duration: theme.transitions.duration.shorter,
          }),
          ...glassLayer,
        }}
      >
        <Typography
          component="span"
          sx={{
            color: gray,
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
            maxWidth: { xs: 'calc(100vw - 200px)', sm: 'min(100%, 560px)' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          {BANNER_TEXT}
        </Typography>
      </Box>

      {/* Floating chrome (same inset / z-index tier as sidebar collapse controls); header band scrolls behind it */}
      <Box
        sx={{
          position: 'fixed',
          top: floatTopPx,
          right: floatTopPx,
          zIndex: floatZ,
          pointerEvents: 'none',
          '& > *': { pointerEvents: 'auto' },
        }}
        aria-label="Header actions"
      >
        <Paper elevation={0} sx={iconTraySx}>
          <Tooltip title="Home" placement="bottom" arrow>
            <IconButton component={Link} to="/" sx={trayIconSx} aria-label="Home">
              <HomeIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="View on GitHub" placement="bottom" arrow>
            <IconButton
              component="a"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={trayIconSx}
              aria-label="GitHub"
            >
              <GitHubIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          {isAuthenticated?.() && onOpenSearch ? (
            <Tooltip title="Search (Ctrl+K)" placement="bottom" arrow>
              <IconButton onClick={onOpenSearch} sx={trayIconSx}>
                <SearchIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          ) : null}
          {onThemeToggle ? (
            <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'} placement="bottom" arrow>
              <IconButton onClick={onThemeToggle} sx={trayIconSx}>
                {darkMode ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>
          ) : null}
          {onInfoSidebarToggle ? (
            <Tooltip title="Information" placement="bottom" arrow>
              <IconButton
                onClick={onInfoSidebarToggle}
                sx={trayIconSx}
                aria-label="Open information panel"
              >
                <InfoOutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Paper>
      </Box>

      <Box
        sx={{
          position: 'fixed',
          top: floatTopPx,
          left: floatTopPx,
          zIndex: floatZ,
          display: { xs: 'block', sm: 'none' },
        }}
      >
        <Tooltip title="Menu" placement="bottom">
          <IconButton
            onClick={onDrawerToggle}
            size="small"
            aria-label="open navigation"
            sx={controlIconSx}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}
