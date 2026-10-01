export type ThemeMode = 'light';

export const getThemeMode = (): ThemeMode => 'light';

/**
 * Enforces pure light/white theme across the entire application.
 * Removes any 'dark' class from html document element and clears dark mode cache,
 * ensuring the app always appears in pristine light theme even if the user's phone
 * has Dark Mode enabled in system settings.
 */
export const applyTheme = (): boolean => {
  try {
    const root = document.documentElement;
    root.classList.remove('dark');
    localStorage.removeItem('superpay_theme_mode_v1');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#5B3DF5');
    }
  } catch {
    // ignore
  }
  return false;
};

export const setThemeMode = (): void => {
  applyTheme();
};
