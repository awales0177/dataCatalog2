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
  const cacheKey = cacheService.generateKey(`agreements/by-model/${modelShortName}`);
  
  if (!options.forceRefresh) {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached agreements for model:', modelShortName);
      return cachedData;
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
    
    cacheService.set(cacheKey, data, options.ttl);
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

// Export cache service for direct access when needed
export { default as cacheService } from './cache';