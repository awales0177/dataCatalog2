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
  // If the input is null, undefined, or empty, return "Not specified"
  if (!dateString || dateString.trim() === '') {
    return 'Not specified';
  }
  
  // If the input is already a string that doesn't look like a date, just return it
  const trimmedString = dateString.toString().trim();
  
  // Check if it's a common non-date string
  const nonDateStrings = ['unknown', 'n/a', 'na', 'not specified', 'tbd', 'tba', 'pending'];
  if (nonDateStrings.includes(trimmedString.toLowerCase())) {
    return trimmedString;
  }
  
  // Try to parse as a date
  const date = new Date(dateString);
  
  // Check if the date is valid (not NaN)
  if (isNaN(date.getTime())) {
    // If it's not a valid date, just return the original string
    return trimmedString;
  }
  
  // If it is a valid date, format it
  return date.toLocaleDateString('en-US', {
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