/** Normalize technology lifecycle status for toolkit cards (matches UUX/dh toolkitDbPayload). */

export function normalizeTechnologyStatus(s) {
  const v = String(s == null || s === '' ? 'production' : s)
    .trim()
    .toLowerCase();
  if (v === 'evaluated' || v === 'evaluation') return 'evaluated';
  if (v === 'development' || v === 'dev') return 'development';
  return 'production';
}
