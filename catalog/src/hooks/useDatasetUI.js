import { useState, useEffect, useCallback } from 'react';

// Load initial sidebar state from localStorage
const getInitialSidebarState = () => {
  try {
    const stored = localStorage.getItem('tracerSidebarCollapsed');
    return stored !== 'true'; // true means open, false means closed
  } catch (error) {
    console.error('Error loading sidebar state:', error);
    return true;
  }
};

export const useDatasetUI = () => {
  const [isOverviewTrayOpen, setIsOverviewTrayOpen] = useState(getInitialSidebarState());
  const [notificationModal, setNotificationModal] = useState(null); // 'warning' | 'error' | null

  const toggleOverviewTray = useCallback(() => {
    setIsOverviewTrayOpen(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem('tracerSidebarCollapsed', String(!newValue));
      } catch (error) {
        console.error('Error saving sidebar state:', error);
      }
      return newValue;
    });
  }, []);

  return {
    isOverviewTrayOpen,
    toggleOverviewTray,
    notificationModal,
    setNotificationModal,
  };
};
