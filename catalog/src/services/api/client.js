import cacheService from '../cache';

/** Explicit base from build env (no trailing slash), e.g. VITE_API_URL=https://api.example.com/api */
const envApiBase = () => {
  const raw = import.meta.env?.VITE_API_URL;
  if (raw == null || String(raw).trim() === '') return null;
  return String(raw).replace(/\/$/, '');
};

/** Default API when running the UI locally (no VITE_API_URL). Cross-origin; backend must allow CORS for the UI origin. */
const LOCAL_DEV_API = 'http://127.0.0.1:8000/api';

const isLoopbackHostname = (hostname) => {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
};

/**
 * API base without trailing slash.
 * - `VITE_API_URL` wins (set for prod or Docker dev targeting the host).
 * - Local loopback dev: direct FastAPI URL (no Vite proxy).
 * - Otherwise same-origin `/api` (e.g. UI and API served behind one host).
 */
const getSyncApiUrl = () => {
  const fromEnv = envApiBase();
  if (fromEnv) return fromEnv;
  if (typeof window === 'undefined') return LOCAL_DEV_API;
  if (isLoopbackHostname(window.location.hostname)) return LOCAL_DEV_API;
  return '/api';
};

const determineApiUrl = async () => {
  const fromEnv = envApiBase();
  if (fromEnv) return fromEnv;
  if (typeof window === 'undefined') return LOCAL_DEV_API;

  const h = window.location.hostname;
  if (isLoopbackHostname(h)) {
    return LOCAL_DEV_API;
  }
  const subRoot = `${window.location.protocol}//api.${h.replace(/^api\./, '')}`.replace(/\/$/, '');
  const subWithApi = `${subRoot}/api`;
  try {
    const response = await fetch(`${subWithApi}/theme`, {
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) return subWithApi;
    }
  } catch {
    // fall through to same-origin /api
  }

  return '/api';
};

let API_URL = getSyncApiUrl();
determineApiUrl().then((url) => {
  if (url !== API_URL) {
    cacheService.clear();
    API_URL = url;
  }
});

export const getApiUrl = () => API_URL;

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchWithCache = async (endpoint, params = {}, options = {}) => {
  const { forceRefresh = false, ttl } = options;
  const cacheKey = cacheService.generateKey(endpoint, params);

  if (endpoint === 'teams') {
    return { data_teams: [] };
  }

  if (!forceRefresh) {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  const url = `${API_URL}/${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  const data = await response.json();
  cacheService.set(cacheKey, data, ttl);
  return data;
};

export const fetchData = (endpoint, options = {}) => fetchWithCache(endpoint, {}, options);

/** Catalog datasets from GET /api/datasets (Postgres `catalog_datasets`), list shape for workbench modals. */
export const fetchCatalogDatasets = async (options = {}) => {
  const data = await fetchData('datasets', options);
  const list = data?.datasets;
  return Array.isArray(list) ? list : [];
};

export const fetchItemCount = async (endpoint, options = {}) => {
  try {
    const apiEndpoint = endpoint === 'agreements' ? 'dataAgreements' : endpoint;
    const cacheKey = cacheService.generateKey(`count/${apiEndpoint}`);

    if (!options.forceRefresh) {
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) return cachedData;
    }

    const response = await fetch(`${API_URL}/count/${apiEndpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    cacheService.set(cacheKey, data.count, options.ttl);
    return data.count;
  } catch (error) {
    throw error;
  }
};

/** List data policies for agreement pickers (GET /policies). */
export const fetchDataPoliciesList = async () => {
  try {
    const response = await fetch(`${API_URL}/policies`, {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });
    if (!response.ok) {
      return { policies: [] };
    }
    return await response.json();
  } catch {
    return { policies: [] };
  }
};
