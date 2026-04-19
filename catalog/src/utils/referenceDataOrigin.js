/** Public asset paths — keep in sync with `public/herd.svg` and `public/system.png`. */
export const ORIGIN_MACHINE_SRC = '/system.png';
export const ORIGIN_HERD_SRC = '/herd.svg';

/** @returns {'machine'|'herd'} */
export function getReferenceDataOrigin(ref) {
  const raw = ref?.dataOrigin ?? ref?.origin;
  if (raw == null) return 'machine';
  const s = String(raw).toLowerCase().trim();
  if (s === 'herd' || s === 'human' || s === 'manual') return 'herd';
  return 'machine';
}

export function datasetOriginMeta(ref) {
  const origin = getReferenceDataOrigin(ref);
  const herd = origin === 'herd';
  return {
    origin,
    src: herd ? ORIGIN_HERD_SRC : ORIGIN_MACHINE_SRC,
    label: herd ? 'HERD' : 'System',
    tooltip: herd
      ? 'HERD — human-entered or manually curated in this catalog'
      : 'System — sourced from systems, pipelines, or automated ingestion',
  };
}
