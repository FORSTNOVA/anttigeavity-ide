const fs = require('fs');
const path = require('path');
const os = require('os');

const EXTENSION_DIR = path.join(os.homedir(), '.antigravity-ide', 'extensions', 'antigravity-usage-dashboard');
const SOURCE_DIR = __dirname;

console.log('==================================================');
console.log('   Antigravity 用量看板插件 (Usage Dashboard) 安装');
console.log('==================================================\n');

try {
  // Ensure target dir
  if (!fs.existsSync(path.dirname(EXTENSION_DIR))) {
    fs.mkdirSync(path.dirname(EXTENSION_DIR), { recursive: true });
  }

  // Copy directory
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyRecursive(SOURCE_DIR, EXTENSION_DIR);

  console.log(`✅ 插件成功安装至: ${EXTENSION_DIR}`);
  console.log('\n🎉 安装完成！重启或重载 Antigravity IDE 窗口即可立即体验用量看板：');
  console.log('   1. 按 Ctrl+Shift+P 输入 "Antigravity: View Usage Dashboard" 打开看板；');
  console.log('   2. 点击左侧活动栏的「⚡ Antigravity 用量看板」图标；');
  console.log('   3. 点击底部状态栏常驻的「⚡ Antigravity: XX tokens」按钮。\n');
} catch (e) {
  console.error('❌ 安装失败:', e);
}
