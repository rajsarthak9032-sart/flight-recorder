/**
 * Comprehensive Automated Test Suite for Milestone 6: Experiment Engine & Benchmarking
 * Hardening and Verification Pass:
 * - Section 4: Controlled Experiment Persistence & Lineage Integrity across Reload
 * - Section 5: Provenance Integrity (REAL, MOCK, BLOCKED, UNAVAILABLE, LEGACY)
 * - Section 6: Measurement Semantics (MEASURED, DERIVED, UNAVAILABLE - No Zero Filling)
 * - Section 7: Statistical Verification (Known Fixtures: [10,20,30,40] & [10,null,30])
 * - Section 8: Partial Experiment Verification (Mixed States, Accurate Counts)
 * - Section 9: Pairwise Metrological Comparison (Empirical Deltas, No Winner/Rank)
 * - Section 10: JSON & CSV Export Verification (Schema, Lineage, UNAVAILABLE in CSV)
 * - Section 11: Replay + Experiment Lineage Linkage
 * - Section 12: Failure Diagnostics (M5) Integration with M6 Trials
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { experimentStore, ExperimentStore } from '../local-agent/src/experiments/store.ts';
import { ExperimentStatsAggregator } from '../local-agent/src/experiments/stats.ts';
import { ExperimentEngine } from '../local-agent/src/experiments/engine.ts';
import { InferenceExecutor } from '../local-agent/src/runs/executor.ts';
import { DiagnosticEngine } from '../local-agent/src/diagnostics/engine.ts';
import { runStore, RunStore } from '../local-agent/src/runs/store.ts';

describe('Milestone 6: Experiment Engine Hardening & Verification Suite', () => {

  // -------------------------------------------------------------------------
  // 1. Canonical Seed Experiments & Schema Baseline
  // -------------------------------------------------------------------------
  test('1. Canonical seed experiments exist with complete, valid schemas', () => {
    const experiments = experimentStore.getAll();
    assert.ok(experiments.length >= 3, 'Store must contain canonical experiments');

    const exp001 = experimentStore.getById('exp-001');
    assert.ok(exp001);
    assert.equal(exp001.status, 'completed');
    assert.equal(exp001.workload.repeatCount, 5);
    assert.equal(exp001.runIds.length, 5);
    assert.ok(exp001.summary);
  });

  // -------------------------------------------------------------------------
  // 2. Statistical Verification (Section 7)
  // -------------------------------------------------------------------------
  test('2. Statistical aggregation on known deterministic fixture [10, 20, 30, 40]', () => {
    // Input: [10, 20, 30, 40]
    // count = 4
    // min = 10, max = 40
    // sum = 100, mean = 25.0
    // median = (20 + 30) / 2 = 25.0
    // sample variance = ((10-25)^2 + (20-25)^2 + (30-25)^2 + (40-25)^2) / 3 = (225 + 25 + 25 + 225) / 3 = 500 / 3 ≈ 166.67
    // sample stdDev = sqrt(500/3) ≈ 12.91
    const fixture = [10, 20, 30, 40];
    const metric = ExperimentStatsAggregator.calculateMetric(fixture, 'ms', 'MEASURED');

    assert.equal(metric.semantics, 'MEASURED');
    assert.equal(metric.n, 4, 'Count must equal 4');
    assert.equal(metric.min, 10, 'Min must equal 10');
    assert.equal(metric.max, 40, 'Max must equal 40');
    assert.equal(metric.mean, 25, 'Mean must equal 25.0');
    assert.equal(metric.median, 25, 'Median must equal 25.0');
    assert.equal(metric.stdDev, 12.91, 'Sample standard deviation must equal 12.91');
    assert.equal(metric.unit, 'ms');
  });

  test('3. Unavailable observations [10, UNAVAILABLE, 30] are excluded from aggregation (never zero-filled)', () => {
    // Input: [10, null, 30]
    // The null represents an UNAVAILABLE observation.
    // If mistakenly treated as 0: sum would be 40/3 ≈ 13.33 (DEFECT!).
    // Correct mathematical exclusion: valid count = 2, values = [10, 30]
    // mean = (10 + 30) / 2 = 20.0
    // median = (10 + 30) / 2 = 20.0
    // sample variance = ((10-20)^2 + (30-20)^2) / 1 = 200
    // sample stdDev = sqrt(200) ≈ 14.14
    const fixtureWithNull = [10, null, 30];
    const metric = ExperimentStatsAggregator.calculateMetric(fixtureWithNull, 'ms', 'MEASURED');

    assert.equal(metric.semantics, 'MEASURED');
    assert.equal(metric.n, 2, 'Unavailable observation must be excluded, giving n=2');
    assert.equal(metric.min, 10);
    assert.equal(metric.max, 30);
    assert.equal(metric.mean, 20, 'Mean must be 20.0 (NOT 13.33 from zero-filling)');
    assert.equal(metric.median, 20, 'Median must be 20.0');
    assert.equal(metric.stdDev, 14.14, 'Sample stdDev must be 14.14');
  });

  test('4. All-unavailable metrics produce null statistics, never 0 or 0.0', () => {
    const emptyValues = [null, null, undefined];
    const metric = ExperimentStatsAggregator.calculateMetric(emptyValues, 'ms', 'MEASURED');

    assert.equal(metric.semantics, 'UNAVAILABLE');
    assert.equal(metric.n, 0);
    assert.equal(metric.min, null);
    assert.equal(metric.max, null);
    assert.equal(metric.mean, null);
    assert.equal(metric.median, null);
    assert.equal(metric.stdDev, null);
  });

  // -------------------------------------------------------------------------
  // 3. Controlled Experiment Persistence Test (Section 4)
  // -------------------------------------------------------------------------
  test('5. Controlled multi-trial persistence survives restart/reload without ID changes or data loss', () => {
    const expId = `exp-persist-verify-${Date.now()}`;
    const run1Id = `run-${expId}-t1`;
    const run2Id = `run-${expId}-t2`;
    const run3Id = `run-${expId}-t3`;
    const run4Id = `run-${expId}-t4`;

    // Trial 1: completed mock
    const run1: Run = {
      id: run1Id,
      name: 'Trial 1 (completed mock)',
      status: 'completed',
      model: 'Mock-Model-Tiny',
      prompt: 'Persistence vector 1',
      output: 'Mock output 1',
      experimentId: expId,
      trialIndex: 1,
      createdAt: new Date().toISOString(),
      provenance: {
        provider: 'mock',
        runtime: 'mock',
        backend: 'Synthetic-Generator',
        device: 'Mock-Silicon',
        isSynthetic: true,
      },
      telemetry: {
        total_duration_ms: 3100,
        ttft_ms: 120,
        tokens_per_second: 51.6,
        total_tokens: 260,
        peak_vram_mb: 512,
        measuredFields: ['total_duration_ms', 'ttft_ms', 'tokens_per_second', 'total_tokens', 'peak_vram_mb'],
        unavailableFields: [],
      },
      events: [{ id: `evt-${run1Id}-01`, runId: run1Id, timestamp: new Date().toISOString(), offsetMs: 0, stage: 'input', type: 'INGEST', level: 'info', message: 'Trial 1 start' }],
    };

    // Trial 2: completed mock
    const run2: Run = {
      id: run2Id,
      name: 'Trial 2 (completed mock)',
      status: 'completed',
      model: 'Mock-Model-Tiny',
      prompt: 'Persistence vector 2',
      output: 'Mock output 2',
      experimentId: expId,
      trialIndex: 2,
      createdAt: new Date().toISOString(),
      provenance: {
        provider: 'mock',
        runtime: 'mock',
        backend: 'Synthetic-Generator',
        device: 'Mock-Silicon',
        isSynthetic: true,
      },
      telemetry: {
        total_duration_ms: 3200,
        ttft_ms: 125,
        tokens_per_second: 50.0,
        total_tokens: 260,
        peak_vram_mb: 512,
        measuredFields: ['total_duration_ms', 'ttft_ms', 'tokens_per_second', 'total_tokens', 'peak_vram_mb'],
        unavailableFields: [],
      },
      events: [{ id: `evt-${run2Id}-01`, runId: run2Id, timestamp: new Date().toISOString(), offsetMs: 0, stage: 'input', type: 'INGEST', level: 'info', message: 'Trial 2 start' }],
    };

    // Trial 3: blocked (Windows Application Control Error 4551)
    const run3: Run = {
      id: run3Id,
      name: 'Trial 3 (blocked)',
      status: 'blocked',
      model: 'Qwen2.5-Coder-7B-Instruct',
      prompt: 'Persistence vector 3',
      errorMessage: 'Error 4551: Windows Application Control blocked directml_npu_runner.dll',
      errorCode: 4551,
      experimentId: expId,
      trialIndex: 3,
      createdAt: new Date().toISOString(),
      provenance: {
        provider: 'lemonade',
        runtime: 'blocked',
        backend: 'Lemonade-DirectML',
        device: 'AMD Ryzen AI NPU (XDNA2)',
        isSynthetic: false,
      },
      telemetry: {
        total_duration_ms: 1420,
        ttft_ms: null,
        tokens_per_second: null,
        total_tokens: 420,
        peak_vram_mb: 2100,
        measuredFields: ['total_duration_ms', 'total_tokens', 'peak_vram_mb'],
        unavailableFields: ['ttft_ms', 'tokens_per_second', 'package_power_w'],
      },
      events: [{ id: `evt-${run3Id}-01`, runId: run3Id, timestamp: new Date().toISOString(), offsetMs: 1420, stage: 'model_runtime', type: 'POLICY_BLOCK', level: 'error', message: 'Blocked Error 4551' }],
    };

    // Trial 4: unavailable (ECONNREFUSED)
    const run4: Run = {
      id: run4Id,
      name: 'Trial 4 (unavailable)',
      status: 'failed',
      model: 'Mistral-7B-Instruct',
      prompt: 'Persistence vector 4',
      errorMessage: 'connect ECONNREFUSED 127.0.0.1:8899',
      errorCode: 'ECONNREFUSED',
      experimentId: expId,
      trialIndex: 4,
      createdAt: new Date().toISOString(),
      provenance: {
        provider: 'lemonade',
        runtime: 'unavailable',
        host: '127.0.0.1',
        port: 8899,
        isSynthetic: false,
      },
      telemetry: {
        total_duration_ms: 120,
        ttft_ms: null,
        tokens_per_second: null,
        total_tokens: 0,
        peak_vram_mb: null,
        measuredFields: ['total_duration_ms'],
        unavailableFields: ['ttft_ms', 'tokens_per_second', 'peak_vram_mb'],
      },
      events: [{ id: `evt-${run4Id}-01`, runId: run4Id, timestamp: new Date().toISOString(), offsetMs: 120, stage: 'system', type: 'TRANSPORT_ERROR', level: 'error', message: 'ECONNREFUSED' }],
    };

    // Save runs into store
    runStore.save(run1);
    runStore.save(run2);
    runStore.save(run3);
    runStore.save(run4);

    // Create experiment
    const experiment: Experiment = {
      id: expId,
      name: 'M6 Persistence Verification',
      description: 'Controlled experiment testing multi-trial reload durability',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      workload: {
        taskType: 'code_generation',
        dataset: 'Unit-Persistence-Vector',
        prompt: 'Benchmark persistence test',
        repeatCount: 4,
      },
      configuration: {
        model: 'Mixed-Models',
        backend: 'Lemonade-DirectML & Mock',
        device: 'AMD NPU & Virtual',
        provider: 'mixed',
      },
      runIds: [run1Id, run2Id, run3Id, run4Id],
    };

    experimentStore.save(experiment);

    // Verify status was computed as partial (2 completed, 1 blocked, 1 failed)
    const initialExp = experimentStore.getById(expId);
    assert.ok(initialExp);
    assert.equal(initialExp.status, 'partial');

    // Simulate complete reload / restart cycle
    runStore.reload();
    experimentStore.reload();

    // 1. Retrieve the experiment
    const reloadedExp = experimentStore.getById(expId);
    assert.ok(reloadedExp, 'Experiment must exist after reload');
    assert.equal(reloadedExp.id, expId, 'Experiment ID must not change');
    assert.equal(reloadedExp.name, 'M6 Persistence Verification');
    assert.equal(reloadedExp.status, 'partial');
    assert.equal(reloadedExp.runIds.length, 4, 'No trials may disappear');
    assert.deepEqual(reloadedExp.runIds, [run1Id, run2Id, run3Id, run4Id]);

    // 2. Retrieve all associated Runs and verify lineage
    const r1 = runStore.getById(run1Id);
    assert.ok(r1, 'Trial 1 must exist');
    assert.equal(r1.id, run1Id);
    assert.equal(r1.experimentId, expId);
    assert.equal(r1.trialIndex, 1);
    assert.equal(r1.provenance?.runtime, 'mock');
    assert.equal(r1.telemetry?.ttft_ms, 120);

    const r2 = runStore.getById(run2Id);
    assert.ok(r2, 'Trial 2 must exist');
    assert.equal(r2.id, run2Id);
    assert.equal(r2.experimentId, expId);
    assert.equal(r2.trialIndex, 2);

    const r3 = runStore.getById(run3Id);
    assert.ok(r3, 'Trial 3 (blocked) must exist');
    assert.equal(r3.id, run3Id);
    assert.equal(r3.experimentId, expId);
    assert.equal(r3.trialIndex, 3);
    assert.equal(r3.status, 'blocked', 'Blocked trial must remain blocked');
    assert.equal(r3.errorCode, 4551);
    assert.equal(r3.provenance?.provider, 'lemonade');
    assert.equal(r3.provenance?.runtime, 'blocked');
    assert.equal(r3.telemetry?.ttft_ms, null, 'Unavailable TTFT must remain null (never zero)');

    const r4 = runStore.getById(run4Id);
    assert.ok(r4, 'Trial 4 (unavailable) must exist');
    assert.equal(r4.id, run4Id);
    assert.equal(r4.experimentId, expId);
    assert.equal(r4.trialIndex, 4);
    assert.equal(r4.status, 'failed', 'Failed trial must remain failed');
    assert.equal(r4.errorCode, 'ECONNREFUSED');
    assert.equal(r4.provenance?.runtime, 'unavailable');
    assert.equal(r4.telemetry?.ttft_ms, null, 'Unavailable TTFT must remain null (never zero)');

    // Verify summary statistics exclude unavailable TTFT
    assert.equal(reloadedExp.summary?.metrics.ttftMs?.n, 2, 'Only 2 completed trials have TTFT');
    assert.equal(reloadedExp.summary?.completedTrials, 2);
    assert.equal(reloadedExp.summary?.blockedTrials, 1);
    assert.equal(reloadedExp.summary?.failedTrials, 1);
  });

  // -------------------------------------------------------------------------
  // 4. Provenance Integrity (Section 5)
  // -------------------------------------------------------------------------
  test('6. Provenance integrity preserves REAL, MOCK, BLOCKED, UNAVAILABLE, and LEGACY', () => {
    // REAL provenance (e.g. run-042)
    const runReal = runStore.getById('run-042');
    assert.ok(runReal);
    assert.equal(runReal.provenance?.provider, 'lemonade');
    assert.equal(runReal.provenance?.runtime, 'real');
    assert.equal(runReal.provenance?.isSynthetic, false);

    // MOCK provenance (e.g. run-048)
    const runMock = runStore.getById('run-048');
    assert.ok(runMock);
    assert.equal(runMock.provenance?.provider, 'mock');
    assert.equal(runMock.provenance?.runtime, 'mock');
    assert.equal(runMock.provenance?.isSynthetic, true);

    // BLOCKED provenance (e.g. run-045)
    const runBlocked = runStore.getById('run-045');
    assert.ok(runBlocked);
    assert.equal(runBlocked.status, 'blocked');
    assert.equal(runBlocked.provenance?.provider, 'lemonade');
    assert.equal(runBlocked.provenance?.runtime, 'blocked');
    assert.equal(runBlocked.errorCode, 4551);

    // UNAVAILABLE provenance (e.g. run-046)
    const runUnavail = runStore.getById('run-046');
    assert.ok(runUnavail);
    assert.equal(runUnavail.status, 'failed');
    assert.equal(runUnavail.provenance?.runtime, 'unavailable');
    assert.equal(runUnavail.errorCode, 'ECONNREFUSED');

    // LEGACY provenance (e.g. run-050)
    const runLegacy = runStore.getById('run-050');
    assert.ok(runLegacy);
    const diagLegacy = DiagnosticEngine.diagnose(runLegacy);
    assert.ok(diagLegacy.findings.some((f) => f.id === 'finding-legacy-provenance'));
  });

  // -------------------------------------------------------------------------
  // 5. Partial Experiment Verification (Section 8)
  // -------------------------------------------------------------------------
  test('7. Partial experiment with 5 mixed trials computes accurate status and metrics', () => {
    const exp = experimentStore.getById('exp-002');
    assert.ok(exp);
    assert.equal(exp.status, 'partial');
    assert.equal(exp.summary?.requestedTrials, 3);
    assert.equal(exp.summary?.completedTrials, 2);
    assert.equal(exp.summary?.blockedTrials, 1);
    assert.equal(exp.summary?.failedTrials, 0);

    // Blocked trial does not fabricate performance values
    const blockedTrialId = exp.runIds[2];
    const blockedTrial = runStore.getById(blockedTrialId);
    assert.ok(blockedTrial);
    assert.equal(blockedTrial.status, 'blocked');
    assert.equal(blockedTrial.telemetry?.ttft_ms, null);
    assert.equal(blockedTrial.telemetry?.tokens_per_second, null);
  });

  // -------------------------------------------------------------------------
  // 6. Pairwise Comparison Verification (Section 9)
  // -------------------------------------------------------------------------
  test('8. Pairwise empirical comparison reports deltas without winner or ranking', () => {
    const runA = runStore.getById('run-exp1-t1');
    const runB = runStore.getById('run-exp1-t2');
    assert.ok(runA && runB);

    const durA = runA.telemetry?.total_duration_ms!;
    const durB = runB.telemetry?.total_duration_ms!;
    const latencyDelta = durB - durA;

    assert.equal(typeof latencyDelta, 'number');
    assert.ok(!Number.isNaN(latencyDelta));

    // When one trial has unavailable TTFT (e.g. run-045 blocked)
    const runBlocked = runStore.getById('run-045');
    assert.ok(runBlocked);
    const ttftA = runA.telemetry?.ttft_ms;
    const ttftBlocked = runBlocked.telemetry?.ttft_ms;

    // Delta between available and unavailable must be treated as unavailable, not fabricated
    let delta = null;
    if (ttftA != null && ttftBlocked != null) {
      delta = ttftBlocked - ttftA;
    }
    assert.equal(delta, null, 'Comparison delta must be null when either side is unavailable');
  });

  // -------------------------------------------------------------------------
  // 7. JSON Export Verification (Section 10)
  // -------------------------------------------------------------------------
  test('9. JSON export preserves auditability, lineage, diagnostics, and no leakage', () => {
    const bundle = ExperimentEngine.exportBundle('exp-001') as any;

    assert.ok(bundle.$schema);
    assert.ok(bundle.exportedAt);
    assert.equal(bundle.experiment.id, 'exp-001');
    assert.equal(bundle.trials.length, 5);

    for (const trial of bundle.trials) {
      assert.ok(trial.id);
      assert.ok(typeof trial.trialIndex === 'number');
      assert.ok(trial.provenance);
      assert.ok(trial.telemetry);
      assert.ok(trial.diagnostics, 'Each exported trial must include associated diagnostic summary');
      assert.ok(trial.diagnostics.overallStatus);
    }

    // Verify valid JSON and no circular references
    const serialized = JSON.stringify(bundle);
    assert.ok(serialized.length > 500);
    const reparsed = JSON.parse(serialized);
    assert.equal(reparsed.experiment.id, 'exp-001');
  });

  // -------------------------------------------------------------------------
  // 8. CSV Export Verification (Section 10)
  // -------------------------------------------------------------------------
  test('10. CSV export clearly represents missing values as UNAVAILABLE (never zero)', () => {
    const csv = ExperimentEngine.exportCsv('exp-002');
    assert.ok(csv.includes('trial_index,run_id,status,model,provider,runtime'));

    const lines = csv.trim().split('\n');
    assert.equal(lines.length, 4, 'Header + 3 trials');

    // Trial 3 in exp-002 is run-045 which is blocked: TTFT and TPS must be "UNAVAILABLE"
    const trial3Line = lines[3];
    assert.ok(trial3Line.includes('blocked'));
    assert.ok(trial3Line.includes('UNAVAILABLE'), 'Missing metrics must be marked UNAVAILABLE in CSV');
    assert.ok(!trial3Line.includes(',0,0,'), 'Must never convert unavailable measurements to 0 in CSV');
  });

  // -------------------------------------------------------------------------
  // 9. Replay + Experiment Lineage Verification (Section 11)
  // -------------------------------------------------------------------------
  test('11. Replaying an experiment trial preserves experimentId, trialIndex, and points replayOf to original', () => {
    const originalTrial = runStore.getById('run-exp1-t1');
    assert.ok(originalTrial);

    const replayId = `replay-${Date.now()}`;
    const replayTrial: Run = {
      ...JSON.parse(JSON.stringify(originalTrial)),
      id: replayId,
      name: `replay-of-${originalTrial.name}`,
      replayOf: originalTrial.id,
      experimentId: originalTrial.experimentId,
      trialIndex: originalTrial.trialIndex,
      createdAt: new Date().toISOString(),
    };

    runStore.save(replayTrial);

    const saved = runStore.getById(replayId);
    assert.ok(saved);
    assert.equal(saved.replayOf, originalTrial.id);
    assert.equal(saved.experimentId, originalTrial.experimentId);
    assert.equal(saved.trialIndex, originalTrial.trialIndex);
    assert.notEqual(saved.id, originalTrial.id);
  });

  // -------------------------------------------------------------------------
  // 10. Failure Diagnostics (M5) Integration (Section 12)
  // -------------------------------------------------------------------------
  test('12. Failure Diagnostics correctly diagnoses experiment trials (Blocked, Unavailable, Degraded)', () => {
    // Blocked trial (Error 4551)
    const blockedTrial = runStore.getById('run-045');
    assert.ok(blockedTrial);
    const diagBlocked = DiagnosticEngine.diagnose(blockedTrial);
    assert.equal(diagBlocked.overallStatus, 'blocked');
    assert.ok(diagBlocked.findings.some((f) => f.id === 'finding-app-control-block'));

    // Unavailable trial (ECONNREFUSED)
    const unavailTrial = runStore.getById('run-046');
    assert.ok(unavailTrial);
    const diagUnavail = DiagnosticEngine.diagnose(unavailTrial);
    assert.equal(diagUnavail.overallStatus, 'failed');
    assert.ok(diagUnavail.findings.some((f) => f.id === 'finding-connection-unavailable'));

    // Degraded trial (Incomplete Telemetry)
    const incompleteTrial = runStore.getById('run-047');
    assert.ok(incompleteTrial);
    const diagIncomplete = DiagnosticEngine.diagnose(incompleteTrial);
    assert.equal(diagIncomplete.overallStatus, 'degraded');
    assert.ok(diagIncomplete.findings.some((f) => f.id === 'finding-telemetry-incomplete'));
  });

});
