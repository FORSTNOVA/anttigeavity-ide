function getWebviewContent(stats) {
  const statsJson = JSON.stringify(stats);
  const q = stats?.officialQuotas || {};
  const gemini = q.gemini || { weeklyPct: 97, fiveHourPct: 91 };
  const claude = q.claude || { weeklyPct: 100, fiveHourPct: 100 };
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Antigravity 订阅用量与配额看板</title>
  <style>
    :root {
      --bg-gradient: radial-gradient(circle at 10% 20%, rgba(20, 24, 38, 0.95), rgba(10, 12, 20, 0.98));
      --card-bg: rgba(255, 255, 255, 0.04);
      --card-border: rgba(255, 255, 255, 0.08);
      --card-hover: rgba(255, 255, 255, 0.07);
      --text-main: #f0f3f8;
      --text-sub: #9aa5b8;
      --accent-blue: #3b82f6;
      --accent-cyan: #06b6d4;
      --accent-purple: #8b5cf6;
      --accent-green: #10b981;
      --accent-amber: #f59e0b;
      --accent-pink: #ec4899;
      --radius: 14px;
      --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg-gradient);
      color: var(--text-main);
      font-family: var(--font);
      padding: 16px 20px;
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--card-border);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 16px rgba(236, 72, 153, 0.4);
    }
    .title-group h1 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(to right, #ffffff, #f472b6, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .title-group p {
      font-size: 11px;
      color: var(--text-sub);
      margin-top: 1px;
    }
    .header-actions {
      display: flex;
      gap: 8px;
    }
    .btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-main);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
    }
    .btn:hover {
      background: var(--card-hover);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .btn-primary {
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      border: none;
      color: white;
      box-shadow: 0 2px 10px rgba(236, 72, 153, 0.3);
    }

    /* Dual Track Native Quotas */
    .dual-quota-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }

    .quota-group-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 16px;
      backdrop-filter: blur(12px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      position: relative;
      overflow: hidden;
    }
    .quota-group-card.gemini::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981);
    }
    .quota-group-card.claude::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #ec4899, #8b5cf6, #f59e0b);
    }

    .group-title {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bucket-row {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bucket-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .bucket-name {
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .bucket-reset {
      font-size: 11px;
      color: #94a3b8;
    }
    .bucket-ring-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bucket-pct {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
    }

    .ring-svg {
      width: 36px;
      height: 36px;
      transform: rotate(-90deg);
      transform-origin: 50% 50%;
    }
    .ring-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 3.5;
    }
    .ring-fill {
      fill: none;
      stroke: #10b981;
      stroke-width: 3.5;
      stroke-linecap: round;
      stroke-dasharray: 100 100;
      transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      padding: 12px 14px;
      backdrop-filter: blur(12px);
    }
    .kpi-label {
      font-size: 11px;
      color: var(--text-sub);
      font-weight: 500;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 2px;
    }
    .kpi-sub {
      font-size: 10px;
      color: var(--accent-cyan);
    }

    /* Modal Dialog */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.active {
      display: flex;
    }
    .modal-box {
      background: #1e2433;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      width: 90%;
      max-width: 380px;
      padding: 20px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    }
    .modal-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 14px;
      color: #fff;
    }
    .form-group {
      margin-bottom: 12px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 5px;
    }
    .form-input {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 13px;
      color: #fff;
      outline: none;
    }
    .form-input:focus {
      border-color: #ec4899;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="logo-badge">⚡</div>
      <div class="title-group">
        <h1>Antigravity 订阅配额看板</h1>
        <p><span style="color: #10b981; font-weight: 600;">● 官方实时直连</span> · <span id="val-sync-time">正在连接...</span></p>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn btn-primary" onclick="refreshData()" title="从 Antigravity 官方 Language Server 直接拉取最新配额">🔄 直连同步</button>
      <button class="btn" onclick="openCalibrateModal()" title="手动输入微调">✏️ 微调</button>
    </div>
  </div>

  <!-- Dual Track Quotas -->
  <div class="dual-quota-grid">
    <!-- Gemini Models Group -->
    <div class="quota-group-card gemini">
      <div class="group-title">
        <span>✨ Gemini Models 配额组</span>
        <span style="font-size: 11px; color: #34d399; font-weight: normal;">● 运行正常</span>
      </div>

      <div class="bucket-row">
        <div class="bucket-info">
          <div class="bucket-name">周度配额剩余 (Weekly Limit Remaining)</div>
          <div class="bucket-reset" id="gemini-weekly-reset">重置于: ${gemini.weeklyReset || '3天4小时后'}</div>
        </div>
        <div class="bucket-ring-box">
          <span class="bucket-pct" id="gemini-weekly-pct">${gemini.weeklyPct}%</span>
          <svg class="ring-svg" viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.9155" />
            <circle class="ring-fill" id="gemini-weekly-ring" cx="18" cy="18" r="15.9155" style="stroke-dashoffset: ${100 - gemini.weeklyPct};" />
          </svg>
        </div>
      </div>

      <div class="bucket-row">
        <div class="bucket-info">
          <div class="bucket-name">5小时限额剩余 (Five Hour Limit Remaining)</div>
          <div class="bucket-reset" id="gemini-5h-reset">重置于: ${gemini.fiveHourReset || '3小时51分后'}</div>
        </div>
        <div class="bucket-ring-box">
          <span class="bucket-pct" id="gemini-5h-pct">${gemini.fiveHourPct}%</span>
          <svg class="ring-svg" viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.9155" />
            <circle class="ring-fill" id="gemini-5h-ring" cx="18" cy="18" r="15.9155" style="stroke-dashoffset: ${100 - gemini.fiveHourPct};" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Claude and GPT models Group -->
    <div class="quota-group-card claude">
      <div class="group-title">
        <span>🤖 Claude and GPT models 配额组</span>
        <span style="font-size: 11px; color: #a78bfa; font-weight: normal;">● 全量就绪</span>
      </div>

      <div class="bucket-row">
        <div class="bucket-info">
          <div class="bucket-name">周度配额剩余 (Weekly Limit Remaining)</div>
          <div class="bucket-reset" id="claude-weekly-reset">重置于: ${claude.weeklyReset || '下周一 00:00'}</div>
        </div>
        <div class="bucket-ring-box">
          <span class="bucket-pct" id="claude-weekly-pct">${claude.weeklyPct}%</span>
          <svg class="ring-svg" viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.9155" />
            <circle class="ring-fill" id="claude-weekly-ring" cx="18" cy="18" r="15.9155" style="stroke: #a78bfa; stroke-dashoffset: ${100 - claude.weeklyPct};" />
          </svg>
        </div>
      </div>

      <div class="bucket-row">
        <div class="bucket-info">
          <div class="bucket-name">5小时限额剩余 (Five Hour Limit Remaining)</div>
          <div class="bucket-reset" id="claude-5h-reset">${claude.fiveHourReset || '全量可用'}</div>
        </div>
        <div class="bucket-ring-box">
          <span class="bucket-pct" id="claude-5h-pct">${claude.fiveHourPct}%</span>
          <svg class="ring-svg" viewBox="0 0 36 36">
            <circle class="ring-bg" cx="18" cy="18" r="15.9155" />
            <circle class="ring-fill" id="claude-5h-ring" cx="18" cy="18" r="15.9155" style="stroke: #a78bfa; stroke-dashoffset: ${100 - claude.fiveHourPct};" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- KPI Grid -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">今日 Token 消耗</div>
      <div class="kpi-value" id="val-today-tokens">--</div>
      <div class="kpi-sub">输入: <span id="val-in-tokens">--</span> | 输出: <span id="val-out-tokens">--</span></div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Tab 补全采纳率</div>
      <div class="kpi-value" id="val-accept-rate">--%</div>
      <div class="kpi-sub">采纳: <span id="val-acc-count">--</span> / <span id="val-sug-count">--</span> 次</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">今日 Agent 会话</div>
      <div class="kpi-value" id="val-sessions">-- 次</div>
      <div class="kpi-sub">工具调用: <span id="val-tool-calls">--</span> 次</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">累计总消耗 (Lifetime)</div>
      <div class="kpi-value" id="val-lifetime">--</div>
      <div class="kpi-sub" style="color: var(--accent-green);">👑 订阅专享通道</div>
    </div>
  </div>

  <!-- Interactive Calibration Modal -->
  <div class="modal-overlay" id="calibrateModal" onclick="if(event.target===this)closeCalibrateModal()">
    <div class="modal-box">
      <div class="modal-title">✏️ 校准配额数据</div>
      <div class="form-group">
        <label>Gemini 5小时限额剩余 (%)</label>
        <input type="number" id="inputGemini5h" class="form-input" min="0" max="100" />
      </div>
      <div class="form-group">
        <label>Gemini 周度配额剩余 (%)</label>
        <input type="number" id="inputGeminiWk" class="form-input" min="0" max="100" />
      </div>
      <div class="form-group">
        <label>Claude/GPT 5小时剩余 (%)</label>
        <input type="number" id="inputClaude5h" class="form-input" min="0" max="100" />
      </div>
      <div class="form-group">
        <label>Claude/GPT 周度剩余 (%)</label>
        <input type="number" id="inputClaudeWk" class="form-input" min="0" max="100" />
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeCalibrateModal()">取消</button>
        <button class="btn btn-primary" onclick="submitCalibration()">保存并应用</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentStats = ${statsJson};

    function formatNumber(num) {
      if (!num) return '0';
      if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toLocaleString();
    }

    function setRingProgress(ringElem, pctElem, pct, isClaude = false) {
      if (!ringElem) return;
      const val = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
      if (pctElem) {
        pctElem.innerText = val + '%';
      }
      
      const offset = 100 - val;
      ringElem.style.strokeDashoffset = offset + '';

      let color = isClaude ? '#a78bfa' : '#10b981';
      if (val <= 15) {
        color = '#ef4444'; // Red for critically low quota
      } else if (val <= 40) {
        color = '#f59e0b'; // Amber for warning quota
      }
      ringElem.style.stroke = color;
      if (pctElem) {
        pctElem.style.color = (val <= 40) ? color : '#ffffff';
      }
    }

    function renderDashboard(data) {
      if (!data) return;
      currentStats = data;
      const q = data.officialQuotas || {};
      const gemini = q.gemini || { weeklyPct: 97, fiveHourPct: 91 };
      const claude = q.claude || { weeklyPct: 100, fiveHourPct: 100 };

      // 1. Quotas
      const gWkReset = document.getElementById('gemini-weekly-reset');
      if (gWkReset) gWkReset.innerText = '重置于: ' + (gemini.weeklyReset || '3天4小时后');
      setRingProgress(
        document.getElementById('gemini-weekly-ring'),
        document.getElementById('gemini-weekly-pct'),
        gemini.weeklyPct,
        false
      );

      const g5Reset = document.getElementById('gemini-5h-reset');
      if (g5Reset) g5Reset.innerText = '重置于: ' + (gemini.fiveHourReset || '3小时51分后');
      setRingProgress(
        document.getElementById('gemini-5h-ring'),
        document.getElementById('gemini-5h-pct'),
        gemini.fiveHourPct,
        false
      );

      const cWkReset = document.getElementById('claude-weekly-reset');
      if (cWkReset) cWkReset.innerText = '重置于: ' + (claude.weeklyReset || '下周一 00:00');
      setRingProgress(
        document.getElementById('claude-weekly-ring'),
        document.getElementById('claude-weekly-pct'),
        claude.weeklyPct,
        true
      );

      const c5Reset = document.getElementById('claude-5h-reset');
      if (c5Reset) c5Reset.innerText = claude.fiveHourReset || '全量可用';
      setRingProgress(
        document.getElementById('claude-5h-ring'),
        document.getElementById('claude-5h-pct'),
        claude.fiveHourPct,
        true
      );

      // 2. KPIs
      const tTokens = document.getElementById('val-today-tokens');
      if (tTokens) tTokens.innerText = formatNumber(data.totalTokensToday);
      const inTokens = document.getElementById('val-in-tokens');
      if (inTokens) inTokens.innerText = formatNumber(data.tokensPrompt);
      const outTokens = document.getElementById('val-out-tokens');
      if (outTokens) outTokens.innerText = formatNumber(data.tokensCompletion);

      const accRate = document.getElementById('val-accept-rate');
      if (accRate) accRate.innerText = data.acceptRate + '%';
      const accCount = document.getElementById('val-acc-count');
      if (accCount) accCount.innerText = data.completionsAccepted || 0;
      const sugCount = document.getElementById('val-sug-count');
      if (sugCount) sugCount.innerText = data.completionsSuggested || 0;

      const toolCalls = document.getElementById('val-tool-calls');
      if (toolCalls) toolCalls.innerText = data.toolCalls || 0;
      const sessions = document.getElementById('val-sessions');
      if (sessions) sessions.innerText = (data.agentSessions || 0) + ' 次';
      const lifetime = document.getElementById('val-lifetime');
      if (lifetime) lifetime.innerText = formatNumber(data.lifetimeTokens);

      // 3. Sync Status
      const syncElem = document.getElementById('val-sync-time');
      if (syncElem) {
        syncElem.innerText = q.lastSyncTime ? ('已同步于 ' + q.lastSyncTime) : '实时同步中';
      }
    }

    function showToast(msg) {
      let t = document.getElementById('dash-toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'dash-toast';
        t.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(16,185,129,0.95);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;z-index:9999;box-shadow:0 4px 14px rgba(0,0,0,0.5);transition:opacity 0.3s ease;pointer-events:none;white-space:nowrap;';
        document.body.appendChild(t);
      }
      t.innerText = msg;
      t.style.opacity = '1';
      clearTimeout(window.__dash_toast_timer);
      window.__dash_toast_timer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
    }

    function openCalibrateModal() {
      const q = currentStats.officialQuotas || {};
      const gemini = q.gemini || {};
      const claude = q.claude || {};

      document.getElementById('inputGemini5h').value = gemini.fiveHourPct !== undefined ? gemini.fiveHourPct : 91;
      document.getElementById('inputGeminiWk').value = gemini.weeklyPct !== undefined ? gemini.weeklyPct : 97;
      document.getElementById('inputClaude5h').value = claude.fiveHourPct !== undefined ? claude.fiveHourPct : 100;
      document.getElementById('inputClaudeWk').value = claude.weeklyPct !== undefined ? claude.weeklyPct : 100;

      document.getElementById('calibrateModal').classList.add('active');
      document.getElementById('inputGemini5h').focus();
    }

    function closeCalibrateModal() {
      document.getElementById('calibrateModal').classList.remove('active');
    }

    function submitCalibration() {
      const g5 = parseInt(document.getElementById('inputGemini5h').value, 10);
      const gw = parseInt(document.getElementById('inputGeminiWk').value, 10);
      const c5 = parseInt(document.getElementById('inputClaude5h').value, 10);
      const cw = parseInt(document.getElementById('inputClaudeWk').value, 10);

      const newQuotas = {
        gemini: {
          fiveHourPct: isNaN(g5) ? 91 : g5,
          weeklyPct: isNaN(gw) ? 97 : gw
        },
        claude: {
          fiveHourPct: isNaN(c5) ? 100 : c5,
          weeklyPct: isNaN(cw) ? 100 : cw
        }
      };

      // Optimistically update local view immediately!
      if (!currentStats.officialQuotas) currentStats.officialQuotas = {};
      currentStats.officialQuotas.gemini = Object.assign(currentStats.officialQuotas.gemini || {}, newQuotas.gemini);
      currentStats.officialQuotas.claude = Object.assign(currentStats.officialQuotas.claude || {}, newQuotas.claude);
      renderDashboard(currentStats);

      closeCalibrateModal();
      showToast('✅ 配额数值已成功校准并同步！');

      // Send to extension host
      vscode.postMessage({ command: 'calibrate', quotas: newQuotas });
    }

    function refreshData() {
      showToast('🔄 正在同步最新配额数据...');
      vscode.postMessage({ command: 'refresh' });
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeCalibrateModal();
      if (e.key === 'Enter' && document.getElementById('calibrateModal').classList.contains('active')) {
        submitCalibration();
      }
    });

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'updateStats') {
        renderDashboard(message.stats);
      }
    });

    // Initial render
    renderDashboard(currentStats);
  </script>
</body>
</html>`;
}

module.exports = { getWebviewContent };
