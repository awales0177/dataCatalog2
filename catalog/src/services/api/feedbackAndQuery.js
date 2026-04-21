import { getApiUrl, getAuthHeaders } from './client.js';

/** POST /api/feedback — optional backend; used by reference hub / catalog shell. */
export const submitFeedback = async ({ userId, feedbackText }) => {
  const response = await fetch(`${getApiUrl()}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      ...(userId ? { userId: String(userId) } : {}),
      feedbackText: String(feedbackText ?? ''),
    }),
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON body */
  }
  if (!response.ok) {
    let msg = data.detail ?? `HTTP ${response.status}`;
    if (Array.isArray(msg)) {
      msg = msg
        .map((x) => (typeof x === 'string' ? x : x.msg || JSON.stringify(x)))
        .join('; ');
    }
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
};

/**
 * Natural language → SQL for query workbench. Backend may omit /query/nl-query; caller can fall back client-side.
 */
export const fetchNaturalLanguageQuery = async (question, tableName, schema, model) => {
  const body = { question, tableName, schema };
  if (model) body.model = model;
  const response = await fetch(`${getApiUrl()}/query/nl-query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.sql != null ? data : { sql: data };
};
