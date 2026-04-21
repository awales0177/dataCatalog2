import cacheService from '../cache';
import { getApiUrl, getAuthHeaders } from './client.js';

export const createDataPolicy = async (policyData) => {
  try {
    const response = await fetch(`${getApiUrl()}/policies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/policies/${encodeURIComponent(policyId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/policies/${encodeURIComponent(policyId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
