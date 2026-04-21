/** @typedef {{ disabled: boolean, comingSoon: boolean }} DisableFlags */

/**
 * Workbench carousel / home tile actions disabled for this deployment.
 * Keys match {@link ../constants/workbenchCarousel.js} `action` and home workspace tile mapping.
 */
const DISABLED_CAROUSEL_ACTIONS = new Set(['query', 'referenceHub', 'studio', 'modeling']);

/** Stub: UUX reads `disable.json`; sidebar nav items use id. */
export function getSidebarDisable(_id) {
  return { disabled: false, comingSoon: false };
}

/** @param {string | undefined} action */
export function getHomeCarouselDisable(action) {
  if (action && DISABLED_CAROUSEL_ACTIONS.has(action)) {
    return { disabled: true, comingSoon: false };
  }
  return { disabled: false, comingSoon: false };
}
