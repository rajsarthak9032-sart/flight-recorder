# Quick Start Guide

This guide describes how to run and test **Lemonade Flight Recorder** in a local environment.

---

## 1. Prerequisites

* **Node.js**: `v20.0.0` or later (tested on Node v22.x/v26.x with `--experimental-strip-types`)
* **NPM**: `v9.0.0` or later
* **Operating System**: Windows 11, Linux, or macOS

---

## 2. Installation & Setup

Clone the repository and install all dependencies:

```bash
git clone https://github.com/example/lemonade-flight-recorder.git
cd lemonade-flight-recorder

# Install dependencies
npm install
```

---

## 3. Starting the Local Agent & Web UI

Start the combined Local Agent server and web interface:

```bash
npm start
```

The service will output:
```text
[Lemonade Flight Recorder] Telemetry server listening on http://0.0.0.0:3000
```

Open your browser to:
```text
http://localhost:3000
```

---

## 4. Running Verification Tests

Run the complete regression suite (Milestones 4 through 7):

```bash
npm test
```

Expected output:
```text
# tests 47
# suites 5
# pass 47
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

Verify TypeScript compilation:
```bash
npm run typecheck
```

Build production static assets:
```bash
npm run build
```

---

## 5. Navigation Map

| Canonical Route | Interface | Purpose |
| :--- | :--- | :--- |
| `/` or `/command-center` | Command Center | Overview of local service status, recent runs, and metrology |
| `/flight-recorder` | Live Flight Recorder | Real-time event streaming and telemetry inspector |
| `/replay` | Replay Lab | Deterministic run replay and parent-child lineage analysis |
| `/diagnostics` | Failure Diagnostics | Evidence-backed root cause analysis (RCA) |
| `/experiments` | Experiment Engine | Multi-trial controlled benchmarks and statistical comparisons |
| `/models` | Models | Installed on-device models and execution configurations |
| `/hardware` | Hardware Telemetry | DirectML NPU/GPU sensor readings and memory allocations |
| `/reports` | Research Reports | Technical reports, ISO/IEC 42001 audit logs, and bundle exports |
| `/settings` | Settings | Local agent configuration, privacy policies, and socket paths |
