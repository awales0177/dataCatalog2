/** @typedef {{ disabled: boolean, comingSoon: boolean }} DisableFlags */

/** Stub: UUX reads `disable.json`; this catalog enables all sidebar / carousel actions by default. */
export function getSidebarDisable(_id) {
  return { disabled: false, comingSoon: false };
}

/** @param {string | undefined} _action */
export function getHomeCarouselDisable(_action) {
  return { disabled: false, comingSoon: false };
}
