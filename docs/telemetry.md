# Telemetry & Metrology Metrics

## Overview

Flight Recorder enforces strict metrology standards for every recorded metric.

---

## Metric Definitions

| Metric | Unit | Type | Definition |
| :--- | :--- | :--- | :--- |
| `total_duration_ms` | ms | `MEASURED` | Total wall-clock time from request receipt to stream completion. |
| `ttft_ms` | ms | `MEASURED` | Wall-clock latency until the first generated token is emitted. |
| `tokens_per_second` | tok/s | `DERIVED` | Output tokens divided by the active generation duration. |
| `input_tokens` | count | `MEASURED` | Number of tokens in input context. |
| `output_tokens` | count | `MEASURED` | Number of tokens generated in output stream. |
| `peak_vram_mb` | MB | `MEASURED` | Peak dedicated video memory allocated by DirectML runtime. |
| `npu_utilization_pct`| % | `MEASURED` | Average or peak compute load reported by NPU hardware counters. |
| `package_power_w` | W | `MEASURED` | Package power consumption measured across execution window. |

---

## Metric Semantics

* `MEASURED`: Directly sampled from system or hardware timers.
* `DERIVED`: Computed via mathematical formula over measured fields.
* `UNAVAILABLE`: Telemetry was not reported by hardware/runtime driver (never filled with zero).
