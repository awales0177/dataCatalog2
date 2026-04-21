import { WORKBENCH_PATHS, isWorkbenchPath } from '../constants/workbenchPaths';

/**
 * Browser tab title for a route before an optional entity label is applied
 * (see DocumentTitleProvider: `Entity · ${base}`).
 */
export function getStaticDocumentTitle(path) {
  if (path === '/') return 'Home';
  if (path === '/workspaces') return 'Workspaces';
  if (path === '/models') return 'Data Models';
  if (path === '/agreements') return 'Product Agreements';
  if (path === '/domains') return 'Data Domains';
  if (path === '/applications') return 'Data Teams';
  if (path === '/toolkit') return 'Toolkit';
  if (path === '/toolkit/import') return 'Import toolkit';
  if (path.startsWith('/toolkit/function/')) {
    if (path.includes('/edit') || path.endsWith('/new')) return 'Edit function';
    return 'Function';
  }
  if (path.startsWith('/toolkit/sop/')) return 'SOP';
  if (path.startsWith('/toolkit/package/')) {
    if (path.includes('/edit') || path.endsWith('/new')) return 'Edit package';
    return 'Package';
  }
  if (path.startsWith('/toolkit/container/')) {
    if (path.includes('/edit') || path.endsWith('/new')) return 'Edit container';
    return 'Container';
  }
  if (path.startsWith('/toolkit/infrastructure/')) {
    if (path.includes('/edit') || path.endsWith('/new')) return 'Edit infrastructure';
    return 'Infrastructure';
  }
  if (path === '/toolkit/create') return 'New toolkit';
  if (path.startsWith('/toolkit/') && path.includes('/technology/')) {
    if (path.includes('/readme/')) return 'Technology readme';
    if (path.includes('/technology/create')) return 'New technology';
    if (path.includes('/technology/') && path.includes('/edit')) return 'Edit technology';
    return 'Technology';
  }
  if (path.startsWith('/toolkit/') && path.includes('/edit')) return 'Edit toolkit';
  if (path.startsWith('/toolkit/')) return 'Toolkit';
  if (path === '/standards') return 'Data Standards';
  if (path === '/standards/create' || path.startsWith('/standards/edit/')) return 'Data Standard';
  if (path.startsWith('/standards/')) return 'Data Standard';
  if (path === '/glossary') return 'Glossary';
  if (path.includes('/glossary/') && path.includes('/markdown')) return 'Glossary markdown';
  if (path === '/glossary/create' || path.startsWith('/glossary/')) return 'Glossary term';
  if (path === '/settings') return 'Settings';
  if (path === '/rules') return 'Data Quality Rules';
  if (path === '/users') return 'Users';
  if (path === '/statistics') return 'Statistics';
  if (path === '/applications/create' || path.startsWith('/applications/edit/')) return 'Edit application';
  if (path.startsWith('/models/')) {
    if (path.includes('/edit')) return 'Edit data model';
    if (path.includes('/markdown/')) return 'Model markdown';
    return 'Data model';
  }
  if (path.startsWith('/agreements/')) {
    if (path.includes('/edit') || path.endsWith('/create')) return 'Edit agreement';
    return 'Agreement';
  }
  if (path === WORKBENCH_PATHS.query) return 'Query workbench';
  if (path === WORKBENCH_PATHS.modeling) return 'Data modeling';
  if (path === WORKBENCH_PATHS.studio) return 'Modeling studio';
  if (path === WORKBENCH_PATHS.ruleBuilder) return 'Rule builder';
  if (path === WORKBENCH_PATHS.referenceData) return 'Reference data hub';
  if (isWorkbenchPath(path)) return 'Workbench';
  if (path === '/role') return 'Role';
  if (path === '/unauthorized') return 'Unauthorized';
  return 'Catalog';
}
