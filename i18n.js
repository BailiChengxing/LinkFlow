/**
 * i18n module for LinkFlow
 * Stores language preference in localStorage under 'linkflow.language'
 * Falls back to English for missing translations, then Simplified Chinese if loading fails.
 */
const I18N = (() => {
  const LANG_KEY = 'linkflow.language';
  const DEFAULT_LANG = 'zh-CN';
  const SUPPORTED_LANGS = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'fr', 'de', 'es', 'pt-BR', 'ru', 'it', 'nl', 'tr', 'ar', 'hi'];

  let currentLang = DEFAULT_LANG;
  let translations = {};

  async function loadTranslations(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    try {
      const loadLocale = async function(locale) {
        const response = await fetch(chrome.runtime.getURL('locales/' + locale + '.json'));
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      };

      const base = lang === 'en' ? {} : await loadLocale('en');
      const selected = await loadLocale(lang);
      translations = mergeTranslations(base, selected);
      currentLang = lang;
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    } catch (e) {
      console.warn('Failed to load locale ' + lang + ', falling back to ' + DEFAULT_LANG, e);
      if (lang !== DEFAULT_LANG) {
        await loadTranslations(DEFAULT_LANG);
      }
    }
  }

  function mergeTranslations(base, overrides) {
    const merged = Object.assign({}, base);
    Object.keys(overrides || {}).forEach(function(key) {
      const baseValue = merged[key];
      const overrideValue = overrides[key];
      if (baseValue && overrideValue && typeof baseValue === 'object' && typeof overrideValue === 'object') {
        merged[key] = mergeTranslations(baseValue, overrideValue);
      } else {
        merged[key] = overrideValue;
      }
    });
    return merged;
  }

  function t(key, params) {
    params = params || {};
    var keys = key.split('.');
    var value = translations;
    for (var i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object' && keys[i] in value) {
        value = value[keys[i]];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return key;
    return value.replace(/\{(\w+)\}/g, function(_, name) {
      return params[name] !== undefined ? params[name] : '{' + name + '}';
    });
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || DEFAULT_LANG;
  }

  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) lang = DEFAULT_LANG;
    localStorage.setItem(LANG_KEY, lang);
    currentLang = lang;
  }

  function getSupportedLangs() {
    return SUPPORTED_LANGS;
  }

  function getCurrentLang() {
    return currentLang;
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
  }

  async function init() {
    var lang = getLang();
    await loadTranslations(lang);
    applyTranslations();
  }

  return {
    init: init,
    t: t,
    getLang: getLang,
    setLang: setLang,
    getSupportedLangs: getSupportedLangs,
    getCurrentLang: getCurrentLang,
    applyTranslations: applyTranslations
  };
})();
