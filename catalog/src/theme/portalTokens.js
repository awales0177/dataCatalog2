/**
 * Shared “enterprise portal” palette (header, footer, sidebar) — aligned with UUX dh.
 * Accent matches My Dashboard CTAs (`#37ABBF` / `#2a8a9a`).
 */
export const catalogAccent = {
  main: '#37ABBF',
  hover: '#2a8a9a',
  rgb: '55, 171, 191',
};

export const catalogHeroGradients = {
  light: `linear-gradient(
    168deg,
    color-mix(in srgb, #1e1e20 90%, #37ABBF 10%) 0%,
    #1e1e20 48%,
    color-mix(in srgb, #1e1e20 93%, #0a0c10 7%) 100%
  )`,
  dark: `linear-gradient(
    168deg,
    #141518 0%,
    color-mix(in srgb, #1e1e20 92%, #37ABBF 8%) 42%,
    #1e1e20 55%,
    #0a0b0d 100%
  )`,
};

export const portalColors = {
  navy: '#2c3445',
  navyElevated: '#343d50',
  pageBg: '#f9f9f9',
  accent: catalogAccent.main,
  accentHover: catalogAccent.hover,
  accentSoft: `rgba(${catalogAccent.rgb}, 0.14)`,
  accentSoftHover: `rgba(${catalogAccent.rgb}, 0.22)`,
  onNavy: '#ffffff',
  onNavyMuted: 'rgba(255, 255, 255, 0.72)',
  borderOnNavy: 'rgba(255, 255, 255, 0.12)',
};
