# Milestone 5: Failure Diagnostics & Telemetry Metrology
**Lemonade Flight Recorder — Evidence-Based AI Failure Analysis System**

---

## 1. Architectural Role of Diagnostics in Lemonade Flight Recorder

Milestone 5 transforms Lemonade Flight Recorder from a passive telemetry and log viewer into an **evidence-based, metrological diagnostic system** for local AI inference runtimes.

In local inference environments (such as DirectML, XDNA NPU, and ROCm GPU), failures are frequently opaque:
- Drivers hang or time out without emitting high-level exceptions.
- Host security software silently terminates runner binaries (e.g. Windows Application Control / AppLocker).
- Model files are missing or unmapped in memory.
- Token generation suffers from logit drift, quantization clipping, or preamble bleed.

**Core Product Principle**:
> **Failure Diagnostics must be based ONLY on observable evidence.**
> We do NOT generate speculative AI explanations, simulate fake chains-of-thought, or hallucinate causality. The system strictly correlates recorded telemetry, error codes, socket states, and stage events to identify facts and guide human investigation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LEMONADE FLIGHT RECORDER ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ Telemetry Stream (M1-M4)
                                      ▼
┌──────────────────┐       ┌────────────────────────┐       ┌─────────────────┐
│ RunStore         │──────▶│ Deterministic          │──────▶│ Diagnostics     │
│ (Runs & Events)  │       │ Diagnostic Engine      │       │ Panel / UI      │
└──────────────────┘       └────────────────────────┘       └─────────────────┘
                                      │
            ┌─────────────────────────┼────────────────────────┐
            ▼                         ▼                        ▼
    Observable Evidence       Provenance Shield       Metrological Stage
    (Fields, Values, IDs)     (REAL, MOCK, BLOCKED,   (Input -> Retrieval ->
                              UNAVAILABLE, LEGACY)    Context -> Model -> EOS)
```

---

## 2. Complete Diagnostic Schema

The diagnostic schema is defined in `packages/shared/src/types.ts`:

### Data Structures

```typescript
export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export type DiagnosticCategory =
  | 'connection'
  | 'runtime'
  | 'model'
  | 'backend'
  | 'input'
  | 'generation'
  | 'telemetry'
  | 'persistence'
  | 'configuration'
  | 'unknown';

export interface DiagnosticEvidence {
  source: 'run' | 'event' | 'metric' | 'provenance' | 'runtime' | 'hardware';
  field: string;
  value?: string | number | boolean | null;
  description: string;
  eventId?: string; // Direct link to flight recorder trace event
}

export interface DiagnosticFinding {
  id: string;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  title: string;
  summary: string;
  evidence: DiagnosticEvidence[];
  nextInspection?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export type OverallDiagnosticStatus =
  | 'healthy'
  | 'degraded'
  | 'failed'
  | 'blocked'
  | 'insufficient-data';

export interface RunDiagnostics {
  runId: string;
  generatedAt: string;
  overallStatus: OverallDiagnosticStatus;
  stageAtFailure?: string;
  findings: DiagnosticFinding[];
  unavailableFields?: string[];
  observableSummary: string;
}
```

---

## 3. Diagnostic Engine Rule Set

The diagnostic engine is implemented in `local-agent/src/diagnostics/engine.ts`. It executes rules in deterministic priority order:

| Rule ID | Trigger Condition | Severity | Category | Diagnostic Finding | Next Inspection Step |
|---|---|---|---|---|---|
| **RULE-01** | `run.status === 'blocked'` OR Error 4551 OR Application Control policy match | `error` | `runtime` | Inference backend execution was blocked by host application-control policy | Review the host's application-control policy with the system administrator. (Bypass instructions forbidden) |
| **RULE-02** | `ECONNREFUSED` or transport socket failure | `error` | `connection` | Lemonade runtime unavailable | Verify Lemonade server is running and reachable at configured endpoint |
| **RULE-03** | Model missing / not found error recorded | `error` | `model` | Requested model unavailable in local runtime | Verify model presence in local Lemonade model directory or pull weights |
| **RULE-04** | Execution began but terminated with runtime error | `error` | `generation` | Generation terminated prematurely with runtime fault | Inspect last generated token logits and GPU/NPU memory boundaries before fault |
| **RULE-05** | `status === 'completed'` but TTFT or throughput missing | `warning` | `telemetry` | Generation completed with incomplete telemetry | Verify if hardware profiling hooks (DirectML/XDNA) were active during run |
| **RULE-06** | `status === 'completed'` and nominal metrics | `info` | `runtime` | No failure detected | Run executed nominally; inspect latency or token distribution if benchmarking |
| **RULE-07** | Status failed/blocked but 0 events and no error message | `warning` | `unknown` | Insufficient diagnostic evidence | Enable verbose Flight Recorder event logging for subsequent runs |
| **RULE-08** | `provenance.provider === 'mock'` or `runtime === 'mock'` | `info` | `configuration` | Synthetic execution (Mock Provider) | Note that synthetic measurements do not reflect silicon substrate timings |
| **RULE-09** | Missing or legacy provenance metadata | `info` | `configuration` | Historical unversioned run | Telemetry is unclassified historical baseline; no remediation required |

---

## 4. Evidence Model & Traceability

Every finding links to **concrete observable records**:
1. **Source Tracking**: Identifies whether the fact came from the `run` entity, a specific `event`, an unmeasured `metric`, or verified `provenance`.
2. **Event Correlation (`eventId`)**: In the Flight Recorder and Failure Diagnostics UI, clicking any evidence chip jumps directly to that event in the trace log, highlighting it in yellow/error borders and displaying the raw JSON payload.
3. **No Speculation**: If a parameter was unmeasured, it is tagged as `value: null` and entered into `unavailableFields`. It is **never defaulted to 0**.

---

## 5. Provenance Guarantees

Milestone 5 enforces strict provenance integrity:
- **`REAL`**: Active Lemonade runtime connected via IPC or localhost socket, dispatching to real DirectML/NPU/ROCm silicon.
- **`MOCK`**: Synthetically generated benchmark or unit test. Clearly badged as `MOCK RUN (SYNTHETIC)`. Never masqueraded as real hardware metrics.
- **`BLOCKED`**: The binary was halted prior to or during dispatch by host OS security controls.
- **`UNAVAILABLE`**: The server daemon was unreachable over the network transport.
- **`LEGACY`**: Pre-M4 historical runs without provenance headers. Left explicitly unclassified rather than guessing.

---

## 6. UI Components & Workflows

### 1. Failure Diagnostics Cockpit (`/failure-diagnostics`)
- **Run Selector Switcher**: Quickly switch between canonical runs (`RUN #045` Blocked, `RUN #046` Offline, `RUN #042` Healthy, `RUN #047` Incomplete Telemetry, `RUN #048` Mock, `RUN #051` Hallucination Anomaly).
- **Incident Header**: Shows Run ID, model, substrate target, and strict Provenance Badge.
- **Observable Stage Sequencer**: 5-step visual pipeline:
  1. Input Processing
  2. Document Retrieval
  3. Context Assembly
  4. Model Runtime / NPU Dispatch
  5. Assertion & Output Verification
- **Diagnostic Findings Card**: Category tags, severity badges (`ERROR`, `WARNING`, `INFO`), factual summary, and Next Inspection recommendation.
- **Metrological Evidence Inspector**: Concrete data tables, top candidate logits, probability differentials, and hardware silicon sensors (Watts, Temp, VRAM, IRQ errors).

### 2. Run Detail Integration (`/runs/:id`)
- Accessing `/runs/:id` serves the comprehensive diagnostic and execution inspection dossier directly for that run.

### 3. Command Center Cockpit (`/command-center` & `/`)
- Displays distinct status pills:
  - `Lemonade Server`: **CONNECTED** / **DISCONNECTED**
  - `Inference Runtime`: **READY** / **BLOCKED** / **UNAVAILABLE**
- Real-time recent run audit table with diagnostic badges.

---

## 7. Local Agent API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Probes server connection, runtime state, and hardware sensors |
| `GET` | `/api/runs` | Returns all recorded runs with summary diagnostic states |
| `GET` | `/api/runs/:id` | Returns run record with events and computed `RunDiagnostics` |
| `GET` | `/api/runs/:id/diagnostics` | Computes and returns pure `RunDiagnostics` for the run |
| `GET` | `/api/runs/:id/events` | Returns chronologically ordered `RunEvent` stream |
| `POST` | `/api/runs` | Dispatches new inference run through Lemonade or Mock |
| `POST` | `/api/runs/:id/replay` | Clones and replays an existing run trace under isolation |

---

## 8. Metrological Limitations

What Failure Diagnostics **CAN** determine:
- Whether the host security policy blocked the binary execution (Error 4551).
- Whether transport connectivity to the inference daemon failed (ECONNREFUSED).
- Whether model weights were missing from the local filesystem.
- At which discrete pipeline stage an execution halt or timeout occurred.
- Which specific telemetry fields were unmeasured vs. observed.
- Discrepancies between retrieved ground truth and generated output tokens.

What Failure Diagnostics **CANNOT** determine from recorded telemetry:
- Underlying cause of uninstrumented kernel panics if no crash dump was captured.
- Internal weights distribution of closed-source third-party runner binaries without profiling hooks.
- User intent beyond the submitted prompt string and configuration parameters.
