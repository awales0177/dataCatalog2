/**
 * Toolkit hub URLs: /toolkit/:id (technology routes under /toolkit/:id/technology/...).
 * Prefer item.uuid in routes when present; legacy slug/id still resolves.
 */

const base = (toolkitId) => {
  if (toolkitId == null || toolkitId === '') return '/toolkit';
  return `/toolkit/${encodeURIComponent(String(toolkitId))}`;
};

/** Stable id for routing/API: uuid when set, else legacy id */
export function workbenchCanonicalRef(t) {
  if (!t) return '';
  return t.uuid || t.id;
}

export function workbenchTechnologyCanonicalRef(tech) {
  if (!tech) return '';
  return tech.uuid || tech.id;
}

export function workbenchPath(toolkitId) {
  return base(toolkitId);
}

export function workbenchEditPath(toolkitId) {
  return `${base(toolkitId)}/edit`;
}

export function workbenchTechnologyCreatePath(toolkitId) {
  return `${base(toolkitId)}/technology/create`;
}

export function workbenchTechnologyPath(toolkitId, technologyId) {
  return `${base(toolkitId)}/technology/${encodeURIComponent(String(technologyId))}`;
}

export function workbenchTechnologyReadmePath(toolkitId, technologyId, readmeType) {
  return `${workbenchTechnologyPath(toolkitId, technologyId)}/readme/${encodeURIComponent(readmeType)}`;
}

/** Match hub by uuid, primary id, or legacy itemId / item_id slug (for bookmarks). */
export function findWorkbenchToolkit(toolkits, toolkitId) {
  if (!toolkits?.length || toolkitId == null || toolkitId === '') return null;
  const tid = String(toolkitId).trim();
  const kl = tid.toLowerCase();
  let found = toolkits.find(
    (t) =>
      (t.uuid != null && String(t.uuid).toLowerCase() === kl) || String(t.id) === tid,
  );
  if (found) return { toolkit: found, canonicalId: workbenchCanonicalRef(found) };
  found = toolkits.find(
    (t) =>
      (t.itemId != null && String(t.itemId) === tid) ||
      (t.item_id != null && String(t.item_id) === tid),
  );
  if (found) return { toolkit: found, canonicalId: workbenchCanonicalRef(found) };
  return null;
}

export function findWorkbenchTechnology(toolkit, technologyId) {
  if (!toolkit?.technologies?.length || technologyId == null || technologyId === '') return null;
  const tid = String(technologyId).trim();
  const kl = tid.toLowerCase();
  const found = toolkit.technologies.find(
    (x) =>
      (x.uuid != null && String(x.uuid).toLowerCase() === kl) || String(x.id) === tid,
  );
  if (found) return { technology: found, canonicalId: workbenchTechnologyCanonicalRef(found) };
  return null;
}
