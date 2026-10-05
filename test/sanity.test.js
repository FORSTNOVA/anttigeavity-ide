const assert = require('assert');
const { getWebviewContent } = require('../src/webviewProvider');
const MetricsManager = require('../src/metricsManager');

console.log('Running sanity test for Antigravity Usage Dashboard...');

const metrics = new MetricsManager();
const summary = metrics.getSummary();

assert(summary !== null, 'Summary should not be null');
assert(typeof summary.totalTokensToday === 'number', 'totalTokensToday should be a number');
assert(summary.officialQuotas !== undefined, 'officialQuotas should be defined');

const html = getWebviewContent(summary);
assert(typeof html === 'string' && html.length > 1000, 'HTML should be valid string');

const expectedIds = [
  'gemini-weekly-pct', 'gemini-weekly-reset', 'gemini-weekly-ring',
  'gemini-5h-pct', 'gemini-5h-reset', 'gemini-5h-ring',
  'claude-weekly-pct', 'claude-weekly-reset', 'claude-weekly-ring',
  'claude-5h-pct', 'claude-5h-reset', 'claude-5h-ring',
  'val-today-tokens', 'val-in-tokens', 'val-out-tokens',
  'val-accept-rate', 'val-acc-count', 'val-sug-count',
  'val-tool-calls', 'val-sessions', 'val-lifetime'
];

for (const id of expectedIds) {
  assert(html.includes(`id="${id}"`), `HTML must contain element id="${id}"`);
}

console.log('✅ All sanity tests passed successfully!');
process.exit(0);
