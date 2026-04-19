import { TOOLKIT_LANGUAGE_OPTIONS } from '../data/toolkitEvalIcons';
import { findWorkbenchToolkit } from './toolkitWorkbench';

const WB_TECH_RE =
  /^\/toolkit\/(?:(?:toolkit|workbench)\/)?([^/]+)\/technology\/([^/?#]+)/;

export function parseWorkbenchTechnologyUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.trim().match(WB_TECH_RE);
  if (!m) return null;
  return { toolkitId: decodeURIComponent(m[1]), technologyId: decodeURIComponent(m[2]) };
}

/**
 * Match a model resources.tools entry to toolkit data for imagery / metadata.
 */
export function resolveModelToolTechnology(toolkits, toolName, url) {
  const parsed = parseWorkbenchTechnologyUrl(url);
  if (parsed && Array.isArray(toolkits)) {
    const resolved = findWorkbenchToolkit(toolkits, parsed.toolkitId);
    if (resolved?.toolkit) {
      const tk = resolved.toolkit;
      const resTech = findWorkbenchTechnology(tk, parsed.technologyId);
      if (resTech?.technology) return { technology: resTech.technology, toolkit: tk };
    }
  }

  const tn = String(toolName || '').trim().toLowerCase();
  if (!tn || !Array.isArray(toolkits)) return null;

  for (const tk of toolkits) {
    for (const tech of tk.technologies || []) {
      const n = String(tech.name || '').trim().toLowerCase();
      if (n && tn === n) return { technology: tech, toolkit: tk };
    }
  }

  for (const tk of toolkits) {
    for (const tech of tk.technologies || []) {
      const n = String(tech.name || '').trim().toLowerCase();
      if (n && (tn.startsWith(`${n} (`) || tn.startsWith(n))) {
        return { technology: tech, toolkit: tk };
      }
    }
  }

  return null;
}

function languageIconForTech(tech) {
  if (!tech) return null;
  const langs = [];
  if (Array.isArray(tech.languages)) langs.push(...tech.languages);
  if (tech.language) langs.push(tech.language);
  for (const label of langs) {
    const lc = String(label).trim().toLowerCase();
    const hit = TOOLKIT_LANGUAGE_OPTIONS.find((o) => o.label.toLowerCase() === lc);
    if (hit) return { src: hit.icon, alt: hit.label, invert: false };
  }
  return null;
}

/**
 * Image to show on model "Tools" cards: tech card image, primary language icon, or toolkit card art.
 * @returns {{ src: string, alt: string, invert?: boolean } | null}
 */
export function getTechnologyCardImage(technology, toolkit) {
  if (technology?.cardImage && typeof technology.cardImage === 'string') {
    return { src: technology.cardImage, alt: technology.name || 'Technology', invert: false };
  }
  const lang = languageIconForTech(technology);
  if (lang) return lang;
  if (toolkit?.cardImage && typeof toolkit.cardImage === 'string') {
    return {
      src: toolkit.cardImage,
      alt: toolkit.displayName || toolkit.name || 'Toolkit',
      invert: false,
    };
  }
  return null;
}
