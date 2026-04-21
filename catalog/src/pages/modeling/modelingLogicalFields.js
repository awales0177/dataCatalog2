/**
 * Logical / canonical field names for "target" side of modeling column maps.
 * Prefer `logicalFields` on each model in models.json when present.
 */

const DEFAULT_TARGETS = [
  'id',
  'name',
  'code',
  'description',
  'status',
  'type',
  'created_at',
  'updated_at',
  'effective_from',
  'effective_to',
];

/** Curated targets by catalog shortName — extend or override via models.json `logicalFields`. */
const BY_SHORT_NAME = {
  CUST: [
    'party_id',
    'customer_id',
    'email',
    'phone',
    'first_name',
    'last_name',
    'status',
    'segment',
    'created_at',
    'updated_at',
  ],
  PROD: [
    'product_id',
    'sku',
    'name',
    'description',
    'price',
    'currency',
    'category_id',
    'stock_qty',
    'created_at',
    'updated_at',
  ],
  ORD: [
    'order_id',
    'customer_id',
    'order_status',
    'total_amount',
    'currency',
    'placed_at',
    'shipped_at',
    'created_at',
    'updated_at',
  ],
  LEG: ['entity_id', 'case_id', 'jurisdiction', 'status', 'filed_at', 'created_at', 'updated_at'],
  MKT: ['campaign_id', 'name', 'channel', 'budget', 'start_date', 'end_date', 'created_at', 'updated_at'],
  FIN: ['account_id', 'amount', 'currency', 'transaction_date', 'posting_status', 'created_at', 'updated_at'],
  TRANS: ['trip_id', 'route_id', 'mode', 'scheduled_at', 'status', 'created_at', 'updated_at'],
};

/**
 * @param {Record<string, unknown> | null | undefined} catalogModel — row from models.json
 * @returns {string[]}
 */
export function getTargetFieldsForCatalogModel(catalogModel) {
  if (!catalogModel || typeof catalogModel !== 'object') return [...DEFAULT_TARGETS];
  const fromJson = catalogModel.logicalFields;
  if (Array.isArray(fromJson) && fromJson.length > 0) {
    return fromJson.map((x) => String(x));
  }
  const sn = String(catalogModel.shortName || '').toUpperCase();
  if (BY_SHORT_NAME[sn]) return [...BY_SHORT_NAME[sn]];
  return [...DEFAULT_TARGETS];
}
