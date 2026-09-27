/* Shared theme preference for the popup and settings page. */
const Theme = (() => {
  const STORAGE_KEY = 'linkflow.theme';
  const VALID_THEMES = ['light', 'dark', 'auto'];
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getPreference() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(stored) ? stored : 'auto';
  }

  function apply() {
    const preference = getPreference();
    const effectiveTheme = preference === 'auto'
      ? (colorSchemeQuery.matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.style.colorScheme = effectiveTheme;
  }

  function setPreference(preference) {
    const normalized = VALID_THEMES.includes(preference) ? preference : 'auto';
    localStorage.setItem(STORAGE_KEY, normalized);
    apply();
    return normalized;
  }

  colorSchemeQuery.addEventListener('change', () => {
    if (getPreference() === 'auto') apply();
  });

  return { getPreference, setPreference, apply };
})();
