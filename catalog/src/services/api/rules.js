import cacheService from '../cache';
import { getApiUrl, getAuthHeaders } from './client.js';

/** Master list: all model rules (library + per-model), same shape as catalog `rules`. */
export const getAllModelRules = async (options = {}) => {
  try {
    const cacheKey = cacheService.generateKey('rules', {});
    if (!options.forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached) return cached;
    }
    const response = await fetch(`${getApiUrl()}/rules`, { headers: { ...getAuthHeaders() } });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (_e) {
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
    const response = await fetch(`${getApiUrl()}/rules/assign`, {
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

export const getRulesForModel = async (modelShortName, _options = {}) => {
  try {
    const response = await fetch(`${getApiUrl()}/rules/${encodeURIComponent(modelShortName)}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (_e) {
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

export const getRuleCountForModel = async (modelShortName, _options = {}) => {
  try {
    const response = await fetch(`${getApiUrl()}/rules/${encodeURIComponent(modelShortName)}/count`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (_e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rule count:', error);
    return { count: 0 };
  }
};

export const createRule = async (ruleData) => {
  try {
    const response = await fetch(`${getApiUrl()}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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

/** @param {object} [options] - When several catalog rows share the same rule id, pass modelShortName to target one copy (use '' for library / no model). */
export const deleteRule = async (ruleId, options = {}) => {
  try {
    let url = `${getApiUrl()}/rules/${encodeURIComponent(ruleId)}`;
    if (Object.prototype.hasOwnProperty.call(options, 'modelShortName')) {
      const v = options.modelShortName;
      url += `?modelShortName=${encodeURIComponent(v == null ? '' : String(v))}`;
    }
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/rules/${encodeURIComponent(modelShortName)}/coverage`, {
      headers: getAuthHeaders(),
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
