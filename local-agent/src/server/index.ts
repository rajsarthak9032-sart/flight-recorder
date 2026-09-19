/**
 * Local Agent Server Module
 * Milestone 6: Local API endpoints for Runs, Diagnostics, Experiments, Benchmarking & Telemetry
 */

import { Router } from 'express';
import { runStore } from '../runs/store.ts';
import { DiagnosticEngine } from '../diagnostics/engine.ts';
import { lemonadeClient } from '../lemonade/client.ts';
import { HardwareService } from '../hardware/service.ts';
import { experimentStore } from '../experiments/store.ts';
import { ExperimentEngine } from '../experiments/engine.ts';
import { InferenceExecutor } from '../runs/executor.ts';
import { reportStore } from '../reports/store.ts';
import { ReportEngine } from '../reports/engine.ts';
import type { Run, Experiment, ExperimentWorkload, ExperimentConfiguration, ResearchReport } from '../../../packages/shared/src/types.ts';

export function createAgentRouter(): Router {
  const router = Router();

  // 1. Health & Server Status
  router.get('/health', async (_req, res) => {
    const serverStatus = await lemonadeClient.probeServer();
    const runtimeStatus = await lemonadeClient.probeRuntime();
    const hardware = HardwareService.getSnapshot();

    res.json({
      status: 'ok',
      version: '1.4.2',
      server: serverStatus,
      runtime: runtimeStatus,
      hardware,
    });
  });

  // 2. Runs List with Diagnostics summary
  router.get('/runs', (_req, res) => {
    const runs = runStore.getAll();
    const summarized = runs.map((r) => {
      const diagnostics = DiagnosticEngine.diagnose(r);
      return {
        id: r.id,
        name: r.name,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        model: r.model,
        experimentId: r.experimentId,
        trialIndex: r.trialIndex,
        replayOf: r.replayOf,
        provenance: r.provenance,
        telemetry: r.telemetry,
        diagnosticsSummary: {
          overallStatus: diagnostics.overallStatus,
          findingsCount: diagnostics.findings.length,
          observableSummary: diagnostics.observableSummary,
          primaryFinding: diagnostics.findings[0]?.title ?? 'No failure detected',
        },
      };
    });
    res.json({ runs: summarized });
  });

  // 3. Single Run with Full Details
  router.get('/runs/:id', (req, res) => {
    const run = runStore.getById(req.params.id);
    if (!run) {
      res.status(404).json({ error: `Run "${req.params.id}" not found` });
      return;
    }
    const diagnostics = DiagnosticEngine.diagnose(run);
    res.json({ run, diagnostics });
  });

  // 4. Run Diagnostics Endpoint
  router.get('/runs/:id/diagnostics', (req, res) => {
    const run = runStore.getById(req.params.id);
    if (!run) {
      res.status(404).json({ error: `Run "${req.params.id}" not found` });
      return;
    }
    const diagnostics = DiagnosticEngine.diagnose(run);
    res.json(diagnostics);
  });

  // 5. Run Events Endpoint
  router.get('/runs/:id/events', (req, res) => {
    const run = runStore.getById(req.params.id);
    if (!run) {
      res.status(404).json({ error: `Run "${req.params.id}" not found` });
      return;
    }
    res.json({ events: run.events ?? [] });
  });

  // 6. Create / Dispatch New Run (Through Authoritative InferenceExecutor)
  router.post('/runs', async (req, res) => {
    try {
      const { model, prompt, provider = 'lemonade', experimentId, trialIndex } = req.body || {};
      const run = await InferenceExecutor.execute({
        model: model || 'Qwen2.5-Coder-7B-Instruct',
        prompt: prompt || 'User interactive probe run',
        provider: provider === 'mock' ? 'mock' : 'lemonade',
        experimentId,
        trialIndex,
      });

      const diagnostics = DiagnosticEngine.diagnose(run);
      res.status(201).json({ run, diagnostics });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution error' });
    }
  });

  // 7. Replay Run
  router.post('/runs/:id/replay', (req, res) => {
    const original = runStore.getById(req.params.id);
    if (!original) {
      res.status(404).json({ error: `Run "${req.params.id}" not found` });
      return;
    }

    const replayId = `replay-${Date.now().toString(36)}`;
    const replayRun: Run = {
      ...JSON.parse(JSON.stringify(original)),
      id: replayId,
      name: `replay-of-${original.name}`,
      replayOf: original.id,
      createdAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 3000).toISOString(),
    };

    runStore.save(replayRun);
    const diagnostics = DiagnosticEngine.diagnose(replayRun);
    res.status(201).json({ run: replayRun, diagnostics });
  });

  // =========================================================================
  // Milestone 6: Experiment Engine & Benchmarking Endpoints
  // =========================================================================

  // 8. List All Experiments
  router.get('/experiments', (_req, res) => {
    const experiments = experimentStore.getAll();
    res.json({ experiments });
  });

  // 9. Single Experiment Detail with Runs and Diagnostics
  router.get('/experiments/:id', (req, res) => {
    const experiment = experimentStore.getById(req.params.id);
    if (!experiment) {
      res.status(404).json({ error: `Experiment "${req.params.id}" not found` });
      return;
    }

    const runs = experiment.runIds
      .map((id) => runStore.getById(id))
      .filter((r): r is Run => r !== undefined);

    const diagnosticsMap: Record<string, any> = {};
    for (const run of runs) {
      diagnosticsMap[run.id] = DiagnosticEngine.diagnose(run);
    }

    // Prepare empirical trial comparison matrix
    const comparison = runs.map((run) => {
      const diag = diagnosticsMap[run.id];
      const hasDuration = run.telemetry?.total_duration_ms != null;
      const hasTtft = run.telemetry?.ttft_ms != null;
      const hasTps = run.telemetry?.tokens_per_second != null;
      const hasTokens = run.telemetry?.total_tokens != null;
      const hasVram = run.telemetry?.peak_vram_mb != null;

      return {
        trialIndex: run.trialIndex ?? 1,
        runId: run.id,
        status: run.status,
        model: run.model,
        provenance: run.provenance,
        metrics: {
          durationMs: {
            value: run.telemetry?.total_duration_ms ?? null,
            semantics: hasDuration ? 'MEASURED' : 'UNAVAILABLE',
            unit: 'ms',
          },
          ttftMs: {
            value: run.telemetry?.ttft_ms ?? null,
            semantics: hasTtft ? 'MEASURED' : 'UNAVAILABLE',
            unit: 'ms',
          },
          tokensPerSecond: {
            value: run.telemetry?.tokens_per_second ?? null,
            semantics: hasTps ? 'DERIVED' : 'UNAVAILABLE',
            unit: 'tok/s',
          },
          totalTokens: {
            value: run.telemetry?.total_tokens ?? null,
            semantics: hasTokens ? 'MEASURED' : 'UNAVAILABLE',
            unit: 'tok',
          },
          peakVramMb: {
            value: run.telemetry?.peak_vram_mb ?? null,
            semantics: hasVram ? 'MEASURED' : 'UNAVAILABLE',
            unit: 'MB',
          },
        },
        diagnosticsStatus: diag.overallStatus,
        primaryFinding: diag.findings[0]?.title ?? 'Nominal',
        errorCode: run.errorCode,
        outputPreview: run.output ? run.output.slice(0, 100) : (run.errorMessage ? run.errorMessage.slice(0, 100) : 'None'),
      };
    });

    res.json({
      experiment,
      runs,
      diagnostics: diagnosticsMap,
      comparison,
    });
  });

  // 10. Create New Experiment
  router.post('/experiments', (req, res) => {
    const { name, description, workload, configuration } = req.body || {};

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Experiment name is required.' });
      return;
    }

    if (!workload || !workload.input) {
      res.status(400).json({ error: 'Workload input prompt is required.' });
      return;
    }

    const repeatCount = Number(workload.repeatCount) || 3;
    if (repeatCount < 1 || repeatCount > 50) {
      res.status(400).json({ error: 'Repeat count must be between 1 and 50.' });
      return;
    }

    const expId = `exp-${Date.now().toString(36)}`;
    const newExperiment: Experiment = {
      id: expId,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      workload: {
        input: workload.input,
        repeatCount,
        description: workload.description || 'Standard reproducible workload',
      },
      configuration: {
        model: configuration?.model || 'Qwen2.5-Coder-7B-Instruct',
        backend: configuration?.backend || 'Lemonade-DirectML',
        device: configuration?.device || 'AMD Ryzen AI NPU (XDNA2)',
        provider: configuration?.provider === 'mock' ? 'mock' : 'lemonade',
      },
      runIds: [],
    };

    experimentStore.save(newExperiment);
    res.status(201).json({ experiment: newExperiment });
  });

  // 11. Run / Execute Experiment Trials
  router.post('/experiments/:id/run', async (req, res) => {
    const experiment = experimentStore.getById(req.params.id);
    if (!experiment) {
      res.status(404).json({ error: `Experiment "${req.params.id}" not found` });
      return;
    }

    try {
      const result = await ExperimentEngine.run(experiment.id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to execute experiment trials' });
    }
  });

  // 12. Delete Experiment
  router.delete('/experiments/:id', (req, res) => {
    const deleted = experimentStore.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: `Experiment "${req.params.id}" not found` });
      return;
    }
    res.json({ success: true, id: req.params.id });
  });

  // 13. Export Reproducible Experiment Bundle
  router.get('/experiments/:id/export', (req, res) => {
    try {
      if (req.query.format === 'csv') {
        const csv = ExperimentEngine.exportCsv(req.params.id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}-reproducible.csv"`);
        res.send(csv);
        return;
      }
      const bundle = ExperimentEngine.exportBundle(req.params.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}-reproducible.json"`);
      res.json(bundle);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Export error' });
    }
  });

  // --------------------------------------------------------------------------
  // Milestone 7: Reproducible Research Reports Endpoints
  // --------------------------------------------------------------------------

  // 14. List All Research Reports
  router.get('/reports', (_req, res) => {
    const reports = reportStore.getAll();
    res.json({ reports });
  });

  // 15. Get Single Research Report
  router.get('/reports/:id', (req, res) => {
    const report = reportStore.getById(req.params.id);
    if (!report) {
      res.status(404).json({ error: `Report "${req.params.id}" not found` });
      return;
    }
    res.json({ report });
  });

  // 16. Generate New Research Report from Experiment or Run IDs
  router.post('/reports/generate', (req, res) => {
    try {
      const { experimentId, runIds, title, description, objective } = req.body || {};

      let report: ResearchReport;
      if (experimentId) {
        report = ReportEngine.generateFromExperiment(experimentId, { title, description, objective });
      } else if (Array.isArray(runIds) && runIds.length > 0) {
        report = ReportEngine.generateFromRuns(runIds, { title, description, objective });
      } else {
        res.status(400).json({ error: 'Either experimentId or a non-empty runIds array is required.' });
        return;
      }

      reportStore.save(report);
      res.status(201).json({ report });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to generate report' });
    }
  });

  // 17. Export Research Report (JSON, CSV, MD, HTML)
  router.get('/reports/:id/export', (req, res) => {
    const report = reportStore.getById(req.params.id);
    if (!report) {
      res.status(404).json({ error: `Report "${req.params.id}" not found` });
      return;
    }

    const format = (req.query.format as string) || 'json';

    if (format === 'csv') {
      const csv = ReportEngine.exportCsv(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report.id}-report.csv"`);
      res.send(csv);
      return;
    }

    if (format === 'md' || format === 'markdown') {
      const md = ReportEngine.exportMarkdown(report);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${report.id}-report.md"`);
      res.send(md);
      return;
    }

    if (format === 'html') {
      const html = ReportEngine.exportHtml(report);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${report.id}-report.html"`);
      res.send(html);
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.id}-report.json"`);
    res.json(report);
  });

  // 18. Export Full Reproducibility Bundle
  router.get('/reports/:id/bundle', (req, res) => {
    const report = reportStore.getById(req.params.id);
    if (!report) {
      res.status(404).json({ error: `Report "${req.params.id}" not found` });
      return;
    }

    const bundle = ReportEngine.exportBundle(report);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.id}-reproducibility-bundle.json"`);
    res.json(bundle);
  });

  // 19. Delete Report
  router.delete('/reports/:id', (req, res) => {
    const deleted = reportStore.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: `Report "${req.params.id}" not found` });
      return;
    }
    res.json({ success: true, id: req.params.id });
  });

  return router;
}

