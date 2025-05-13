import cacheService from './cache';

const API_URL = 'http://localhost:8000/api';

const fetchWithCache = async (endpoint, params = {}, options = {}) => {
  const { forceRefresh = false, ttl } = options;
  const cacheKey = cacheService.generateKey(endpoint, params);

  // Return cached data if available and not forcing refresh
  if (!forceRefresh) {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) return cachedData;
  }

  try {
    const response = await fetch(`${API_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Cache the response
    cacheService.set(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const fetchData = (endpoint, options = {}) => 
  fetchWithCache(endpoint, {}, options);

export const fetchItemCount = async (endpoint, options = {}) => {
  try {
    const apiEndpoint = endpoint === 'contracts' ? 'dataContracts' : endpoint;
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

export const fetchContracts = (options = {}) => 
  fetchData('dataContracts', options);

export const fetchContractsByModel = async (modelShortName, options = {}) => {
  const cacheKey = cacheService.generateKey(`contracts/by-model/${modelShortName}`);
  
  if (!options.forceRefresh) {
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) return cachedData;
  }

  try {
    const response = await fetch(`${API_URL}/contracts/by-model/${modelShortName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    cacheService.set(cacheKey, data, options.ttl);
    return data;
  } catch (error) {
    console.error('Error fetching contracts by model:', error);
    throw error;
  }
};

export const fetchDomains = (options = {}) => 
  fetchData('domains', options);

export const fetchTheme = (options = {}) => 
  fetchData('theme', options);

export const fetchMenu = (options = {}) => 
  fetchData('menu', options);

export const fetchModels = (options = {}) => 
  fetchData('models', options);

// Export cache service for direct access when needed
export { default as cacheService } from './cache';
