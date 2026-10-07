export type ThemeMode = 'light' | 'dark' | 'system';

export const getThemeMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem('superpay_theme_mode_v1');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'system';
};

/**
 * Applies the active theme (light / dark / system auto preference)
 */
export const applyTheme = (mode?: ThemeMode): boolean => {
  try {
    const activeMode = mode || getThemeMode();
    const root = document.documentElement;
    let isDark = false;

    if (activeMode === 'dark') {
      isDark = true;
    } else if (activeMode === 'light') {
      isDark = false;
    } else if (activeMode === 'system') {
      isDark = Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0E0E12' : '#5B3DF5');
    }

    return isDark;
  } catch {
    return false;
  }
};

export const setThemeMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem('superpay_theme_mode_v1', mode);
    applyTheme(mode);
  } catch {
    // ignore
  }
};
