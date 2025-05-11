export const getQualityColor = (score) => {
  if (score >= 90) {
    return '#4caf50'; // Green for high quality
  } else if (score >= 75) {
    return '#ff9800'; // Orange for medium quality
  } else {
    return '#f44336'; // Red for low quality
  }
}; 