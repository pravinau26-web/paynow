export type ThemeMode = 'light';

export const getThemeMode = (): ThemeMode => {
  return 'light';
};

/**
 * Permanently enforces pristine light theme matching super.money video design
 */
export const applyTheme = (_mode?: string): boolean => {
  try {
    const root = document.documentElement;
    root.classList.remove('dark');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#5B3DF5');
    }
    return false;
  } catch {
    return false;
  }
};

export const setThemeMode = (_mode: string): void => {
  applyTheme('light');
};
