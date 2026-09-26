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
    const rawText = rawInput.value.trim();
    
    // 清空展示区域
    linksContainer.textContent = '';

    if (!rawText) {
      renderEmpty('请输入或粘贴需要提取的文本');
      return;
    }

    const extractedSet = new Set();
    const lines = rawText.split(/[\r\n\s]+/);

    lines.forEach(line => {
      if (!line.trim()) return;

      // 1. 标准 URL 正则（匹配带有 http/https 或常用域名结构的字符串）
      const standardRegex = /(https?:\/\/[^\s\u4e00-\u9fa5<>"'{}|\\^`\[\]]+|[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+[^\s\u4e00-\u9fa5<>"'{}|\\^`\[\]]*)/gi;
      const directMatches = line.match(standardRegex);

      if (directMatches) {
        directMatches.forEach(url => extractedSet.add(cleanUrl(url)));
      } else {
        // 2. 混淆链接容错：去除文本中间夹杂的中文字符（如“删”、“中”、“文”等防封字样）
        const sanitized = line.replace(/[\u4e00-\u9fa5]+/g, '');
        const match = sanitized.match(/(https?:\/\/[^\s<>"'{}|\\^`\[\]]+|[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\/[^\s<>"'{}|\\^`\[\]]*|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/gi);
        if (match) {
          match.forEach(url => extractedSet.add(cleanUrl(url)));
        }
      }
    });

    const cleanedLinks = Array.from(extractedSet).filter(Boolean);

    if (cleanedLinks.length === 0) {
      renderEmpty('未检测到有效 URL 链接');
      return;
    }

    resultCount.textContent = `提取结果（${cleanedLinks.length} 条）：`;

    // 纯 DOM 节点构建渲染（不使用 innerHTML，安全合规）
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
      openBtn.onclick = () => {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url });
        } else {
          window.open(url, '_blank');
        }
      };

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

  // 格式化 URL 与补充 http/https 前缀
  function cleanUrl(url) {
    let cleaned = url.replace(/[，。；！,;!]+$/, '').trim();
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'https://' + cleaned;
    }
    return cleaned;
  }

  // 渲染空状态说明
  function renderEmpty(message) {
    resultCount.textContent = '提取结果：';
    const emptyBox = document.createElement('div');
    emptyBox.className = 'empty-box';
    emptyBox.textContent = message;
    linksContainer.appendChild(emptyBox);
  }

  // 状态提示显示
  function showStatus(msg) {
    status.textContent = msg;
    status.style.display = 'inline';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  }
});