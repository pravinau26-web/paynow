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
    root.style.colorScheme = 'light';
    if (document.body) {
      document.body.style.colorScheme = 'light';
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#FAFAFC');
    }
    return false;
  } catch {
    return false;
  }
};

export const setThemeMode = (_mode: string): void => {
  applyTheme('light');
};
