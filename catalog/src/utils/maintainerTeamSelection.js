/**
 * TeamSelector uses application names; map legacy numeric maintainer id when possible.
 * @param {string|number|null|undefined} storedMaintainer - Saved maintainer (name or legacy id).
 * @param {Array<{ id?: string|number, name?: string }>} applications
 * @returns {string[]}
 */
export function maintainerToTeamSelectorSelection(storedMaintainer, applications) {
  if (storedMaintainer == null || String(storedMaintainer).trim() === '') return [];
  const s = String(storedMaintainer).trim();
  const byId = (applications || []).find((a) => String(a.id) === s);
  if (byId) return [byId.name];
  return [s];
}
