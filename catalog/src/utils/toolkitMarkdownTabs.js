/** Markdown documentation tabs for toolkit technologies (maps to API readme_refs keys). */

const TAB_ID_RE = /^[a-z][a-z0-9_]{0,62}$/;

export const DEFAULT_MARKDOWN_TABS = [
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'requirements', title: 'Requirements' },
  { id: 'evaluation', title: 'Evaluation' },
];

/** @deprecated Use DEFAULT_MARKDOWN_TABS / tab titles on each tab */
export const MARKDOWN_TAB_SLOTS = DEFAULT_MARKDOWN_TABS.map((t) => t.id);

export const DEFAULT_MARKDOWN_TAB_TITLES = Object.fromEntries(
  DEFAULT_MARKDOWN_TABS.map((t) => [t.id, t.title]),
);

const LEGACY_DEFAULT_IDS = new Set(MARKDOWN_TAB_SLOTS);

export function normalizeMarkdownTabId(id) {
  const s = String(id ?? '').trim();
  if (!TAB_ID_RE.test(s)) return null;
  return s;
}

/** Returns normalized tabs or null if input is not a valid array. */
export function normalizeMarkdownTabs(arr) {
  if (!Array.isArray(arr)) return null;
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const id = normalizeMarkdownTabId(item.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const title =
      item.title != null && String(item.title).trim() !== ''
        ? String(item.title).trim()
        : DEFAULT_MARKDOWN_TAB_TITLES[id] || id;
    out.push({ id, title });
  }
  return out;
}

/**
 * Merge tab config from technology (details merged to top-level by API).
 * Prefers details.markdownTabs / markdownTabs; migrates legacy markdownTabSlots.
 */
export function mergeMarkdownTabStateFromTech(t) {
  const d = t?.details || {};
  const rawMt = t?.markdownTabs != null ? t.markdownTabs : d.markdownTabs;

  if (Array.isArray(rawMt)) {
    if (rawMt.length === 0) {
      return { markdownTabs: [] };
    }
    const norm = normalizeMarkdownTabs(rawMt);
    if (norm && norm.length) {
      return { markdownTabs: norm };
    }
    return { markdownTabs: [] };
  }

  const slots = t?.markdownTabSlots ?? d?.markdownTabSlots;
  const titles = {
    ...(typeof d?.markdownTabTitles === 'object' ? d.markdownTabTitles : {}),
    ...(typeof t?.markdownTabTitles === 'object' ? t.markdownTabTitles : {}),
  };
  if (slots === undefined || slots === null) {
    return { markdownTabs: [...DEFAULT_MARKDOWN_TABS] };
  }
  if (!Array.isArray(slots)) {
    return { markdownTabs: [...DEFAULT_MARKDOWN_TABS] };
  }
  if (slots.length === 0) {
    return { markdownTabs: [] };
  }
  const out = [];
  const seen = new Set();
  for (const s of slots) {
    const id = normalizeMarkdownTabId(s);
    if (!id || !LEGACY_DEFAULT_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    const title =
      titles[id] != null && String(titles[id]).trim() !== ''
        ? String(titles[id]).trim()
        : DEFAULT_MARKDOWN_TAB_TITLES[id] || id;
    out.push({ id, title });
  }
  return out.length ? { markdownTabs: out } : { markdownTabs: [...DEFAULT_MARKDOWN_TABS] };
}

/**
 * Effective tabs for workbench UI.
 * @returns {{ markdownTabs: { id: string, title: string }[], slots: string[] }}
 */
export function getEffectiveMarkdownTabs(tech) {
  const { markdownTabs } = mergeMarkdownTabStateFromTech(tech);
  return {
    markdownTabs,
    slots: markdownTabs.map((x) => x.id),
  };
}

export function tabLabelForTab(tab) {
  if (!tab) return '';
  if (tab.title != null && String(tab.title).trim() !== '') return String(tab.title).trim();
  return DEFAULT_MARKDOWN_TAB_TITLES[tab.id] || tab.id;
}

/** @deprecated Use tabLabelForTab */
export function tabLabelForSlot(slot, titles) {
  const custom = titles?.[slot];
  if (custom != null && String(custom).trim() !== '') return String(custom).trim();
  return DEFAULT_MARKDOWN_TAB_TITLES[slot] || slot;
}
