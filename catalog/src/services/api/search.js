import { getApiUrl, getAuthHeaders } from './client.js';

export const globalSearch = async (query, options = {}) => {
  try {
    const { types, limit = 50 } = options;
    let url = `${getApiUrl()}/search?q=${encodeURIComponent(query)}&limit=${limit}`;

    if (types && types.length > 0) {
      url += `&types=${types.join(',')}`;
    }

    const response = await fetch(url, {
      headers: getAuthHeaders(),
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
      `${getApiUrl()}/search/suggest?q=${encodeURIComponent(query)}&limit=${limit}`,
      { headers: getAuthHeaders() },
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
    const response = await fetch(`${getApiUrl()}/search/stats`, {
      headers: getAuthHeaders(),
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
    const response = await fetch(`${getApiUrl()}/search/rebuild`, {
      method: 'POST',
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
