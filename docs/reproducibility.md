# Reproducibility Guide & Bundle Verification

## Mission

This guide provides step-by-step instructions for inspecting, verifying, and exporting complete reproducibility bundles.

---

## 10-Step Reproduction Workflow

1. **Install Dependencies**: `npm install`
2. **Start Server**: `npm start` (opens `http://localhost:3000`)
3. **Verify Baseline Tests**: `npm test` (confirms 47/47 tests pass)
4. **Inspect Flight Recorder**: Navigate to `/flight-recorder` to review recorded runs and event timelines.
5. **Replay a Run**: Navigate to `/replay`, select a run (e.g. `run-001`), and click *Replay Run*.
6. **Diagnose Failures**: Navigate to `/diagnostics`, select a blocked run (e.g. `run-045`), and inspect observable evidence traces.
7. **Run / Inspect Experiments**: Navigate to `/experiments` to review multi-trial Bessel statistics on `exp-001` or execute new trials.
8. **Generate Technical Report**: Navigate to `/reports`, click *Generate New Report*, choose an experiment, and compile.
9. **Export Formats**: Click JSON, CSV, Markdown, or HTML to download self-contained reports.
10. **Export Bundle**: Download the complete Reproducibility Bundle JSON containing `manifest.json`, `README.md`, `report.json`, `report.md`, `report.html`, `trials.csv`, `runs.json`, `diagnostics.json`, and `measurements.json`.

---

## Bundle Extraction & Verification

A downloaded bundle JSON contains all raw artifacts in its `files` dictionary. Another researcher can extract them using Node.js or standard JSON tools:

```javascript
import fs from 'fs';

const bundle = JSON.parse(fs.readFileSync('rep-exp-001-reproducibility-bundle.json', 'utf8'));

console.log('Manifest:', bundle.manifest);
fs.writeFileSync('extracted_report.md', bundle.files['report.md']);
fs.writeFileSync('extracted_trials.csv', bundle.files['trials.csv']);
```
