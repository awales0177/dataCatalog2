/** Rule zone dimension for catalog / data-quality rules. */

export const RULE_ZONE_OPTIONS = [
  { value: 'value', label: 'Value' },
  { value: 'schema', label: 'Schema' },
  { value: 'product', label: 'Product' },
  { value: 'other', label: 'Other' },
];

const ALLOWED = new Set(RULE_ZONE_OPTIONS.map((o) => o.value));

/** @returns {'value'|'schema'|'product'|'other'} */
export function normalizeRuleZone(raw) {
  const s = String(raw == null ? '' : raw).toLowerCase().trim();
  if (ALLOWED.has(s)) return s;
  return 'value';
}

export function ruleZoneLabel(zone) {
  const z = normalizeRuleZone(zone);
  return RULE_ZONE_OPTIONS.find((o) => o.value === z)?.label ?? z;
}

/** Distinct chip accents per zone. */
export function ruleZoneColor(zone) {
  const z = normalizeRuleZone(zone);
  if (z === 'schema') return '#2a8a9a';
  if (z === 'product') return '#6a1b9a';
  if (z === 'other') return '#546e7a';
  return '#2e7d32';
}
