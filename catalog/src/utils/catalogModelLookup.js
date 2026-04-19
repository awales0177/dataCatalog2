/**
 * Resolve a catalog data model from the URL segment (uuid preferred, or legacy shortName / id).
 */

export function findCatalogModel(modelsList, routeKey) {
  const k = (routeKey || '').trim();
  if (!k) return null;
  const kl = k.toLowerCase();
  return (
    modelsList.find((m) => {
      if (!m) return false;
      if (m.uuid && String(m.uuid).toLowerCase() === kl) return true;
      if (m.shortName && m.shortName.toLowerCase() === kl) return true;
      return String(m.id) === k;
    }) || null
  );
}

/** API path segment for model-scoped routes: prefer stable uuid */
export function modelApiRef(m) {
  if (!m) return '';
  return m.uuid || m.shortName || m.id;
}

export function findGlossaryTerm(terms, routeKey) {
  const k = (routeKey || '').trim();
  if (!k) return null;
  const kl = k.toLowerCase();
  const list = Array.isArray(terms) ? terms : [];
  return (
    list.find((t) => {
      if (!t) return false;
      if (t.uuid && String(t.uuid).toLowerCase() === kl) return true;
      return String(t.id).toLowerCase() === kl;
    }) || null
  );
}

export function glossaryTermApiRef(t) {
  if (!t) return '';
  return t.uuid || t.id;
}

/** Same stable key as glossary URLs / API (uuid preferred). */
export function glossaryTermsEqual(a, b) {
  if (!a || !b) return false;
  return String(glossaryTermApiRef(a)) === String(glossaryTermApiRef(b));
}

export function findDataPolicy(policies, routeKey) {
  const k = (routeKey || '').trim();
  if (!k) return null;
  const kl = k.toLowerCase();
  const list = Array.isArray(policies) ? policies : [];
  return (
    list.find((p) => {
      if (!p) return false;
      if (p.uuid && String(p.uuid).toLowerCase() === kl) return true;
      return String(p.id).toLowerCase() === kl;
    }) || null
  );
}

export function dataPolicyApiRef(p) {
  if (!p) return '';
  return p.uuid || p.id;
}

export function findApplication(applications, routeKey) {
  const k = (routeKey || '').trim();
  if (!k) return null;
  const kl = k.toLowerCase();
  const list = Array.isArray(applications) ? applications : [];
  return (
    list.find((a) => {
      if (!a) return false;
      if (a.uuid && String(a.uuid).toLowerCase() === kl) return true;
      return String(a.id).toLowerCase() === kl || String(a.id) === k;
    }) || null
  );
}

export function applicationApiRef(a) {
  if (!a) return '';
  return a.uuid || a.id;
}
