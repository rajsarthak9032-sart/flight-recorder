# Replay Lab & Deterministic Lineage

## Mission

Replay Lab enables developers and researchers to reproduce any previously recorded Run with identical parameters, hardware bindings, and prompt contexts, preserving complete lineage relationships.

---

## Lineage Preservation

When a run is replayed:

1. **New Unique Run**: A new Run document is minted (`id: run-replay-<timestamp>`).
2. **Parent Linkage**: The `replayOf` property explicitly references the original run ID.
3. **Experiment Context**: If part of a multi-trial experiment, `experimentId` and `trialIndex` are preserved.
4. **Independent Events**: An independent event log is created with fresh execution timestamps.
5. **Deterministic Storage**: Both the original run and the replay run remain immutable and queryable in `RunStore`.

```text
Run #001 (Original Root)
   │
   └──► Replay #001-R1 (replayOf: 'run-001', trialIndex: 1)
           │
           └──► Replay #001-R2 (replayOf: 'run-001-R1', trialIndex: 1)
```
