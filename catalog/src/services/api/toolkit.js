import cacheService from '../cache';
import { getApiUrl, getAuthHeaders } from './client.js';

export const createToolkitComponent = async (componentData) => {
  try {
    const response = await fetch(`${getApiUrl()}/toolkit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(componentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateToolkitComponent = async (componentType, componentId, componentData) => {
  try {
    const response = await fetch(
      `${getApiUrl()}/toolkit/${encodeURIComponent(componentType)}/${encodeURIComponent(componentId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(componentData),
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteToolkitComponent = async (componentType, componentId) => {
  try {
    const response = await fetch(
      `${getApiUrl()}/toolkit/${encodeURIComponent(componentType)}/${encodeURIComponent(componentId)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      },
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateToolkitPackage = async (packageId, packageData) => {
  try {
    const response = await fetch(`${getApiUrl()}/toolkit/packages/${encodeURIComponent(packageId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(packageData),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (_e) {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch (_e2) {
          /* ignore */
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
};

export const deleteToolkitPackage = async (packageId) => {
  try {
    const response = await fetch(`${getApiUrl()}/toolkit/packages/${encodeURIComponent(packageId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    cacheService.invalidateByPrefix('toolkit');
    return result;
  } catch (error) {
    throw error;
  }
};

export const trackToolkitComponentClick = async (componentType, componentId) => {
  try {
    const response = await fetch(
      `${getApiUrl()}/toolkit/${encodeURIComponent(componentType)}/${encodeURIComponent(componentId)}/click`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    cacheService.invalidateByPrefix('toolkit');

    return result;
  } catch (error) {
    console.error('Error tracking toolkit click:', error);
    return { clickCount: 0 };
  }
};

export const trackToolkitPackageClick = async (packageName) => {
  try {
    const response = await fetch(`${getApiUrl()}/toolkit/packages/${encodeURIComponent(packageName)}/click`, {
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

    cacheService.invalidateByPrefix('toolkit');

    return result;
  } catch (error) {
    console.error('Error tracking toolkit package click:', error);
    return { clickCount: 0 };
  }
};

export const importFunctionsFromLibrary = async (
  packageName,
  modulePath = null,
  pypiUrl = null,
  bulkMode = false,
) => {
  try {
    let url = `${getApiUrl()}/toolkit/import-from-library?package_name=${encodeURIComponent(packageName)}`;
    if (modulePath) {
      url += `&module_path=${encodeURIComponent(modulePath)}`;
    }
    if (pypiUrl) {
      url += `&pypi_url=${encodeURIComponent(pypiUrl)}`;
    }
    if (bulkMode) {
      url += `&bulk_mode=true`;
    }

    const response = await fetch(url, {
      method: 'POST',
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
