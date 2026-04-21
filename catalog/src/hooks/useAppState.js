import { useCatalogBootstrap } from './useCatalogBootstrap';
import { useAppLayout } from './useAppLayout';

export const useAppState = () => {
  const bootstrap = useCatalogBootstrap();
  const layout = useAppLayout();

  const currentTheme = bootstrap.themeData
    ? {
        ...(layout.darkMode ? bootstrap.themeData.dark : bootstrap.themeData.light),
        darkMode: layout.darkMode,
      }
    : null;

  return {
    ...bootstrap,
    ...layout,
    currentTheme,
  };
};
