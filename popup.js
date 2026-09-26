document.addEventListener('DOMContentLoaded', () => {
  const rawInput = document.getElementById('rawInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const extractBtn = document.getElementById('extractBtn');
  const linksContainer = document.getElementById('linksContainer');
  const resultCount = document.getElementById('resultCount');
  const statusDiv = document.getElementById('status');

  // 1. 强校验单条 URL 是否合法
  function isValidUrl(urlString) {
    try {
      const parsed = new URL(urlString);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      const hostParts = parsed.hostname.split('.');
      if (hostParts.length < 2) return false;
      const tld = hostParts[hostParts.length - 1];
      return tld.length >= 2 && /^[a-zA-Z]+$/.test(tld);
    } catch (e) {
      return false;
    }
  }

  // 2. 批量提取并清洗多条链接
  function extractAllUrls(text) {
    if (!text || !text.trim()) return [];

    // 全局正则匹配 URL
    const globalUrlPattern = /(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s\u4e00-\u9fa5【】\[\]()]*)?/gi;
    const matches = text.match(globalUrlPattern) || [];

    const extractedSet = new Set(); // 去重集合

    matches.forEach(rawUrl => {
      // 细节清洗：移除尾部标点符号
      let cleanUrl = rawUrl.replace(/[.,;:!?\s]+$/, '');
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }

      if (isValidUrl(cleanUrl)) {
        extractedSet.add(cleanUrl);
      }
    });

    return Array.from(extractedSet);
  }

  // 提示信息控制
  function showStatus(msg, isError = false) {
    statusDiv.innerText = msg;
    statusDiv.style.color = isError ? '#d93025' : '#188038';
    statusDiv.style.display = 'inline';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  // 3. 渲染多链接列表 UI
  function renderLinks(urls) {
    linksContainer.innerHTML = '';

    if (urls.length === 0) {
      resultCount.innerText = '提取结果：0 条';
      linksContainer.innerHTML = `<div class="empty-box">⚠️ 未在文本中提取到有效的链接！</div>`;
      return;
    }

    resultCount.innerText = `已提取 ${urls.length} 条链接：`;

    urls.forEach((url, index) => {
      const card = document.createElement('div');
      card.className = 'link-card';

      card.innerHTML = `
        <a class="link-text" data-url="${url}" title="点击打开">${index + 1}. ${url}</a>
        <div class="link-actions">
          <button class="icon-btn copy-single-btn" data-url="${url}">📋 复制</button>
          <button class="icon-btn open-single-btn" data-url="${url}">🚀 打开</button>
        </div>
      `;

      linksContainer.appendChild(card);
    });

    // 绑定卡片上的点击事件（打开链接）
    linksContainer.querySelectorAll('.link-text, .open-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUrl = e.currentTarget.getAttribute('data-url');
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: targetUrl });
        } else {
          window.open(targetUrl, '_blank');
        }
      });
    });

    // 绑定单条复制按钮点击事件
    linksContainer.querySelectorAll('.copy-single-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const targetUrl = e.currentTarget.getAttribute('data-url');
        await navigator.clipboard.writeText(targetUrl);
        showStatus("✅ 已复制该链接");
      });
    });
  }

  // 4. “读取剪切板”按钮逻辑
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        rawInput.value = text;
        showStatus("📋 已读取剪切板");
      } else {
        showStatus("⚠️ 剪切板为空", true);
      }
    } catch (err) {
      alert("无法读取剪切板，请确保授权: " + err.message);
    }
  });

  // 5. “提取全部链接”主按钮逻辑（仅做提取展示，不写入剪切板）
  extractBtn.addEventListener('click', () => {
    const urls = extractAllUrls(rawInput.value);
    renderLinks(urls);

    if (urls.length > 0) {
      showStatus(`🎉 已成功提取 ${urls.length} 条链接`);
    } else {
      showStatus("⚠️ 提取失败", true);
    }
  });
});