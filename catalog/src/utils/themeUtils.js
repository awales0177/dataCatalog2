import themeData from '../data/theme.json';

// Get the current theme object based on dark mode state
export const getTheme = (darkMode) => {
  return darkMode ? themeData.dark : themeData.light;
};

// Get quality color based on score
export const getQualityColor = (score, darkMode) => {
  const theme = getTheme(darkMode);
  if (score >= 90) return theme.quality.high;
  if (score >= 70) return theme.quality.medium;
  return theme.quality.low;
};

// Format date to readable string
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Filter data models based on search query
export const filterDataModels = (models, query) => {
  if (!query) return models;
  
  const searchTerm = query.toLowerCase();
  return models.filter(model => 
    model.name.toLowerCase().includes(searchTerm) ||
    model.description.toLowerCase().includes(searchTerm) ||
    model.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    model.owner.toLowerCase().includes(searchTerm)
  );
}; 