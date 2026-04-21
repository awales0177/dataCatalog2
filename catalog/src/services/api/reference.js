import cacheService from '../cache';
import { getApiUrl, getAuthHeaders } from './client.js';

export const createReferenceItem = async (referenceData) => {
  try {
    const response = await fetch(`${getApiUrl()}/reference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/reference/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/reference/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
