import cacheService from './cache';

const determineApiUrl = async () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000/api';
  }

  // Try api.domainname first
  const apiDomainUrl = `${window.location.protocol}//api.${window.location.hostname.replace(/^api\./, '')}`;
  try {
    const response = await fetch(apiDomainUrl);
    if (response.status !== 200) {
      throw new Error('API domain returned non-200 status');
    }
    return apiDomainUrl;
  } catch (error) {
    // API domain not available, fall back to domain/api
  }

  // Fall back to domainname/api
  const fallbackUrl = `${window.location.origin}/api`;
  return fallbackUrl;
};

let API_URL = 'http://localhost:8000/api'; // Default value
determineApiUrl().then(url => {
  API_URL = url;
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const fetchWithCache = async (endpoint, params = {}, options = {}) => {
  const { forceRefresh = false, ttl } = options;
  const cacheKey = cacheService.generateKey(endpoint, params);

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

export const fetchAgreementsByModel = async (modelShortName, options = {}) => {
  // Use the same cache as the main agreements data for consistency
  if (!options.forceRefresh) {
    const cachedData = cacheService.get('dataAgreements');
    if (cachedData && cachedData.agreements) {
      // Filter the cached data by model
      const filteredAgreements = cachedData.agreements.filter(
        agreement => agreement.modelShortName && 
        agreement.modelShortName.toLowerCase() === modelShortName.toLowerCase()
      );
      return { agreements: filteredAgreements };
    }
  }

  try {
    const url = `${API_URL}/agreements/by-model/${modelShortName}`;
    
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

export const deleteModel = async (shortName) => {
  try {
    const response = await fetch(`${API_URL}/models/${shortName}`, {
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

export const updateModel = async (shortName, modelData, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/models/${shortName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        shortName: shortName,
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
    const response = await fetch(`${API_URL}/agreements/${agreementId}`, {
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
    const response = await fetch(`${API_URL}/agreements/${agreementId}`, {
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
    const response = await fetch(`${API_URL}/applications/${applicationId}`, {
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
    const response = await fetch(`${API_URL}/applications/${applicationId}`, {
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
    const response = await fetch(`${API_URL}/toolkit/${componentType}/${componentId}`, {
      method: 'PUT',
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

export const deleteToolkitComponent = async (componentType, componentId) => {
  try {
    const response = await fetch(`${API_URL}/toolkit/${componentType}/${componentId}`, {
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

// Data Policy Management Functions
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
    const response = await fetch(`${API_URL}/policies/${policyId}`, {
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
    const response = await fetch(`${API_URL}/policies/${policyId}`, {
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

// Export cache service for direct access when needed
export { default as cacheService } from './cache';