import cacheService from '../cache';
import { getApiUrl, getAuthHeaders } from './client.js';

export const createApplication = async (applicationData) => {
  try {
    const response = await fetch(`${getApiUrl()}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/applications/${encodeURIComponent(applicationId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/applications/${encodeURIComponent(applicationId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
