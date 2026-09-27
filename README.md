# 清链助手 (LinkFlow)

<p align="center">
  <b>一款极简、高效、注重隐私的浏览器扩展，专为从复杂文本中一键提取与批量清洗 URL 链接而设计。</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue.svg" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Platforms-Chrome%20%7C%20Firefox%20(Desktop%20%26%20Android)-orange.svg" alt="Platforms Support">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License">
</p>

---

## ✨ 核心特性

- 🔗 **智能正则清洗**：按配置移除中日文等干扰字符，并清理链接尾部标点。
- ⚙️ **自定义匹配规则**：从弹窗打开设置页，查看或恢复默认规则，也可编辑 JavaScript 正则表达式与标记；设置保存在本机。
- 📋 **剪贴板一键同步**：集成快捷按钮，点击即可直接读取系统剪贴板内容，无需手动粘贴。
- 🌐 **多语言支持**：设置页面支持 15 种界面语言，可在侧边栏的「语言」页面切换。
- 🈳 **干扰文字清理列表**：可自主添加、编辑和删除语言字符范围；提供中文、日文、韩文、西里尔文、阿拉伯文、泰文、希腊文、希伯来文和天城文预设。
- 📦 **全平台兼容**：适配 Chrome / Edge 等 Chromium 核心浏览器，以及 Firefox 桌面版与 Firefox Android 移动端（采用触控友好型响应式交互设计）。
- 🔒 **绝对隐私安全**：基于纯原生 JavaScript 开发，无第三方依赖，所有提取与清洗过程均在**本地浏览器**完成，零数据上传。
- 🚫 **原生无构建**：纯粹的 HTML5 / CSS3 / ES6+ 实现，无需任何打包部署编译环境。

---

## 📸 界面预览

（见 `public/` 目录下的截图）

---

## 📦 安装与测试

### 1. Chrome / Edge / Brave

1. 克隆或下载本仓库代码到本地：
   ```bash
   git clone https://github.com/BailiChengxing/LinkFlow.git
   ```
2. 打开浏览器，访问 `chrome://extensions/`。
3. 开启右上角的 **"开发者模式"**。
4. 点击 **"加载已解压的扩展程序"**，选择项目根目录即可。

### 2. Firefox 桌面版 (Firefox Desktop)

1. 打开 Firefox，在地址栏输入 `about:debugging#/runtime/this-firefox`。
2. 点击 **"临时载入附加组件…"** (Load Temporary Add-on)。
3. 选择项目目录下的 `manifest.json` 文件即可完成加载。

### 3. Firefox 安卓版 (Firefox Android)

1. 确保已将最新版本提交至 [Firefox 附加组件商店 (AMO)](https://addons.mozilla.org/)。
2. 在 Android 版 Firefox 浏览器中访问扩展发布页面。
3. 点击 **"添加到 Firefox"**，安装后即可在手机浏览器的工具菜单中使用。

---

## 📁 项目结构

```text
LinkFlow/
├── manifest.json        # 扩展配置文件 (Manifest V3 / 兼容 Gecko & Gecko Android)
├── popup.html           # 扩展弹窗结构与样式
├── popup.js             # 核心逻辑 (剪贴板读取、正则清洗、原生 DOM 安全渲染)
├── settings.html        # 正则规则设置页面
├── settings.js          # 默认规则、自定义规则校验与本地保存
├── i18n.js              # 国际化模块 (语言加载、翻译、DOM 文本替换)
├── locales/             # 页面级翻译文件
│   ├── zh-CN.json       # 简体中文
│   ├── en.json          # English
│   ├── ja.json          # 日本語
│   └── 其他语言包       # 繁体中文、韩语、法语、德语、西语等
├── _locales/            # 扩展清单级翻译文件 (用于扩展名称和描述)
│   └── 多语种 messages.json 文件
├── icon.png             # 128x128 扩展高清图标
├── ico16.png            # 16x16 扩展图标
├── ico32.png            # 32x32 扩展图标
├── ico48.png            # 48x48 扩展图标
├── ico64.png            # 64x64 扩展图标
├── icon.svg             # 矢量图标源文件
├── public/              # 截图与演示素材
└── README.md            # 项目说明文档
```

---

## 🌐 多语言支持

清链助手提供 **简体中文、繁体中文、English、日本語、한국어、Français、Deutsch、Español、Português (Brasil)、Русский、Italiano、Nederlands、Türkçe、العربية、हिन्दी** 共 15 种界面语言。

- **切换方式**：点击弹窗中的「⚙ 设置」按钮 → 打开侧边栏的「语言」页面并选择界面语言。
- **语言存储**：语言偏好保存在本地 `localStorage` 中（键名 `linkflow.language`），默认为简体中文。
- 缺少单独翻译的文案会回退到英语；阿拉伯语界面使用 RTL 文字方向。

---

## 🈳 干扰字符范围

在设置页的「通用」页面，选择字符集后点击「添加语言」即可将该 Unicode 范围加入清理列表。界面语言仍在单独的「语言」页面设置。当前提供以下预设：

| 字符集 | 用途 |
|------|------|
| 中文 | 清除 CJK 汉字（默认启用） |
| 日文 | 清除平假名、片假名及扩展假名 |
| 韩文 | 清除韩文音节与韩文字母 |
| 俄文、阿拉伯文、泰文 | 清除对应文字范围 |
| 希腊文、希伯来文、天城文 | 清除对应文字范围 |
| 自定义 | 输入名称和自定义 Unicode 字符/范围 |

保存后，Popup 会在链接识别前移除清理列表中的字符，同时保留链接标点和分隔符。例如同时启用中文和日文范围，可修复 `ht牛逼tps://.../disちk/...` 这类文本。

---

## 🛠️ 技术栈

- **规范标准**：WebExtensions Manifest V3
- **前端技术**：HTML5, CSS3 (Flexbox & Media Queries 响应式适配), JavaScript (ES6+ Native DOM API)
- **国际化**：自定义 i18n 模块 + WebExtension `_locales` 标准
- **安全与合规**：纯 DOM 节点创建（避免 innerHTML），通过 Mozilla AMO 安全合规检测。

---

## 📜 开源协议

本项目基于 [MIT License](LICENSE) 协议开源。
