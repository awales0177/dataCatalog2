/** Serialize toolkit technologies for PUT/POST /api/toolkit (Postgres-backed). */

import { TOOLKIT_LANGUAGE_OPTIONS } from '../data/toolkitEvalIcons';
import { normalizeMarkdownTabs } from './toolkitMarkdownTabs';
import { normalizeTechnologyStatus } from './toolkitStatus';

export { normalizeTechnologyStatus };

const LEGACY_MARKDOWN_KEYS = ['installation', 'usage', 'requirements', 'evaluation'];

const DETAIL_KEYS_TOP = ['likes', 'dislikes', 'iconOverrides'];

export function looksLikeDatabaseToolkitId(id) {
  if (id == null || id === '' || id === 'create') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(id),
  );
}

/** Keep only strings that match a preset label (case-insensitive). */
/** Valid { title, url } pairs for workbench technology links (non-empty after trim). */
export function normalizeTechLinks(arr) {
  const raw = Array.isArray(arr) ? arr : [];
  const out = [];
  for (const x of raw) {
    const title = String(x?.title ?? '').trim();
    const url = String(x?.url ?? '').trim();
    if (!title || !url) continue;
    out.push({ title, url });
  }
  return out;
}

/** Safe href for user-entered URLs (add https if no scheme). */
export function technologyLinkHref(url) {
  const u = String(url ?? '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (/^\/\//.test(u)) return `https:${u}`;
  return `https://${u}`;
}

export function normalizeEvalLabels(arr, optionList) {
  const raw = Array.isArray(arr) ? arr : [];
  const out = [];
  const seen = new Set();
  for (const p of raw) {
    const opt = optionList.find(
      (o) => o.label.toLowerCase() === String(p).trim().toLowerCase(),
    );
    if (!opt) continue;
    const k = opt.label.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(opt.label);
    }
  }
  return out;
}

export function buildTechnologyDetails(t) {
  const d = {};
  if (t.details && typeof t.details === 'object') {
    Object.assign(d, t.details);
  }
  for (const k of DETAIL_KEYS_TOP) {
    if (t[k] != null && t[k] !== '') {
      if (k === 'likes' || k === 'dislikes') {
        const n = Number(t[k]);
        if (!Number.isNaN(n)) d[k] = n;
      } else {
        d[k] = t[k];
      }
    }
  }

  const mdList =
    Array.isArray(t.markdownTabs) ? t.markdownTabs : Array.isArray(d.markdownTabs) ? d.markdownTabs : null;

  if (Array.isArray(mdList)) {
    if (mdList.length === 0) {
      d.markdownTabs = [];
    } else {
      const norm = normalizeMarkdownTabs(mdList);
      if (norm && norm.length) {
        d.markdownTabs = norm;
        for (const { id } of norm) {
          if (t[id] != null && t[id] !== '') d[id] = t[id];
        }
      } else {
        d.markdownTabs = [];
      }
    }
  } else {
    for (const k of LEGACY_MARKDOWN_KEYS) {
      if (t[k] != null && t[k] !== '') d[k] = t[k];
    }
  }

  delete d.markdownTabSlots;
  delete d.markdownTabTitles;

  if (Array.isArray(t.languages)) {
    const langs = normalizeEvalLabels(t.languages, TOOLKIT_LANGUAGE_OPTIONS);
    if (langs.length) d.languages = langs;
    else delete d.languages;
  }

  if (Array.isArray(t.links)) {
    const links = normalizeTechLinks(t.links);
    if (links.length) d.links = links;
    else delete d.links;
  }

  return d;
}

export function technologyToApiPayload(t) {
  const out = {
    id: t.id,
    ...(t.uuid ? { uuid: t.uuid } : {}),
    name: t.name,
    description: t.description,
    rank: Number(t.rank) || 1,
    status: normalizeTechnologyStatus(t.status),
    pros: Array.isArray(t.pros) ? t.pros : [],
    cons: Array.isArray(t.cons) ? t.cons : [],
  };
  if (t.itemId != null && t.itemId !== '') out.itemId = t.itemId;
  if (t.language) out.language = t.language;
  if (t.documentation) out.documentation = t.documentation;
  if (t.githubRepo) out.githubRepo = t.githubRepo;
  if (t.lastUpdated) out.lastUpdated = t.lastUpdated;
  const mt = t.maintainerTeamId;
  if (mt != null && String(mt).trim() !== '') {
    out.maintainerTeamId = String(mt).trim();
  } else {
    out.maintainerTeamId = null;
  }
  const details = buildTechnologyDetails(t);
  if (Object.keys(details).length) out.details = details;
  return out;
}
