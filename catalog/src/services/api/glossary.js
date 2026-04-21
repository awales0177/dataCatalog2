import cacheService from '../cache';
import { getApiUrl, getAuthHeaders } from './client.js';

export const createGlossaryTerm = async (glossaryData) => {
  try {
    const response = await fetch(`${getApiUrl()}/glossary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/glossary/${encodeURIComponent(termId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/glossary/${encodeURIComponent(termId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
