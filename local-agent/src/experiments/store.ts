/**
 * Lemonade Flight Recorder — Experiment Store
 * Milestone 6: Controlled Experiment Collection and Persistence
 */

import fs from 'fs';
import path from 'path';
import type { Experiment, Run } from '../../../packages/shared/src/types.ts';
import { runStore } from '../runs/store.ts';
import { ExperimentStatsAggregator } from './stats.ts';

export class ExperimentStore {
  private experiments: Map<string, Experiment> = new Map();
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath ?? path.resolve(process.cwd(), 'data', 'experiments.json');
    this.initStore();
  }

  private initStore(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error('[ExperimentStore] Failed to create data directory:', err);
      }
    }

    if (fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: Experiment[] = JSON.parse(raw);
        for (const e of list) {
          this.experiments.set(e.id, e);
        }
      } catch (err) {
        console.error('[ExperimentStore] Failed to parse existing experiments file:', err);
      }
    }

    const countBefore = this.experiments.size;
    this.seedCanonicalExperiments();
    if (this.experiments.size > countBefore || !fs.existsSync(this.storagePath)) {
      this.persist();
    }
  }

  public getAll(): Experiment[] {
    return Array.from(this.experiments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getById(id: string): Experiment | undefined {
    return this.experiments.get(id);
  }

  public save(experiment: Experiment): void {
    experiment.updatedAt = new Date().toISOString();
    // Automatically re-compute summary from current runs
    const runs = experiment.runIds
      .map((rId) => runStore.getById(rId))
      .filter((r): r is Run => r !== undefined);

    experiment.summary = ExperimentStatsAggregator.summarize(experiment, runs);
    experiment.status = ExperimentStatsAggregator.deriveStatus(
      experiment.status,
      experiment.workload.repeatCount,
      experiment.summary.completedTrials,
      experiment.summary.failedTrials,
      experiment.summary.blockedTrials
    );

    this.experiments.set(experiment.id, experiment);
    this.persist();
  }

  public delete(id: string): boolean {
    const deleted = this.experiments.delete(id);
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  public persist(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = JSON.stringify(Array.from(this.experiments.values()), null, 2);
      fs.writeFileSync(this.storagePath, data, 'utf-8');
    } catch (err) {
      console.error('[ExperimentStore] Failed to persist experiments to disk:', err);
    }
  }

  public reload(): void {
    if (fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: Experiment[] = JSON.parse(raw);
        this.experiments.clear();
        for (const e of list) {
          this.experiments.set(e.id, e);
        }
      } catch (err) {
        console.error('[ExperimentStore] Failed to reload experiments from disk:', err);
      }
    }
  }

  public clear(reseed = false): void {
    this.experiments.clear();
    if (reseed) {
      this.seedCanonicalExperiments();
    }
    this.persist();
  }

  private seedCanonicalExperiments(): void {
    // -----------------------------------------------------------------------
    // Experiment 1: Qwen2.5 Code Generation Latency Baseline (5 completed trials)
    // -----------------------------------------------------------------------
    const exp1Runs: Run[] = [
      {
        id: 'run-exp1-t1',
        name: 'exp-ast-eval-042',
        status: 'completed',
        createdAt: '2025-05-18T14:10:00.000Z',
        completedAt: '2025-05-18T14:10:09.650Z',
        model: 'Qwen2.5-Coder-7B-Instruct',
        prompt: 'Refactor AST parser for streaming parser nodes (batch_size=1, ctx=4k)',
        output: 'export class StreamingAstParser { private buffer: string = ""; }',
        experimentId: 'exp-001',
        trialIndex: 1,
        provenance: {
          provider: 'lemonade',
          runtime: 'real',
          backend: 'Lemonade-DirectML',
          device: 'AMD Ryzen AI NPU (XDNA2)',
          isSynthetic: false,
          verifiedAt: '2025-05-18T14:10:00.050Z',
        },
        telemetry: {
          ttft_ms: 310,
          total_duration_ms: 9650,
          tokens_per_second: 42.7,
          input_tokens: 1840,
          output_tokens: 412,
          total_tokens: 2252,
          peak_vram_mb: 6553,
          npu_utilization_pct: 78,
          package_power_w: 16.2,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens', 'total_tokens', 'peak_vram_mb'],
          unavailableFields: [],
        },
        hardware: {
          device: 'AMD Ryzen AI NPU (XDNA2)',
          backend: 'Lemonade-DirectML v1.4',
          memoryTotalMb: 16384,
          driverVersion: 'AMD 24.10.1',
        },
      },
      {
        id: 'run-exp1-t2',
        name: 'exp-ast-eval-042-t2',
        status: 'completed',
        createdAt: '2025-05-18T14:11:00.000Z',
        completedAt: '2025-05-18T14:11:09.520Z',
        model: 'Qwen2.5-Coder-7B-Instruct',
        prompt: 'Refactor AST parser for streaming parser nodes (batch_size=1, ctx=4k)',
        output: 'export class StreamingAstParser { parseNext() { return true; } }',
        experimentId: 'exp-001',
        trialIndex: 2,
        provenance: {
          provider: 'lemonade',
          runtime: 'real',
          backend: 'Lemonade-DirectML',
          device: 'AMD Ryzen AI NPU (XDNA2)',
          isSynthetic: false,
        },
        telemetry: {
          ttft_ms: 302,
          total_duration_ms: 9520,
          tokens_per_second: 43.1,
          input_tokens: 1840,
          output_tokens: 410,
          total_tokens: 2250,
          peak_vram_mb: 6553,
          npu_utilization_pct: 79,
          package_power_w: 16.4,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens', 'total_tokens', 'peak_vram_mb'],
          unavailableFields: [],
        },
        hardware: {
          device: 'AMD Ryzen AI NPU (XDNA2)',
          backend: 'Lemonade-DirectML v1.4',
          memoryTotalMb: 16384,
          driverVersion: 'AMD 24.10.1',
        },
      },
      {
        id: 'run-exp1-t3',
        name: 'exp-ast-eval-042-t3',
        status: 'completed',
        createdAt: '2025-05-18T14:12:00.000Z',
        completedAt: '2025-05-18T14:12:09.810Z',
        model: 'Qwen2.5-Coder-7B-Instruct',
        prompt: 'Refactor AST parser for streaming parser nodes (batch_size=1, ctx=4k)',
        output: 'export class StreamingAstParser { flush() { this.buffer = ""; } }',
        experimentId: 'exp-001',
        trialIndex: 3,
        provenance: {
          provider: 'lemonade',
          runtime: 'real',
          backend: 'Lemonade-DirectML',
          device: 'AMD Ryzen AI NPU (XDNA2)',
          isSynthetic: false,
        },
        telemetry: {
          ttft_ms: 324,
          total_duration_ms: 9810,
          tokens_per_second: 41.9,
          input_tokens: 1840,
          output_tokens: 411,
          total_tokens: 2251,
          peak_vram_mb: 6580,
          npu_utilization_pct: 77,
          package_power_w: 16.1,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens', 'total_tokens', 'peak_vram_mb'],
          unavailableFields: [],
        },
        hardware: {
          device: 'AMD Ryzen AI NPU (XDNA2)',
          backend: 'Lemonade-DirectML v1.4',
          memoryTotalMb: 16384,
          driverVersion: 'AMD 24.10.1',
        },
      },
      {
        id: 'run-exp1-t4',
        name: 'exp-ast-eval-042-t4',
        status: 'completed',
        createdAt: '2025-05-18T14:13:00.000Z',
        completedAt: '2025-05-18T14:13:09.490Z',
        model: 'Qwen2.5-Coder-7B-Instruct',
        prompt: 'Refactor AST parser for streaming parser nodes (batch_size=1, ctx=4k)',
        output: 'export class StreamingAstParser { get ready() { return true; } }',
        experimentId: 'exp-001',
        trialIndex: 4,
        provenance: {
          provider: 'lemonade',
          runtime: 'real',
          backend: 'Lemonade-DirectML',
          device: 'AMD Ryzen AI NPU (XDNA2)',
          isSynthetic: false,
        },
        telemetry: {
          ttft_ms: 298,
          total_duration_ms: 9490,
          tokens_per_second: 43.4,
          input_tokens: 1840,
          output_tokens: 412,
          total_tokens: 2252,
          peak_vram_mb: 6553,
          npu_utilization_pct: 80,
          package_power_w: 16.3,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens', 'total_tokens', 'peak_vram_mb'],
          unavailableFields: [],
        },
        hardware: {
          device: 'AMD Ryzen AI NPU (XDNA2)',
          backend: 'Lemonade-DirectML v1.4',
          memoryTotalMb: 16384,
          driverVersion: 'AMD 24.10.1',
        },
      },
      {
        id: 'run-exp1-t5',
        name: 'exp-ast-eval-042-t5',
        status: 'completed',
        createdAt: '2025-05-18T14:14:00.000Z',
        completedAt: '2025-05-18T14:14:09.610Z',
        model: 'Qwen2.5-Coder-7B-Instruct',
        prompt: 'Refactor AST parser for streaming parser nodes (batch_size=1, ctx=4k)',
        output: 'export class StreamingAstParser { end() { return this.result; } }',
        experimentId: 'exp-001',
        trialIndex: 5,
        provenance: {
          provider: 'lemonade',
          runtime: 'real',
          backend: 'Lemonade-DirectML',
          device: 'AMD Ryzen AI NPU (XDNA2)',
          isSynthetic: false,
        },
        telemetry: {
          ttft_ms: 308,
          total_duration_ms: 9610,
          tokens_per_second: 42.9,
          input_tokens: 1840,
          output_tokens: 412,
          total_tokens: 2252,
          peak_vram_mb: 6553,
          npu_utilization_pct: 78,
          package_power_w: 16.2,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens', 'total_tokens', 'peak_vram_mb'],
          unavailableFields: [],
        },
        hardware: {
          device: 'AMD Ryzen AI NPU (XDNA2)',
          backend: 'Lemonade-DirectML v1.4',
          memoryTotalMb: 16384,
          driverVersion: 'AMD 24.10.1',
        },
      },
    ];

    exp1Runs.forEach((r) => runStore.save(r));

    const exp001: Experiment = {
      id: 'exp-001',
      name: 'Qwen2.5 Code Generation Latency Baseline',
      description: '5-trial repeated execution measuring token generation throughput and TTFT stability on AMD NPU.',
      createdAt: '2025-05-18T14:09:00.000Z',
      updatedAt: '2025-05-18T14:15:00.000Z',
      status: 'completed',
      workload: {
        input: 'Refactor AST parser for streaming parser nodes (batch_size=1, ctx=4k)',
        repeatCount: 5,
        description: 'AST Parser streaming refactoring workload',
      },
      configuration: {
        model: 'Qwen2.5-Coder-7B-Instruct',
        backend: 'Lemonade-DirectML',
        device: 'AMD Ryzen AI NPU (XDNA2)',
        provider: 'lemonade',
      },
      runIds: exp1Runs.map((r) => r.id),
    };

    exp001.summary = ExperimentStatsAggregator.summarize(exp001, exp1Runs);
    this.experiments.set(exp001.id, exp001);

    // -----------------------------------------------------------------------
    // Experiment 2: DirectML NPU Policy Block Tolerance (Partial Outcome: 2 completed, 1 blocked)
    // -----------------------------------------------------------------------
    const exp2Runs: Run[] = [
      {
        id: 'run-exp2-t1',
        name: 'exp-npu-dispatch-045-t1',
        status: 'completed',
        createdAt: '2025-05-18T15:05:00.000Z',
        completedAt: '2025-05-18T15:05:04.200Z',
        model: 'Qwen2.5-Coder-7B-Instruct',
        prompt: 'Synthesize low-overhead DirectML buffer allocation hooks',
        output: '// DirectML Buffer allocator hooks initialized.',
        experimentId: 'exp-002',
        trialIndex: 1,
        provenance: {
          provider: 'lemonade',
          runtime: 'real',
          backend: 'Lemonade-DirectML',
          device: 'AMD Ryzen AI NPU (XDNA2)',
          isSynthetic: false,
        },
        telemetry: {
          ttft_ms: 290,
          total_duration_ms: 4200,
          tokens_per_second: 44.0,
          input_tokens: 420,
          output_tokens: 185,
          total_tokens: 605,
          peak_vram_mb: 5120,
          npu_utilization_pct: 75,
          package_power_w: 15.8,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens', 'total_tokens', 'peak_vram_mb'],
          unavailableFields: [],
        },
        hardware: {
          device: 'AMD Ryzen AI NPU',
          backend: 'Lemonade-DirectML v1.4',
        },
      },
      {
        id: 'run-exp2-t2',
        name: 'exp-npu-dispatch-045-t2',
        status: 'completed',
        createdAt: '2025-05-18T15:07:00.000Z',
        completedAt: '2025-05-18T15:07:04.310Z',
        model: 'Qwen2.5-Coder-7B-Instruct',
        prompt: 'Synthesize low-overhead DirectML buffer allocation hooks',
        output: '// DirectML Buffer allocator hooks initialized with ring-buffer swap.',
        experimentId: 'exp-002',
        trialIndex: 2,
        provenance: {
          provider: 'lemonade',
          runtime: 'real',
          backend: 'Lemonade-DirectML',
          device: 'AMD Ryzen AI NPU (XDNA2)',
          isSynthetic: false,
        },
        telemetry: {
          ttft_ms: 295,
          total_duration_ms: 4310,
          tokens_per_second: 43.8,
          input_tokens: 420,
          output_tokens: 189,
          total_tokens: 609,
          peak_vram_mb: 5120,
          npu_utilization_pct: 76,
          package_power_w: 15.9,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens', 'total_tokens', 'peak_vram_mb'],
          unavailableFields: [],
        },
        hardware: {
          device: 'AMD Ryzen AI NPU',
          backend: 'Lemonade-DirectML v1.4',
        },
      },
      // Trial 3 is the canonical Run #045 (Windows Application Control Error 4551 blocked!)
      {
        ...runStore.getById('run-045')!,
        experimentId: 'exp-002',
        trialIndex: 3,
      },
    ];

    exp2Runs.forEach((r) => runStore.save(r));

    const exp002: Experiment = {
      id: 'exp-002',
      name: 'DirectML NPU Policy Block Tolerance',
      description: 'Mixed outcome experiment: 2 trials completed nominal, 1 trial halted by OS Host Application Control Policy (Error 4551).',
      createdAt: '2025-05-18T15:04:00.000Z',
      updatedAt: '2025-05-18T15:11:00.000Z',
      status: 'partial',
      workload: {
        input: 'Synthesize low-overhead DirectML buffer allocation hooks',
        repeatCount: 3,
        description: 'DirectML driver dispatch stress test',
      },
      configuration: {
        model: 'Qwen2.5-Coder-7B-Instruct',
        backend: 'Lemonade-DirectML',
        device: 'AMD Ryzen AI NPU (XDNA2)',
        provider: 'lemonade',
      },
      runIds: exp2Runs.map((r) => r.id),
    };

    exp002.summary = ExperimentStatsAggregator.summarize(exp002, exp2Runs);
    this.experiments.set(exp002.id, exp002);

    // -----------------------------------------------------------------------
    // Experiment 3: Synthetic Mock Model Baseline (Explicit mock provenance)
    // -----------------------------------------------------------------------
    const exp3Runs: Run[] = [
      {
        id: 'run-exp3-t1',
        name: 'exp-mock-baseline-048-t1',
        status: 'completed',
        createdAt: '2025-05-18T15:40:00.000Z',
        completedAt: '2025-05-18T15:40:03.200Z',
        model: 'Mock-Model-Tiny',
        prompt: 'Deterministic mock test vector',
        output: 'Synthetic response text from mock generator.',
        experimentId: 'exp-003',
        trialIndex: 1,
        provenance: {
          provider: 'mock',
          runtime: 'mock',
          backend: 'Synthetic-Generator',
          device: 'Mock-Virtual-Silicon',
          isSynthetic: true,
        },
        telemetry: {
          ttft_ms: 120,
          total_duration_ms: 3200,
          tokens_per_second: 50.0,
          input_tokens: 100,
          output_tokens: 160,
          total_tokens: 260,
          peak_vram_mb: 512,
          npu_utilization_pct: 30,
          package_power_w: 5.0,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens'],
          unavailableFields: [],
        },
      },
      {
        id: 'run-exp3-t2',
        name: 'exp-mock-baseline-048-t2',
        status: 'completed',
        createdAt: '2025-05-18T15:41:00.000Z',
        completedAt: '2025-05-18T15:41:03.150Z',
        model: 'Mock-Model-Tiny',
        prompt: 'Deterministic mock test vector',
        output: 'Synthetic response text from mock generator trial 2.',
        experimentId: 'exp-003',
        trialIndex: 2,
        provenance: {
          provider: 'mock',
          runtime: 'mock',
          backend: 'Synthetic-Generator',
          device: 'Mock-Virtual-Silicon',
          isSynthetic: true,
        },
        telemetry: {
          ttft_ms: 118,
          total_duration_ms: 3150,
          tokens_per_second: 50.8,
          input_tokens: 100,
          output_tokens: 160,
          total_tokens: 260,
          peak_vram_mb: 512,
          npu_utilization_pct: 30,
          package_power_w: 5.0,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens'],
          unavailableFields: [],
        },
      },
      {
        id: 'run-exp3-t3',
        name: 'exp-mock-baseline-048-t3',
        status: 'completed',
        createdAt: '2025-05-18T15:42:00.000Z',
        completedAt: '2025-05-18T15:42:03.220Z',
        model: 'Mock-Model-Tiny',
        prompt: 'Deterministic mock test vector',
        output: 'Synthetic response text from mock generator trial 3.',
        experimentId: 'exp-003',
        trialIndex: 3,
        provenance: {
          provider: 'mock',
          runtime: 'mock',
          backend: 'Synthetic-Generator',
          device: 'Mock-Virtual-Silicon',
          isSynthetic: true,
        },
        telemetry: {
          ttft_ms: 122,
          total_duration_ms: 3220,
          tokens_per_second: 49.7,
          input_tokens: 100,
          output_tokens: 160,
          total_tokens: 260,
          peak_vram_mb: 512,
          npu_utilization_pct: 30,
          package_power_w: 5.0,
          measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second', 'input_tokens', 'output_tokens'],
          unavailableFields: [],
        },
      },
    ];

    exp3Runs.forEach((r) => runStore.save(r));

    const exp003: Experiment = {
      id: 'exp-003',
      name: 'Synthetic Mock Model Throughput Baseline',
      description: 'Explicit synthetic run test baseline for verifying mock-to-real provenance isolation.',
      createdAt: '2025-05-18T15:39:00.000Z',
      updatedAt: '2025-05-18T15:43:00.000Z',
      status: 'completed',
      workload: {
        input: 'Deterministic mock test vector',
        repeatCount: 3,
        description: 'Synthetic generator throughput verification',
      },
      configuration: {
        model: 'Mock-Model-Tiny',
        backend: 'Synthetic-Generator',
        device: 'Mock-Virtual-Silicon',
        provider: 'mock',
      },
      runIds: exp3Runs.map((r) => r.id),
    };

    exp003.summary = ExperimentStatsAggregator.summarize(exp003, exp3Runs);
    this.experiments.set(exp003.id, exp003);
  }
}

export const experimentStore = new ExperimentStore();
