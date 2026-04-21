import cacheService from '../cache';
import { getApiUrl, getAuthHeaders, fetchData } from './client.js';

export const fetchModels = (options = {}) => fetchData('models', options);

export const createModel = async (modelData) => {
  try {
    const response = await fetch(`${getApiUrl()}/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(modelData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');

    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteModel = async (modelRef) => {
  try {
    const response = await fetch(`${getApiUrl()}/models/${encodeURIComponent(modelRef)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');

    return result;
  } catch (error) {
    throw error;
  }
};

export const updateModel = async (modelRef, modelData, options = {}) => {
  try {
    const response = await fetch(`${getApiUrl()}/models/${encodeURIComponent(modelRef)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        shortName: modelRef,
        modelData: modelData,
        updateAssociatedLinks:
          options.updateAssociatedLinks !== undefined ? options.updateAssociatedLinks : true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    cacheService.invalidateByPrefix('models');
    cacheService.invalidateByPrefix('dataAgreements');

    if (cacheService.getAllKeys().some((key) => key.includes('models') || key.includes('dataAgreements'))) {
      cacheService.clear();
    }

    return result;
  } catch (error) {
    throw error;
  }
};

export const trackModelClick = async (modelRef) => {
  try {
    const response = await fetch(`${getApiUrl()}/models/${encodeURIComponent(modelRef)}/click`, {
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

    cacheService.invalidateByPrefix('models');

    return result;
  } catch (error) {
    console.error('Error tracking click:', error);
    return { clickCount: 0 };
  }
};
