import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const currentTheme = {
    darkMode,
    primary: '#2196f3',
    primaryDark: '#1976d2',
    background: darkMode ? '#121212' : '#ffffff',
    card: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#b0b0b0' : '#666666',
    border: darkMode ? '#333333' : '#e0e0e0',
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 