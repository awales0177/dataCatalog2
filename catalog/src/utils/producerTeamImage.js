/**
 * Match agreement dataProducer entries to Enterprise Data Teams (applications) by name
 * and return the first team's card image (same fields as ApplicationCard).
 */
export function getProducerTeamImageSrc(agreement, applications = []) {
  if (!agreement || !applications.length) return null;
  const raw = agreement.dataProducer;
  const producers = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : [];
  for (const p of producers) {
    if (!p || !String(p).trim()) continue;
    const name = String(p).trim();
    const app = applications.find(
      (a) => a?.name && String(a.name).trim().toLowerCase() === name.toLowerCase()
    );
    if (app) {
      const src = app.image || app.imageUrl || app.logo;
      if (src) return src;
    }
  }
  return null;
}
