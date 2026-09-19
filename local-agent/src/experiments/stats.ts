/**
 * Lemonade Flight Recorder — Experiment Statistical Aggregator & Measurement Engine
 * Milestone 6: Rigorous Metrological Aggregation (MEASURED, DERIVED, UNAVAILABLE)
 */

import type {
  Experiment,
  ExperimentSummary,
  StatisticalMetric,
  MetricSemantics,
  Run,
  ExperimentProvenanceSummary,
} from '../../../packages/shared/src/types.ts';

export class ExperimentStatsAggregator {
  /**
   * Computes statistical distribution for an array of numbers.
   * If numbers array is empty, marks metric as UNAVAILABLE with null values.
   */
  public static calculateMetric(
    values: (number | null | undefined)[],
    unit: string,
    defaultSemantics: 'MEASURED' | 'DERIVED'
  ): StatisticalMetric {
    const valid = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

    if (valid.length === 0) {
      return {
        semantics: 'UNAVAILABLE',
        n: 0,
        min: null,
        median: null,
        mean: null,
        max: null,
        stdDev: null,
        unit,
      };
    }

    const sorted = [...valid].sort((a, b) => a - b);
    const n = sorted.length;
    const min = Math.round(sorted[0] * 100) / 100;
    const max = Math.round(sorted[n - 1] * 100) / 100;
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const rawMean = sum / n;
    const mean = Math.round(rawMean * 100) / 100;

    let median: number;
    if (n % 2 === 1) {
      median = sorted[Math.floor(n / 2)];
    } else {
      median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    }
    median = Math.round(median * 100) / 100;

    let stdDev: number | null = null;
    if (n > 1) {
      const variance = sorted.reduce((acc, val) => acc + Math.pow(val - rawMean, 2), 0) / (n - 1);
      stdDev = Math.round(Math.sqrt(variance) * 100) / 100;
    } else {
      stdDev = 0;
    }

    return {
      semantics: defaultSemantics,
      n,
      min,
      median,
      mean,
      max,
      stdDev,
      unit,
    };
  }

  /**
   * Produces an empirical ExperimentSummary from an experiment definition and its trial runs.
   */
  public static summarize(experiment: Experiment, runs: Run[]): ExperimentSummary {
    const requestedTrials = experiment.workload.repeatCount;
    let completedTrials = 0;
    let failedTrials = 0;
    let blockedTrials = 0;
    let unavailableTrials = 0;

    const provenanceDistribution: ExperimentProvenanceSummary = {
      real: 0,
      mock: 0,
      blocked: 0,
      unavailable: 0,
      legacy: 0,
    };

    const durationValues: (number | null)[] = [];
    const ttftValues: (number | null)[] = [];
    const tpsValues: (number | null)[] = [];
    const tokenValues: (number | null)[] = [];
    const vramValues: (number | null)[] = [];

    const unavailableMetricsSet = new Set<string>();

    for (const run of runs) {
      if (run.status === 'completed') {
        completedTrials++;
      } else if (run.status === 'blocked') {
        blockedTrials++;
      } else {
        failedTrials++;
      }

      // Check provenance
      const prov = run.provenance;
      if (!prov || prov.legacy) {
        provenanceDistribution.legacy++;
      } else if (prov.runtime === 'mock') {
        provenanceDistribution.mock++;
      } else if (prov.runtime === 'blocked' || run.status === 'blocked') {
        provenanceDistribution.blocked++;
      } else if (prov.runtime === 'unavailable') {
        provenanceDistribution.unavailable++;
        unavailableTrials++;
      } else if (prov.runtime === 'real') {
        provenanceDistribution.real++;
      }

      // Collect telemetry metrics
      if (run.telemetry) {
        durationValues.push(run.telemetry.total_duration_ms);
        ttftValues.push(run.telemetry.ttft_ms);
        tpsValues.push(run.telemetry.tokens_per_second);
        tokenValues.push(run.telemetry.total_tokens);
        vramValues.push(run.telemetry.peak_vram_mb);

        if (run.telemetry.unavailableFields) {
          run.telemetry.unavailableFields.forEach((f) => unavailableMetricsSet.add(f));
        }
      }
    }

    const durationMetric = this.calculateMetric(durationValues, 'ms', 'MEASURED');
    const ttftMetric = this.calculateMetric(ttftValues, 'ms', 'MEASURED');
    const tpsMetric = this.calculateMetric(tpsValues, 'tok/s', 'DERIVED');
    const tokensMetric = this.calculateMetric(tokenValues, 'tok', 'MEASURED');
    const vramMetric = this.calculateMetric(vramValues, 'MB', 'MEASURED');

    // Register any metric with zero valid observations as unavailable
    if (durationMetric.semantics === 'UNAVAILABLE') unavailableMetricsSet.add('total_duration_ms');
    if (ttftMetric.semantics === 'UNAVAILABLE') unavailableMetricsSet.add('ttft_ms');
    if (tpsMetric.semantics === 'UNAVAILABLE') unavailableMetricsSet.add('tokens_per_second');
    if (tokensMetric.semantics === 'UNAVAILABLE') unavailableMetricsSet.add('total_tokens');
    if (vramMetric.semantics === 'UNAVAILABLE') unavailableMetricsSet.add('peak_vram_mb');

    return {
      requestedTrials,
      completedTrials,
      failedTrials,
      blockedTrials,
      unavailableTrials,
      provenanceDistribution,
      metrics: {
        durationMs: durationMetric,
        ttftMs: ttftMetric,
        tokensPerSecond: tpsMetric,
        totalTokens: tokensMetric,
        peakVramMb: vramMetric,
      },
      unavailableMetrics: Array.from(unavailableMetricsSet),
      model: experiment.configuration.model,
      hardware: runs[0]?.hardware
        ? {
            device: runs[0].hardware.device,
            backend: runs[0].hardware.backend,
          }
        : undefined,
    };
  }

  /**
   * Determines the updated status of an experiment based on requested vs executed trials.
   */
  public static deriveStatus(
    currentStatus: Experiment['status'],
    requestedTrials: number,
    completedTrials: number,
    failedTrials: number,
    blockedTrials: number
  ): Experiment['status'] {
    if (currentStatus === 'running') return 'running';

    const totalFinished = completedTrials + failedTrials + blockedTrials;

    if (totalFinished === 0) return 'draft';

    if (completedTrials === requestedTrials) {
      return 'completed';
    }

    if (completedTrials === 0) {
      return 'failed';
    }

    // Mixed results or partial execution
    return 'partial';
  }
}
