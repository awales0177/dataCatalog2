/**
 * URL paths for full-screen Workbench modals (Agora, Modeler, Rule builder, Reference data).
 * Use these for navigate() so links are shareable and the browser back button works.
 */

/**
 * Pass on `navigate(WORKBENCH_PATHS.ruleBuilder, { state: { ... } })` so RuleBuilderModal
 * opens directly on that model (skips picker when the short name matches).
 */
export const RULE_BUILDER_MODEL_SHORT_NAME_KEY = 'ruleBuilderModelShortName';

/** Where to return when closing a workbench route (set when entering). */
export const WORKBENCH_RETURN_TO_KEY = 'workbenchReturnTo';

/** Safe in-app path after leaving workbench; never another workbench URL. */
export function normalizeWorkbenchReturnPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return '/';
  if (path.startsWith('/workbench/')) return '/';
  const hash = path.indexOf('#');
  return (hash >= 0 ? path.slice(0, hash) : path) || '/';
}

/** Path to navigate to when closing workbench (from `location.state`). */
export function getWorkbenchExitPath(location) {
  return normalizeWorkbenchReturnPath(location?.state?.[WORKBENCH_RETURN_TO_KEY]);
}

/**
 * Merge into `navigate(workbenchPath, { state })` when opening a workbench.
 * @param {import('react-router-dom').Location} location
 * @param {Record<string, unknown>} [extraState] e.g. `{ [RULE_BUILDER_MODEL_SHORT_NAME_KEY]: 'sn' }`
 */
export function buildWorkbenchEnterState(location, extraState = null) {
  const pathname = location?.pathname || '/';
  const search = location?.search || '';
  let returnTo;
  if (pathname.startsWith('/workbench/')) {
    returnTo = location.state?.[WORKBENCH_RETURN_TO_KEY] ?? '/';
  } else {
    returnTo = pathname + search;
  }
  const base = {
    [WORKBENCH_RETURN_TO_KEY]: normalizeWorkbenchReturnPath(returnTo),
  };
  if (extraState && typeof extraState === 'object' && !Array.isArray(extraState)) {
    return { ...extraState, ...base };
  }
  return base;
}

export const WORKBENCH_PATHS = {
  agora: '/workbench/agora',
  modeling: '/workbench/modeling',
  /** Agora + Modeler side-by-side on wide screens */
  studio: '/workbench/studio',
  ruleBuilder: '/workbench/rule-builder',
  referenceData: '/workbench/reference-data',
};

/** Valid `workbenchKey` segment for `/workbench/:workbenchKey` */
export const WORKBENCH_ALLOWED_KEYS = new Set([
  'agora',
  'modeling',
  'studio',
  'rule-builder',
  'reference-data',
]);

export function workbenchModalStateFromPath(pathname) {
  const base = {
    agoraOpen: false,
    modelingOpen: false,
    ruleBuilderOpen: false,
  };
  if (pathname === WORKBENCH_PATHS.studio) {
    return { ...base, agoraOpen: true, modelingOpen: true };
  }
  if (pathname === WORKBENCH_PATHS.agora) return { ...base, agoraOpen: true };
  if (pathname === WORKBENCH_PATHS.modeling) return { ...base, modelingOpen: true };
  if (pathname === WORKBENCH_PATHS.ruleBuilder) return { ...base, ruleBuilderOpen: true };
  return base;
}

export function workbenchOpenAgora(currentPath) {
  if (currentPath === WORKBENCH_PATHS.modeling) return WORKBENCH_PATHS.studio;
  return WORKBENCH_PATHS.agora;
}

export function workbenchOpenModeling(currentPath) {
  if (currentPath === WORKBENCH_PATHS.agora) return WORKBENCH_PATHS.studio;
  return WORKBENCH_PATHS.modeling;
}

export function workbenchCloseAgora(currentPath) {
  if (currentPath === WORKBENCH_PATHS.studio) return WORKBENCH_PATHS.modeling;
  return '/';
}

export function workbenchCloseModeling(currentPath) {
  if (currentPath === WORKBENCH_PATHS.studio) return WORKBENCH_PATHS.agora;
  return '/';
}
