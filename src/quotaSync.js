const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

class AntigravityDirectConnector {
  constructor() {
    this.port = null;
    this.csrfToken = null;
    this.certPath = path.join(
      process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
      'Programs', 'Antigravity IDE', 'resources', 'app', 'extensions', 'antigravity', 'dist', 'languageServer', 'cert.pem'
    );
    this.lastDiscoveredTime = 0;
  }

  // 1. Discover running Language Server port and CSRF token from active Antigravity session
  discoverConfig() {
    try {
      const logsDir = path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'Antigravity IDE',
        'logs'
      );

      if (!fs.existsSync(logsDir)) return null;

      const subdirs = fs.readdirSync(logsDir).sort().reverse();
      for (const sub of subdirs) {
        const lsLog = path.join(logsDir, sub, 'ls-main.log');
        if (fs.existsSync(lsLog)) {
          const content = fs.readFileSync(lsLog, 'utf8');
          const portMatch = content.match(/Language server listening on random port at (\d+) for HTTPS/);
          const tokenMatch = content.match(/--csrf_token\s+([a-f0-9-]+)/);

          if (portMatch && tokenMatch) {
            this.port = parseInt(portMatch[1], 10);
            this.csrfToken = tokenMatch[1];
            this.lastDiscoveredTime = Date.now();
            return { port: this.port, csrfToken: this.csrfToken };
          }
        }
      }
    } catch (e) {
      console.error('[AntigravityDirectConnector] Discovery error:', e);
    }
    return null;
  }

  // 2. Format ISO reset time into user-friendly Chinese countdown
  formatResetTime(isoString) {
    if (!isoString) return '';
    try {
      const target = new Date(isoString).getTime();
      if (isNaN(target)) return String(isoString);
      const diff = target - Date.now();
      if (diff <= 0) return '即将重置';

      const totalMins = Math.floor(diff / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}天${hours % 24}小时后`;
      if (hours > 0) return `${hours}小时${mins}分后`;
      return `${mins}分钟后`;
    } catch (_) {
      return String(isoString);
    }
  }

  // 3. Query RetrieveUserQuotaSummary directly via HTTPS ConnectRPC
  fetchOfficialQuota(forceRefresh = true) {
    return new Promise((resolve, reject) => {
      if (!this.port || !this.csrfToken) {
        this.discoverConfig();
      }

      if (!this.port || !this.csrfToken) {
        return reject(new Error('未检测到 Antigravity Language Server 运行会话'));
      }

      if (!fs.existsSync(this.certPath)) {
        return reject(new Error('未找到 Antigravity Language Server 通信证书'));
      }

      const cert = fs.readFileSync(this.certPath);
      const postData = JSON.stringify({ forceRefresh: !!forceRefresh });

      const req = https.request({
        hostname: '127.0.0.1',
        port: this.port,
        path: '/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary',
        method: 'POST',
        ca: cert,
        headers: {
          'Content-Type': 'application/json',
          'Connect-Protocol-Version': '1',
          'X-Codeium-Csrf-Token': this.csrfToken,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 6000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode !== 200) {
            // Re-discover if port/token changed
            this.port = null;
            this.csrfToken = null;
            return reject(new Error(`Antigravity 响应异常 (HTTP ${res.statusCode}): ${data}`));
          }

          try {
            const json = JSON.parse(data);
            const groups = json.response?.groups || json.groups || [];

            const parsedQuotas = {
              gemini: {
                weeklyPct: 100,
                weeklyReset: '3天后',
                fiveHourPct: 100,
                fiveHourReset: '全量可用'
              },
              claude: {
                weeklyPct: 100,
                weeklyReset: '下周一 00:00',
                fiveHourPct: 100,
                fiveHourReset: '全量可用'
              },
              rawGroups: groups,
              connected: true,
              lastSyncTime: new Date().toLocaleTimeString()
            };

            for (const g of groups) {
              const name = (g.displayName || '').toLowerCase();
              if (name.includes('gemini')) {
                for (const b of (g.buckets || [])) {
                  const bName = (b.displayName || '').toLowerCase();
                  const pct = Math.round((b.remainingFraction !== undefined ? b.remainingFraction : 1) * 100);
                  const reset = this.formatResetTime(b.resetTime || b.resetsIn || b.refreshText);

                  if (bName.includes('week') || bName.includes('周') || b.window === 'weekly') {
                    parsedQuotas.gemini.weeklyPct = pct;
                    if (reset) parsedQuotas.gemini.weeklyReset = reset;
                  } else if (bName.includes('five') || bName.includes('5') || bName.includes('hour') || b.window === '5h') {
                    parsedQuotas.gemini.fiveHourPct = pct;
                    if (reset) parsedQuotas.gemini.fiveHourReset = reset;
                  }
                }
              } else if (name.includes('claude') || name.includes('gpt')) {
                for (const b of (g.buckets || [])) {
                  const bName = (b.displayName || '').toLowerCase();
                  const pct = Math.round((b.remainingFraction !== undefined ? b.remainingFraction : 1) * 100);
                  const reset = this.formatResetTime(b.resetTime || b.resetsIn || b.resetTime);

                  if (bName.includes('week') || bName.includes('周') || b.window === 'weekly') {
                    parsedQuotas.claude.weeklyPct = pct;
                    if (reset) parsedQuotas.claude.weeklyReset = reset;
                  } else if (bName.includes('five') || bName.includes('5') || bName.includes('hour') || b.window === '5h') {
                    parsedQuotas.claude.fiveHourPct = pct;
                    if (reset) parsedQuotas.claude.fiveHourReset = reset;
                  }
                }
              }
            }

            resolve(parsedQuotas);
          } catch (e) {
            reject(new Error(`解析 Antigravity 配额数据失败: ${e.message}`));
          }
        });
      });

      req.on('error', (err) => {
        this.port = null;
        this.csrfToken = null;
        reject(err);
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = AntigravityDirectConnector;
