/**
 * Infer foreign-key-style relationships between tables in the modeler canvas
 * (columns like customer_id → table "customer" / "customers" when that table is also on the canvas).
 */

function getColumnsForTableItem(item, datasets) {
  if (!item || !Array.isArray(datasets)) return [];
  const ds = datasets.find((d) => d.id === item.datasetId);
  const table = ds?.tables?.find((t) => t.name === item.tableName);
  return Array.isArray(table?.columns) ? table.columns : [];
}

function columnSourceName(col) {
  if (col && typeof col === 'object') return col.name != null ? String(col.name) : '';
  return String(col ?? '');
}

/** Optional API hints: foreignKey, referencesTable, refTable, references.table */
function explicitRefTable(col) {
  if (!col || typeof col !== 'object') return null;
  const fk = col.foreignKey || col.foreign_key;
  if (fk && typeof fk === 'object') {
    const t = fk.table || fk.referencedTable || fk.refTable;
    if (t) return String(t);
  }
  if (col.referencesTable) return String(col.referencesTable);
  if (col.refTable) return String(col.refTable);
  const r = col.references;
  if (r && typeof r === 'object' && r.table) return String(r.table);
  return null;
}

function stemFromIdColumn(columnName) {
  const raw = String(columnName || '').trim();
  if (!raw) return null;
  const m1 = raw.match(/^(.+)_id$/i);
  if (m1) return m1[1];
  if (/Id$/i.test(raw) && raw.length > 2) return raw.replace(/Id$/i, '');
  return null;
}

function normalizeTableKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * @returns {{ nodes: string[], edges: Array<{ from: string, to: string, via: string }> }}
 */
export function inferTableRelationships(modelItems, datasets) {
  if (!Array.isArray(modelItems) || modelItems.length === 0) {
    return { nodes: [], edges: [] };
  }
  const tableNames = [...new Set(modelItems.map((i) => i.tableName).filter(Boolean))];
  const lowerToCanonical = new Map();
  for (const t of tableNames) {
    lowerToCanonical.set(String(t).toLowerCase(), t);
  }

  function resolveStemToTable(stem) {
    if (!stem) return null;
    const s = String(stem).toLowerCase();
    const variants = [
      s,
      `${s}s`,
      s.replace(/s$/, ''),
      `${s}es`,
      s.endsWith('s') ? s.slice(0, -1) : s,
    ];
    for (const v of variants) {
      if (!v) continue;
      const hit = lowerToCanonical.get(v);
      if (hit) return hit;
    }
    const sn = normalizeTableKey(stem);
    for (const t of tableNames) {
      const tn = normalizeTableKey(t);
      if (tn === sn || tn === `${sn}s` || `${tn}s` === sn || tn === sn.replace(/s$/, '')) {
        return t;
      }
    }
    return null;
  }

  function resolveExplicitName(name) {
    const n = String(name || '').trim();
    if (!n) return null;
    const direct = lowerToCanonical.get(n.toLowerCase());
    if (direct) return direct;
    return resolveStemToTable(n);
  }

  const edges = [];
  const seen = new Set();

  for (const item of modelItems) {
    const from = item.tableName;
    if (!from) continue;
    const cols = getColumnsForTableItem(item, datasets);
    for (const col of cols) {
      const cn = columnSourceName(col);
      if (!cn) continue;
      let to = explicitRefTable(col);
      if (to) to = resolveExplicitName(to);
      if (!to) {
        const stem = stemFromIdColumn(cn);
        to = resolveStemToTable(stem);
      }
      if (!to || to === from) continue;
      if (!lowerToCanonical.has(String(to).toLowerCase())) continue;
      const key = `${from}\0${to}\0${cn}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from, to, via: cn });
    }
  }

  return { nodes: tableNames, edges };
}
