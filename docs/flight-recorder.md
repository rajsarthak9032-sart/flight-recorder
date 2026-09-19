# Flight Recorder & Event Timeline

## Mission

Flight Recorder captures execution traces with high temporal resolution across every stage of the on-device inference lifecycle.

---

## Lifecycle Stages

```text
init ──► prepare ──► tokenize ──► prefill ──► generate ──► complete (or error)
```

1. **`init`**: Socket handshake, process binding, and session initialization.
2. **`prepare`**: Memory allocation and DirectML weight buffer verification.
3. **`tokenize`**: Conversion of text input to token sequences.
4. **`prefill`**: Prompt processing and KV-cache warming on NPU/GPU.
5. **`generate`**: Autoregressive token decoding and streaming.
6. **`complete`**: Output finalization and resource release.
7. **`error`**: Exception capture with stage-specific fault logging.

---

## Telemetry Metrics

| Metric Key | Unit | Semantics | Description |
| :--- | :--- | :--- | :--- |
| `total_duration_ms` | ms | `MEASURED` | Wall-clock elapsed time from request receipt to completion |
| `ttft_ms` | ms | `MEASURED` | Time to First Token (wall-clock latency until first token emission) |
| `tokens_per_second` | tok/s | `DERIVED` | Output tokens divided by generation duration |
| `input_tokens` | count | `MEASURED` | Number of tokens in input context |
| `output_tokens` | count | `MEASURED` | Number of tokens generated |
| `total_tokens` | count | `DERIVED` | Sum of input and output tokens |
| `peak_vram_mb` | MB | `MEASURED` | Maximum dedicated VRAM allocated during run |
| `npu_utilization_pct` | % | `MEASURED` | Peak or average NPU compute engine load |
| `package_power_w` | W | `MEASURED` | Sustained package power draw during generation |
