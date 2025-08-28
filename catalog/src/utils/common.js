// Function to generate random pastel color
export const getRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 65%)`;
};
