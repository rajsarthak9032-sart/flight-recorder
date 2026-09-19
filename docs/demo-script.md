# Golden Demo Script (3–5 Minutes)

This script provides a concise, step-by-step walkthrough for demonstrating Lemonade Flight Recorder to evaluators and researchers.

---

## 0:00–0:30 — Problem & Mission
* **Speaker**: "Local AI workloads frequently run as black boxes without clear visibility into execution stages, latency variance, or failure conditions. Lemonade Flight Recorder provides an aerospace-grade observability, replay, diagnostics, experiment, and reproducible reporting layer for on-device AI running on AMD hardware."

---

## 0:30–1:15 — Live Flight Recorder & Event Timeline
* **Action**: Navigate to `/flight-recorder` and select `run-001`.
* **Speaker**: "Here we see the full request lifecycle broken into distinct execution stages: `init`, `prepare`, `tokenize`, `prefill`, and `generate`. Every event is timestamped, showing exact TTFT (300 ms), tokens per second (42.0 tok/s), and peak VRAM allocation."

---

## 1:15–1:45 — Replay Lab & Deterministic Lineage
* **Action**: Navigate to `/replay`, select `run-001`, and click *Replay Run*.
* **Speaker**: "In the Replay Lab, we re-execute runs under identical parameters. Notice that the replayed run mints a new unique Run ID while preserving a cryptographic pointer to the parent run via `replayOf`. Lineage is maintained across repeated replays."

---

## 1:45–2:30 — Failure Diagnostics & Evidence-Based RCA
* **Action**: Navigate to `/diagnostics` and select `run-045`.
* **Speaker**: "When a run fails or is blocked by system policies—such as Windows Application Control Error 4551—the Diagnostic Engine analyzes the recorded event logs without speculative AI models. It surfaces exact, observable evidence traces and next-inspection steps."

---

## 2:30–3:15 — Experiment Engine & Statistical Metrology
* **Action**: Navigate to `/experiments` and select `exp-001` (Qwen2.5-Coder-7B-Instruct Baseline).
* **Speaker**: "The Experiment Engine runs controlled benchmark batches. Rather than simple averages, it computes Bessel-corrected sample standard deviations, medians, and ranges. Blocked or failed trials have their latency marked as `UNAVAILABLE` and are never zero-filled."

---

## 3:15–4:15 — Research Reports & ISO/IEC 42001 Audits
* **Action**: Navigate to `/reports` and open `rep-seed-001`.
* **Speaker**: "Research Reports consolidate multi-trial data into publication-ready technical reports conforming to ISO/IEC 42001 standards. It includes executive summaries, provenance distributions, Bessel statistical tables, trial matrices, failure findings, replay lineage trees, pairwise empirical deltas, and explicit boundary disclosures."

---

## 4:15–5:00 — Reproducibility Bundles & Export
* **Action**: Click *Export Bundle* or export Markdown/CSV/HTML.
* **Speaker**: "With one click, researchers can export the entire study as a self-contained Reproducibility Bundle JSON containing the report, raw sanitized run logs, diagnostic evidence, and CSV trial matrices. Another engineer can independently verify the study without requiring the UI."
