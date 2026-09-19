# Lemonade Flight Recorder

> **A local-first observability, replay, failure diagnostics, experiment orchestration, and reproducible reporting platform for on-device AI workloads running through Lemonade by AMD.**

---

## 🎯 Why It Exists

On-device AI workloads frequently operate as black boxes, making it difficult to understand:
* **What ran**: Prompt hashes, models, tokenizer configs, and parameter sets.
* **Where it ran**: Host OS, DirectML execution backend, Ryzen AI NPU (XDNA2), or Radeon GPU.
* **How long it took**: Stage-by-stage wall clock latency (Time to First Token vs token streaming).
* **What telemetry was actually observed**: Real hardware counters vs missing telemetry.
* **Whether the result was real, mocked, blocked, or unavailable**: Explicit execution provenance.
* **Whether the run can be reproduced**: Deterministic replay with parent-child lineage tracking.

Lemonade Flight Recorder solves this observability and reproducibility gap with an aerospace-grade developer metrology pipeline.

---

## 🛫 Product Workflow

```text
RUN ──► RECORD ──► INSPECT ──► REPLAY ──► DIAGNOSE ──► EXPERIMENT ──► COMPARE ──► REPORT ──► REPRODUCE
```

1. **Flight Recorder**: Real-time event streaming and pipeline telemetry capture (TTFT, TPS, VRAM, latency) without sensitive prompt or secret leakage.
2. **Replay Lab**: Deterministic single-run and multi-run replay with complete lineage tracing (`replayOf`, `experimentId`, `trialIndex`).
3. **Failure Diagnostics**: Evidence-grounded root cause analysis (RCA) detecting Windows Application Control (Error 4551), connection timeouts (`ECONNREFUSED`), and incomplete telemetry without speculative hallucination.
4. **Experiment Engine**: Controlled, repeated benchmarking runs with Bessel-corrected sample statistics, median, range, and strict `UNAVAILABLE` semantics (never zero-filled).
5. **Research Reports**: Automated technical report generation providing executive summaries, environment specs, provenance matrices, measurement tables, failure findings, replay lineage trees, pairwise empirical deltas (no arbitrary winner badges), explicit limitations, and self-contained bundle exports.
6. **Reproducibility Bundles**: Self-contained cryptographic archives containing raw logs, reports, trials CSV, manifest, and execution guides.

---

## 🏗️ System Architecture

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

Core inference and private runtime data remain strictly on-device.

---

## 🔬 Core Metrology Principles

* **OBSERVE → RECORD → REPRODUCE → ANALYZE → REPORT**: Every metric and conclusion is grounded in recorded telemetry.
* **No Fabricated Measurements**: Unavailable observations are explicitly marked `UNAVAILABLE` and excluded from aggregations rather than zero-filled.
* **No Arbitrary Rankings**: Empirical comparisons report mathematical deltas without subjective "winner" or "recommended" labels.
* **Authoritative Provenance**: Clear distinction across `REAL`, `MOCK`, `BLOCKED`, `UNAVAILABLE`, and `LEGACY` execution states.
* **Zero Telemetry Leakage**: Private weights, credentials, API keys, and unhashed prompts are strictly guarded on-device.

---

## ⚠️ Real Runtime Boundary & Verification Disclosure

* **Verified**: Web UI routing, run persistence across reloads, replay lineage trees, failure diagnostics with evidence tracing, multi-trial experiment orchestration, Bessel-corrected sample statistics ($\sigma$), ISO/IEC 42001 research report generation, multi-format exports (JSON, CSV, Markdown, HTML), and reproducibility bundle compilation.
* **Current Environment Notice**: In sandboxed development environments or Windows hosts where execution of the native Lemonade backend binary is blocked by Windows Application Control (Error 4551), execution is classified as `BLOCKED` or `MOCK`. Synthetic and fault results are explicitly documented in all reports and must not be claimed as physical AMD silicon performance.

---

## 🚀 Quick Start

### 1. Installation & Start

```bash
# Clone the repository
git clone https://github.com/example/lemonade-flight-recorder.git
cd lemonade-flight-recorder

# Install dependencies
npm install

# Build static assets
npm run build

# Start local Flight Recorder server
npm start
```

Access the console at `http://localhost:3000`.

### 2. Automated Verification

```bash
# Run comprehensive automated test suite
npm test

# Run TypeScript typecheck
npm run typecheck
```

**Verified Test State**:
* `47/47 tests passing` across 5 suites (Diagnostics, Experiments, Replay, Reports, Routing)
* `TypeScript Typecheck: PASS` (0 errors)
* `Production Asset Build: PASS`

---

## 📚 Documentation Index

Comprehensive technical documentation is available in the [`docs/`](docs/) directory:

* [`docs/architecture.md`](docs/architecture.md): System architecture and data pipeline specifications.
* [`docs/quickstart.md`](docs/quickstart.md): Step-by-step setup and navigation guide.
* [`docs/local-runtime.md`](docs/local-runtime.md): DirectML, Mock, and Fault runtime modes.
* [`docs/flight-recorder.md`](docs/flight-recorder.md): Request lifecycle stages and telemetry metrics.
* [`docs/replay-lab.md`](docs/replay-lab.md): Replay lineage tracking and deterministic reproduction.
* [`docs/failure-diagnostics.md`](docs/failure-diagnostics.md): Evidence-based root-cause analysis (RCA).
* [`docs/experiments.md`](docs/experiments.md): Multi-trial benchmarks and Bessel statistics.
* [`docs/reports.md`](docs/reports.md): ISO/IEC 42001 technical research reports.
* [`docs/reproducibility.md`](docs/reproducibility.md): Reproducibility guide and bundle verification.
* [`docs/telemetry.md`](docs/telemetry.md): Metric definitions and measurement semantics.
* [`docs/provenance.md`](docs/provenance.md): Provenance classifications and visual tags.
* [`docs/limitations.md`](docs/limitations.md): Boundary conditions and environment constraints.
* [`docs/verification-matrix.md`](docs/verification-matrix.md): Status and evidence matrix across all capabilities.
* [`docs/demo-script.md`](docs/demo-script.md): 3–5 minute presentation and evaluation walkthrough.

---

## 📁 Repository Structure

```text
├── command_center/       # Command center dashboard UI
├── live_flight_recorder/ # Live telemetry and event streaming UI
├── replay_lab/           # Deterministic replay and lineage UI
├── failure_diagnostics/  # Evidence-based root cause analysis UI
├── experiments/          # Multi-trial experiment engine & benchmarking UI
├── reports/              # Reproducible research reports & metrology showcase UI
├── local-agent/          # TypeScript server, stores, executors, and engines
│   └── src/
│       ├── diagnostics/  # RCA diagnostic rules and evidence extractors
│       ├── experiments/  # Multi-trial orchestration and statistical aggregators
│       ├── hardware/     # DirectML and system telemetry providers
│       ├── lemonade/     # Lemonade client and socket listeners
│       ├── reports/      # Technical report generation and bundle export engine
│       ├── runs/         # Authoritative Run store and replay executors
│       └── server/       # Local REST API router
├── packages/shared/      # Authoritative schema and TypeScript type definitions
├── docs/                 # Architectural specifications and milestone documentation
└── tests/                # Automated verification and regression test suites
```

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
