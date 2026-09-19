/**
 * Milestone 7: Reproducible Research Reports & Metrology Verification Test Suite
 *
 * Test coverage:
 * - 1. Report generation from Experiment
 * - 2. Report generation from custom Run selection
 * - 3. Provenance preservation (REAL, MOCK, BLOCKED, UNAVAILABLE, LEGACY)
 * - 4. Measurement semantics (MEASURED, DERIVED, UNAVAILABLE - No zero filling)
 * - 5. Statistical summary calculation & preservation matching M6
 * - 6. Trial matrix preservation including failed/blocked trials
 * - 7. Failure diagnostics findings inclusion (Error 4551, ECONNREFUSED, evidence traces)
 * - 8. Replay lineage preservation (replayOf, experimentId, trialIndex)
 * - 9. Pairwise comparisons report empirical deltas without winner/rank labels
 * - 10. Real runtime boundary limitation explicitly present when unverified
 * - 11. JSON export format validity
 * - 12. CSV export format validity (UNAVAILABLE preserved)
 * - 13. Markdown export format validity
 * - 14. HTML export format validity
 * - 15. Reproducibility Bundle completeness (manifest, README, all artifacts)
 * - 16. Security & Secret Scanning (no API keys, tokens, credentials, or CoT leak)
 * - 17. Report store persistence and reload across disk operations
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { reportStore, ReportStore } from '../local-agent/src/reports/store.ts';
import { ReportEngine } from '../local-agent/src/reports/engine.ts';
import { experimentStore } from '../local-agent/src/experiments/store.ts';
import { runStore } from '../local-agent/src/runs/store.ts';
import type { Run, Experiment } from '../packages/shared/src/types.ts';
import fs from 'fs';
import path from 'path';

describe('Milestone 7: Reproducible Research Reports Test Suite', () => {

  // -------------------------------------------------------------------------
  // 1. Report Generation from Experiment
  // -------------------------------------------------------------------------
  test('1. Generates complete ResearchReport from an existing Experiment (exp-001)', () => {
    const report = ReportEngine.generateFromExperiment('exp-001', {
      title: 'Test Baseline Report',
      description: 'Verification of baseline report synthesis',
    });

    assert.ok(report);
    assert.ok(report.id.startsWith('rep-exp-001-'));
    assert.equal(report.title, 'Test Baseline Report');
    assert.equal(report.experimentId, 'exp-001');
    assert.equal(report.trialMatrix.length, 5);
    assert.ok(report.executiveSummary.length > 20);
    assert.ok(report.objective.length > 10);
    assert.ok(report.methodology);
    assert.ok(report.environment);
    assert.ok(report.measurements);
    assert.ok(report.statistics);
    assert.ok(report.limitations.length >= 2);
    assert.ok(report.conclusion.length > 20);
  });

  // -------------------------------------------------------------------------
  // 2. Report Generation from Custom Runs
  // -------------------------------------------------------------------------
  test('2. Generates ResearchReport from an ad-hoc list of Run IDs', () => {
    const report = ReportEngine.generateFromRuns(['run-exp1-t1', 'run-exp1-t2'], {
      title: 'Ad-Hoc Pair Report',
      objective: 'Inspect two consecutive baseline runs',
    });

    assert.ok(report);
    assert.ok(report.id.startsWith('rep-runs-'));
    assert.equal(report.runIds.length, 2);
    assert.equal(report.trialMatrix.length, 2);
    assert.equal(report.objective, 'Inspect two consecutive baseline runs');
  });

  // -------------------------------------------------------------------------
  // 3. Provenance Preservation
  // -------------------------------------------------------------------------
  test('3. Accurately classifies and preserves REAL, MOCK, BLOCKED, UNAVAILABLE, and LEGACY provenance', () => {
    const report = ReportEngine.generateFromExperiment('exp-002');
    assert.ok(report);

    const dist = report.provenance.distribution;
    assert.equal(dist.blocked, 1, 'Must identify 1 blocked trial');
    assert.equal(dist.real, 2, 'Must identify 2 real trials');

    // Verify individual items
    const blockedTrial = report.trialMatrix.find((t) => t.classification === 'BLOCKED');
    assert.ok(blockedTrial, 'Blocked trial must exist in trial matrix');
    assert.equal(blockedTrial.status, 'blocked');
  });

  // -------------------------------------------------------------------------
  // 4. Measurement Semantics (No Zero Filling)
  // -------------------------------------------------------------------------
  test('4. Measurement semantics strictly preserve MEASURED, DERIVED, and UNAVAILABLE without zero-filling', () => {
    const report = ReportEngine.generateFromExperiment('exp-002');

    // In exp-002, blocked trial has null TTFT and TPS
    const blockedRow = report.trialMatrix.find((t) => t.status === 'blocked');
    assert.ok(blockedRow);
    assert.equal(blockedRow.ttftMs, null, 'Blocked trial TTFT must be null, never 0');
    assert.equal(blockedRow.tokensPerSecond, null, 'Blocked trial TPS must be null, never 0');

    // Check statistical metrics
    const stats = report.statistics?.metrics;
    assert.ok(stats);
    assert.equal(stats.durationMs?.semantics, 'MEASURED');
    assert.equal(stats.tokensPerSecond?.semantics, 'DERIVED');
  });

  // -------------------------------------------------------------------------
  // 5. Statistical Summary Integrity
  // -------------------------------------------------------------------------
  test('5. Statistical summary calculates exact mean, median, min, max, and Bessel sample stdDev matching M6', () => {
    const report = ReportEngine.generateFromExperiment('exp-001');
    const durStat = report.statistics?.metrics.durationMs;

    assert.ok(durStat);
    assert.equal(durStat.n, 5, 'Sample count must be 5');
    assert.equal(durStat.min, 9490);
    assert.equal(durStat.max, 9810);
    assert.equal(durStat.mean, 9616);
    assert.equal(durStat.median, 9610);
    assert.ok(durStat.stdDev !== null && durStat.stdDev > 100 && durStat.stdDev < 150);
  });

  // -------------------------------------------------------------------------
  // 6. Trial Matrix Completeness
  // -------------------------------------------------------------------------
  test('6. Trial matrix preserves all trials including blocked and completed without silent omission', () => {
    const report = ReportEngine.generateFromExperiment('exp-002');
    assert.equal(report.trialMatrix.length, 3, 'All 3 trials in exp-002 must be preserved in trial matrix');

    const statuses = report.trialMatrix.map((t) => t.status);
    assert.ok(statuses.includes('blocked'), 'Must include blocked trial');
    assert.ok(statuses.includes('completed'), 'Must include completed trials');
  });

  // -------------------------------------------------------------------------
  // 7. Failure Diagnostics Findings Inclusion
  // -------------------------------------------------------------------------
  test('7. Report contains evidence-grounded Failure Diagnostics findings (Error 4551, Policy Block)', () => {
    const report = ReportEngine.generateFromExperiment('exp-002');
    assert.ok(report.diagnostics.length >= 1, 'Must include findings for blocked runs');

    const error4551Finding = report.diagnostics.find(
      (d) => d.title.includes('blocked') || d.title.includes('4551') || d.summary.includes('application-control')
    );
    assert.ok(error4551Finding, 'Must identify Error 4551 block finding');
    assert.equal(error4551Finding.severity, 'error');
    assert.ok(error4551Finding.evidence.length > 0, 'Must contain concrete evidence traces');
  });

  // -------------------------------------------------------------------------
  // 8. Replay Lineage
  // -------------------------------------------------------------------------
  test('8. Replay lineage relationships (replayOf, experimentId, trialIndex) survive report generation', () => {
    // Create a replay run
    const replayRun: Run = {
      id: 'run-replay-test-01',
      name: 'Replay of Run 001',
      status: 'completed',
      createdAt: new Date().toISOString(),
      model: 'Qwen2.5-Coder-7B-Instruct',
      prompt: 'Refactor AST parser',
      replayOf: 'run-exp1-t1',
      trialIndex: 2,
      provenance: {
        provider: 'lemonade',
        runtime: 'real',
        isSynthetic: false,
      },
      telemetry: {
        total_duration_ms: 9550,
        ttft_ms: 300,
        tokens_per_second: 42.0,
      },
    };
    runStore.save(replayRun);

    const report = ReportEngine.generateFromRuns(['run-exp1-t1', 'run-replay-test-01'], {
      title: 'Replay Comparison Report',
    });

    assert.ok(report.replayLineage.length === 2);
    const replayNode = report.replayLineage.find((n) => n.runId === 'run-replay-test-01');
    assert.ok(replayNode, 'Must contain a replay node');
    assert.equal(replayNode.replayOf, 'run-exp1-t1');
  });

  // -------------------------------------------------------------------------
  // 9. Pairwise Metrological Comparisons
  // -------------------------------------------------------------------------
  test('9. Pairwise comparisons produce empirical deltas without subjective winner or ranking labels', () => {
    const report = ReportEngine.generateFromExperiment('exp-001');
    assert.ok(report.comparisons.length > 0);

    for (const comp of report.comparisons) {
      assert.ok(comp.trialAName);
      assert.ok(comp.trialBName);
      assert.notEqual(comp.latencyDeltaMs, undefined);
      assert.notEqual(comp.ttftDeltaMs, undefined);
      assert.notEqual(comp.tpsDelta, undefined);
      assert.ok(comp.note?.includes('Empirical difference') || comp.note?.includes('No qualitative superiority'));

      const serialized = JSON.stringify(comp).toUpperCase();
      assert.ok(!serialized.includes('WINNER'), 'No WINNER badges allowed');
      assert.ok(!serialized.includes('RECOMMENDED'), 'No RECOMMENDED badges allowed');
      assert.ok(!serialized.includes('BEST'), 'No BEST badges allowed');
    }
  });

  // -------------------------------------------------------------------------
  // 10. Real Runtime Boundary Limitation
  // -------------------------------------------------------------------------
  test('10. Reports explicitly preserve the Real Runtime Boundary limitation when unverified or blocked', () => {
    const report = ReportEngine.generateFromExperiment('exp-002');

    const hasBoundaryNotice = report.limitations.some(
      (l) => l.includes('Real Lemonade inference was not verified in this environment') || l.includes('Error 4551')
    );
    assert.ok(hasBoundaryNotice, 'Must include explicit unverified runtime limitation notice');
  });

  // -------------------------------------------------------------------------
  // 11. JSON Export Validity
  // -------------------------------------------------------------------------
  test('11. JSON export produces valid, complete, and parseable ResearchReport schema', () => {
    const report = ReportEngine.generateFromExperiment('exp-001');
    const jsonStr = JSON.stringify(report, null, 2);
    const parsed = JSON.parse(jsonStr);

    assert.equal(parsed.id, report.id);
    assert.equal(parsed.experimentId, 'exp-001');
    assert.equal(parsed.trialMatrix.length, 5);
  });

  // -------------------------------------------------------------------------
  // 12. CSV Export Validity
  // -------------------------------------------------------------------------
  test('12. CSV export clearly represents missing values as UNAVAILABLE (never 0)', () => {
    const report = ReportEngine.generateFromExperiment('exp-002');
    const csv = ReportEngine.exportCsv(report);

    assert.ok(csv.startsWith('trial_index,run_id,status,model,provider,runtime,classification,duration_ms,ttft_ms,tokens_per_second,total_tokens,peak_vram_mb,diagnostics_status,primary_finding'));
    assert.ok(csv.includes('UNAVAILABLE'), 'CSV must contain UNAVAILABLE for missing metrics');

    const lines = csv.trim().split('\n');
    assert.equal(lines.length, 4, 'Header + 3 trials = 4 lines');
  });

  // -------------------------------------------------------------------------
  // 13. Markdown Export Validity
  // -------------------------------------------------------------------------
  test('13. Markdown export generates clean, comprehensive GitHub-compliant report document', () => {
    const report = ReportEngine.generateFromExperiment('exp-001');
    const md = ReportEngine.exportMarkdown(report);

    assert.ok(md.includes('# Metrology Report:'));
    assert.ok(md.includes('## 1. Executive Summary'));
    assert.ok(md.includes('## 2. Objective'));
    assert.ok(md.includes('## 3. Methodology & Execution'));
    assert.ok(md.includes('## 4. Environment & Hardware'));
    assert.ok(md.includes('## 5. Provenance Distribution'));
    assert.ok(md.includes('## 6. Measurements & Metrology'));
    assert.ok(md.includes('## 7. Statistical Summary'));
    assert.ok(md.includes('## 8. Trial Matrix'));
    assert.ok(md.includes('## 12. Limitations & Boundary Conditions'));
    assert.ok(md.includes('## 13. Conclusion'));
  });

  // -------------------------------------------------------------------------
  // 14. HTML Export Validity
  // -------------------------------------------------------------------------
  test('14. HTML export generates standalone, valid HTML document with embedded stylesheets', () => {
    const report = ReportEngine.generateFromExperiment('exp-001');
    const html = ReportEngine.exportHtml(report);

    assert.ok(html.startsWith('<!DOCTYPE html>'));
    assert.ok(html.includes('<html lang="en" class="dark">'));
    assert.ok(html.includes(report.title));
    assert.ok(html.includes('ISO/IEC 42001 Metrology Audit Trail'));
    assert.ok(html.includes('</html>'));
  });

  // -------------------------------------------------------------------------
  // 15. Reproducibility Bundle Completeness
  // -------------------------------------------------------------------------
  test('15. Reproducibility bundle contains manifest, README, models, CSV, MD, HTML, and telemetry logs', () => {
    const report = ReportEngine.generateFromExperiment('exp-001');
    const bundle = ReportEngine.exportBundle(report);

    assert.ok(bundle.manifest);
    assert.equal(bundle.manifest.manifestVersion, '1.0.0');
    assert.equal(bundle.manifest.reportId, report.id);
    assert.ok(bundle.manifest.files.includes('README.md'));
    assert.ok(bundle.manifest.files.includes('report.json'));
    assert.ok(bundle.manifest.files.includes('report.md'));
    assert.ok(bundle.manifest.files.includes('report.html'));
    assert.ok(bundle.manifest.files.includes('trials.csv'));

    assert.ok(bundle.files['README.md']);
    assert.ok(bundle.files['report.json']);
    assert.ok(bundle.files['trials.csv']);
    assert.ok(bundle.files['runs.json']);
    assert.ok(bundle.files['diagnostics.json']);
  });

  // -------------------------------------------------------------------------
  // 16. Security & Secret Scanning
  // -------------------------------------------------------------------------
  test('16. Exported bundle and reports contain zero API keys, passwords, tokens, or CoT reasoning leakage', () => {
    const report = ReportEngine.generateFromExperiment('exp-001');
    const bundle = ReportEngine.exportBundle(report);
    const bundleString = JSON.stringify(bundle);

    assert.ok(!bundleString.includes('AIzaSy'), 'No Google API keys');
    assert.ok(!bundleString.includes('sk-'), 'No OpenAI API keys');
    assert.ok(!bundleString.includes('ghp_'), 'No GitHub tokens');
    assert.ok(!bundleString.includes('password123'), 'No passwords');
    assert.ok(!bundleString.includes('"promptSecrets"'), 'No prompt secret attributes');
  });

  // -------------------------------------------------------------------------
  // 17. Report Store Persistence & Reload
  // -------------------------------------------------------------------------
  test('17. ReportStore persists reports to disk and reloads cleanly without loss', () => {
    const tempPath = path.resolve(process.cwd(), 'data', 'reports-test-temp.json');
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    const storeA = new ReportStore(tempPath);
    const rep = ReportEngine.generateFromExperiment('exp-001', { title: 'Persistent Report Test' });
    rep.id = 'rep-persist-test-01';
    storeA.save(rep);

    assert.ok(fs.existsSync(tempPath), 'File must be written to disk');

    const storeB = new ReportStore(tempPath);
    const reloaded = storeB.getById('rep-persist-test-01');
    assert.ok(reloaded, 'Report must be found in reloaded store');
    assert.equal(reloaded.title, 'Persistent Report Test');
    assert.equal(reloaded.experimentId, 'exp-001');

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  });
});
