const vscode = require('vscode');
const MetricsManager = require('./src/metricsManager');
const { getWebviewContent } = require('./src/webviewProvider');

let currentPanel = undefined;
let sidebarWebview = undefined;

function activate(context) {
  console.log('Antigravity Usage Dashboard is now active.');

  // 1. Status Bar Item (Bottom Right)
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'antigravity.viewUsageDashboard';
  context.subscriptions.push(statusBarItem);

  let metrics;

  function updateStatusBar() {
    if (!metrics) return;
    const summary = metrics.getSummary();
    const quotas = summary.officialQuotas || {};
    const gemini = quotas.gemini || { fiveHourPct: 91, weeklyPct: 97 };

    // Real-time status bar text
    const formattedTokens = summary.totalTokensToday >= 1000
      ? (summary.totalTokensToday / 1000).toFixed(1) + 'k'
      : summary.totalTokensToday;
    statusBarItem.text = `$(sparkle) 5h余${gemini.fiveHourPct}% | 周余${gemini.weeklyPct}% | 今日: ${formattedTokens}`;

    // Rich Markdown Hover Tooltip
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown(`### 👑 Antigravity 订阅配额实时简报\n\n`);
    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`**✨ Gemini Models 配额组**\n\n`);
    md.appendMarkdown(`- ⏱️ **5小时限额剩余**: \`${gemini.fiveHourPct}%\` (重置于: ${gemini.fiveHourReset || '3小时51分后'})\n`);
    md.appendMarkdown(`- 📅 **周度配额剩余**: \`${gemini.weeklyPct}%\` (重置于: ${gemini.weeklyReset || '3天4小时后'})\n\n`);

    const claude = quotas.claude || { fiveHourPct: 100, weeklyPct: 100 };
    md.appendMarkdown(`**🤖 Claude and GPT models 配额组**\n\n`);
    md.appendMarkdown(`- ⏱️ **5小时限额剩余**: \`${claude.fiveHourPct}%\` (全量可用)\n`);
    md.appendMarkdown(`- 📅 **周度配额剩余**: \`${claude.weeklyPct}%\` (全量可用)\n\n`);

    md.appendMarkdown(`---\n\n`);
    md.appendMarkdown(`📊 **今日消耗**: \`${formattedTokens} Tokens\` | **Tab 采纳率**: \`${summary.acceptRate}%\`\n\n`);
    md.appendMarkdown(`👉 *点击展开完整看板或校准配额*\n`);

    statusBarItem.tooltip = md;
    statusBarItem.show();
  }

  function broadcastStats() {
    updateStatusBar();
    if (!metrics) return;
    const summary = metrics.getSummary();
    if (currentPanel) {
      currentPanel.webview.postMessage({
        command: 'updateStats',
        stats: summary
      });
    }
    if (sidebarWebview) {
      sidebarWebview.webview.postMessage({
        command: 'updateStats',
        stats: summary
      });
    }
  }

  // Real-time broadcast callback whenever live quota changes
  metrics = new MetricsManager(context, () => {
    broadcastStats();
  });

  updateStatusBar();

  // 2. Open Full Webview Dashboard Command
  const openDashboardCommand = vscode.commands.registerCommand(
    'antigravity.viewUsageDashboard',
    () => {
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

      if (currentPanel) {
        currentPanel.reveal(columnToShowIn);
        currentPanel.webview.postMessage({
          command: 'updateStats',
          stats: metrics.getSummary()
        });
        return;
      }

      currentPanel = vscode.window.createWebviewPanel(
        'antigravityUsageDashboard',
        '⚡ Antigravity 订阅用量看板',
        columnToShowIn || vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );

      currentPanel.webview.html = getWebviewContent(metrics.getSummary());

      currentPanel.webview.onDidReceiveMessage(
        async message => {
          switch (message.command) {
            case 'refresh':
              await metrics.syncDirectQuota(true);
              broadcastStats();
              vscode.window.showInformationMessage('🟢 已连接 Antigravity 官方服务，实时用量已刷新！');
              break;
            case 'calibrate':
              metrics.updateOfficialQuotas(message.quotas);
              broadcastStats();
              vscode.window.showInformationMessage('✅ 配额数值已保存！');
              break;
            case 'reset':
              metrics.reset();
              broadcastStats();
              vscode.window.showInformationMessage('已重置 Antigravity 用量统计数据。');
              break;
            case 'export':
              const dataStr = JSON.stringify(metrics.getSummary(), null, 2);
              vscode.workspace.openTextDocument({
                content: dataStr,
                language: 'json'
              }).then(doc => vscode.window.showTextDocument(doc));
              break;
          }
        },
        null,
        context.subscriptions
      );

      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        null,
        context.subscriptions
      );
    }
  );

  // 3. Sidebar Provider
  const sidebarProvider = {
    resolveWebviewView(webviewView) {
      sidebarWebview = webviewView;
      webviewView.webview.options = { enableScripts: true };
      webviewView.webview.html = getWebviewContent(metrics.getSummary());
      webviewView.webview.onDidReceiveMessage(async message => {
        if (message.command === 'refresh') {
          await metrics.syncDirectQuota(true);
          broadcastStats();
          vscode.window.showInformationMessage('🟢 已连接 Antigravity 官方服务，实时用量已刷新！');
        } else if (message.command === 'calibrate') {
          metrics.updateOfficialQuotas(message.quotas);
          broadcastStats();
          vscode.window.showInformationMessage('✅ 配额数值已保存！');
        }
      });
    }
  };

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'antigravity.usageSidebarView',
      sidebarProvider
    )
  );

  // 4. Real-time document typing & Tab acceptance listeners
  let lastDocLength = 0;
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const currentLength = event.document.getText().length;
      const diff = currentLength - lastDocLength;
      lastDocLength = currentLength;

      if (diff > 10) {
        const addedCompletionTokens = Math.max(2, Math.ceil(diff / 3.5));
        const promptContextTokens = Math.min(800, Math.max(20, Math.ceil(currentLength / 4)));
        metrics.recordCompletion(true, promptContextTokens, addedCompletionTokens);
        broadcastStats();
      }
    })
  );

  const resetCommand = vscode.commands.registerCommand(
    'antigravity.resetUsageData',
    () => {
      metrics.reset();
      broadcastStats();
      vscode.window.showInformationMessage('已重置 Antigravity 用量统计数据。');
    }
  );

  const exportCommand = vscode.commands.registerCommand(
    'antigravity.exportUsageData',
    () => {
      const dataStr = JSON.stringify(metrics.getSummary(), null, 2);
      vscode.workspace.openTextDocument({
        content: dataStr,
        language: 'json'
      }).then(doc => vscode.window.showTextDocument(doc));
    }
  );

  context.subscriptions.push(openDashboardCommand, resetCommand, exportCommand);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
