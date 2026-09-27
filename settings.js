(() => {
  const REGEX_STORAGE_KEY = 'linkflow.regexSettings';
  const NOISE_STORAGE_KEY = 'linkflow.noiseRules';
  const BRACKET_STORAGE_KEY = 'linkflow.bracketCleanup';
  const CONNECTIVITY_STORAGE_KEY = 'linkflow.connectivityTest';
  const RETENTION_STORAGE_KEY = 'linkflow.contentRetention';
  const HISTORY_SETTINGS_KEY = 'linkflow.historySettings';
  const HISTORY_STORAGE_KEY = 'linkflow.extractionHistory';
  const HISTORY_PAGE_SIZE = 10;
  const DEFAULT_PATTERN = "(?:https?:\\/\\/)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}(?::\\d{1,5})?(?:[/?#][^\\s<>\"'{}|\\\\^`\\[\\]]*)?";
  const DEFAULT_FLAGS = 'gi';
  const PRESETS = {
    chinese: { name: '中文', range: '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\u{20000}-\\u{2fa1f}' },
    japanese: { name: '日本語', range: '\\u3040-\\u309f\\u30a0-\\u30ff\\u31f0-\\u31ff\\u{1b000}-\\u{1b16f}\\u{1b100}-\\u{1b12f}\\u{1b130}-\\u{1b16f}' },
    korean: { name: '한국어', range: '\\u1100-\\u11ff\\u3130-\\u318f\\uac00-\\ud7af\\ua960-\\ua97f\\ud7b0-\\ud7ff' },
    russian: { name: 'Русский', range: '\\u0400-\\u052f' },
    arabic: { name: 'العربية', range: '\\u0600-\\u06ff\\u0750-\\u077f\\u08a0-\\u08ff' },
    thai: { name: 'ไทย', range: '\\u0e00-\\u0e7f' },
    greek: { name: 'Ελληνικά', range: '\\u0370-\\u03ff\\u1f00-\\u1fff' },
    hebrew: { name: 'עברית', range: '\\u0590-\\u05ff' },
    devanagari: { name: 'देवनागरी', range: '\\u0900-\\u097f' },
    custom: { name: '', range: '' }
  };

  const patternInput = document.getElementById('patternInput');
  const flagsInput = document.getElementById('flagsInput');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const message = document.getElementById('message');
  const langSelect = document.getElementById('langSelect');
  const themeSelect = document.getElementById('themeSelect');
  const connectivityEnabled = document.getElementById('connectivityEnabled');
  const connectivityConcurrency = document.getElementById('connectivityConcurrency');
  const connectivitySettingsMessage = document.getElementById('connectivitySettingsMessage');
  const contentRetention = document.getElementById('contentRetention');
  const retentionSettingsMessage = document.getElementById('retentionSettingsMessage');
  const historyEnabled = document.getElementById('historyEnabled');
  const historyLimit = document.getElementById('historyLimit');
  const historySettingsMessage = document.getElementById('historySettingsMessage');
  const historyList = document.getElementById('historyList');
  const historyPagination = document.getElementById('historyPagination');
  const historyPrevious = document.getElementById('historyPrevious');
  const historyNext = document.getElementById('historyNext');
  const historyPageLabel = document.getElementById('historyPageLabel');
  const clearStorageBtn = document.getElementById('clearStorageBtn');
  let currentHistoryPage = 0;
  const languagePresetSelect = document.getElementById('languagePresetSelect');
  const languageRulesList = document.getElementById('languageRulesList');

  function syncAboutVersion() {
    const versionElement = document.querySelector('[data-i18n="settings.aboutVersion"]');
    if (!versionElement) return;

    let version = '1.1.5';
    try {
      const runtime = globalThis.browser?.runtime || globalThis.chrome?.runtime;
      version = runtime?.getManifest?.().version || version;
    } catch {
      // Keep the displayed fallback version when the extension API is unavailable.
    }
    versionElement.textContent = I18N.t('settings.aboutVersion', { version });
  }

  async function initPage() {
    await I18N.init();
    syncAboutVersion();
    Theme.apply();
    document.getElementById('defaultRuleCode').textContent = `/${DEFAULT_PATTERN}/${DEFAULT_FLAGS}`;
    langSelect.value = I18N.getCurrentLang();
    themeSelect.value = Theme.getPreference();
    loadRule();
    loadNoiseRules();
    loadBracketOptions();
    loadConnectivitySettings();
    loadRetentionSettings();
    loadHistorySettings();
    renderHistory();
    updatePresetOptions();
  }

  function normalizedFlags(flags) {
    return Array.from(new Set(`${flags.replace(/\\s/g, '')}g`)).join('');
  }

  function validateRule() {
    const pattern = patternInput.value.trim();
    if (!pattern) throw new Error(I18N.t('settings.errorEmptyPattern'));
    const flags = normalizedFlags(flagsInput.value);
    new RegExp(pattern, flags);
    return { pattern, flags };
  }

  function showMessage(element, text, isError = false) {
    element.textContent = text;
    element.classList.toggle('error', isError);
  }

  function saveAllSettings() {
    try {
      const rule = validateRule();
      const noiseRules = collectNoiseRules();
      const bracketPairs = collectBracketOptions();
      localStorage.setItem(REGEX_STORAGE_KEY, JSON.stringify(rule));
      localStorage.setItem(NOISE_STORAGE_KEY, JSON.stringify(noiseRules));
      localStorage.setItem(BRACKET_STORAGE_KEY, JSON.stringify(bracketPairs));
      flagsInput.value = rule.flags;
      showMessage(message, I18N.t('settings.saveSuccess'));
    } catch (error) {
      showMessage(message, error.message || I18N.t('settings.saveError'), true);
    }
  }

  function loadRule() {
    try {
      const saved = JSON.parse(localStorage.getItem(REGEX_STORAGE_KEY) || 'null');
      if (saved && typeof saved.pattern === 'string' && typeof saved.flags === 'string') {
        patternInput.value = saved.pattern;
        flagsInput.value = saved.flags;
        return;
      }
    } catch {
      // Fall back to the built-in rule when stored settings are invalid.
    }
    patternInput.value = DEFAULT_PATTERN;
    flagsInput.value = DEFAULT_FLAGS;
  }

  function validateCharacterRange(range) {
    if (!range || range.length > 512 || /[\[\]/^\r\n]/.test(range)) return false;
    if (/\\(?!u(?:\{[0-9a-f]{1,6}\}|[0-9a-f]{4})|x[0-9a-f]{2})/i.test(range)) return false;
    try {
      new RegExp(`[${range}]`, 'u');
      return true;
    } catch {
      return false;
    }
  }

  function makeRuleRow(rule = {}) {
    const row = document.createElement('div');
    row.className = 'language-rule';
    row.dataset.presetKey = getPresetKey(rule);

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'rule-name';
    nameInput.value = rule.name || '';
    nameInput.placeholder = I18N.t('settings.ruleNamePlaceholder');
    nameInput.setAttribute('aria-label', I18N.t('settings.ruleNamePlaceholder'));

    const rangeInput = document.createElement('input');
    rangeInput.type = 'text';
    rangeInput.className = 'rule-range';
    rangeInput.value = rule.range || '';
    rangeInput.placeholder = I18N.t('settings.ruleRangePlaceholder');
    rangeInput.spellcheck = false;
    rangeInput.setAttribute('aria-label', I18N.t('settings.ruleRangePlaceholder'));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-rule-btn';
    deleteButton.textContent = I18N.t('settings.deleteLanguageRule');
    deleteButton.addEventListener('click', () => {
      row.remove();
      updatePresetOptions();
    });

    row.append(nameInput, rangeInput, deleteButton);
    return row;
  }

  function renderNoiseRules(rules) {
    languageRulesList.textContent = '';
    rules.forEach(rule => languageRulesList.appendChild(makeRuleRow(rule)));
    updatePresetOptions();
  }

  function getNoiseRulesForCurrentLanguage() {
    return Array.from(languageRulesList.querySelectorAll('.language-rule')).map(row => {
      const preset = row.dataset.presetKey || 'custom';
      const translationKey = `settings.preset${preset[0].toUpperCase()}${preset.slice(1)}`;
      const translatedName = I18N.t(translationKey);
      return {
        name: preset !== 'custom' && translatedName !== translationKey
          ? translatedName
          : row.querySelector('.rule-name').value,
        range: row.querySelector('.rule-range').value,
        preset
      };
    });
  }

  function getPresetKey(rule) {
    if (rule.preset && Object.hasOwn(PRESETS, rule.preset)) return rule.preset;
    const matchingPreset = Object.entries(PRESETS).find(([key, preset]) => {
      return key !== 'custom' && preset.range === rule.range;
    });
    return matchingPreset ? matchingPreset[0] : 'custom';
  }

  function updatePresetOptions() {
    const usedPresets = new Set(
      Array.from(languageRulesList.querySelectorAll('.language-rule'))
        .map(row => row.dataset.presetKey)
        .filter(key => key && key !== 'custom')
    );
    const previousSelection = languagePresetSelect.value;
    const availableKeys = Object.keys(PRESETS).filter(key => key === 'custom' || !usedPresets.has(key));

    languagePresetSelect.textContent = '';
    availableKeys.forEach(key => {
      const option = document.createElement('option');
      const translationKey = `settings.preset${key[0].toUpperCase()}${key.slice(1)}`;
      const translatedName = I18N.t(translationKey);
      option.value = key;
      option.textContent = translatedName === translationKey ? (PRESETS[key].name || key) : translatedName;
      languagePresetSelect.appendChild(option);
    });

    languagePresetSelect.value = availableKeys.includes(previousSelection)
      ? previousSelection
      : (availableKeys[0] || 'custom');
  }

  function loadNoiseRules() {
    try {
      const saved = JSON.parse(localStorage.getItem(NOISE_STORAGE_KEY) || 'null');
      if (Array.isArray(saved)) {
        renderNoiseRules(saved);
        return;
      }
    } catch {
      // Use the built-in Chinese range if saved settings are unreadable.
    }
    renderNoiseRules([{ name: PRESETS.chinese.name, range: PRESETS.chinese.range, preset: 'chinese' }]);
  }

  function loadBracketOptions() {
    let enabledPairs = [];
    try {
      const saved = JSON.parse(localStorage.getItem(BRACKET_STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) enabledPairs = saved;
    } catch {
      // Keep all bracket cleanup options disabled if stored settings are unreadable.
    }
    document.querySelectorAll('[data-bracket-pair]').forEach(option => {
      option.checked = enabledPairs.includes(option.dataset.bracketPair);
    });
  }

  function collectBracketOptions() {
    return Array.from(document.querySelectorAll('[data-bracket-pair]:checked'))
      .map(option => option.dataset.bracketPair);
  }

  function loadConnectivitySettings() {
    let settings = { enabled: false, concurrency: 4 };
    try {
      const saved = JSON.parse(localStorage.getItem(CONNECTIVITY_STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        settings = {
          enabled: saved.enabled === true,
          concurrency: Number.isInteger(saved.concurrency)
            ? Math.min(20, Math.max(1, saved.concurrency))
            : 4
        };
      }
    } catch {
      // Use safe defaults if saved settings are unreadable.
    }
    connectivityEnabled.checked = settings.enabled;
    connectivityConcurrency.value = String(settings.concurrency);
  }

  function saveConnectivitySettings(enabled = connectivityEnabled.checked) {
    let concurrency = Number(connectivityConcurrency.value);
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 20) {
      if (enabled) {
        showMessage(connectivitySettingsMessage, I18N.t('settings.concurrencyInvalid'), true);
        return false;
      }
      concurrency = 4;
    }
    connectivityConcurrency.value = String(concurrency);
    localStorage.setItem(CONNECTIVITY_STORAGE_KEY, JSON.stringify({ enabled, concurrency }));
    showMessage(connectivitySettingsMessage, I18N.t('settings.connectivitySaved'));
    return true;
  }

  function loadRetentionSettings() {
    const allowedValues = ['never', 'browser', 'after-use'];
    const saved = localStorage.getItem(RETENTION_STORAGE_KEY);
    contentRetention.value = allowedValues.includes(saved) ? saved : 'browser';
  }

  function saveRetentionSettings() {
    localStorage.setItem(RETENTION_STORAGE_KEY, contentRetention.value);
    showMessage(retentionSettingsMessage, I18N.t('settings.retentionSaved'));
  }

  function getHistorySettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_SETTINGS_KEY) || 'null');
      return {
        enabled: saved?.enabled === true,
        limit: saved?.limit === 80 ? 80 : 50
      };
    } catch {
      return { enabled: false, limit: 50 };
    }
  }

  function loadHistorySettings() {
    const settings = getHistorySettings();
    historyEnabled.checked = settings.enabled;
    historyLimit.value = String(settings.limit);
    historyLimit.disabled = !settings.enabled;
  }

  function getExtractionHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
      return Array.isArray(saved)
        ? saved.filter(item => item && typeof item.url === 'string' && Number.isFinite(item.extractedAt))
        : [];
    } catch {
      return [];
    }
  }

  function saveHistorySettings() {
    const settings = { enabled: historyEnabled.checked, limit: Number(historyLimit.value) === 80 ? 80 : 50 };
    localStorage.setItem(HISTORY_SETTINGS_KEY, JSON.stringify(settings));
    historyLimit.value = String(settings.limit);
    historyLimit.disabled = !settings.enabled;
    const entries = getExtractionHistory().slice(0, settings.limit);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
    currentHistoryPage = Math.min(currentHistoryPage, Math.max(0, Math.ceil(entries.length / HISTORY_PAGE_SIZE) - 1));
    showMessage(historySettingsMessage, I18N.t('settings.historySaved'));
    renderHistory();
  }

  async function clearAllStoredData() {
    localStorage.clear();
    const browserStorage = globalThis.browser?.storage;
    if (browserStorage) {
      await Promise.all(['local', 'sync', 'session'].map(async areaName => {
        try {
          await browserStorage[areaName]?.clear();
        } catch {
          // Continue clearing other areas when a browser does not expose one.
        }
      }));
    } else {
      const chromeStorage = globalThis.chrome?.storage;
      if (chromeStorage) {
        await Promise.all(['local', 'sync', 'session'].map(areaName => new Promise(resolve => {
          const area = chromeStorage[areaName];
          if (!area?.clear) {
            resolve();
            return;
          }
          try {
            area.clear(() => {
              void globalThis.chrome?.runtime?.lastError;
              resolve();
            });
          } catch {
            resolve();
          }
        })));
      }
    }
    window.location.reload();
  }

  function renderHistory() {
    const history = getExtractionHistory();
    const pageCount = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
    currentHistoryPage = Math.min(currentHistoryPage, pageCount - 1);
    const pageItems = history.slice(currentHistoryPage * HISTORY_PAGE_SIZE, (currentHistoryPage + 1) * HISTORY_PAGE_SIZE);
    historyList.textContent = '';

    if (pageItems.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'history-empty';
      empty.textContent = I18N.t('settings.historyEmpty');
      historyList.appendChild(empty);
    } else {
      pageItems.forEach((item, pageIndex) => {
        const row = document.createElement('div');
        row.className = 'history-row';

        const link = document.createElement('span');
        link.className = 'history-link';
        link.textContent = item.url;
        link.title = item.url;

        const time = document.createElement('time');
        time.className = 'history-time';
        time.dateTime = new Date(item.extractedAt).toISOString();
        time.textContent = new Intl.DateTimeFormat(I18N.getCurrentLang(), {
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(new Date(item.extractedAt));

        const open = document.createElement('button');
        open.type = 'button';
        open.className = 'secondary-btn';
        open.textContent = I18N.t('settings.historyOpen');
        open.addEventListener('click', () => {
          const runtime = globalThis.browser?.tabs || globalThis.chrome?.tabs;
          if (runtime?.create) runtime.create({ url: item.url });
          else window.open(item.url, '_blank', 'noopener');
        });

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'secondary-btn history-delete-btn';
        remove.textContent = I18N.t('settings.historyDelete');
        remove.addEventListener('click', () => {
          const entries = getExtractionHistory();
          entries.splice(currentHistoryPage * HISTORY_PAGE_SIZE + pageIndex, 1);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
          currentHistoryPage = Math.min(currentHistoryPage, Math.max(0, Math.ceil(entries.length / HISTORY_PAGE_SIZE) - 1));
          showMessage(historySettingsMessage, I18N.t('settings.historyDeleted'));
          renderHistory();
        });

        const actions = document.createElement('div');
        actions.className = 'history-actions';
        actions.append(open, remove);
        row.append(link, time, actions);
        historyList.appendChild(row);
      });
    }

    historyPagination.hidden = history.length <= HISTORY_PAGE_SIZE;
    historyPrevious.disabled = currentHistoryPage <= 0;
    historyNext.disabled = currentHistoryPage >= pageCount - 1;
    historyPageLabel.textContent = I18N.t('settings.historyPage', { current: currentHistoryPage + 1, total: pageCount });
  }

  async function enableConnectivityChecks() {
    const concurrency = Number(connectivityConcurrency.value);
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 20) {
      connectivityEnabled.checked = false;
      saveConnectivitySettings(false);
      showMessage(connectivitySettingsMessage, I18N.t('settings.concurrencyInvalid'), true);
      return;
    }

    const permissions = globalThis.browser?.permissions || globalThis.chrome?.permissions;
    if (!permissions?.request) {
      connectivityEnabled.checked = false;
      saveConnectivitySettings(false);
      showMessage(connectivitySettingsMessage, I18N.t('settings.permissionUnavailable'), true);
      return;
    }

    try {
      const granted = await permissions.request({ origins: ['http://*/*', 'https://*/*'] });
      if (!granted) {
        connectivityEnabled.checked = false;
        saveConnectivitySettings(false);
        showMessage(connectivitySettingsMessage, I18N.t('settings.permissionDenied'), true);
        return;
      }
      if (!saveConnectivitySettings(true)) connectivityEnabled.checked = false;
    } catch {
      connectivityEnabled.checked = false;
      saveConnectivitySettings(false);
      showMessage(connectivitySettingsMessage, I18N.t('settings.permissionDenied'), true);
    }
  }

  function collectNoiseRules() {
    const rows = Array.from(languageRulesList.querySelectorAll('.language-rule'));
    const rules = [];
    const usedPresets = new Set();
    for (const row of rows) {
      const name = row.querySelector('.rule-name').value.trim();
      const range = row.querySelector('.rule-range').value.trim();
      if (!name || !range || !validateCharacterRange(range)) {
        throw new Error(I18N.t('settings.invalidLanguageRule'));
      }
      const preset = row.dataset.presetKey || 'custom';
      if (preset !== 'custom' && usedPresets.has(preset)) {
        throw new Error(I18N.t('settings.duplicateLanguageRule'));
      }
      if (preset !== 'custom') usedPresets.add(preset);
      rules.push({ name, range, preset });
    }
    return rules;
  }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(nav => nav.removeAttribute('aria-current'));
      item.setAttribute('aria-current', 'page');
      document.querySelectorAll('.settings-section').forEach(section => {
        section.hidden = section.id !== `section-${item.dataset.section}`;
      });
    });
  });

  langSelect.addEventListener('change', async () => {
    I18N.setLang(langSelect.value);
    await I18N.init();
    syncAboutVersion();
    langSelect.value = I18N.getCurrentLang();
    document.getElementById('defaultRuleCode').textContent = `/${DEFAULT_PATTERN}/${DEFAULT_FLAGS}`;
    renderNoiseRules(getNoiseRulesForCurrentLanguage());
    updatePresetOptions();
    showMessage(message, '');
    showMessage(connectivitySettingsMessage, '');
    showMessage(historySettingsMessage, '');
    renderHistory();
  });

  themeSelect.addEventListener('change', () => {
    themeSelect.value = Theme.setPreference(themeSelect.value);
  });

  connectivityEnabled.addEventListener('change', () => {
    if (connectivityEnabled.checked) {
      enableConnectivityChecks();
    } else {
      saveConnectivitySettings(false);
    }
  });

  connectivityConcurrency.addEventListener('change', () => {
    saveConnectivitySettings();
  });

  contentRetention.addEventListener('change', saveRetentionSettings);

  historyEnabled.addEventListener('change', saveHistorySettings);
  historyLimit.addEventListener('change', saveHistorySettings);
  historyPrevious.addEventListener('click', () => {
    currentHistoryPage = Math.max(0, currentHistoryPage - 1);
    renderHistory();
  });
  historyNext.addEventListener('click', () => {
    currentHistoryPage += 1;
    renderHistory();
  });

  clearStorageBtn.addEventListener('click', async () => {
    if (!window.confirm(I18N.t('settings.clearStorageConfirm'))) return;
    await clearAllStoredData();
  });

  document.getElementById('addLanguageRuleBtn').addEventListener('click', () => {
    const presetKey = languagePresetSelect.value;
    const usedPresets = new Set(
      Array.from(languageRulesList.querySelectorAll('.language-rule')).map(row => row.dataset.presetKey)
    );
    if (presetKey !== 'custom' && usedPresets.has(presetKey)) {
      updatePresetOptions();
      showMessage(message, I18N.t('settings.duplicateLanguageRule'), true);
      return;
    }
    const preset = PRESETS[presetKey] || PRESETS.custom;
    const translatedName = I18N.t(`settings.preset${presetKey[0].toUpperCase()}${presetKey.slice(1)}`);
    const name = presetKey === 'custom' ? '' : (translatedName.startsWith('settings.') ? preset.name : translatedName);
    const row = makeRuleRow({ name, range: preset.range, preset: presetKey });
    languageRulesList.appendChild(row);
    updatePresetOptions();
    row.querySelector(presetKey === 'custom' ? '.rule-name' : '.rule-range').focus();
    showMessage(message, '');
  });

  saveBtn.addEventListener('click', saveAllSettings);
  resetBtn.addEventListener('click', () => {
    patternInput.value = DEFAULT_PATTERN;
    flagsInput.value = DEFAULT_FLAGS;
    showMessage(message, '');
  });

  patternInput.addEventListener('input', () => showMessage(message, ''));
  flagsInput.addEventListener('input', () => showMessage(message, ''));

  initPage();
})();
