const API_URL = 'http://localhost:8000/api';

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const fetchItemCount = async (endpoint) => {
  try {
    // Map 'contracts' to 'dataContracts' for consistency
    const apiEndpoint = endpoint === 'contracts' ? 'dataContracts' : endpoint;
    const response = await fetch(`${API_URL}/count/${apiEndpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error fetching item count:', error);
    throw error;
  }
};

export const fetchContracts = () => fetchData('dataContracts');

export const fetchContractsByModel = async (modelShortName) => {
  try {
    const response = await fetch(`${API_URL}/contracts/by-model/${modelShortName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching contracts by model:', error);
    throw error;
  }
};

export const fetchDomains = () => fetchData('domains');
export const fetchTheme = () => fetchData('theme');
export const fetchMenu = () => fetchData('menu'); export const fetchModels = () => fetchData("models");
