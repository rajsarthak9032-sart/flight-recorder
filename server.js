import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createAgentRouter } from './local-agent/src/server/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// API Routes for Local Agent, Telemetry, and Diagnostics
app.use('/api', createAgentRouter());

// Primary route handlers
app.get(['/', '/command-center', '/command_center', '/command-center/', '/command_center/', '/command-center/code.html', '/command_center/code.html'], (req, res) => {
  if (req.path === '/' && fs.existsSync(path.join(__dirname, 'index.html'))) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'command_center', 'code.html'));
});

app.get(['/flight-recorder', '/flight-recorder/', '/live-flight-recorder', '/live-flight-recorder/', '/live-runs', '/live-runs/', '/live_flight_recorder', '/live_flight_recorder/', '/flight-recorder/code.html', '/live-flight-recorder/code.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'live_flight_recorder', 'code.html'));
});

app.get(['/replay', '/replay/', '/replay-lab', '/replay-lab/', '/replay_lab', '/replay_lab/', '/replay/code.html', '/replay-lab/code.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'replay_lab', 'code.html'));
});

app.get(['/diagnostics', '/diagnostics/', '/failure-diagnostics', '/failure-diagnostics/', '/failure_diagnostics', '/failure_diagnostics/', '/diagnostics/code.html', '/failure-diagnostics/code.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'failure_diagnostics', 'code.html'));
});

// Run detail route (M5 Run Detail integration)
app.get(['/runs/:id', '/runs/:id/detail', '/runs\\[:id\\]'], (req, res) => {
  res.sendFile(path.join(__dirname, 'failure_diagnostics', 'code.html'));
});

// Milestone 6: Experiment Engine & Benchmarking Console
app.get(['/experiments', '/experiments/', '/experiments/:id', '/experiments/code.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'experiments', 'code.html'));
});

// Models / Model Lab
app.get(['/models', '/model-lab', '/models/', '/model-lab/', '/models/code.html', '/model-lab/code.html'], (req, res) => {
  const candidate = path.join(__dirname, 'models', 'code.html');
  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }
  res.sendFile(path.join(__dirname, 'command_center', 'code.html'));
});

// Hardware Telemetry
app.get(['/hardware', '/hardware/', '/hardware/code.html'], (req, res) => {
  const candidate = path.join(__dirname, 'hardware', 'code.html');
  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }
  res.sendFile(path.join(__dirname, 'command_center', 'code.html'));
});

// Metrology Reports
app.get(['/reports', '/reports/', '/reports/code.html'], (req, res) => {
  const candidate = path.join(__dirname, 'reports', 'code.html');
  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }
  res.sendFile(path.join(__dirname, 'command_center', 'code.html'));
});

// System Settings
app.get(['/settings', '/settings/', '/settings/code.html'], (req, res) => {
  const candidate = path.join(__dirname, 'settings', 'code.html');
  if (fs.existsSync(candidate)) {
    return res.sendFile(candidate);
  }
  res.sendFile(path.join(__dirname, 'command_center', 'code.html'));
});

// Serve static assets from both dist (if built) and root
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  app.use(express.static(path.join(__dirname, 'dist')));
}
app.use(express.static(__dirname));

app.listen(PORT, HOST, () => {
  console.log(`[Lemonade Flight Recorder] Telemetry server listening on http://${HOST}:${PORT}`);
});
