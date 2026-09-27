document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n
  await I18N.init();
  Theme.apply();

  const rawInput = document.getElementById('rawInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const extractBtn = document.getElementById('extractBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const linksContainer = document.getElementById('linksContainer');
  const resultCount = document.getElementById('resultCount');
  const status = document.getElementById('status');
  const POPUP_STATE_KEY = 'linkflow.popupState';
  const SESSION_MARKER_KEY = 'linkflow.popupSessionStarted';
  const popupState = { input: '', links: [], emptyMessageKey: 'popup.emptyWaiting' };

  await preparePopupState();
  rawInput.value = popupState.input;
  if (popupState.links.length > 0) {
    const connectivitySettings = getConnectivitySettings();
    if (connectivitySettings.enabled) {
      popupState.links.forEach(link => {
        link.statusKey = 'connectivityChecking';
        link.state = 'checking';
        delete link.status;
      });
      savePopupState();
    }
    const connectivityBadges = renderLinks(popupState.links, connectivitySettings.enabled);
    if (connectivitySettings.enabled) runConnectivityTests(connectivityBadges, connectivitySettings.concurrency);
  } else if (popupState.emptyMessageKey !== 'popup.emptyWaiting') {
    renderEmpty(I18N.t(popupState.emptyMessageKey));
  }

  rawInput.addEventListener('input', () => {
    popupState.input = rawInput.value;
    savePopupState();
  });

  window.addEventListener('pagehide', () => {
    if (getContentRetention() === 'after-use') localStorage.removeItem(POPUP_STATE_KEY);
  });

  settingsBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('settings.html', '_blank');
    }
  });

  // 读取剪贴板
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      rawInput.value = text;
      popupState.input = text;
      savePopupState();
      showStatus(I18N.t('popup.statusPasteOk'));
    } catch (err) {
      showStatus(I18N.t('popup.statusPasteFail'));
    }
  });

  // 提取链接主逻辑
  extractBtn.addEventListener('click', () => {
    const rawText = rawInput.value.trim();
    popupState.input = rawInput.value;

    if (!rawText) {
      popupState.links = [];
      popupState.emptyMessageKey = 'popup.emptyNoInput';
      savePopupState();
      linksContainer.textContent = '';
      renderEmpty(I18N.t('popup.emptyNoInput'));
      return;
    }

    const extractedSet = new Set();
    const sanitizedText = removeBracketedContent(removeInsertedNoise(rawText));
    const urlRegex = getUrlRegex();
    const matches = sanitizedText.match(urlRegex) || [];

    matches.forEach(url => {
      const cleaned = cleanUrl(url);
      if (cleaned) extractedSet.add(cleaned);
    });

    const cleanedLinks = Array.from(extractedSet).filter(Boolean);

    if (cleanedLinks.length === 0) {
      popupState.links = [];
      popupState.emptyMessageKey = 'popup.emptyNoResult';
      savePopupState();
      linksContainer.textContent = '';
      renderEmpty(I18N.t('popup.emptyNoResult'));
      return;
    }

    const connectivitySettings = getConnectivitySettings();
    popupState.links = cleanedLinks.map(url => ({
      url,
      statusKey: connectivitySettings.enabled ? 'connectivityChecking' : null,
      state: connectivitySettings.enabled ? 'checking' : null
    }));
    popupState.emptyMessageKey = null;
    savePopupState();
    linksContainer.textContent = '';
    const connectivityBadges = renderLinks(popupState.links, connectivitySettings.enabled);
    if (connectivitySettings.enabled) {
      runConnectivityTests(connectivityBadges, connectivitySettings.concurrency);
    }
  });

  function renderLinks(links, connectivityEnabled) {
    linksContainer.textContent = '';
    resultCount.textContent = I18N.t('popup.resultCount', { count: links.length });
    const connectivityBadges = [];
    links.forEach(link => {
      const url = link.url;
      const card = document.createElement('div');
      card.className = 'link-card';

      const linkText = document.createElement('span');
      linkText.className = 'link-text';
      linkText.textContent = url;

      const connectivityBadge = document.createElement('span');
      connectivityBadge.className = 'connectivity-status';
      if (connectivityEnabled) {
        connectivityBadge.textContent = I18N.t(`popup.${link.statusKey || 'connectivityChecking'}`, { status: link.status });
        if (link.state) connectivityBadge.dataset.state = link.state;
        connectivityBadges.push({ url, element: connectivityBadge, record: link });
      }

      const btnGroup = document.createElement('div');
      btnGroup.className = 'link-actions';

      const openBtn = document.createElement('button');
      openBtn.className = 'icon-btn';
      openBtn.textContent = I18N.t('popup.openBtn');
      openBtn.onclick = () => {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url });
        } else {
          window.open(url, '_blank');
        }
      };

      const copyBtn = document.createElement('button');
      copyBtn.className = 'icon-btn';
      copyBtn.textContent = I18N.t('popup.copyBtn');
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(url);
        showStatus(I18N.t('popup.statusCopied'));
      };

      btnGroup.appendChild(openBtn);
      btnGroup.appendChild(copyBtn);
      card.appendChild(linkText);
      if (connectivityEnabled) card.appendChild(connectivityBadge);
      card.appendChild(btnGroup);

      linksContainer.appendChild(card);
    });
    return connectivityBadges;
  }

  async function preparePopupState() {
    const hasSession = await getSessionMarker();
    if (hasSession === false) {
      if (getContentRetention() !== 'never') localStorage.removeItem(POPUP_STATE_KEY);
      await setSessionMarker();
    }

    try {
      const saved = JSON.parse(localStorage.getItem(POPUP_STATE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;
      popupState.input = typeof saved.input === 'string' ? saved.input : '';
      popupState.links = Array.isArray(saved.links)
        ? saved.links.filter(link => link && typeof link.url === 'string').map(link => ({
          url: link.url,
          statusKey: typeof link.statusKey === 'string' ? link.statusKey : null,
          state: typeof link.state === 'string' ? link.state : null,
          ...(Number.isInteger(link.status) ? { status: link.status } : {})
        }))
        : [];
      popupState.emptyMessageKey = typeof saved.emptyMessageKey === 'string'
        ? saved.emptyMessageKey
        : (popupState.links.length ? null : 'popup.emptyWaiting');
    } catch {
      localStorage.removeItem(POPUP_STATE_KEY);
    }
  }

  function getContentRetention() {
    const setting = localStorage.getItem('linkflow.contentRetention');
    return ['never', 'browser', 'after-use'].includes(setting) ? setting : 'browser';
  }

  function savePopupState() {
    try {
      localStorage.setItem(POPUP_STATE_KEY, JSON.stringify(popupState));
    } catch {
      // Keep the popup usable when browser storage is unavailable or full.
    }
  }

  async function getSessionMarker() {
    const browserArea = globalThis.browser?.storage?.session;
    if (browserArea) {
      try {
        const stored = await browserArea.get(SESSION_MARKER_KEY);
        return stored[SESSION_MARKER_KEY] === true;
      } catch {
        return null;
      }
    }
    const chromeArea = globalThis.chrome?.storage?.session;
    if (!chromeArea) return null;
    return new Promise(resolve => {
      try {
        chromeArea.get(SESSION_MARKER_KEY, result => resolve(result?.[SESSION_MARKER_KEY] === true));
      } catch {
        resolve(null);
      }
    });
  }

  async function setSessionMarker() {
    const browserArea = globalThis.browser?.storage?.session;
    if (browserArea) {
      try {
        await browserArea.set({ [SESSION_MARKER_KEY]: true });
      } catch {
        // Session storage is optional on older browsers.
      }
      return;
    }
    const chromeArea = globalThis.chrome?.storage?.session;
    if (!chromeArea) return;
    await new Promise(resolve => {
      try {
        chromeArea.set({ [SESSION_MARKER_KEY]: true }, resolve);
      } catch {
        resolve();
      }
    });
  }

  function getConnectivitySettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('linkflow.connectivityTest') || 'null');
      return {
        enabled: saved?.enabled === true,
        concurrency: Number.isInteger(saved?.concurrency)
          ? Math.min(20, Math.max(1, saved.concurrency))
          : 4
      };
    } catch {
      return { enabled: false, concurrency: 4 };
    }
  }

  async function runConnectivityTests(items, concurrency) {
    const permissions = globalThis.browser?.permissions || globalThis.chrome?.permissions;
    if (!permissions?.contains) {
      items.forEach(({ element, record }) => setConnectivityBadge(element, 'connectivityPermissionMissing', 'error', undefined, record));
      return;
    }

    try {
      const hasPermission = await permissions.contains({ origins: ['http://*/*', 'https://*/*'] });
      if (!hasPermission) {
        items.forEach(({ element, record }) => setConnectivityBadge(element, 'connectivityPermissionMissing', 'error', undefined, record));
        return;
      }
    } catch {
      items.forEach(({ element, record }) => setConnectivityBadge(element, 'connectivityPermissionMissing', 'error', undefined, record));
      return;
    }

    let nextIndex = 0;
    async function worker() {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await checkConnectivity(item.url, item.element, item.record);
      }
    }

    const workerCount = Math.min(items.length, Math.max(1, Math.min(20, concurrency)));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
  }

  async function checkConnectivity(url, badge, record) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        signal: controller.signal
      });
      setConnectivityBadge(badge, 'connectivityReachable', 'reachable', { status: response.status }, record);
    } catch {
      setConnectivityBadge(badge, controller.signal.aborted ? 'connectivityTimedOut' : 'connectivityUnreachable', 'error', undefined, record);
    } finally {
      clearTimeout(timeout);
    }
  }

  function setConnectivityBadge(element, translationKey, state, params, record) {
    element.textContent = I18N.t(`popup.${translationKey}`, params);
    element.dataset.state = state;
    element.setAttribute('role', 'status');
    if (record) {
      record.statusKey = translationKey;
      record.state = state;
      if (Number.isInteger(params?.status)) record.status = params.status;
      else delete record.status;
      savePopupState();
    }
  }

  function getUrlRegex() {
    const defaultRegex = /(?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#][^\s<>"'{}|\\^`\[\]]*)?/gi;

    try {
      const saved = JSON.parse(localStorage.getItem('linkflow.regexSettings') || 'null');
      if (!saved || typeof saved.pattern !== 'string' || typeof saved.flags !== 'string') {
        return new RegExp(defaultRegex.source, defaultRegex.flags);
      }

      const flags = Array.from(new Set(`${saved.flags}g`)).join('');
      return new RegExp(saved.pattern, flags);
    } catch {
      return new RegExp(defaultRegex.source, defaultRegex.flags);
    }
  }

  function removeInsertedNoise(text) {
    let cleaned = text
      .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    let rules;
    try {
      rules = JSON.parse(localStorage.getItem('linkflow.noiseRules') || 'null');
    } catch {
      rules = null;
    }

    if (!Array.isArray(rules)) {
      rules = [{ range: '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\u{20000}-\\u{2fa1f}' }];
    }

    rules.forEach(rule => {
      if (!rule || typeof rule.range !== 'string' || !rule.range) return;
      if (rule.range.length > 512 || /[\[\]/^\r\n]/.test(rule.range)) return;
      if (/\\(?!u(?:\{[0-9a-f]{1,6}\}|[0-9a-f]{4})|x[0-9a-f]{2})/i.test(rule.range)) return;
      try {
        cleaned = cleaned.replace(new RegExp(`[${rule.range}]+`, 'gu'), '');
      } catch {
        // Ignore invalid character ranges instead of interrupting link extraction.
      }
    });

    return cleaned;
  }

  function removeBracketedContent(text) {
    let enabledPairs;
    try {
      enabledPairs = JSON.parse(localStorage.getItem('linkflow.bracketCleanup') || '[]');
    } catch {
      enabledPairs = [];
    }
    if (!Array.isArray(enabledPairs) || enabledPairs.length === 0) return text;

    const openToClose = new Map();
    const closingCharacters = new Set();
    enabledPairs.forEach(pair => {
      if (typeof pair === 'string' && pair.length === 2) {
        openToClose.set(pair[0], pair[1]);
        closingCharacters.add(pair[1]);
      }
    });
    if (openToClose.size === 0) return text;

    const stack = [];
    const removed = new Uint8Array(text.length);
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (openToClose.has(character)) {
        const close = openToClose.get(character);
        const opening = stack[stack.length - 1];
        if (character === close && opening && opening.close === character) {
          stack.pop();
          removed.fill(1, opening.index, index + 1);
        } else {
          stack.push({ index, close });
        }
      } else if (closingCharacters.has(character) && stack.length > 0) {
        const opening = stack[stack.length - 1];
        if (opening.close === character) {
          stack.pop();
          removed.fill(1, opening.index, index + 1);
        }
      }
    }

    let result = '';
    for (let index = 0; index < text.length; index += 1) {
      if (!removed[index]) result += text[index];
    }
    return result;
  }

  function cleanUrl(url) {
    let cleaned = url.replace(/[.,;!?，。；！？、]+$/u, '').trim();
    if (!cleaned.includes('.')) return '';
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'https://' + cleaned;
    }

    try {
      const parsed = new URL(cleaned);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    } catch {
      return '';
    }

    return cleaned;
  }

  function renderEmpty(message) {
    resultCount.textContent = I18N.t('popup.resultPrefix');
    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-box';
    emptyBox.textContent = message;
    linksContainer.appendChild(emptyBox);
  }

  function showStatus(msg) {
    status.textContent = msg;
    status.style.display = 'inline';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  }
});
