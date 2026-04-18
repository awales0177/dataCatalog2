/** @param {unknown} arr @returns {string[]} */
export function normalizeTagList(arr) {
  const raw = Array.isArray(arr) ? arr : [];
  const seen = new Set();
  const out = [];
  for (const x of raw) {
    const t = String(x == null ? '' : x).trim();
    if (!t) continue;
    const lk = t.toLowerCase();
    if (!seen.has(lk)) {
      seen.add(lk);
      out.push(t);
    }
  }
  return out;
}

/**
 * Unified rule tags for model & country rules: `tags` plus legacy tagged* fields when still present.
 * @param {Record<string, unknown>|null|undefined} rule
 * @returns {string[]}
 */
export function ruleTagsList(rule) {
  if (!rule || typeof rule !== 'object') return [];
  const merged = [];
  const fromTags = rule.tags;
  if (Array.isArray(fromTags)) {
    for (const x of fromTags) {
      if (x == null) continue;
      const s = String(x).trim();
      if (s) merged.push(s);
    }
  }
  for (const key of ['taggedObjects', 'taggedColumns', 'taggedFunctions']) {
    const v = rule[key];
    if (!Array.isArray(v)) continue;
    for (const x of v) {
      if (x == null) continue;
      const s = String(x).trim();
      if (s) merged.push(s);
    }
  }
  const seen = new Set();
  const out = [];
  for (const s of merged) {
    const lk = s.toLowerCase();
    if (!seen.has(lk)) {
      seen.add(lk);
      out.push(s);
    }
  }
  return out;
}
