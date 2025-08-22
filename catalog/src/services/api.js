import cacheService from './cache';

const determineApiUrl = async () => {
  if (window.location.hostname === 'localhost') {
    console.log('Using localhost URL:', 'http://localhost:8000/api');
    return 'http://localhost:8000/api';
  }

  // Try api.domainname first
  const apiDomainUrl = `${window.location.protocol}//api.${window.location.hostname.replace(/^api\./, '')}`;
  console.log('Trying API domain URL:', apiDomainUrl);
  try {
    const response = await fetch(apiDomainUrl);
    if (response.status !== 200) {
      console.log('API domain returned non-200 status:', response.status);
      throw new Error('API domain returned non-200 status');
    }
    console.log('Successfully connected to API domain:', apiDomainUrl);
    return apiDomainUrl;
  } catch (error) {
    console.log('API domain not available, falling back to domain/api');
  }

  // Fall back to domainname/api
  const fallbackUrl = `${window.location.origin}/api`;
  console.log('Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

let API_URL = 'http://localhost:8000/api'; // Default value
determineApiUrl().then(url => {
  API_URL = url;
  console.log('API URL determined:', API_URL);
});

const fetchWithCache = async (endpoint, params = {}, options = {}) => {
  const { forceRefresh = false, ttl } = options;
  const cacheKey = cacheService.generateKey(endpoint, params);

  // Debug cache status
  console.log(`Cache check for ${endpoint}:`, {
    cacheKey,
    forceRefresh,
    hasCachedData: !!cacheService.get(cacheKey),
    allCacheKeys: cacheService.getAllKeys()
  });

  // Return cached data if available and not forcing refresh
  if (!forceRefresh) {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data for:', endpoint);
      return cachedData;
    }
  }

  try {
    const url = `${API_URL}/${endpoint}`;
    console.log('Fetching data from:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.error('Error details:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API response for', endpoint, ':', data);
    
    // Cache the response
    cacheService.set(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    console.error('Error details:', {
      endpoint,
      params,
      options,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
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
    console.error('Error fetching item count:', error);
    throw error;
  }
};

export const fetchAgreements = async (options = {}) => {
  console.log('fetchAgreements called with options:', options);
  const data = await fetchData('dataAgreements', options);
  console.log('fetchAgreements response:', data);
  return data;
};

export const fetchAgreementsByModel = async (modelShortName, options = {}) => {
  // Use the same cache as the main agreements data for consistency
  if (!options.forceRefresh) {
    const cachedData = cacheService.get('dataAgreements');
    if (cachedData && cachedData.agreements) {
      console.log('Returning cached agreements for model:', modelShortName);
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
    console.log('Fetching agreements for model:', modelShortName);
    console.log('Request URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      console.error('Error details:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Agreements data received:', data);
    
    // Note: We don't cache this separately since it's filtered from the main dataAgreements cache
    return data;
  } catch (error) {
    console.error('Error fetching agreements by model:', error);
    console.error('Error details:', {
      modelShortName,
      options,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
    throw error;
  }
};

export const fetchDomains = (options = {}) => 
  fetchData('domains', options);

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
      },
      body: JSON.stringify(modelData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Debug cache invalidation
    console.log('Cache invalidation for model creation:');
    console.log('  New model shortName:', modelData.shortName);
    console.log('  Cache keys before invalidation:', cacheService.getAllKeys());
    
    // Invalidate cache for models and related data
    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');
    
    console.log('  Cache keys after invalidation:', cacheService.getAllKeys());
    
    return result;
  } catch (error) {
    console.error('Error creating model:', error);
    throw error;
  }
};

export const deleteModel = async (shortName) => {
  try {
    const response = await fetch(`${API_URL}/models/${shortName}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Debug cache invalidation
    console.log('Cache invalidation for model deletion:');
    console.log('  Deleted model shortName:', shortName);
    console.log('  Cache keys before invalidation:', cacheService.getAllKeys());
    
    // Invalidate cache for models and related data
    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');
    
    console.log('  Cache keys after invalidation:', cacheService.getAllKeys());
    
    return result;
  } catch (error) {
    console.error('Error deleting model:', error);
    throw error;
  }
};

export const updateModel = async (shortName, modelData, options = {}) => {
  try {
    const response = await fetch(`${API_URL}/models/${shortName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
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
    
    // Debug cache invalidation
    console.log('Cache invalidation for model update:');
    console.log('  Model shortName:', shortName);
    console.log('  Cache keys before invalidation:', cacheService.getAllKeys());
    
    // Invalidate cache for models and related data
    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');
    
    // Nuclear option: clear all cache if invalidation didn't work
    if (cacheService.getAllKeys().some(key => key.includes('models') || key.includes('dataAgreements'))) {
      console.log('Cache invalidation incomplete, clearing all cache');
      cacheService.clear();
    }
    
    console.log('  Cache keys after invalidation:', cacheService.getAllKeys());
    
    return result;
  } catch (error) {
    console.error('Error updating model:', error);
    throw error;
  }
};

// Agreement Management Functions
export const createAgreement = async (agreementData) => {
  try {
    const response = await fetch(`${API_URL}/agreements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error creating agreement:', error);
    throw error;
  }
};

export const updateAgreement = async (agreementId, agreementData) => {
  try {
    const response = await fetch(`${API_URL}/agreements/${agreementId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error updating agreement:', error);
    throw error;
  }
};

export const deleteAgreement = async (agreementId) => {
  try {
    const response = await fetch(`${API_URL}/agreements/${agreementId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('dataAgreements');
    return result;
  } catch (error) {
    console.error('Error deleting agreement:', error);
    throw error;
  }
};

// Reference Data Management Functions
export const createReferenceItem = async (referenceData) => {
  try {
    const response = await fetch(`${API_URL}/reference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error creating reference item:', error);
    throw error;
  }
};

export const updateReferenceItem = async (itemId, referenceData) => {
  try {
    const response = await fetch(`${API_URL}/reference/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error updating reference item:', error);
    throw error;
  }
};

export const deleteReferenceItem = async (itemId) => {
  try {
    const response = await fetch(`${API_URL}/reference/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('reference');
    return result;
  } catch (error) {
    console.error('Error deleting reference item:', error);
    throw error;
  }
};

// Application Management Functions
export const createApplication = async (applicationData) => {
  try {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error creating application:', error);
    throw error;
  }
};

export const updateApplication = async (applicationId, applicationData) => {
  try {
    const response = await fetch(`${API_URL}/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error updating application:', error);
    throw error;
  }
};

export const deleteApplication = async (applicationId) => {
  try {
    const response = await fetch(`${API_URL}/applications/${applicationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('applications');
    return result;
  } catch (error) {
    console.error('Error deleting application:', error);
    throw error;
  }
};

// Toolkit Management Functions
export const createToolkitComponent = async (componentData) => {
  try {
    const response = await fetch(`${API_URL}/toolkit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error creating toolkit component:', error);
    throw error;
  }
};

export const updateToolkitComponent = async (componentType, componentId, componentData) => {
  try {
    const response = await fetch(`${API_URL}/toolkit/${componentType}/${componentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    console.error('Error updating toolkit component:', error);
    throw error;
  }
};

export const deleteToolkitComponent = async (componentType, componentId) => {
  try {
    const response = await fetch(`${API_URL}/toolkit/${componentType}/${componentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    console.error('Error deleting toolkit component:', error);
    throw error;
  }
};

// Export cache service for direct access when needed
export { default as cacheService } from './cache';