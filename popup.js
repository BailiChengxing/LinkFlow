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
      showStatus(I18N.t('popup.statusPasteOk'));
    } catch (err) {
      showStatus(I18N.t('popup.statusPasteFail'));
    }
  });

  // 提取链接主逻辑
  extractBtn.addEventListener('click', () => {
    const rawText = rawInput.value.trim();
    
    // 清空展示区域
    linksContainer.textContent = '';

    if (!rawText) {
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
      renderEmpty(I18N.t('popup.emptyNoResult'));
      return;
    }

    resultCount.textContent = I18N.t('popup.resultCount', { count: cleanedLinks.length });

    const connectivitySettings = getConnectivitySettings();
    const connectivityBadges = [];
    cleanedLinks.forEach(url => {
      const card = document.createElement('div');
      card.className = 'link-card';

      const linkText = document.createElement('span');
      linkText.className = 'link-text';
      linkText.textContent = url;

      const connectivityBadge = document.createElement('span');
      connectivityBadge.className = 'connectivity-status';
      if (connectivitySettings.enabled) {
        connectivityBadge.textContent = I18N.t('popup.connectivityChecking');
        connectivityBadges.push({ url, element: connectivityBadge });
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
      if (connectivitySettings.enabled) card.appendChild(connectivityBadge);
      card.appendChild(btnGroup);

      linksContainer.appendChild(card);
    });

    if (connectivitySettings.enabled) {
      runConnectivityTests(connectivityBadges, connectivitySettings.concurrency);
    }
  });

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
      items.forEach(({ element }) => setConnectivityBadge(element, 'connectivityPermissionMissing', 'error'));
      return;
    }

    try {
      const hasPermission = await permissions.contains({ origins: ['http://*/*', 'https://*/*'] });
      if (!hasPermission) {
        items.forEach(({ element }) => setConnectivityBadge(element, 'connectivityPermissionMissing', 'error'));
        return;
      }
    } catch {
      items.forEach(({ element }) => setConnectivityBadge(element, 'connectivityPermissionMissing', 'error'));
      return;
    }

    let nextIndex = 0;
    async function worker() {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await checkConnectivity(item.url, item.element);
      }
    }

    const workerCount = Math.min(items.length, Math.max(1, Math.min(20, concurrency)));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
  }

  async function checkConnectivity(url, badge) {
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
      setConnectivityBadge(badge, 'connectivityReachable', 'reachable', { status: response.status });
    } catch {
      setConnectivityBadge(badge, controller.signal.aborted ? 'connectivityTimedOut' : 'connectivityUnreachable', 'error');
    } finally {
      clearTimeout(timeout);
    }
  }

  function setConnectivityBadge(element, translationKey, state, params) {
    element.textContent = I18N.t(`popup.${translationKey}`, params);
    element.dataset.state = state;
    element.setAttribute('role', 'status');
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
