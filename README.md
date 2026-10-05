# ⚡ Antigravity Usage & Quota Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Antigravity IDE](https://img.shields.io/badge/Platform-Antigravity%20IDE-8b5cf6.svg)](https://antigravity.google/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

专为 **Google Antigravity IDE** 量身打造的实时用量监控与订阅配额可视化看板插件。

通过直连 Antigravity 本地 Language Server 与智能会话轨迹引擎，全自动拉取官方订阅配额、统计代码补全采纳率，并追踪 Agent 会话和 Token 消耗。

---

## ✨ 核心特性

- 👑 **官方配额实时直连 (Live Quota Sync)**：
  - 零配置自动发现 Antigravity Language Server 通信端口与安全令牌。
  - 毫秒级直连原生 RPC 接口，实时呈现 **Gemini** 与 **Claude/GPT** 模型的 **5小时配额** 与 **周度配额** 剩余比例及重置倒计时。
- ⭕ **自适应状态进度环 (Adaptive Health Gauges)**：
  - 基于高精度 SVG 动态圆环，从 12 点钟正上方顺时针精确映射剩余配额。
  - 自适应配额健康度变色：**健康 (>40% 绿/紫)**、**预警 (16%~40% 琥珀黄)**、**极低 (≤15% 警示红)**。
- 📊 **全量 Token 与会话统计 (Token & Agent Analytics)**：
  - 自动聚合今日所有 Agent 交互产生的 Prompt（输入）与 Completion（输出）Token。
  - 自动统计 Agent 会话场次、工具调用 (Tool Calls) 频次以及累计 Lifetime 消耗。
- 🎯 **Tab 代码补全采纳率分析 (Tab Acceptance Rate)**：
  - 实时捕获编辑器代码补全建议与采纳动作，精准呈现当前补全效率。
- 🖥️ **全景多端交互入口**：
  - **右下角状态栏**：常驻显示当前核心配额与今日用量（如 `⚡ 5h余48% | 周余90% | 今日: 441.2k`）。
  - **左侧活动栏面板**：专属图标，侧边栏一键抽屉式查看。
  - **全屏交互大屏**：按快捷键一键唤起完整沉浸式看板，支持手动微调与数据刷新。

---

## 📸 界面预览

| 官方配额双轨监控与自适应告警环 | 全方位实时 KPI 数据大屏 |
| :---: | :---: |
| 实时同步 Gemini 与 Claude 5小时/周度限额与重置时间 | 今日 Token 消耗、Tab 采纳率、会话与工具调用统计 |

---

## 🚀 快速安装

### 方式一：一键自动安装 (推荐)

在终端克隆本项目并运行安装脚本即可自动部署到 Antigravity IDE 扩展目录：

```bash
git clone https://github.com/FORSTNOVA/anttigeavity-ide.git
cd anttigeavity-ide
node install.js
```

安装完成后，在 Antigravity IDE 中按 `Ctrl+Shift+P`，输入并运行：
```text
Developer: Reload Window
```
即可立即加载体验！

---

## 📖 使用指南

插件提供三种便捷唤起方式：

1. **状态栏常驻**：点击 IDE 底部右下角的状态栏文字（`⚡ 5h余XX% | 周余XX% | 今日: XXk`），直接呼出看板；
2. **快捷命令**：按 `Ctrl+Shift+P` 输入 `Antigravity: View Usage Dashboard` 并回车；
3. **活动栏图标**：点击 IDE 左侧活动栏专属的「⚡ Antigravity 用量看板」图标。

---

## 🏗️ 架构与实现原理

```
[Antigravity IDE]
   │
   ├── 1. Language Server RPC (ConnectRPC)
   │      └── RetrieveUserQuotaSummary ──► 官方账号配额 (Gemini 5h/周度、Claude 限额)
   │
   ├── 2. Brain Session Transcripts (~/.gemini/antigravity-ide/brain/)
   │      └── transcript.jsonl ────────► 真实 Prompt/Completion Token、会话与工具调用
   │
   └── 3. VS Code TextDocument Listener
          └── onDidChangeTextDocument ──► Tab 补全采纳率与实时输入分析
```

---

## 🛠️ 项目结构

```
antigravity-usage-dashboard/
├── .gitignore             # Git 忽略配置
├── CHANGELOG.md           # 版本更新日志
├── CONTRIBUTING.md        # 开源贡献指南
├── LICENSE                # MIT 开源许可证
├── README.md              # 项目中文与使用说明
├── extension.js           # 扩展生命周期、命令与状态栏集成
├── install.js             # 一键安装脚本
├── package.json           # 扩展清单与配置配置项
├── media/                 # 扩展图标与静态资源
│   ├── icon.png           # 插件高清 Logo
│   └── sidebar-icon.svg   # 侧边栏矢量图标
├── src/
│   ├── metricsManager.js  # 指标管理与 Brain 对话日志聚合器
│   ├── quotaSync.js       # 官方 Language Server 直连同步器
│   └── webviewProvider.js # 现代高质感看板 UI 与 SVG 渲染
└── test/
    └── sanity.test.js     # 自动化可用性校验测试
```

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细开发规范与流程。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
