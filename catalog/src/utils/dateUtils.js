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
  
  // Check if it's already a formatted timestamp (YYYY-MM-DD HH:MM:SS)
  if (trimmedString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    return trimmedString; // Return the full timestamp as-is
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