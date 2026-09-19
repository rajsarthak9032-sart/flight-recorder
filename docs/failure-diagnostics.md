# Failure Diagnostics & Evidence-Based RCA

## Mission

Failure Diagnostics analyzes recorded runs and event streams to produce deterministic root-cause findings grounded entirely in observable telemetry.

---

## Non-Speculative Diagnosis Rule

* **No Speculative Hallucination**: The diagnostic engine does not use external generative AI to guess reasons for failures.
* **Observable Evidence Requirement**: Every finding must cite explicit fields in `run`, `provenance`, or `events`.

---

## Canonical Fault Patterns

### 1. Windows Application Control Policy Block (Error 4551)
* **Observed Evidence**: `run.status === 'blocked'`, error message containing `4551` or `application-control`.
* **Diagnostic Status**: `BLOCKED` (Severity: `ERROR`).
* **Summary**: Host security policy prevented execution of the Lemonade binary.

### 2. Runtime Daemon Unreachable (`ECONNREFUSED`)
* **Observed Evidence**: Error event at `init` or `prepare` containing `ECONNREFUSED` or `socket closed`.
* **Diagnostic Status**: `UNAVAILABLE` (Severity: `ERROR`).
* **Summary**: Local Lemonade daemon was not listening on the expected port or IPC socket.

### 3. Incomplete Telemetry Streams
* **Observed Evidence**: Run status completed but `ttft_ms` or `tokens_per_second` missing from telemetry.
* **Diagnostic Status**: `DEGRADED` (Severity: `WARNING`).
* **Summary**: Hardware driver did not report complete event timestamps.
