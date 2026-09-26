# 清链助手 (LinkFlow)

<p align="center">
  <img src="icon.png" width="100" height="100" alt="清链助手 Icon">
</p>

<p align="center">
  <b>一款极简、高效、注重隐私的浏览器扩展，专为从复杂文本中一键提取与批量清洗 URL 链接而设计。</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Platforms-Chrome%20%7C%20Firefox%20(Desktop%20%26%20Android)-orange.svg" alt="Platforms Support">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License">
</p>

---

## 🌟 核心特性

- 🧹 **智能正则清洗**：自动剔除干扰文本、中文字符、符号（如 `【】[]`）及链接末尾的标点符号。
- 📋 **剪切板一键同步**：集成快捷按钮，点击即可直接读取系统剪切板内容，无需手动粘贴。
- 📱 **全平台兼容**：适配 Chrome / Edge 等 Chromium 核心浏览器，以及 Firefox 桌面版与 Firefox Android 移动端（采用触控友好型响应式交互设计）。
- 🛡️ **绝对隐私安全**：基于纯原生 JavaScript 开发，无第三方依赖，所有提取与清洗过程均在**本地浏览器端**完成，零数据上传。
- ⚡ **原生无构建**：纯粹的 HTML5 / CSS3 / ES6+ 实现，无需任何打包部署编译环境。

---

## 📸 界面预览



---

## 📦 安装与测试

### 1. Chrome / Edge / Brave

1. 克隆或下载本仓库代码到本地：
   ```bash
   git clone https://github.com/BailiChengxing/LinkFlow.git
   ```
2. 打开浏览器，访问 `chrome://extensions/`。
3. 开启右上角的 **“开发者模式”**。
4. 点击 **“加载已解压的扩展程序”**，选择项目根目录即可。

### 2. Firefox 桌面版 (Firefox Desktop)

1. 打开 Firefox，在地址栏输入 `about:debugging#/runtime/this-firefox`。
2. 点击 **“临时载入附加组件...”** (Load Temporary Add-on)。
3. 选择项目目录下的 `manifest.json` 文件即可完成加载。

### 3. Firefox 安卓版 (Firefox Android)

1. 确保已将最新版本打包提交至 [Firefox 附加组件商店 (AMO)](https://addons.mozilla.org/)。
2. 在 Android 版 Firefox 浏览器中访问扩展发布页面。
3. 点击 **“添加到 Firefox”**，安装后即可在手机浏览器的工具菜单中使用。

---

## 📁 项目结构

```text
LinkFlow/
├── manifest.json   # 扩展配置文件 (Manifest V3 / 兼容 Gecko & Gecko Android)
├── popup.html      # 扩展弹窗结构与样式
├── popup.js        # 核心逻辑 (剪切板读取、正则清洗、原生 DOM 安全渲染)
├── icon.png        # 128x128 扩展高清图标
└── README.md       # 项目说明文档
```

---

## 🛠️ 技术栈

- **规范标准**：WebExtensions Manifest V3
- **前端技术**：HTML5, CSS3 (Flexbox & Media Queries 响应式适配), JavaScript (ES6+ Native DOM API)
- **安全与合规**：纯 DOM 节点创建（避免 innerHTML），通过 Mozilla AMO 安全合规检测。

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 协议开源。