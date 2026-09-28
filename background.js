(() => {
  const MENU_ID = 'linkflow-extract-selection';
  const ENABLED_KEY = 'linkflow.contextMenuEnabled';
  const TITLE_KEY = 'linkflow.contextMenuTitle';
  const SELECTION_KEY = 'linkflow.contextMenuSelection';
  const api = globalThis.chrome || globalThis.browser;

  if (!api?.contextMenus || !api?.storage?.local) return;

  function readConfig() {
    return new Promise(resolve => {
      api.storage.local.get([ENABLED_KEY, TITLE_KEY], result => {
        void api.runtime?.lastError;
        resolve({
          enabled: result?.[ENABLED_KEY] === true,
          title: typeof result?.[TITLE_KEY] === 'string' && result[TITLE_KEY]
            ? result[TITLE_KEY]
            : '用 LinkFlow 提取链接'
        });
      });
    });
  }

  function removeMenu() {
    return new Promise(resolve => {
      api.contextMenus.removeAll(() => {
        void api.runtime?.lastError;
        resolve();
      });
    });
  }

  async function syncMenu() {
    const config = await readConfig();
    await removeMenu();
    if (!config.enabled) return;

    try {
      api.contextMenus.create({
        id: MENU_ID,
        title: config.title,
        contexts: ['selection']
      });
    } catch {
      // The next settings update or startup event can retry menu registration.
    }
  }

  api.runtime.onInstalled.addListener(() => {
    void syncMenu();
  });
  api.runtime.onStartup?.addListener(() => {
    void syncMenu();
  });
  api.storage.onChanged?.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes[ENABLED_KEY] || changes[TITLE_KEY])) {
      void syncMenu();
    }
  });

  api.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || typeof info.selectionText !== 'string') return;
    const selection = info.selectionText.trim();
    if (!selection) return;

    api.storage.local.set({ [SELECTION_KEY]: selection }, () => {
      void api.runtime?.lastError;
      const action = api.action || api.browserAction;
      if (action?.openPopup) {
        try {
          const opening = action.openPopup();
          if (opening?.catch) opening.catch(() => openPopupWindow());
        } catch {
          openPopupWindow();
        }
      } else {
        openPopupWindow();
      }
    });
  });

  function openPopupWindow() {
    if (!api.windows?.create || !api.runtime?.getURL) return;
    api.windows.create({
      url: api.runtime.getURL('popup.html'),
      type: 'popup',
      width: 390,
      height: 640
    }, () => {
      void api.runtime?.lastError;
    });
  }
})();
