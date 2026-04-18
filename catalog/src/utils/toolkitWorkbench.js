/** Toolkit workbench URLs under /toolkit/toolkit/:id (dataCatalog2 routing). */

const base = (toolkitId) => {
  if (toolkitId == null || toolkitId === '') return '/toolkit';
  return `/toolkit/toolkit/${encodeURIComponent(String(toolkitId))}`;
};

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

/** Match workbench by primary id or legacy itemId / item_id slug (for bookmarks). */
export function findWorkbenchToolkit(toolkits, toolkitId) {
  if (!toolkits?.length || toolkitId == null || toolkitId === '') return null;
  const tid = String(toolkitId);
  let found = toolkits.find((t) => String(t.id) === tid);
  if (found) return { toolkit: found, canonicalId: String(found.id) };
  found = toolkits.find(
    (t) =>
      (t.itemId != null && String(t.itemId) === tid) ||
      (t.item_id != null && String(t.item_id) === tid),
  );
  if (found) return { toolkit: found, canonicalId: String(found.id) };
  return null;
}
