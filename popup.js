document.addEventListener('DOMContentLoaded', () => {
  const rawInput = document.getElementById('rawInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const extractBtn = document.getElementById('extractBtn');
  const linksContainer = document.getElementById('linksContainer');
  const resultCount = document.getElementById('resultCount');
  const status = document.getElementById('status');

  // 读取剪切板
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      rawInput.value = text;
      showStatus('已读取剪切板');
    } catch (err) {
      showStatus('读取失败，请手动粘贴');
    }
  });

  // 提取链接主逻辑
  extractBtn.addEventListener('click', () => {
    const text = rawInput.value;
    // 正则表达式过滤 URL
    const urlRegex = /(https?:\/\/[^\s<>"'{}|\\^`\[\]]+)/gi;
    const matches = text.match(urlRegex) || [];

    // 去重并清洗尾部标点
    const cleanedLinks = [...new Set(matches.map(url => url.replace(/[，。；！,;!]+$/, '')))];

    // 清空展示区域
    linksContainer.textContent = '';

    if (cleanedLinks.length === 0) {
      resultCount.textContent = '提取结果：';
      const emptyBox = document.createElement('div');
      emptyBox.className = 'empty-box';
      emptyBox.textContent = '未检测到有效 URL 链接';
      linksContainer.appendChild(emptyBox);
      return;
    }

    resultCount.textContent = `提取结果（${cleanedLinks.length} 条）：`;

    // 安全渲染卡片节点（不使用 innerHTML，规避 Firefox 警告）
    cleanedLinks.forEach(url => {
      const card = document.createElement('div');
      card.className = 'link-card';

      const linkText = document.createElement('span');
      linkText.className = 'link-text';
      linkText.textContent = url;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'link-actions';

      const openBtn = document.createElement('button');
      openBtn.className = 'icon-btn';
      openBtn.textContent = '打开';
      openBtn.onclick = () => chrome.tabs.create({ url });

      const copyBtn = document.createElement('button');
      copyBtn.className = 'icon-btn';
      copyBtn.textContent = '复制';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(url);
        showStatus('已复制');
      };

      btnGroup.appendChild(openBtn);
      btnGroup.appendChild(copyBtn);
      card.appendChild(linkText);
      card.appendChild(btnGroup);

      linksContainer.appendChild(card);
    });
  });

  function showStatus(msg) {
    status.textContent = msg;
    status.style.display = 'inline';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  }
});