import { getApiUrl, getAuthHeaders, fetchData } from './client.js';

export const fetchDatasets = async (options = {}) => {
  try {
    const data = await fetchData('datasets', options);
    return data.datasets || data || [];
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
};

export const fetchDatasetById = async (datasetId, _options = {}) => {
  try {
    const response = await fetch(`${getApiUrl()}/datasets/${datasetId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
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
