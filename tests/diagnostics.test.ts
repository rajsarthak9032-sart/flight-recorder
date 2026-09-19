/**
 * Automated Test Suite for Milestone 5: Failure Diagnostics
 * Covers all 8 mandatory test cases specified in the requirements.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DiagnosticEngine } from '../local-agent/src/diagnostics/engine.ts';
import { runStore } from '../local-agent/src/runs/store.ts';

describe('Milestone 5: Failure Diagnostics Test Suite', () => {
  // Test 1: Blocked Lemonade (Windows Application Control Error 4551)
  test('Test 1: Blocked Lemonade (Windows Application Control, Error 4551)', () => {
    const run = runStore.getById('run-045');
    assert.ok(run, 'Run #045 should exist in store');

    const diag = DiagnosticEngine.diagnose(run);
    assert.equal(diag.overallStatus, 'blocked');
    assert.equal(diag.stageAtFailure, 'model_runtime');

    const blockFinding = diag.findings.find((f) => f.id === 'finding-app-control-block');
    assert.ok(blockFinding, 'Should identify Windows Application Control block finding');
    assert.equal(blockFinding.severity, 'error');
    assert.equal(blockFinding.category, 'runtime');
    assert.match(blockFinding.title, /blocked/i);
    assert.match(blockFinding.summary, /application-control/i);

    // Verify next inspection guidance does NOT contain bypass instructions
    assert.ok(blockFinding.nextInspection, 'Should provide next inspection guidance');
    assert.match(blockFinding.nextInspection, /administrator/i);
    assert.doesNotMatch(blockFinding.nextInspection, /disable|bypass|workaround/i);

    // Verify evidence
    assert.ok(blockFinding.evidence.length >= 2, 'Should include concrete recorded evidence');
    const errEv = blockFinding.evidence.find((e) => e.field === 'errorMessage' || e.field === 'message');
    assert.ok(errEv, 'Should reference error message');
    assert.match(String(errEv.value), /4551/);
  });

  // Test 2: Lemonade runtime unavailable (ECONNREFUSED)
  test('Test 2: Lemonade unavailable (connection refused, ECONNREFUSED)', () => {
    const run = runStore.getById('run-046');
    assert.ok(run, 'Run #046 should exist in store');

    const diag = DiagnosticEngine.diagnose(run);
    assert.equal(diag.overallStatus, 'failed');

    const connFinding = diag.findings.find((f) => f.id === 'finding-connection-unavailable');
    assert.ok(connFinding, 'Should identify connection failure finding');
    assert.equal(connFinding.severity, 'error');
    assert.equal(connFinding.category, 'connection');
    assert.match(connFinding.title, /unavailable/i);
    assert.match(connFinding.summary, /could not establish communication/i);

    // Verify evidence cites recorded port and error
    const portEv = connFinding.evidence.find((e) => e.field === 'port');
    assert.ok(portEv, 'Should cite recorded port');
    assert.equal(portEv.value, 8899);

    const errEv = connFinding.evidence.find((e) => e.field === 'errorMessage');
    assert.ok(errEv, 'Should cite ECONNREFUSED error message');
    assert.match(String(errEv.value), /ECONNREFUSED/);
  });

  // Test 3: Successful run (Nominal real run)
  test('Test 3: Successful run (nominal real run, no failure detected)', () => {
    const run = runStore.getById('run-042');
    assert.ok(run, 'Run #042 should exist in store');

    const diag = DiagnosticEngine.diagnose(run);
    assert.equal(diag.overallStatus, 'healthy');
    assert.equal(diag.findings.length, 1);
    assert.equal(diag.findings[0].id, 'finding-healthy-run');
    assert.equal(diag.findings[0].severity, 'info');
    assert.match(diag.findings[0].title, /No failure detected/i);
    assert.match(diag.observableSummary, /nominal/i);
  });

  // Test 4: Incomplete telemetry (Completed run with missing TTFT/TPS)
  test('Test 4: Incomplete telemetry (completed run with missing TTFT/TPS)', () => {
    const run = runStore.getById('run-047');
    assert.ok(run, 'Run #047 should exist in store');

    const diag = DiagnosticEngine.diagnose(run);
    assert.equal(diag.overallStatus, 'degraded');

    const telemFinding = diag.findings.find((f) => f.id === 'finding-telemetry-incomplete');
    assert.ok(telemFinding, 'Should identify telemetry incomplete finding');
    assert.equal(telemFinding.severity, 'warning');
    assert.equal(telemFinding.category, 'telemetry');
    assert.match(telemFinding.title, /incomplete telemetry/i);

    // Metrics integrity: must NEVER treat unavailable as 0
    assert.equal(run.telemetry?.ttft_ms, null);
    assert.equal(run.telemetry?.tokens_per_second, null);
    assert.notEqual(run.telemetry?.ttft_ms, 0);
    assert.notEqual(run.telemetry?.tokens_per_second, 0);

    // Verify unavailable fields list
    assert.ok(diag.unavailableFields?.includes('ttft_ms'));
    assert.ok(diag.unavailableFields?.includes('tokens_per_second'));
  });

  // Test 5: Mock provenance
  test('Test 5: Mock provenance (synthetic run identified as mock, never masked)', () => {
    const run = runStore.getById('run-048');
    assert.ok(run, 'Run #048 should exist in store');

    const diag = DiagnosticEngine.diagnose(run);
    const mockFinding = diag.findings.find((f) => f.id === 'finding-mock-synthetic');
    assert.ok(mockFinding, 'Should detect synthetic mock provenance');
    assert.equal(mockFinding.severity, 'info');
    assert.equal(mockFinding.category, 'configuration');
    assert.match(mockFinding.title, /Synthetic execution/i);
    assert.match(mockFinding.summary, /deterministic mock provider/i);

    // Provenance integrity
    assert.equal(run.provenance?.provider, 'mock');
    assert.equal(run.provenance?.runtime, 'mock');
    assert.equal(run.provenance?.isSynthetic, true);
  });

  // Test 6: Insufficient diagnostic evidence
  test('Test 6: Insufficient diagnostic evidence (failed run lacking error trace/events)', () => {
    const run = runStore.getById('run-049');
    assert.ok(run, 'Run #049 should exist in store');

    const diag = DiagnosticEngine.diagnose(run);
    assert.equal(diag.overallStatus, 'insufficient-data');

    const insuffFinding = diag.findings.find((f) => f.id === 'finding-insufficient-data');
    assert.ok(insuffFinding, 'Should identify insufficient diagnostic evidence');
    assert.equal(insuffFinding.severity, 'warning');
    assert.equal(insuffFinding.category, 'unknown');
    assert.match(insuffFinding.title, /Insufficient diagnostic evidence/i);
    assert.match(insuffFinding.nextInspection, /verbose Flight Recorder/i);
  });

  // Test 7: Evidence integrity (Findings reference real recorded fields and values)
  test('Test 7: Evidence integrity (findings contain valid fields, sources, and event IDs)', () => {
    const run = runStore.getById('run-045');
    const diag = DiagnosticEngine.diagnose(run);

    for (const finding of diag.findings) {
      assert.ok(finding.id, 'Finding must have an id');
      assert.ok(finding.title, 'Finding must have a title');
      assert.ok(finding.summary, 'Finding must have a summary');
      assert.ok(Array.isArray(finding.evidence), 'Finding must have an evidence array');

      for (const ev of finding.evidence) {
        assert.ok(
          ['run', 'event', 'metric', 'provenance', 'runtime', 'hardware'].includes(ev.source),
          `Evidence source "${ev.source}" must be valid`
        );
        assert.ok(ev.field, 'Evidence must state the recorded field');
        assert.ok(ev.description, 'Evidence must provide a factual description');
        if (ev.source === 'event' && ev.eventId) {
          const matchedEvent = run?.events?.find((e) => e.id === ev.eventId);
          assert.ok(matchedEvent, `Event ID "${ev.eventId}" must exist in run's recorded events`);
        }
      }
    }
  });

  // Test 8: Legacy run (Historical run without provenance)
  test('Test 8: Legacy run (historical run without provenance remains unclassified)', () => {
    const run = runStore.getById('run-050');
    assert.ok(run, 'Run #050 should exist in store');
    assert.equal(run.provenance, undefined, 'Legacy run has no provenance object');

    const diag = DiagnosticEngine.diagnose(run);
    const legacyFinding = diag.findings.find((f) => f.id === 'finding-legacy-provenance');
    assert.ok(legacyFinding, 'Should tag historical run with legacy finding');
    assert.match(legacyFinding.title, /lacking modern provenance/i);
    assert.match(legacyFinding.summary, /cannot be determined/i);
  });
});
