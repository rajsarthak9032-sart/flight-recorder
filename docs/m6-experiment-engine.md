# Milestone 6: Experiment Engine & Benchmarking

## Overview

Milestone 6 introduces the **Experiment Engine & Benchmarking Laboratory** to the Lemonade Flight Recorder. It transforms the system into a local AI experimentation laboratory that enables engineers to define controlled workloads, execute repeated trials, aggregate empirical measurements, and export reproducible benchmark results.

The system builds strictly upon the foundations established in M1–M5:
- **M3 (Trustworthy Provenance & Telemetry)**: Metrological rigor, separation of measured vs derived vs unavailable values, zero fabricated statistics.
- **M4 (Replay & Lineage)**: Run lineage and trial indexing while preserving `replayOf` links.
- **M5 (Evidence-Based Diagnostics)**: Direct integration of diagnostic findings for failed or blocked experiment trials.

---

## 1. Single Authoritative Execution Architecture

A critical architectural mandate of Milestone 6 is that **there is strictly one authoritative path for model inference execution**. The Experiment Engine does not implement a secondary or duplicate inference loop; rather, it orchestrates the existing Lemonade and local hardware execution pipeline:

```
┌────────────────────────────────────────────────────────┐
│             Browser UI / Experiment Console             │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST
┌──────────────────────────▼─────────────────────────────┐
│               Flight Recorder Local Agent               │
│                (/api/experiments/:id/run)              │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                    ExperimentEngine                    │
│            (orchestrates trials 1..repeatCount)        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                   InferenceExecutor                    │
│       (authoritative path for all Runs and Replays)     │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 Lemonade Client / Daemon                │
│            (probes runtime, checks OS policies)         │
└──────────────────────────┬─────────────────────────────┘
                           │ DirectML / Silicon dispatch
┌──────────────────────────▼─────────────────────────────┐
│             Local Hardware (e.g. AMD Ryzen AI)          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Metrological Measurement Semantics

To prevent "metric inflation" and scientific dishonesty, every single metric in the benchmark laboratory is explicitly classified under one of three semantic states:

| Semantic Tag | Meaning | Handling in Statistical Engine |
| :--- | :--- | :--- |
| **`MEASURED`** | Directly recorded by hardware or runtime instrumentation (e.g., hardware timers, prompt token counts, peak VRAM). | Aggregated across valid observations into min, max, mean, median, and sample standard deviation. |
| **`DERIVED`** | Mathematically calculated from valid measured source inputs (e.g., generation tokens / duration). | Aggregated with transparent formula notation (`out_tok / sec`). |
| **`UNAVAILABLE`** | Not captured by the runtime profiling hooks or missing due to pre-execution failure. | **Never displayed as `0`**. Represented as `Unavailable` / `null`. Excluded from numeric statistical formulas. |

---

## 3. Statistical Aggregation Formulas

For repeated trials ($n \ge 1$):

1. **Median**:
   - For odd $n$: middle value of sorted observations.
   - For even $n$: arithmetic mean of the two central sorted values.
2. **Mean**:
   $$\mu = \frac{1}{n} \sum_{i=1}^n x_i$$
3. **Sample Standard Deviation** ($n > 1$):
   $$s = \sqrt{\frac{1}{n-1} \sum_{i=1}^n (x_i - \mu)^2}$$
   *(For $n = 1$, $s = 0$.)*
4. **Precision Policy**:
   Outputs are rounded to at most 1 decimal place (or whole milliseconds) to avoid giving a false impression of precision.

---

## 4. Partial Experiments & Mixed Trial Outcomes

Real-world hardware experiments often encounter non-uniform conditions (e.g. Windows Application Control blocks, thermal halts, or driver restarts).

The Experiment Engine explicitly supports **`partial`** experiment states:
- If 5 trials are requested, and 3 succeed while 1 is blocked by OS policy (Error 4551) and 1 fails:
  - The experiment status is marked **`partial`**.
  - The UI explicitly renders: `PARTIAL (3/5 Completed · 1 Blocked · 1 Failed)`.
  - The 3 completed trials remain valid empirical data points and are aggregated with $n=3$.
  - Blocked and failed trials link directly to the **Failure Diagnostics** engine so the engineer can inspect the exact stage and evidence of failure.

---

## 5. Experiment Data Model & Lineage

Experiments serve as an organizational and statistical aggregation layer over individual `Run` entities:

```typescript
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'running' | 'completed' | 'partial' | 'failed';
  workload: {
    input: string;
    repeatCount: number;
    description?: string;
  };
  configuration: {
    model: string;
    backend?: string;
    device?: string;
    provider?: 'lemonade' | 'mock';
  };
  runIds: string[];
  summary?: ExperimentSummary;
}
```

Each trial within an experiment is an ordinary `Run` augmented with lineage metadata:
- `run.experimentId`: Identifier of the enclosing experiment.
- `run.trialIndex`: 1-based sequential trial index.
- `run.replayOf`: Preserved whenever a trial is replayed, ensuring experiment lineage and replay lineage remain distinct and mutually non-destructive.

---

## 6. Reproducible Export Bundle

Every experiment can be exported via `GET /api/experiments/:id/export` to produce a self-contained JSON schema bundle incorporating:
- Complete experiment metadata and workload input.
- Target hardware and runtime configuration.
- Full array of trial runs with timestamped event traces and provenance tags.
- Calculated statistical summaries and measurement semantics registry.
