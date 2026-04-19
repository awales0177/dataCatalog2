/**
 * Shareable URLs for workbench modals (query, modeling, split studio, rule builder, RDH).
 * Synced with {@link WorkbenchModalsProvider} via pathname.
 */

export const WORKBENCH_RETURN_TO_KEY = 'workbenchReturnTo';

export const WORKBENCH_PATHS = {
  query: '/workbench/query',
  modeling: '/workbench/modeling',
  /** Query + modeling side-by-side on wide screens */
  studio: '/workbench/studio',
  ruleBuilder: '/workbench/rule-builder',
  referenceData: '/workbench/reference-data',
};

/** Valid middle segment for `/workbench/:segment` */
export const WORKBENCH_ALLOWED_KEYS = new Set([
  'query',
  'modeling',
  'studio',
  'rule-builder',
  'reference-data',
]);

export function isWorkbenchPath(pathname) {
  return typeof pathname === 'string' && pathname.startsWith('/workbench/');
}

export function normalizeWorkbenchReturnPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return '/';
  if (path.startsWith('/workbench/')) return '/';
  const hash = path.indexOf('#');
  return (hash >= 0 ? path.slice(0, hash) : path) || '/';
}

export function getWorkbenchExitPath(location) {
  const raw = location?.state?.[WORKBENCH_RETURN_TO_KEY];
  return normalizeWorkbenchReturnPath(typeof raw === 'string' ? raw : '/') || '/';
}

/**
 * Merge into `navigate(workbenchPath, { state })` when opening a workbench from a normal catalog page.
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

export function workbenchModalFlagsFromPath(pathname) {
  const base = {
    queryOpen: false,
    modelingOpen: false,
    ruleBuilderOpen: false,
    referenceHubOpen: false,
  };
  switch (pathname) {
    case WORKBENCH_PATHS.studio:
      return { ...base, queryOpen: true, modelingOpen: true };
    case WORKBENCH_PATHS.query:
      return { ...base, queryOpen: true };
    case WORKBENCH_PATHS.modeling:
      return { ...base, modelingOpen: true };
    case WORKBENCH_PATHS.ruleBuilder:
      return { ...base, ruleBuilderOpen: true };
    case WORKBENCH_PATHS.referenceData:
      return { ...base, referenceHubOpen: true };
    default:
      return base;
  }
}
