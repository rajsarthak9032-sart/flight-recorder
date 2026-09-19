import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dist = path.join(__dirname, 'dist');

console.log('[BUILD] Preparing dist output directory...');
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    for (const file of files) {
      if (file === 'node_modules' || file === 'dist' || file === '.git') continue;
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const itemsToCopy = [
  'command_center',
  'live_flight_recorder',
  'replay_lab',
  'failure_diagnostics',
  'experiments',
  'hardware',
  'models',
  'reports',
  'settings',
  'lemonade_flight_recorder',
  'packages',
  'local-agent',
  'src',
  'docs',
  'tests',
  'data',
  'lemonade-logo.png',
  'index.html',
  'metadata.json',
  'package.json',
  'server.js',
  'tsconfig.json'
];

for (const item of itemsToCopy) {
  const srcPath = path.join(__dirname, item);
  const destPath = path.join(dist, item);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
    console.log(`[BUILD] Copied ${item} to dist/`);
  }
}

console.log('[BUILD] Build completed successfully.');
