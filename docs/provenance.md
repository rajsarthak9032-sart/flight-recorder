# Provenance & Execution Classification

## Mission

Every run and report in Lemonade Flight Recorder carries explicit provenance metadata to guarantee scientific integrity.

---

## Provenance States

| Classification | Meaning | Visual Indicator |
| :--- | :--- | :--- |
| `REAL` | Executed against native Lemonade daemon on physical silicon. | Green badge (`REAL SILICON`) |
| `MOCK` | Generated via deterministic synthetic driver for testing. | Yellow badge (`SYNTHETIC`) |
| `BLOCKED` | Attempted execution blocked by host OS security policy (e.g. Error 4551). | Red badge (`BLOCKED`) |
| `UNAVAILABLE` | Daemon unreachable or socket closed unexpectedly. | Gray badge (`UNAVAILABLE`) |
| `LEGACY` | Historical archive run lacking modern telemetry envelope. | Dim gray badge (`LEGACY`) |

---

## Anti-Fabrication Rule

* Synthetic test data is **never** presented as real physical silicon benchmarks.
* Whenever real hardware execution is unverified, reports automatically include the **Real Runtime Boundary Notice**.
