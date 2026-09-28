# 清链助手（LinkFlow）

> 一款轻量、注重隐私的浏览器扩展，可从混杂文本中提取和清理 URL。

**简体中文** | [English](README.md)

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)
![Platforms](https://img.shields.io/badge/Platforms-Chrome%20%7C%20Edge%20%7C%20Firefox-orange.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 功能特性

- **提取链接：** 从粘贴的文本中识别 HTTP/HTTPS 链接，规范化并去重。
- **自定义匹配：** 编辑 JavaScript 正则表达式及标记，或恢复内置默认规则。
- **文本清理：** 按需移除 Unicode 字符范围，并可在匹配前清除选定的括号、尖括号、大括号、书名号及引号和其中内容。
- **连通性测试：** 可选测试提取出的链接并显示连接状态，同时设置最大并发数。启用该功能时，扩展才会请求访问所有 HTTP/HTTPS 网站的可选权限。
- **弹窗内容保留：** 可选择保留原始输入和提取结果、关闭浏览器后删除，或每次使用后删除。
- **右键提取：** 可选启用选中文本的右键菜单，打开 LinkFlow 并立即提取其中的链接。
- **剪贴板输入：** 在弹窗中直接读取剪贴板文本。
- **主题和多语言：** 支持 15 种界面语言，以及浅色、深色和跟随浏览器的自动主题。
- **隐私优先：** 匹配和清理在本地完成。连通性测试会请求你选择测试的链接；输入文本和链接不会上传到 LinkFlow 服务器。
- **浏览器支持：** Chromium 系浏览器（Chrome、Edge、Brave）及 Firefox 桌面版/安卓版。
- **无需构建步骤，无第三方运行时依赖。**

## 安装

### Chrome、Edge 或 Brave

可从 [Microsoft Edge 加载项商店](https://microsoftedge.microsoft.com/addons/detail/gbfnjfjmjijdngcikfldgmkamhcjcmnm)安装已发布的版本，也可按以下步骤加载未打包版本。

1. 下载或克隆本仓库。
2. 打开 `chrome://extensions/`（或浏览器的扩展程序页面）。
3. 开启**开发者模式**。
4. 点击**加载已解压的扩展程序**，选择仓库目录。

### Firefox 桌面版

可从 [Firefox 附加组件商店](https://addons.mozilla.org/zh-CN/firefox/addon/%E6%B8%85%E9%93%BE%E5%8A%A9%E6%89%8B/)安装已发布的版本，也可按以下步骤临时载入。

Firefox 使用独立的 Manifest V3 后台脚本格式。安装 Node.js 后，在仓库目录运行 `node build-firefox.mjs`，再加载生成的 `.build/firefox/manifest.json`。

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击**临时载入附加组件…**。
3. 选择 `.build/firefox/manifest.json`。

Firefox 安卓版可在设备支持时从 [Firefox 附加组件商店](https://addons.mozilla.org/)安装已发布的扩展。

## 使用方法

1. 打开清链助手，粘贴文本或点击**读取剪贴板**。
2. 点击**提取全部链接**，查看清理和去重后的结果。
3. 打开**设置**，配置匹配规则、字符清理、语言、主题和连通性测试。

如需从网页选中文本中提取链接，请先在**设置 → 更多 → 右键菜单**中启用功能。之后选中文本并右键点击，选择**用 LinkFlow 提取链接**即可。

### 连通性测试与权限

链接有效测试默认关闭。进入**设置 → 更多 → 链接有效测试**，启用功能并选择并发数。启用时浏览器会请求访问所有 HTTP/HTTPS 网站的可选权限，以便向提取出的链接发送请求并判断是否收到 HTTP 响应。只有启用后，测试才会在提取链接时运行。超时或请求被阻止会显示为无响应；收到服务器响应时会显示有效及 HTTP 状态码。网站本身有响应，但具体页面仍可能返回错误状态。

在**设置 → 更多 → 有效时间**中，可以选择始终保留弹窗原始输入和提取结果、关闭浏览器后删除，或每次使用后删除。默认设置为关闭浏览器后删除。

### 链接有效测试

**链接有效测试**是一个按链接逐条检查的功能，用于判断提取出的 URL 是否真的可用。提取完成后，系统会对每个链接单独进行测试，若返回 HTTP 响应，则在界面中显示为 **有效**；若超时、失败或被拦截，则显示为 **无响应** 等状态。

这个测试是可选功能，默认关闭。启用后，LinkFlow 会向浏览器申请 HTTP/HTTPS 网站的可选访问权限，并对每个提取出的链接发起轻量请求。测试并发数可以在设置中调整，界面上每条结果旁边都会显示状态标记，方便快速筛选出真正有效的链接。

### 清理规则

在**设置 → 通用**中配置 Unicode 范围和括号/引号类型。默认启用中文字符清理，可按需添加、编辑或删除范围。括号内容清理可分别勾选；匹配到成对符号时，将连同符号内部的内容一起移除。

## 隐私说明

清链助手将偏好设置及按保留策略暂存的弹窗内容保存在浏览器本地，不会把粘贴文本或设置发送到 LinkFlow 后端。启用链接有效测试后，浏览器会向提取出的 URL 发送请求；相应网站可能收到该请求及常规网络元数据。如需停止测试，可关闭该功能，或在浏览器扩展设置中撤销可选的网站访问权限。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `manifest.json` | WebExtension Manifest V3 元数据和权限 |
| `popup.html`、`popup.js` | 弹窗界面、链接提取和测试 |
| `settings.html`、`settings.js` | 设置和偏好配置 |
| `background.js` | 选中文本右键菜单的注册和处理 |
| `manifest.firefox.json`、`build-firefox.mjs` | Firefox 兼容清单及打包脚本 |
| `theme.js`、`i18n.js` | 主题与国际化共享逻辑 |
| `locales/` | 界面翻译文件；`supplemental.json` 用于补齐各语言包缺失的翻译 |
| `_locales/` | 浏览器扩展名称和描述翻译 |

## 开发

这是无需依赖和编译的 HTML/CSS/JavaScript 扩展。测试更改时，将仓库作为未打包扩展加载，并在浏览器扩展管理页面重新加载。

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。
