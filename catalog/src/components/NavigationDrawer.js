import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  alpha,
  Chip,
  Paper,
  Divider,
  Avatar,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Visibility as EyeIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Diamond as CrownIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import {
  collapsedDrawerWidth,
  drawerWidth,
  sidebarFloatInset,
  sidebarBottomLift,
  sidebarBorderRadius,
} from '../constants/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useWorkbenchModals } from '../contexts/WorkbenchModalsContext';
import Logo from './Logo';
import { portalColors } from '../theme/portalTokens';
import { getSidebarDisable, getHomeCarouselDisable } from '../utils/disableConfig';
import { WORKBENCH_CAROUSEL_ITEMS } from '../constants/workbenchCarousel';
import packageJson from '../../package.json';

const NavigationDrawer = ({
  currentTheme,
  mobileOpen,
  onDrawerToggle,
  isDrawerCollapsed,
  onDrawerCollapse,
  menuData,
  avatarColor,
  sidebarVisibilityMode,
  onSidebarVisibilityToggle,
}) => {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentRole, isAdmin, canEdit } = useAuth();
  const {
    agoraOpen,
    modelingOpen,
    openAgora,
    openModeling,
    openRuleBuilder,
    openReferenceHub,
  } = useWorkbenchModals();
  const canEditRules = Boolean(canEdit?.() || isAdmin?.());

  const getWorkbenchCarouselHandler = (item) => {
    if (item.action === 'agora') {
      return () => openAgora();
    }
    if (item.action === 'modeling') {
      return () => openModeling();
    }
    if (item.action === 'rules') {
      if (!canEditRules) return undefined;
      return () => openRuleBuilder();
    }
    if (item.action === 'referenceHub') {
      return () => openReferenceHub();
    }
    return undefined;
  };

  const sidebarFlags = (id) => getSidebarDisable(id);

  const isDark = Boolean(currentTheme?.darkMode);
  const pageSurface =
    currentTheme.background || (isDark ? '#0f0f0f' : '#f5f5f5');
  const SIDEBAR_TEXT = isDark ? currentTheme.text : '#1e293b';
  const SIDEBAR_TEXT_MUTED = isDark ? currentTheme.textSecondary : '#64748b';
  const SIDEBAR_BORDER = isDark
    ? currentTheme.border || 'rgba(255, 255, 255, 0.1)'
    : 'rgba(44, 52, 69, 0.1)';
  const accent = currentTheme?.primary || portalColors.accent;
  const SIDEBAR_ACCENT = accent;
  const SIDEBAR_HOVER = alpha(accent, 0.06);
  const SIDEBAR_SELECTED_BG = alpha(accent, 0.1);
  const SIDEBAR_SELECTED_HOVER_BG = alpha(accent, 0.14);
  const NAV_DISABLED_OPACITY = 0.42;

  const navCardShadow = isDark
    ? '0 10px 36px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255,255,255,0.06)'
    : '0 10px 36px rgba(44, 52, 69, 0.1), 0 0 0 1px rgba(44, 52, 69, 0.06)';

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <CrownIcon />;
      case 'editor':
        return <EditIcon />;
      case 'reader':
        return <EyeIcon />;
      default:
        return <EyeIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'editor':
        return 'secondary';
      case 'reader':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const handleChangeRole = () => {
    navigate('/role', { state: { changeRole: true, from: { pathname: window.location.pathname } } });
    if (!isSmUp) onDrawerToggle?.();
  };

  const railWidth = isDrawerCollapsed ? collapsedDrawerWidth : drawerWidth;
  const collapseDisabled =
    sidebarVisibilityMode === 'always-visible' || sidebarVisibilityMode === 'always-hidden';
  const drawerPaperTop = `${sidebarFloatInset + sidebarBottomLift}px`;

  const showDesktopRail = sidebarVisibilityMode !== 'always-hidden';

  const renderMenuItem = (item, { mobileLabels = false, showLabels = false } = {}) => {
    const labelsOn = Boolean(mobileLabels || showLabels);
    const isSelected =
      item.path === '/'
        ? location.pathname === item.path || location.pathname === ''
        : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    const { disabled: navDis, comingSoon: navSoon } = sidebarFlags(item.id);
    const tip = navDis
      ? navSoon
        ? 'Coming soon'
        : 'Unavailable'
      : [item.name, item.count != null ? `(${item.count})` : ''].filter(Boolean).join(' ');

    const row = (
      <Box
        sx={{
          position: 'relative',
          mx: labelsOn ? 0 : 0.5,
          my: isSelected ? 0.25 : 0,
        }}
      >
        <ListItem
          button
          {...(!navDis ? { component: Link, to: item.path } : { component: 'div' })}
          aria-disabled={navDis}
          selected={isSelected}
          onClick={
            navDis
              ? (e) => e.preventDefault()
              : mobileLabels
                ? () => onDrawerToggle?.()
                : undefined
          }
          sx={{
            color: SIDEBAR_TEXT,
            py: 1.1,
            px: labelsOn ? 1.5 : 1,
            justifyContent: labelsOn ? 'flex-start' : 'center',
            borderRadius: '10px',
            ...(navDis && {
              opacity: NAV_DISABLED_OPACITY,
              cursor: 'not-allowed',
            }),
            '&.Mui-selected': {
              bgcolor: SIDEBAR_SELECTED_BG,
              color: SIDEBAR_ACCENT,
              fontWeight: 600,
              '&:hover': { bgcolor: SIDEBAR_SELECTED_HOVER_BG },
            },
            '&:hover:not(.Mui-selected)': { bgcolor: SIDEBAR_HOVER },
          }}
        >
          <ListItemIcon
            sx={{
              color: 'inherit',
              minWidth: labelsOn ? 40 : 0,
              marginRight: labelsOn ? 1 : 0,
              justifyContent: 'center',
              '& svg': {
                width: item.id === 'home' ? '1.2rem' : '1.35rem',
                height: item.id === 'home' ? '1.2rem' : '1.35rem',
              },
            }}
          >
            {item.icon}
          </ListItemIcon>
          {labelsOn ? (
            <ListItemText
              primary={item.name}
              primaryTypographyProps={{ variant: 'body2', fontWeight: isSelected ? 600 : 500 }}
            />
          ) : null}
        </ListItem>
      </Box>
    );

    if (labelsOn) {
      return row;
    }

    return (
      <Tooltip title={tip} placement="right" arrow>
        {row}
      </Tooltip>
    );
  };

  const buildMenuList = (filteredItems, { mobileLabels, isDrawerCollapsed: railCollapsed }) =>
    filteredItems.map((item) => (
      <React.Fragment key={item.path}>
        {renderMenuItem(item, {
          mobileLabels,
          showLabels: Boolean(mobileLabels || !railCollapsed),
        })}
      </React.Fragment>
    ));

  const userFooter = (compact) => (
    <Box
      sx={{
        flexShrink: 0,
        p: compact ? 1 : 1.5,
        borderTop: `1px solid ${SIDEBAR_BORDER}`,
        display: 'flex',
        flexDirection: compact ? 'column' : 'row',
        alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? 1 : 1.5,
        justifyContent: compact ? 'center' : 'space-between',
      }}
    >
      {compact ? (
        <>
          <Tooltip title={user?.full_name || user?.username || 'User'} placement="right">
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: avatarColor,
                fontSize: '0.75rem',
              }}
            >
              {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
          {user && (
            <Tooltip
              title={`Role: ${(currentRole || 'reader').charAt(0).toUpperCase() + (currentRole || 'reader').slice(1)} — change`}
              placement="right"
            >
              <IconButton size="small" onClick={handleChangeRole} sx={{ color: SIDEBAR_TEXT_MUTED }}>
                {getRoleIcon(currentRole || 'reader')}
              </IconButton>
            </Tooltip>
          )}
        </>
      ) : (
        <>
          {user && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: SIDEBAR_TEXT }} noWrap>
                  {user?.full_name || user?.username}
                </Typography>
                <Chip
                  icon={getRoleIcon(currentRole || 'reader')}
                  label={(currentRole || 'reader').charAt(0).toUpperCase() + (currentRole || 'reader').slice(1)}
                  color={getRoleColor(currentRole || 'reader')}
                  size="small"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Box>
              <Button
                size="small"
                startIcon={<SwapHorizIcon />}
                onClick={handleChangeRole}
                sx={{ mt: 0.5, fontSize: '0.7rem', minWidth: 0, px: 0.5, color: SIDEBAR_TEXT_MUTED }}
              >
                Change role
              </Button>
            </Box>
          )}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <Tooltip title={user?.full_name || user?.username || 'User'} placement="right">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: avatarColor,
                  fontSize: '0.75rem',
                }}
              >
                {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
            <Typography
              variant="caption"
              sx={{ color: SIDEBAR_TEXT_MUTED, fontSize: '0.6rem', lineHeight: 1.2, textAlign: 'right' }}
            >
              v{packageJson.version}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );

  const carouselBlock = (compact) => (
    <Box
      sx={{
        flexShrink: 0,
        py: compact ? 1 : 1,
        px: compact ? 0.5 : 1,
        display: 'flex',
        flexDirection: compact ? 'column' : 'row',
        flexWrap: compact ? 'nowrap' : 'wrap',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        gap: compact ? 0.65 : 1,
        overflowX: compact ? 'visible' : 'auto',
      }}
    >
      {WORKBENCH_CAROUSEL_ITEMS.map((item, idx) => {
        const st = getHomeCarouselDisable(item.action);
        const handleClick = getWorkbenchCarouselHandler(item);
        const isClickable = Boolean(handleClick) && !st.disabled;
        return (
          <Tooltip key={idx} title={`${item.alt}: ${item.description}`} placement={compact ? 'top' : 'right'}>
            <Box
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={
                isClickable
                  ? () => {
                      handleClick?.();
                      if (!isSmUp) onDrawerToggle?.();
                    }
                  : undefined
              }
              onKeyDown={
                isClickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick?.();
                        if (!isSmUp) onDrawerToggle?.();
                      }
                    }
                  : undefined
              }
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1.5,
                width: compact ? 44 : 52,
                minHeight: compact ? 40 : 44,
                py: 0.35,
                ...(!isClickable || st.disabled
                  ? {
                      opacity: NAV_DISABLED_OPACITY,
                      cursor: 'not-allowed',
                      filter: 'grayscale(0.35)',
                    }
                  : { cursor: 'pointer', '&:hover': { bgcolor: SIDEBAR_HOVER } }),
              }}
            >
              {st.comingSoon ? (
                <Chip
                  label="Soon"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    height: 16,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    zIndex: 1,
                  }}
                />
              ) : null}
              <Box
                component="img"
                src={item.src}
                alt=""
                sx={{
                  height: compact ? 22 : 26,
                  width: 'auto',
                  maxWidth: compact ? 36 : 40,
                  objectFit: 'contain',
                }}
              />
              {!compact ? (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 0.25, textAlign: 'center' }}>
                  {item.alt}
                </Typography>
              ) : null}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );

  const drawerInner = ({ mobileLabels }) => {
    if (!menuData || !menuData.items) {
      return (
        <ListItem>
          <ListItemText primary="Loading..." sx={{ color: SIDEBAR_TEXT_MUTED, fontStyle: 'italic' }} />
        </ListItem>
      );
    }
    if (menuData.items.length === 0) {
      return (
        <ListItem>
          <ListItemText
            primary="No menu items available"
            sx={{ color: SIDEBAR_TEXT_MUTED, fontStyle: 'italic' }}
          />
        </ListItem>
      );
    }
    const filteredItems = menuData.items.filter((item) => {
      if (item.adminOnly && !isAdmin()) return false;
      if (item.editorOnly && !canEdit() && !isAdmin()) return false;
      return true;
    });

    return buildMenuList(filteredItems, {
      mobileLabels,
      isDrawerCollapsed: mobileLabels ? false : isDrawerCollapsed,
    });
  };

  const paperBody = ({ mobileLabels }) => (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        height: mobileLabels ? '100%' : '100%',
        bgcolor: pageSurface,
        color: SIDEBAR_TEXT,
        borderRadius: `${sidebarBorderRadius}px`,
        border: `1px solid ${SIDEBAR_BORDER}`,
        boxShadow: navCardShadow,
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          py: 1.25,
          px: mobileLabels ? 1 : isDrawerCollapsed ? 0.5 : 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: mobileLabels
            ? 'flex-start'
            : isDrawerCollapsed
              ? 'center'
              : 'flex-start',
          width: '100%',
          '& img': { height: mobileLabels ? 32 : 28, width: 'auto' },
        }}
      >
        <Logo currentTheme={currentTheme} />
      </Box>
      <List
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          py: 0.5,
          px: mobileLabels ? 0.5 : isDrawerCollapsed ? 0.25 : 0.75,
        }}
      >
        {drawerInner({ mobileLabels })}
      </List>

      <Divider sx={{ borderColor: SIDEBAR_BORDER, opacity: 1 }} />
      {carouselBlock(mobileLabels ? false : isDrawerCollapsed)}
      {userFooter(mobileLabels ? false : isDrawerCollapsed)}
    </Paper>
  );

  const controlIconSx = {
    bgcolor: pageSurface,
    border: `1px solid ${SIDEBAR_BORDER}`,
    width: 28,
    height: 28,
    boxShadow: navCardShadow,
    color: SIDEBAR_TEXT,
    '&:hover': { bgcolor: SIDEBAR_HOVER },
  };

  const collapseToggle = (
    <Box
      sx={{
        position: 'fixed',
        left: showDesktopRail ? `${sidebarFloatInset + railWidth + 4}px` : 16,
        top: drawerPaperTop,
        zIndex: (t) => t.zIndex.drawer + 1,
        display: { xs: 'none', sm: 'flex' },
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Tooltip
          title={
            collapseDisabled ? 'Change sidebar visibility mode to adjust width'
              : isDrawerCollapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
          }
          placement="right"
          arrow
        >
          <span>
            <IconButton
              onClick={onDrawerCollapse}
              disabled={collapseDisabled}
              size="small"
              sx={{
                ...controlIconSx,
                '&:disabled': { opacity: 0.45 },
              }}
              aria-label={isDrawerCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isDrawerCollapsed ? (
                <FiChevronRight style={{ fontSize: 18 }} />
              ) : (
                <FiChevronLeft style={{ fontSize: 18 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      {onSidebarVisibilityToggle ? (
        <Tooltip
          title={
            sidebarVisibilityMode === 'auto'
              ? 'Sidebar auto-collapses on detail pages'
              : sidebarVisibilityMode === 'always-visible'
                ? 'Sidebar is always visible'
                : 'Sidebar is hidden'
          }
          placement="right"
          arrow
        >
          <IconButton
            onClick={onSidebarVisibilityToggle}
            size="small"
            sx={{
              ...controlIconSx,
              color:
                sidebarVisibilityMode === 'always-visible'
                  ? SIDEBAR_ACCENT
                  : sidebarVisibilityMode === 'always-hidden'
                    ? theme.palette.error.main
                    : SIDEBAR_TEXT,
            }}
            aria-label="Sidebar visibility mode"
          >
            {sidebarVisibilityMode === 'always-visible' ? (
              <EyeIcon sx={{ fontSize: 18 }} />
            ) : sidebarVisibilityMode === 'always-hidden' ? (
              <VisibilityOffIcon sx={{ fontSize: 18 }} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <FiChevronLeft style={{ fontSize: 14 }} />
                <FiChevronRight style={{ fontSize: 14 }} />
              </Box>
            )}
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );

  return (
    <>
      {collapseToggle}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            maxWidth: 'min(100vw, 320px)',
            bgcolor: 'transparent',
            backgroundImage: 'none',
            border: 'none',
            p: `${sidebarFloatInset}px ${sidebarFloatInset}px ${sidebarFloatInset}px`,
          },
        }}
      >
        {paperBody({ mobileLabels: true })}
      </Drawer>

      {showDesktopRail ? (
        <Box
          component="nav"
          aria-label="Primary navigation"
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'fixed',
            left: `${sidebarFloatInset}px`,
            top: drawerPaperTop,
            bottom: `${sidebarFloatInset}px`,
            zIndex: (t) => t.zIndex.drawer,
            width: railWidth,
            maxWidth: `calc(100vw - ${sidebarFloatInset * 2}px)`,
            pointerEvents: 'auto',
            flexDirection: 'column',
            transition: (t) =>
              t.transitions.create('width', { duration: t.transitions.duration.shorter }),
          }}
        >
          {paperBody({ mobileLabels: false })}
        </Box>
      ) : null}
    </>
  );
};

export default NavigationDrawer;
