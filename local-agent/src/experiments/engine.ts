/**
 * Lemonade Flight Recorder — Experiment Engine
 * Milestone 6: Orchestration Layer for Local AI Benchmarking Experiments
 */

import type { Experiment, Run } from '../../../packages/shared/src/types.ts';
import { experimentStore } from './store.ts';
import { runStore } from '../runs/store.ts';
import { InferenceExecutor } from '../runs/executor.ts';
import { ExperimentStatsAggregator } from './stats.ts';
import { DiagnosticEngine } from '../diagnostics/engine.ts';

export interface ExperimentRunResult {
  experiment: Experiment;
  runs: Run[];
}

export class ExperimentEngine {
  /**
   * Executes all trials of an experiment through the authoritative inference execution path.
   */
  public static async run(
    experimentId: string,
    options: { continueOnFault?: boolean } = { continueOnFault: true }
  ): Promise<ExperimentRunResult> {
    const experiment = experimentStore.getById(experimentId);
    if (!experiment) {
      throw new Error(`Experiment "${experimentId}" not found in local store.`);
    }

    experiment.status = 'running';
    experiment.updatedAt = new Date().toISOString();
    experimentStore.save(experiment);

    const createdRuns: Run[] = [];
    const repeatCount = Math.max(1, experiment.workload.repeatCount);

    for (let trial = 1; trial <= repeatCount; trial++) {
      try {
        const run = await InferenceExecutor.execute({
          model: experiment.configuration.model,
          prompt: experiment.workload.input,
          provider: experiment.configuration.provider,
          experimentId: experiment.id,
          trialIndex: trial,
        });

        createdRuns.push(run);

        // If not already in experiment.runIds, append
        if (!experiment.runIds.includes(run.id)) {
          experiment.runIds.push(run.id);
        }

        // If run is blocked or failed, continue unless explicitly instructed to halt
        if ((run.status === 'blocked' || run.status === 'failed') && !options.continueOnFault) {
          break;
        }
      } catch (err) {
        console.error(`[ExperimentEngine] Trial ${trial} encountered unexpected error:`, err);
        if (!options.continueOnFault) break;
      }
    }

    // Retrieve all runs currently belonging to this experiment
    const allRuns = experiment.runIds
      .map((id) => runStore.getById(id))
      .filter((r): r is Run => r !== undefined);

    // Compute empirical statistical summary
    experiment.summary = ExperimentStatsAggregator.summarize(experiment, allRuns);
    experiment.status = ExperimentStatsAggregator.deriveStatus(
      'completed', // Transition out of running
      experiment.workload.repeatCount,
      experiment.summary.completedTrials,
      experiment.summary.failedTrials,
      experiment.summary.blockedTrials
    );
    experiment.updatedAt = new Date().toISOString();

    experimentStore.save(experiment);

    return {
      experiment,
      runs: allRuns,
    };
  }

  /**
   * Generates a fully reproducible, self-contained export payload for an experiment.
   */
  public static exportBundle(experimentId: string): Record<string, unknown> {
    const experiment = experimentStore.getById(experimentId);
    if (!experiment) {
      throw new Error(`Experiment "${experimentId}" not found`);
    }

    const runs = experiment.runIds
      .map((id) => runStore.getById(id))
      .filter((r): r is Run => r !== undefined);

    return {
      $schema: 'https://lemonade-flight-recorder.local/schemas/m6-experiment-v1.json',
      exportedAt: new Date().toISOString(),
      experiment: {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        createdAt: experiment.createdAt,
        updatedAt: experiment.updatedAt,
      },
      workload: experiment.workload,
      configuration: experiment.configuration,
      summary: experiment.summary,
      trials: runs.map((r) => {
        const diag = DiagnosticEngine.diagnose(r);
        return {
          id: r.id,
          name: r.name,
          experimentId: r.experimentId,
          trialIndex: r.trialIndex,
          status: r.status,
          model: r.model,
          prompt: r.prompt,
          output: r.output,
          errorMessage: r.errorMessage,
          errorCode: r.errorCode,
          provenance: r.provenance,
          telemetry: r.telemetry,
          events: r.events,
          replayOf: r.replayOf,
          diagnostics: {
            overallStatus: diag.overallStatus,
            findingsCount: diag.findings.length,
            primaryFinding: diag.findings[0]?.title ?? 'Nominal',
            findings: diag.findings,
          },
        };
      }),
      environment: {
        engine: 'Lemonade Flight Recorder v1.4.2',
        specification: 'Milestone 6 — Experiment Engine & Benchmarking',
        airGapped: true,
      },
    };
  }

  /**
   * Exports an experiment's trials as standard CSV.
   * Missing/unavailable metrics are explicitly output as "UNAVAILABLE" and never converted to zero.
   */
  public static exportCsv(experimentId: string): string {
    const experiment = experimentStore.getById(experimentId);
    if (!experiment) {
      throw new Error(`Experiment "${experimentId}" not found`);
    }

    const runs = experiment.runIds
      .map((id) => runStore.getById(id))
      .filter((r): r is Run => r !== undefined);

    const headers = [
      'trial_index',
      'run_id',
      'status',
      'model',
      'provider',
      'runtime',
      'duration_ms',
      'ttft_ms',
      'tokens_per_second',
      'total_tokens',
      'peak_vram_mb',
      'replay_of',
      'error_code'
    ];

    const lines = [headers.join(',')];

    for (const r of runs) {
      const dur = r.telemetry?.total_duration_ms != null ? r.telemetry.total_duration_ms : 'UNAVAILABLE';
      const ttft = r.telemetry?.ttft_ms != null ? r.telemetry.ttft_ms : 'UNAVAILABLE';
      const tps = r.telemetry?.tokens_per_second != null ? r.telemetry.tokens_per_second : 'UNAVAILABLE';
      const tokens = r.telemetry?.total_tokens != null ? r.telemetry.total_tokens : 'UNAVAILABLE';
      const vram = r.telemetry?.peak_vram_mb != null ? r.telemetry.peak_vram_mb : 'UNAVAILABLE';
      const replay = r.replayOf || '';
      const err = r.errorCode ? String(r.errorCode) : '';

      lines.push([
        r.trialIndex ?? '',
        r.id,
        r.status,
        `"${r.model}"`,
        r.provenance?.provider || 'unknown',
        r.provenance?.runtime || 'unknown',
        dur,
        ttft,
        tps,
        tokens,
        vram,
        replay,
        err,
      ].join(','));
    }

    return lines.join('\n');
  }
}
