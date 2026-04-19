import cacheService from './cache';

/** Explicit base from build env (no trailing slash), e.g. VITE_API_URL=https://api.example.com/api */
const envApiBase = () => {
  const raw = import.meta.env?.VITE_API_URL;
  if (raw == null || String(raw).trim() === '') return null;
  return String(raw).replace(/\/$/, '');
};

/**
 * API base path without trailing slash. In the browser, prefer same-origin `/api` so Vite `server.proxy`
 * (or prod nginx) forwards to FastAPI — avoids CORS and wrong-port requests.
 */
const getSyncApiUrl = () => {
  const fromEnv = envApiBase();
  if (fromEnv) return fromEnv;
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000/api';
  return '/api';
};

const determineApiUrl = async () => {
  const fromEnv = envApiBase();
  if (fromEnv) return fromEnv;
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000/api';

  const h = window.location.hostname;
  // Dedicated API host: routes in this repo are always under `/api/...`
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
  } catch (error) {
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

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const fetchWithCache = async (endpoint, params = {}, options = {}) => {
  const { forceRefresh = false, ttl } = options;
  const cacheKey = cacheService.generateKey(endpoint, params);

  if (endpoint === 'teams') {
    return { data_teams: [] };
  }

  // Return cached data if available and not forcing refresh
  if (!forceRefresh) {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const url = `${API_URL}/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    cacheService.set(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchData = (endpoint, options = {}) => 
  fetchWithCache(endpoint, {}, options);

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

export const fetchAgreements = async (options = {}) => {
  const data = await fetchData('dataAgreements', options);
  return data;
};

export const fetchAgreementsByModel = async (modelRef, options = {}) => {
  // modelRef: model uuid (preferred) or shortName — API resolves either
  const ref = String(modelRef ?? '');
  if (!options.forceRefresh) {
    const cachedData = cacheService.get('dataAgreements');
    const cachedModels = cacheService.get('models');
    if (cachedData?.agreements) {
      let msn = null;
      if (cachedModels) {
        const list = cachedModels.models || cachedModels;
        const arr = Array.isArray(list) ? list : [];
        const m = arr.find((mm) => {
          if (!mm) return false;
          if (mm.uuid && String(mm.uuid).toLowerCase() === ref.toLowerCase()) return true;
          if (mm.shortName && mm.shortName.toLowerCase() === ref.toLowerCase()) return true;
          return String(mm.id) === ref;
        });
        msn = m?.shortName;
      }
      const key = (msn || ref).toLowerCase();
      const useCache = msn != null || !cachedModels;
      if (useCache) {
        const filteredAgreements = cachedData.agreements.filter(
          (agreement) =>
            agreement.modelShortName && agreement.modelShortName.toLowerCase() === key
        );
        return { agreements: filteredAgreements };
      }
    }
  }

  try {
    const url = `${API_URL}/agreements/by-model/${encodeURIComponent(ref)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Note: We don't cache this separately since it's filtered from the main dataAgreements cache
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchDomains = (options = {}) => 
  fetchData('domains', options);

export const fetchZones = (options = {}) => 
  fetchData('zones', options);

export const fetchTheme = (options = {}) => 
  fetchData('theme', options);

export const fetchModels = (options = {}) => 
  fetchData('models', options);

export const createModel = async (modelData) => {
  try {
    const response = await fetch(`${API_URL}/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(modelData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Invalidate cache for models and related data
    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');
    
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteModel = async (modelRef) => {
  try {
    const response = await fetch(`${API_URL}/models/${encodeURIComponent(modelRef)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Invalidate cache for models and related data
    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');
    
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateModel = async (modelRef, modelData, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/models/${encodeURIComponent(modelRef)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        shortName: modelRef,
        modelData: modelData,
        updateAssociatedLinks: options.updateAssociatedLinks !== undefined ? options.updateAssociatedLinks : true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Invalidate cache for models and related data
    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');
    
    // Nuclear option: clear all cache if invalidation didn't work
    if (cacheService.getAllKeys().some(key => key.includes('models') || key.includes('dataAgreements'))) {
      cacheService.clear();
    }
    
    return result;
  } catch (error) {
    throw error;
  }
};

export const trackModelClick = async (modelRef) => {
  try {
    const response = await fetch(`${API_URL}/models/${encodeURIComponent(modelRef)}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Invalidate cache for models to get updated click count
    cacheService.invalidateByPrefix('models');
    
    return result;
  } catch (error) {
    // Don't throw error - click tracking shouldn't break navigation
    console.error('Error tracking click:', error);
    return { clickCount: 0 };
  }
};

// Agreement Management Functions
export const createAgreement = async (agreementData) => {
  try {
    const response = await fetch(`${API_URL}/agreements`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(agreementData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('dataAgreements');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateAgreement = async (agreementId, agreementData) => {
  try {
    const response = await fetch(`${API_URL}/agreements/${encodeURIComponent(agreementId)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(agreementData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('dataAgreements');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteAgreement = async (agreementId) => {
  try {
    const response = await fetch(`${API_URL}/agreements/${encodeURIComponent(agreementId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('dataAgreements');
    return result;
  } catch (error) {
    throw error;
  }
};

// Reference Data Management Functions
export const createReferenceItem = async (referenceData) => {
  try {
    const response = await fetch(`${API_URL}/reference`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(referenceData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('reference');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateReferenceItem = async (itemId, referenceData) => {
  try {
    const response = await fetch(`${API_URL}/reference/${itemId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(referenceData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('reference');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteReferenceItem = async (itemId) => {
  try {
    const response = await fetch(`${API_URL}/reference/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('reference');
    return result;
  } catch (error) {
    throw error;
  }
};

// Glossary Management Functions
export const createGlossaryTerm = async (glossaryData) => {
  try {
    const response = await fetch(`${API_URL}/glossary`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(glossaryData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('glossary');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateGlossaryTerm = async (termId, glossaryData) => {
  try {
    const response = await fetch(`${API_URL}/glossary/${encodeURIComponent(termId)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(glossaryData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('glossary');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteGlossaryTerm = async (termId) => {
  try {
    const response = await fetch(`${API_URL}/glossary/${encodeURIComponent(termId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('glossary');
    return result;
  } catch (error) {
    throw error;
  }
};

// Application Management Functions
export const createApplication = async (applicationData) => {
  try {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(applicationData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('applications');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateApplication = async (applicationId, applicationData) => {
  try {
    const response = await fetch(`${API_URL}/applications/${encodeURIComponent(applicationId)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(applicationData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('applications');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteApplication = async (applicationId) => {
  try {
    const response = await fetch(`${API_URL}/applications/${encodeURIComponent(applicationId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('applications');
    return result;
  } catch (error) {
    throw error;
  }
};

// Toolkit Management Functions
export const createToolkitComponent = async (componentData) => {
  try {
    const response = await fetch(`${API_URL}/toolkit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(componentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateToolkitComponent = async (componentType, componentId, componentData) => {
  try {
    const response = await fetch(
      `${API_URL}/toolkit/${encodeURIComponent(componentType)}/${encodeURIComponent(componentId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(componentData),
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteToolkitComponent = async (componentType, componentId) => {
  try {
    const response = await fetch(
      `${API_URL}/toolkit/${encodeURIComponent(componentType)}/${encodeURIComponent(componentId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateToolkitPackage = async (packageId, packageData) => {
  try {
    const response = await fetch(`${API_URL}/toolkit/packages/${encodeURIComponent(packageId)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(packageData),
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch (e2) {
          // Ignore
        }
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
};

export const deleteToolkitPackage = async (packageId) => {
  try {
    const response = await fetch(`${API_URL}/toolkit/packages/${encodeURIComponent(packageId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const trackToolkitComponentClick = async (componentType, componentId) => {
  try {
    const response = await fetch(
      `${API_URL}/toolkit/${encodeURIComponent(componentType)}/${encodeURIComponent(componentId)}/click`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Invalidate cache for toolkit to get updated click count
    cacheService.invalidateByPrefix('toolkit');
    
    return result;
  } catch (error) {
    // Don't throw error - click tracking shouldn't break navigation
    console.error('Error tracking toolkit click:', error);
    return { clickCount: 0 };
  }
};

export const trackToolkitPackageClick = async (packageName) => {
  try {
    const response = await fetch(`${API_URL}/toolkit/packages/${encodeURIComponent(packageName)}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Invalidate cache for toolkit to get updated click count
    cacheService.invalidateByPrefix('toolkit');
    
    return result;
  } catch (error) {
    // Don't throw error - click tracking shouldn't break navigation
    console.error('Error tracking toolkit package click:', error);
    return { clickCount: 0 };
  }
};

// Data standards (API: /policies)
export const createDataPolicy = async (policyData) => {
  try {
    const response = await fetch(`${API_URL}/policies`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(policyData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('policies');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateDataPolicy = async (policyId, policyData) => {
  try {
    const response = await fetch(`${API_URL}/policies/${encodeURIComponent(policyId)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(policyData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('policies');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteDataPolicy = async (policyId) => {
  try {
    const response = await fetch(`${API_URL}/policies/${encodeURIComponent(policyId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('policies');
    return result;
  } catch (error) {
    throw error;
  }
};

// Search Functions
export const globalSearch = async (query, options = {}) => {
  try {
    const { types, limit = 50 } = options;
    let url = `${API_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    
    if (types && types.length > 0) {
      url += `&types=${types.join(',')}`;
    }
    
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const getSearchSuggestions = async (query, limit = 10) => {
  try {
    const response = await fetch(
      `${API_URL}/search/suggest?q=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const getSearchStats = async () => {
  try {
    const response = await fetch(`${API_URL}/search/stats`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const rebuildSearchIndex = async () => {
  try {
    const response = await fetch(`${API_URL}/search/rebuild`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Statistics Functions
export const trackPageView = async (page) => {
  try {
    const response = await fetch(`${API_URL}/statistics/page-view?page=${encodeURIComponent(page)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Don't throw error - page tracking shouldn't break the app
      console.warn('Failed to track page view');
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    // Silently fail - don't break the app
    console.warn('Error tracking page view:', error);
    return null;
  }
};

export const trackSiteVisit = async () => {
  try {
    const response = await fetch(`${API_URL}/statistics/site-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Don't throw error - site visit tracking shouldn't break the app
      console.warn('Failed to track site visit');
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    // Silently fail - don't break the app
    console.warn('Error tracking site visit:', error);
    return null;
  }
};

export const fetchStatistics = async () => {
  try {
    const response = await fetch(`${API_URL}/statistics`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Import functions from Python library
export const importFunctionsFromLibrary = async (packageName, modulePath = null, pypiUrl = null, bulkMode = false) => {
  try {
    let url = `${API_URL}/toolkit/import-from-library?package_name=${encodeURIComponent(packageName)}`;
    if (modulePath) {
      url += `&module_path=${encodeURIComponent(modulePath)}`;
    }
    if (pypiUrl) {
      url += `&pypi_url=${encodeURIComponent(pypiUrl)}`;
    }
    if (bulkMode) {
      url += `&bulk_mode=true`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Rules Management Functions
/** Master list: all model rules (library + per-model), same shape as catalog `rules`. */
export const getAllModelRules = async (options = {}) => {
  try {
    const cacheKey = cacheService.generateKey('rules', {});
    if (!options.forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;
    }
    const response = await fetch(`${API_URL}/rules`, { headers: { ...getAuthHeaders() } });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    cacheService.set(cacheKey, data, options.ttl);
    return data;
  } catch (error) {
    console.error('Error fetching all model rules:', error);
    throw error;
  }
};

/** Clone a rule onto a model — POST /rules/assign. */
export const assignRuleToModel = async (libraryRuleId, modelShortName) => {
  try {
    const response = await fetch(`${API_URL}/rules/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ libraryRuleId, modelShortName }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('rules');
    return result;
  } catch (error) {
    throw error;
  }
};

export const getRulesForModel = async (modelShortName, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/rules/${encodeURIComponent(modelShortName)}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
};

export const getAllCountryRules = async () => {
  try {
    const response = await fetch(`${API_URL}/country-rules`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all country rules:', error);
    throw error;
  }
};

export const getRulesForCountry = async (country, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/country-rules/${encodeURIComponent(country)}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching country rules:', error);
    throw error;
  }
};

export const getCountryRuleCoverage = async (country) => {
  try {
    const response = await fetch(`${API_URL}/country-rules/${encodeURIComponent(country)}/coverage`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching country rule coverage:', error);
    throw error;
  }
};

export const getCountryRuleCount = async (country) => {
  try {
    const response = await fetch(`${API_URL}/country-rules/${encodeURIComponent(country)}/count`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching country rule count:', error);
    throw error;
  }
};

export const createCountryRule = async (ruleData) => {
  try {
    const response = await fetch(`${API_URL}/country-rules`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ruleData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create country rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating country rule:', error);
    throw error;
  }
};

export const updateCountryRule = async (ruleId, ruleData) => {
  try {
    const response = await fetch(`${API_URL}/country-rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ruleData)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update country rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating country rule:', error);
    throw error;
  }
};

export const deleteCountryRule = async (ruleId) => {
  try {
    const response = await fetch(`${API_URL}/country-rules/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete country rule');
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting country rule:', error);
    throw error;
  }
};

export const getRuleCountForModel = async (modelShortName, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/rules/${encodeURIComponent(modelShortName)}/count`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rule count:', error);
    // Return 0 on error so UI doesn't break
    return { count: 0 };
  }
};

export const createRule = async (ruleData) => {
  try {
    const response = await fetch(`${API_URL}/rules`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('rules');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateRule = async (ruleId, ruleData) => {
  try {
    const response = await fetch(`${API_URL}/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(ruleData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('rules');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteRule = async (ruleId) => {
  try {
    const response = await fetch(`${API_URL}/rules/${ruleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('rules');
    return result;
  } catch (error) {
    throw error;
  }
};

export const getRuleCoverage = async (modelShortName) => {
  try {
    const response = await fetch(`${API_URL}/rules/${encodeURIComponent(modelShortName)}/coverage`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Datasets and Pipelines Functions
export const fetchDatasets = async (options = {}) => {
  try {
    const data = await fetchData('datasets', options);
    return data.datasets || data || [];
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
};

export const fetchDatasetById = async (datasetId, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/datasets/${datasetId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

/** POST /api/feedback — optional backend; used by reference hub / catalog shell. */
export const submitFeedback = async ({ userId, feedbackText }) => {
  const response = await fetch(`${API_URL}/feedback`, {
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
    const response = await fetch(`${API_URL}/query/nl-query`, {
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

// Export cache service for direct access when needed
export { default as cacheService } from './cache';