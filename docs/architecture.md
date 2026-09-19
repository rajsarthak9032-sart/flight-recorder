# System Architecture & Metrology Pipeline

## Overview

Lemonade Flight Recorder is architected as a local-first, zero-telemetry-leak observability, replay, failure diagnostics, experiment, and reproducible reporting platform for on-device AI workloads running through **Lemonade by AMD**.

---

## High-Level Topology

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Web Browser & UI Clients                     │
│  Command Center • Flight Recorder • Replay Lab • Diagnostics    │
│  Experiments • Models • Hardware • Reports • Settings           │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / JSON API (Port 3000)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Flight Recorder Local Agent                     │
│                                                                 │
│  ┌───────────────────────┐           ┌───────────────────────┐  │
│  │   Run Store (JSON)    │           │ Experiment Store      │  │
│  │   & Event Streamer    │           │ & Bessel Statistics   │  │
│  └───────────┬───────────┘           └───────────┬───────────┘  │
│              │                                   │              │
│              ▼                                   ▼              │
│  ┌───────────────────────┐           ┌───────────────────────┐  │
│  │   Diagnostic Engine   │           │   Report Engine       │  │
│  │   (Evidence-Based)    │           │   (ISO/IEC 42001)     │  │
│  └───────────┬───────────┘           └───────────┬───────────┘  │
│              │                                   │              │
│              └─────────────────┬─────────────────┘              │
│                                │                                │
│                                ▼                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │   Inference Executor & Hardware Telemetry Layer           │  │
│  │   • DirectML Socket Client / Mock Synthetic Driver        │  │
│  │   • Hardware Telemetry Ingest (DirectML / CPU / NPU)      │  │
│  │   • Secret Sanitizer & Provenance Classifier              │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
└────────────────────────────────┼────────────────────────────────┘
                                 │ Local IPC / Socket
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Lemonade Runtime Daemon                     │
│  (DirectML / ONNX Runtime / Ryzen AI NPU XDNA2 Driver)          │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Physical Silicon Execution
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Local AI Hardware Layer                      │
│  AMD Ryzen AI NPU (XDNA2) • AMD Radeon GPU • Host System CPU    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Analytical Processing Workflow

```text
Flight Recorder ──► Run ──► Replay Lab ──► Diagnostics ──► Experiments ──► Reports ──► Bundle Export
```

1. **Flight Recorder**: Real-time event capture across request lifecycle stages (`init`, `prepare`, `tokenize`, `prefill`, `generate`, `complete`, `error`).
2. **Replay Lab**: Deterministic single-run and multi-run replay with persistent parent-child lineage tracing (`replayOf`, `experimentId`, `trialIndex`).
3. **Failure Diagnostics**: Evidence-based root cause analysis without speculative AI models (detects Windows Application Control Error 4551, socket timeouts, missing telemetry).
4. **Experiment Engine**: Controlled, repeated benchmarking runs with Bessel-corrected sample statistics, median, range, and strict `UNAVAILABLE` semantics (never zero-filled).
5. **Research Reports**: Automated technical report generation providing executive summaries, environment specs, provenance matrices, measurement tables, failure findings, replay lineage trees, pairwise empirical deltas (no arbitrary winner badges), explicit limitations, and self-contained bundle exports.
6. **Reproducibility Bundles**: Self-contained cryptographic archives containing raw logs, reports, trials CSV, manifest, and execution guides.

---

## Security & Privacy Invariants

1. **Zero Telemetry Leak**: Raw model weights, unhashed prompt contexts, private API keys, and authorization headers are never logged or exported.
2. **No Data Fabrication**: Missing metrics are strictly marked `UNAVAILABLE` and excluded from aggregations rather than zero-filled.
3. **Authoritative Provenance**: Every run carries an explicit provenance tag (`REAL`, `MOCK`, `BLOCKED`, `UNAVAILABLE`, `LEGACY`).
