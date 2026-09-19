# Verification Matrix

The following matrix documents the verified status of all system capabilities and boundary conditions as of Milestone 8:

| Capability | Status | Evidence |
| :--- | :--- | :--- |
| **Web UI & Navigation** | **VERIFIED** | Clean routing across all 9 canonical routes (`/`, `/flight-recorder`, `/replay`, `/diagnostics`, `/experiments`, `/models`, `/hardware`, `/reports`, `/settings`) |
| **Run Persistence** | **VERIFIED** | Atomic disk serialization across restarts with zero data corruption |
| **Replay Lineage** | **VERIFIED** | Lineage preservation (`replayOf`, `experimentId`, `trialIndex`) verified via automated tests |
| **Failure Diagnostics** | **VERIFIED** | Deterministic RCA for Error 4551, `ECONNREFUSED`, and telemetry dropouts verified via automated tests |
| **Experiment Engine** | **VERIFIED** | Multi-trial orchestration and Bessel-corrected sample statistics ($\sigma$) verified via automated tests |
| **Research Reports** | **VERIFIED** | Deterministic ISO/IEC 42001 report generation verified via automated tests |
| **JSON Export** | **VERIFIED** | Strict schema conformance verified via automated tests |
| **CSV Export** | **VERIFIED** | Tabular trial matrix with explicit `UNAVAILABLE` strings verified via automated tests |
| **Markdown Export** | **VERIFIED** | Clean GitHub-compliant markdown generation verified via automated tests |
| **HTML Export** | **VERIFIED** | Standalone dark-mode metrology HTML report verified via automated tests |
| **Bundle Sanitization** | **VERIFIED** | Zero API keys, passwords, or hidden CoT tokens verified via security tests |
| **Real Lemonade Inference** | **NOT VERIFIED** | Windows Application Control (Error 4551) / sandboxed container boundary |
| **Real Hardware Benchmark** | **NOT VERIFIED** | Synthetic/mock verification mode active in current environment |
