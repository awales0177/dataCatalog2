import { fetchData } from './client.js';

export const fetchDomains = (options = {}) => fetchData('domains', options);

export const fetchZones = (options = {}) => fetchData('zones', options);

export const fetchTheme = (options = {}) => fetchData('theme', options);
