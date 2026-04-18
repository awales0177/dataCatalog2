/** Catalog rule maturity stage (aligned with model tier naming). */

export const RULE_STAGE_OPTIONS = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
];

/** @returns {'bronze'|'silver'|'gold'} */
export function normalizeRuleStage(raw) {
  const s = String(raw == null ? '' : raw).toLowerCase().trim();
  if (s === 'silver' || s === 'gold' || s === 'bronze') return s;
  return 'bronze';
}

/** Hex accent for stage chips (matches data model tier styling). */
export function ruleStageColor(stage) {
  const s = normalizeRuleStage(stage);
  if (s === 'gold') return '#b8860b';
  if (s === 'silver') return '#708090';
  return '#a0522d';
}
