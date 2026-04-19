import { alpha } from '@mui/material/styles';

/**
 * Frosted chrome — strong blur + low-opacity tint + sheen so it reads as glass
 * even when little scrolls behind fixed navbar/sidebar (flat backdrop still picks up blur + gradient).
 */
export function glassChromeSx(currentTheme, darkMode, { edge = 'none' } = {}) {
  const card = currentTheme.card;
  const blur = 'blur(44px) saturate(200%)';
  const tint = alpha(card, darkMode ? 0.18 : 0.32);

  const sheen = darkMode
    ? `linear-gradient(165deg, ${alpha('#ffffff', 0.28)} 0%, ${alpha('#ffffff', 0.06)} 22%, transparent 48%), linear-gradient(215deg, transparent 55%, ${alpha('#000000', 0.45)} 100%)`
    : `linear-gradient(165deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#ffffff', 0.38)} 28%, ${alpha('#ffffff', 0.1)} 52%, transparent 72%)`;

  const base = {
    position: 'relative',
    isolation: 'isolate',
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    background: `${sheen}, ${tint}`,
    boxShadow: darkMode
      ? `0 12px 48px -12px ${alpha('#000000', 0.55)}, inset 0 1px 0 ${alpha('#ffffff', 0.14)}`
      : `0 12px 40px -10px ${alpha('#000000', 0.14)}, inset 0 1px 0 ${alpha('#ffffff', 0.85)}`,
  };

  const edges = {};
  if (edge === 'bottom') {
    edges.borderBottom = `1px solid ${alpha(darkMode ? '#ffffff' : '#000000', darkMode ? 0.22 : 0.1)}`;
    edges.boxShadow = darkMode
      ? `${base.boxShadow}, inset 0 -1px 0 ${alpha('#000000', 0.35)}`
      : `${base.boxShadow}, inset 0 -1px 0 ${alpha('#000000', 0.06)}`;
  }
  if (edge === 'right') {
    edges.borderRight = `1px solid ${alpha(darkMode ? '#ffffff' : '#000000', darkMode ? 0.2 : 0.12)}`;
    edges.boxShadow = darkMode
      ? `${base.boxShadow}, inset -1px 0 0 ${alpha('#ffffff', 0.08)}`
      : `${base.boxShadow}, inset -1px 0 0 ${alpha('#ffffff', 0.65)}`;
  }

  const { boxShadow: _outerShadow, ...restBase } = base;
  if (edge === 'bottom' || edge === 'right') {
    return { ...restBase, ...edges };
  }
  return { ...base };
}

/** Sticky main column header: light frost when scrolled (see MainGlassHeader). */
export function mainHeaderGlassSx(currentTheme, darkMode) {
  const blur = 'blur(22px) saturate(165%)';
  const base = currentTheme.background || (darkMode ? '#0f0f0f' : '#f5f5f5');
  const tint = alpha(base, darkMode ? 0.28 : 0.42);
  const sheen = darkMode
    ? `linear-gradient(180deg, ${alpha('#ffffff', 0.14)} 0%, transparent 65%)`
    : `linear-gradient(180deg, ${alpha('#ffffff', 0.65)} 0%, ${alpha('#ffffff', 0.12)} 100%)`;
  return {
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    background: `${sheen}, ${tint}`,
    borderBottom: `1px solid ${alpha(darkMode ? '#ffffff' : '#000000', darkMode ? 0.14 : 0.09)}`,
    boxShadow: darkMode
      ? `0 10px 36px -12px ${alpha('#000000', 0.4)}`
      : `0 10px 28px -10px ${alpha('#000000', 0.1)}`,
  };
}

/** At rest (scroll top): no frost so the bar reads as absent. */
export function mainHeaderRestSx() {
  return {
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    background: 'transparent',
    borderBottom: '1px solid transparent',
    boxShadow: 'none',
  };
}

/** Smaller glass tiles (sidebar collapse / visibility). */
export function glassControlSx(currentTheme, darkMode) {
  const blur = 'blur(20px) saturate(190%)';
  const tint = alpha(currentTheme.card, darkMode ? 0.35 : 0.55);
  const sheen = darkMode
    ? `linear-gradient(145deg, ${alpha('#ffffff', 0.35)} 0%, transparent 55%)`
    : `linear-gradient(145deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#ffffff', 0.2)} 50%, transparent 75%)`;

  return {
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    background: `${sheen}, ${tint}`,
    border: `1px solid ${alpha(darkMode ? '#ffffff' : '#000000', darkMode ? 0.24 : 0.14)}`,
    boxShadow: darkMode
      ? `0 4px 20px ${alpha('#000000', 0.45)}, inset 0 1px 0 ${alpha('#ffffff', 0.12)}`
      : `0 4px 18px ${alpha('#000000', 0.1)}, inset 0 1px 0 ${alpha('#ffffff', 0.8)}`,
  };
}
