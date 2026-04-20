/** Shared helpers for dashboard pinned items (Home + memoized card). */

export function entityMatchesPinId(entity, pinId) {
  if (!entity) return false;
  const pid = String(pinId);
  return ['uuid', 'id', 'shortName', 'name', 'term'].some((k) => {
    const v = entity[k];
    if (v == null) return false;
    const s = String(v);
    return s === pid || encodeURIComponent(s) === pid;
  });
}

export function lexiconTermForGlossaryCard(lex) {
  return {
    ...lex,
    term: lex.term,
    definition: lex.definition,
    category: Array.isArray(lex.domains) && lex.domains.length ? lex.domains[0] : undefined,
    taggedModels: [],
  };
}
