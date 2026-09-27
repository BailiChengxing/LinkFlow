(() => {
  const REGEX_STORAGE_KEY = 'linkflow.regexSettings';
  const NOISE_STORAGE_KEY = 'linkflow.noiseRules';
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
  const languageRulesList = document.getElementById('languageRulesList');
  const languageMessage = document.getElementById('languageMessage');

  async function initPage() {
    await I18N.init();
    document.getElementById('defaultRuleCode').textContent = `/${DEFAULT_PATTERN}/${DEFAULT_FLAGS}`;
    langSelect.value = I18N.getCurrentLang();
    loadRule();
    loadNoiseRules();
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

  function saveRule() {
    try {
      const rule = validateRule();
      localStorage.setItem(REGEX_STORAGE_KEY, JSON.stringify(rule));
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
    deleteButton.addEventListener('click', () => row.remove());

    row.append(nameInput, rangeInput, deleteButton);
    return row;
  }

  function renderNoiseRules(rules) {
    languageRulesList.textContent = '';
    rules.forEach(rule => languageRulesList.appendChild(makeRuleRow(rule)));
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
    renderNoiseRules([{ name: PRESETS.chinese.name, range: PRESETS.chinese.range }]);
  }

  function saveNoiseRules() {
    const rows = Array.from(languageRulesList.querySelectorAll('.language-rule'));
    const rules = [];
    for (const row of rows) {
      const name = row.querySelector('.rule-name').value.trim();
      const range = row.querySelector('.rule-range').value.trim();
      if (!name || !range || !validateCharacterRange(range)) {
        showMessage(languageMessage, I18N.t('settings.invalidLanguageRule'), true);
        return;
      }
      rules.push({ name, range });
    }
    localStorage.setItem(NOISE_STORAGE_KEY, JSON.stringify(rules));
    showMessage(languageMessage, I18N.t('settings.languageRulesSaved'));
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
    langSelect.value = I18N.getCurrentLang();
    document.getElementById('defaultRuleCode').textContent = `/${DEFAULT_PATTERN}/${DEFAULT_FLAGS}`;
    showMessage(message, '');
    showMessage(languageMessage, '');
  });

  document.getElementById('addLanguageRuleBtn').addEventListener('click', () => {
    const presetKey = document.getElementById('languagePresetSelect').value;
    const preset = PRESETS[presetKey] || PRESETS.custom;
    const translatedName = I18N.t(`settings.preset${presetKey[0].toUpperCase()}${presetKey.slice(1)}`);
    const name = presetKey === 'custom' ? '' : (translatedName.startsWith('settings.') ? preset.name : translatedName);
    const row = makeRuleRow({ name, range: preset.range });
    languageRulesList.appendChild(row);
    row.querySelector(presetKey === 'custom' ? '.rule-name' : '.rule-range').focus();
    showMessage(languageMessage, '');
  });

  document.getElementById('saveLanguageRulesBtn').addEventListener('click', saveNoiseRules);

  saveBtn.addEventListener('click', saveRule);
  resetBtn.addEventListener('click', () => {
    patternInput.value = DEFAULT_PATTERN;
    flagsInput.value = DEFAULT_FLAGS;
    saveRule();
  });

  patternInput.addEventListener('input', () => showMessage(message, ''));
  flagsInput.addEventListener('input', () => showMessage(message, ''));

  initPage();
})();
