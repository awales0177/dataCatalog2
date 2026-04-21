import { getApiUrl, getAuthHeaders } from './client.js';

export const trackPageView = async (page) => {
  try {
    const response = await fetch(`${getApiUrl()}/statistics/page-view?page=${encodeURIComponent(page)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to track page view');
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('Error tracking page view:', error);
    return null;
  }
};

export const trackSiteVisit = async () => {
  try {
    const response = await fetch(`${getApiUrl()}/statistics/site-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to track site visit');
      return null;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('Error tracking site visit:', error);
    return null;
  }
};

export const fetchStatistics = async () => {
  try {
    const response = await fetch(`${getApiUrl()}/statistics`, {
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
