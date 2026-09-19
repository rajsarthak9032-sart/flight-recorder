# Local Runtime & Hardware Layer

## Runtime Modes

Lemonade Flight Recorder interfaces with on-device execution engines in three operational modes:

---

### 1. Direct Lemonade Hardware Mode (`provider: 'lemonade'`, `runtime: 'real'`)

* Communicates with the local Lemonade daemon running on `http://127.0.0.1:8000` or named IPC socket.
* DirectML hardware acceleration targeting AMD Ryzen AI NPU (XDNA2) and AMD Radeon integrated/discrete GPUs.
* Real-time hardware telemetry ingestion: TTFT (Time to First Token), tokens per second (TPS), peak VRAM allocation, NPU utilization, and package power.

---

### 2. Synthetic Test Driver Mode (`provider: 'mock'`, `runtime: 'mock'`)

* Deterministic offline test driver simulating token streaming and telemetry distributions.
* Used for headless testing, CI/CD validation, and software harness verification.
* **Strict Invariant**: Every synthetic run is marked `isSynthetic: true` and classified as `MOCK` in provenance headers and report outputs.

---

### 3. Policy Blocked / Fault Mode (`runtime: 'blocked'` / `'failed'`)

* Captures failure evidence when the operating system or runtime blocks execution (e.g. Windows Application Control Policy Error 4551, missing DLLs, daemon unreachable `ECONNREFUSED`).
* Preserves pre-fault event traces and classifies runs as `BLOCKED` or `UNAVAILABLE`.
