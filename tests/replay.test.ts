/**
 * Automated Test Suite for Milestone 4: Replay Lab Regression & Provenance Integrity
 * Verifies that replaying runs creates distinct, lineage-preserving runs without altering originals.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { runStore } from '../local-agent/src/runs/store.ts';
import { DiagnosticEngine } from '../local-agent/src/diagnostics/engine.ts';

describe('Milestone 4: Replay Lab Regression & Lineage Test Suite', () => {

  // Test 1: Replay creates distinct run and keeps original unchanged
  test('Test 1: Replay creates a distinct Run and leaves original Run intact', () => {
    const original = runStore.getById('run-042');
    assert.ok(original, 'Original run-042 must exist');
    const originalJson = JSON.stringify(original);

    // Simulate Replay
    const replayId = `replay-test-042-${Date.now()}`;
    const replayRun: Run = {
      ...JSON.parse(JSON.stringify(original)),
      id: replayId,
      name: `replay-of-${original.name}`,
      replayOf: original.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    if (replayRun.events) {
      replayRun.events = replayRun.events.map((evt, idx) => ({
        ...evt,
        id: `evt-${replayId}-${idx + 1}`,
        runId: replayId,
      }));
    }

    runStore.save(replayRun);

    // Verify original is untouched
    const afterOriginal = runStore.getById('run-042');
    assert.equal(JSON.stringify(afterOriginal), originalJson, 'Original run must not be mutated');

    // Verify replay run has distinct ID and points to original
    const retrievedReplay = runStore.getById(replayId);
    assert.ok(retrievedReplay, 'Replay run must be retrieved from store');
    assert.equal(retrievedReplay.id, replayId);
    assert.equal(retrievedReplay.replayOf, original.id);
  });

  // Test 2: Replay Run has its own independent events
  test('Test 2: Replay Run generates independent events referencing its own runId', () => {
    const original = runStore.getById('run-045');
    assert.ok(original);

    const replayId = `replay-events-${Date.now()}`;
    const replayRun: Run = {
      ...JSON.parse(JSON.stringify(original)),
      id: replayId,
      name: `replay-of-${original.name}`,
      replayOf: original.id,
      createdAt: new Date().toISOString(),
      events: original.events ? original.events.map((evt, idx) => ({
        ...evt,
        id: `evt-${replayId}-${idx + 1}`,
        runId: replayId,
      })) : [],
    };

    runStore.save(replayRun);

    const saved = runStore.getById(replayId);
    assert.ok(saved?.events && saved.events.length > 0);
    for (const evt of saved.events) {
      assert.equal(evt.runId, replayId, 'Each event must reference the replay run ID');
      assert.ok(evt.id.startsWith(`evt-${replayId}`), 'Event ID must be prefixed with replay ID');
    }
  });

  // Test 3: Blocked replay preserves blocked provenance & diagnostics
  test('Test 3: Blocked run replay preserves blocked provenance and Error 4551 diagnostic', () => {
    const original = runStore.getById('run-045');
    assert.ok(original);
    assert.equal(original.status, 'blocked');

    const replayId = `replay-blocked-${Date.now()}`;
    const replayRun: Run = {
      ...JSON.parse(JSON.stringify(original)),
      id: replayId,
      name: `replay-of-${original.name}`,
      replayOf: original.id,
      createdAt: new Date().toISOString(),
    };

    runStore.save(replayRun);
    const saved = runStore.getById(replayId);
    assert.ok(saved);
    assert.equal(saved.status, 'blocked');
    assert.equal(saved.provenance?.provider, 'lemonade');
    assert.equal(saved.provenance?.runtime, 'blocked');

    const diag = DiagnosticEngine.diagnose(saved);
    assert.equal(diag.overallStatus, 'blocked');
    const finding = diag.findings.find(f => f.id === 'finding-app-control-block');
    assert.ok(finding, 'Must preserve Error 4551 Application Control finding');
  });

  // Test 4: Unavailable run replay preserves unavailable semantics
  test('Test 4: Unavailable run replay preserves ECONNREFUSED and unavailable semantics', () => {
    const original = runStore.getById('run-046');
    assert.ok(original);
    assert.equal(original.status, 'failed');

    const replayId = `replay-unavail-${Date.now()}`;
    const replayRun: Run = {
      ...JSON.parse(JSON.stringify(original)),
      id: replayId,
      name: `replay-of-${original.name}`,
      replayOf: original.id,
      createdAt: new Date().toISOString(),
    };

    runStore.save(replayRun);
    const saved = runStore.getById(replayId);
    assert.ok(saved);
    assert.equal(saved.status, 'failed');
    assert.equal(saved.errorCode, 'ECONNREFUSED');
    assert.equal(saved.provenance?.runtime, 'unavailable');

    const diag = DiagnosticEngine.diagnose(saved);
    assert.equal(diag.overallStatus, 'failed');
    assert.ok(diag.findings.some(f => f.id === 'finding-connection-unavailable'));
  });

  // Test 5: Synthetic mock replay remains explicitly mock
  test('Test 5: Synthetic mock run replay remains explicitly mock without real silicon claims', () => {
    const original = runStore.getById('run-048');
    assert.ok(original);

    const replayId = `replay-mock-${Date.now()}`;
    const replayRun: Run = {
      ...JSON.parse(JSON.stringify(original)),
      id: replayId,
      name: `replay-of-${original.name}`,
      replayOf: original.id,
      createdAt: new Date().toISOString(),
    };

    runStore.save(replayRun);
    const saved = runStore.getById(replayId);
    assert.ok(saved);
    assert.equal(saved.provenance?.provider, 'mock');
    assert.equal(saved.provenance?.runtime, 'mock');
    assert.equal(saved.provenance?.isSynthetic, true);
  });

  // Test 6: Replay persistence survives reload
  test('Test 6: Replay runs survive store reload from disk', () => {
    const replayId = `replay-persist-${Date.now()}`;
    const replayRun: Run = {
      id: replayId,
      name: 'replay-persistence-check',
      status: 'completed',
      model: 'Qwen2.5-Coder-7B-Instruct',
      prompt: 'Verify persistence survives disk reload',
      replayOf: 'run-042',
      createdAt: new Date().toISOString(),
      provenance: {
        provider: 'lemonade',
        runtime: 'real',
        isSynthetic: false,
      },
      telemetry: {
        total_duration_ms: 9500,
        ttft_ms: 305,
        tokens_per_second: 43.1,
        total_tokens: 2250,
        measuredFields: ['total_duration_ms', 'ttft_ms', 'tokens_per_second', 'total_tokens'],
        unavailableFields: [],
      },
    };

    runStore.save(replayRun);
    assert.ok(runStore.getById(replayId));

    // Reload from disk
    runStore.reload();
    const reloaded = runStore.getById(replayId);
    assert.ok(reloaded, 'Replay run must exist after reload');
    assert.equal(reloaded.id, replayId);
    assert.equal(reloaded.replayOf, 'run-042');
    assert.equal(reloaded.telemetry?.ttft_ms, 305);
  });

});
