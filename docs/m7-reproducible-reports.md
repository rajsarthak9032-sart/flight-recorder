# Milestone 7: Reproducible Research Reports & Submission Showcase

## Overview

Milestone 7 delivers the final reproducibility, metrological publishing, and bundle export layer for the **Lemonade Flight Recorder**.

The system translates recorded Flight Recorder runs, controlled experiments, replay lineage graphs, and diagnostic investigations into self-contained, ISO/IEC 42001-compliant technical research reports.

---

## Technical Architecture

```text
┌─────────────────┐       ┌─────────────────┐
│  Experiment     │       │  Run & Events   │
│  Store / Engine │       │  Store          │
└────────┬────────┘       └────────┬────────┘
         │                         │
         └───────────┬─────────────┘
                     ▼
       ┌───────────────────────────┐
       │   Report Generator Engine │
       │   (local-agent/reports)   │
       └─────────────┬─────────────┘
                     │
    ┌────────────────┼────────────────┬────────────────┐
    ▼                ▼                ▼                ▼
┌──────────┐   ┌──────────┐    ┌─────────────┐   ┌──────────────┐
│   JSON   │   │   CSV    │    │  Markdown   │   │  Bundle Zip  │
│  Export  │   │  Export  │    │  / HTML Doc │   │  (Manifest)  │
└──────────┘   └──────────┘    └─────────────┘   └──────────────┘
```

---

## Report Data Model

The `ResearchReport` structure encompasses:

1. **Header & Metadata**: Report ID, creation timestamp, experiment ID, title, and ISO audit profile.
2. **Executive Summary**: High-level factual synthesis of trials, provenance distribution, observed latency, and diagnostics.
3. **Objective & Methodology**: Workload prompt, repeat count, execution mode, timing hooks, and Bessel aggregation rules.
4. **Environment Specification**: Model, provider, runtime, backend, device, CPU, GPU, NPU, and OS.
5. **Authoritative Provenance**: Exact distribution across `REAL`, `MOCK`, `BLOCKED`, `UNAVAILABLE`, and `LEGACY`.
6. **Scientific Measurement Table**: Standardized entries with `MEASURED`, `DERIVED`, `UNAVAILABLE` semantics.
7. **Statistical Summary**: Bessel sample standard deviation ($\sigma$), median, arithmetic mean, min, max over valid observations.
8. **Trial Matrix**: Complete record of all individual trials, including failure and block states.
9. **Failure Diagnostics**: Evidence-grounded root cause findings (Error 4551, ECONNREFUSED, incomplete telemetry).
10. **Replay Lineage**: Preserved tree of parent-child replay links (`replayOf`, `experimentId`, `trialIndex`).
11. **Pairwise Empirical Comparisons**: Mathematical metric deltas between trials without subjective winner badges.
12. **Limitations & Boundary Conditions**: Mandatory warning when real silicon inference was unverified or blocked.
13. **Factual Conclusion**: Objective summary derived purely from recorded evidence.

---

## Reproducibility Bundle

The reproducibility bundle export packages:
* `manifest.json`: Cryptographic integrity manifest and file index.
* `README.md`: Reproduction instructions, measurement semantics, and runtime notice.
* `report.json`: Full machine-readable ResearchReport JSON model.
* `report.md`: Technical publication Markdown.
* `report.html`: Self-contained standalone HTML report.
* `trials.csv`: Spreadsheet-friendly trial and telemetry matrix.
* `experiment.json`: Raw experiment workload and configuration.
* `runs.json`: Sanitized Flight Recorder logs with credentials stripped.
* `diagnostics.json`: Diagnostic findings and evidence traces.
* `measurements.json`: Metrological measurement table.

---

## Verification & Audit Rules

* **Non-Zero Exclusion**: Missing metrics are never filled with zero or zero-equivalent values.
* **No Subjective Scoring**: No "BEST", "WINNER", or arbitrary quality ratings.
* **Security Scanning**: Zero private tokens, API keys, credentials, or hidden CoT in exported files.
