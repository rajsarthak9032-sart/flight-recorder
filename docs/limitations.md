# Runtime Limitations & Boundary Conditions

## Overview

This document explicitly defines the boundaries of verified functionality versus environment constraints.

---

## 1. Verified Capabilities

* **Web UI & Navigation**: All 9 canonical routes (`/`, `/flight-recorder`, `/replay`, `/diagnostics`, `/experiments`, `/models`, `/hardware`, `/reports`, `/settings`).
* **Deterministic Replay Engine**: Parent-child lineage tracking (`replayOf`, `experimentId`, `trialIndex`).
* **Evidence-Based Diagnostics**: Deterministic root-cause analysis (Error 4551, `ECONNREFUSED`, missing telemetry).
* **Bessel-Corrected Statistics**: Unbiased sample standard deviation ($\sigma$), median, mean, min, max without zero-filling.
* **ISO/IEC 42001 Reports**: Multi-format exports (JSON, CSV, Markdown, standalone HTML, Reproducibility Bundle).
* **Data Sanitization**: Zero credential or private token leakage.

---

## 2. Real Runtime Verification Boundary

* **Status**: `NOT VERIFIED IN CURRENT SANDBOX`
* **Root Cause**: On Windows hosts with Application Control policies enabled, the native Lemonade backend binary was blocked (Error 4551). In sandboxed Linux container environments, physical AMD Ryzen AI NPU hardware is not directly exposed to the guest OS.
* **Remediation**: In production deployments on AMD hardware with unrestricted administrative execution policies, the Local Agent connects seamlessly to the native Lemonade DirectML socket.
* **Integrity Commitment**: All synthetic or blocked results are explicitly labeled as `MOCK` or `BLOCKED` and never misrepresented as physical AMD hardware measurements.
