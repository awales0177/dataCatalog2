import {
  workbenchPath,
  workbenchTechnologyPath,
  workbenchCanonicalRef,
  workbenchTechnologyCanonicalRef,
} from './toolkitWorkbench';

function isHttpUrl(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s.trim());
}

/**
 * Flatten toolkit technologies for linking from data model "resources.tools".
 * @param {Array<object>} toolkits - toolkit.toolkits from API
 * @returns {Array<{ label: string, toolkitId: string, toolkitName: string, technologyId: string, techName: string, url: string }>}
 */
export function flattenToolkitTechnologyOptions(toolkits) {
  const out = [];
  for (const tk of toolkits || []) {
    const toolkitId = String(workbenchCanonicalRef(tk) ?? '');
    const toolkitName = tk.displayName || tk.name || toolkitId;
    for (const tech of tk.technologies || []) {
      const technologyId = String(workbenchTechnologyCanonicalRef(tech) ?? '');
      const techName = tech.name || technologyId;
      const doc = typeof tech.documentation === 'string' ? tech.documentation.trim() : '';
      const gh = typeof tech.githubRepo === 'string' ? tech.githubRepo.trim() : '';
      const url = isHttpUrl(doc)
        ? doc
        : isHttpUrl(gh)
          ? gh
          : tk.multipleTechnologies === false
            ? workbenchPath(toolkitId)
            : workbenchTechnologyPath(toolkitId, technologyId);
      out.push({
        label: `${toolkitName} — ${techName}`,
        toolkitId,
        toolkitName,
        technologyId,
        techName,
        url,
      });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

/**
 * Pick a unique key for resources.tools[name] = url.
 */
export function uniqueToolResourceKey(existingTools, techName, toolkitName, technologyId) {
  const tools = existingTools && typeof existingTools === 'object' ? existingTools : {};
  const base = techName || 'tool';
  if (!tools[base]) return base;
  const withTk = `${base} (${toolkitName})`;
  if (!tools[withTk]) return withTk;
  return `${base} (${technologyId})`;
}
