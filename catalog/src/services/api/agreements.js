import cacheService from '../cache';
import { getApiUrl, getAuthHeaders, fetchData } from './client.js';

export const fetchAgreements = async (options = {}) => {
  const data = await fetchData('dataAgreements', options);
  return data;
};

export const fetchAgreementsByModel = async (modelRef, options = {}) => {
  const ref = String(modelRef ?? '');
  if (!options.forceRefresh) {
    const cachedData = cacheService.get('dataAgreements');
    const cachedModels = cacheService.get('models');
    if (cachedData?.agreements) {
      let msn = null;
      if (cachedModels) {
        const list = cachedModels.models || cachedModels;
        const arr = Array.isArray(list) ? list : [];
        const m = arr.find((mm) => {
          if (!mm) return false;
          if (mm.uuid && String(mm.uuid).toLowerCase() === ref.toLowerCase()) return true;
          if (mm.shortName && mm.shortName.toLowerCase() === ref.toLowerCase()) return true;
          return String(mm.id) === ref;
        });
        msn = m?.shortName;
      }
      const key = (msn || ref).toLowerCase();
      const useCache = msn != null || !cachedModels;
      if (useCache) {
        const filteredAgreements = cachedData.agreements.filter(
          (agreement) =>
            agreement.modelShortName && agreement.modelShortName.toLowerCase() === key,
        );
        return { agreements: filteredAgreements };
      }
    }
  }

  try {
    const url = `${getApiUrl()}/agreements/by-model/${encodeURIComponent(ref)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

export const createAgreement = async (agreementData) => {
  try {
    const response = await fetch(`${getApiUrl()}/agreements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(agreementData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('dataAgreements');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateAgreement = async (agreementId, agreementData) => {
  try {
    const response = await fetch(`${getApiUrl()}/agreements/${encodeURIComponent(agreementId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(agreementData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('dataAgreements');
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteAgreement = async (agreementId) => {
  try {
    const response = await fetch(`${getApiUrl()}/agreements/${encodeURIComponent(agreementId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    cacheService.invalidateByPrefix('dataAgreements');
    return result;
  } catch (error) {
    throw error;
  }
};
