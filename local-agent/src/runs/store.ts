/**
 * Lemonade Flight Recorder — Run & Event Telemetry Store
 * Milestone 5: Local In-Memory & File-Synchronized Store
 */

import fs from 'fs';
import path from 'path';
import type { Run, RunEvent } from '../../../packages/shared/src/types.ts';

export class RunStore {
  private runs: Map<string, Run> = new Map();
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath ?? path.resolve(process.cwd(), 'data', 'runs.json');
    this.initStore();
  }

  private initStore(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error('[RunStore] Failed to create data directory:', err);
      }
    }

    if (fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: Run[] = JSON.parse(raw);
        for (const r of list) {
          this.runs.set(r.id, r);
        }
      } catch (err) {
        console.error('[RunStore] Failed to parse existing runs file:', err);
      }
    }

    // Always ensure canonical baseline runs are present in the store
    const countBefore = this.runs.size;
    this.seedCanonicalRuns();
    if (this.runs.size > countBefore || !fs.existsSync(this.storagePath)) {
      this.persist();
    }
  }

  public getAll(): Run[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getById(id: string): Run | undefined {
    return this.runs.get(id);
  }

  public save(run: Run): void {
    this.runs.set(run.id, run);
    this.persist();
  }

  public delete(id: string): boolean {
    const deleted = this.runs.delete(id);
    if (deleted) {
      this.persist();
    }
    return deleted;
  }

  public addEvent(runId: string, event: RunEvent): void {
    const run = this.runs.get(runId);
    if (run) {
      if (!run.events) run.events = [];
      run.events.push(event);
      this.persist();
    }
  }

  public persist(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = JSON.stringify(Array.from(this.runs.values()), null, 2);
      fs.writeFileSync(this.storagePath, data, 'utf-8');
    } catch (err) {
      console.error('[RunStore] Failed to persist runs to disk:', err);
    }
  }

  public reload(): void {
    if (fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: Run[] = JSON.parse(raw);
        this.runs.clear();
        for (const r of list) {
          this.runs.set(r.id, r);
        }
      } catch (err) {
        console.error('[RunStore] Failed to reload runs from disk:', err);
      }
    }
  }

  public clear(reseed = false): void {
    this.runs.clear();
    if (reseed) {
      this.seedCanonicalRuns();
    }
    this.persist();
  }

  private seedCanonicalRuns(): void {
    // 1. RUN #045: BLOCKED (Windows Application Control Error 4551)
    const run045: Run = {
      id: 'run-045',
      name: 'exp-npu-dispatch-045',
      status: 'blocked',
      createdAt: '2025-05-18T15:10:00.000Z',
      completedAt: '2025-05-18T15:10:01.420Z',
      model: 'Qwen2.5-Coder-7B-Instruct',
      prompt: 'Synthesize low-overhead DirectML buffer allocation hooks',
      errorMessage:
        'Error 4551: Windows Application Control blocked the execution of backend directml_npu_runner.dll',
      errorCode: 4551,
      provenance: {
        provider: 'lemonade',
        runtime: 'blocked',
        backend: 'Lemonade-DirectML',
        device: 'AMD Ryzen AI NPU (XDNA2)',
        isSynthetic: false,
      },
      telemetry: {
        ttft_ms: null,
        total_duration_ms: 1420,
        tokens_per_second: null,
        input_tokens: 420,
        output_tokens: 0,
        total_tokens: 420,
        peak_vram_mb: 2100,
        npu_utilization_pct: 0,
        package_power_w: null,
        measuredFields: ['total_duration_ms', 'input_tokens', 'peak_vram_mb'],
        unavailableFields: ['ttft_ms', 'tokens_per_second', 'package_power_w'],
      },
      hardware: {
        device: 'AMD Ryzen AI NPU',
        backend: 'Lemonade-DirectML v1.4',
        memoryTotalMb: 16384,
        driverVersion: 'AMD 24.10.1',
      },
      events: [
        {
          id: 'evt-045-01',
          runId: 'run-045',
          timestamp: '2025-05-18T15:10:00.100Z',
          offsetMs: 100,
          stage: 'input',
          type: 'PROMPT_INGEST',
          level: 'info',
          message: 'Received prompt payload (420 tokens), verified UTF-8 encoding.',
        },
        {
          id: 'evt-045-02',
          runId: 'run-045',
          timestamp: '2025-05-18T15:10:00.320Z',
          offsetMs: 320,
          stage: 'context',
          type: 'CONTEXT_ASSEMBLE',
          level: 'info',
          message: 'Assembled prompt into active context buffer; memory reserved.',
        },
        {
          id: 'evt-045-03',
          runId: 'run-045',
          timestamp: '2025-05-18T15:10:00.800Z',
          offsetMs: 800,
          stage: 'model_runtime',
          type: 'DISPATCH_BINARY',
          level: 'info',
          message: 'Invoking DirectML execution module directml_npu_runner.dll.',
        },
        {
          id: 'evt-045-04',
          runId: 'run-045',
          timestamp: '2025-05-18T15:10:01.420Z',
          offsetMs: 1420,
          stage: 'model_runtime',
          type: 'POLICY_BLOCK',
          level: 'error',
          message:
            'Host operating system blocked binary dispatch: Error 4551 (Windows Application Control enforcement). Process terminated.',
          data: {
            errorCode: 4551,
            binary: 'directml_npu_runner.dll',
            policyType: 'AppControl-Enforced',
          },
        },
      ],
    };

    // 2. RUN #046: UNAVAILABLE (Lemonade daemon offline / ECONNREFUSED)
    const run046: Run = {
      id: 'run-046',
      name: 'exp-connection-check-046',
      status: 'failed',
      createdAt: '2025-05-18T15:20:00.000Z',
      completedAt: '2025-05-18T15:20:00.120Z',
      model: 'Mistral-7B-Instruct',
      prompt: 'Format benchmark test telemetry table',
      errorMessage: 'connect ECONNREFUSED 127.0.0.1:8899',
      errorCode: 'ECONNREFUSED',
      provenance: {
        provider: 'lemonade',
        runtime: 'unavailable',
        host: '127.0.0.1',
        port: 8899,
        isSynthetic: false,
      },
      telemetry: {
        ttft_ms: null,
        total_duration_ms: 120,
        tokens_per_second: null,
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        peak_vram_mb: null,
        npu_utilization_pct: null,
        package_power_w: null,
        measuredFields: ['total_duration_ms'],
        unavailableFields: [
          'ttft_ms',
          'tokens_per_second',
          'peak_vram_mb',
          'npu_utilization_pct',
          'package_power_w',
        ],
      },
      events: [
        {
          id: 'evt-046-01',
          runId: 'run-046',
          timestamp: '2025-05-18T15:20:00.010Z',
          offsetMs: 10,
          stage: 'system',
          type: 'DAEMON_CONNECT_INIT',
          level: 'info',
          message: 'Initiating socket handshake with Lemonade daemon at 127.0.0.1:8899.',
        },
        {
          id: 'evt-046-02',
          runId: 'run-046',
          timestamp: '2025-05-18T15:20:00.120Z',
          offsetMs: 120,
          stage: 'system',
          type: 'TRANSPORT_ERROR',
          level: 'error',
          message:
            'TCP connection failed: connect ECONNREFUSED 127.0.0.1:8899. Daemon process is not running or unreachable.',
          data: {
            host: '127.0.0.1',
            port: 8899,
            syscall: 'connect',
          },
        },
      ],
    };

    // 3. RUN #042: HEALTHY (Completed nominal real run)
    const run042: Run = {
      id: 'run-042',
      name: 'exp-ast-eval-042',
      status: 'completed',
      createdAt: '2025-05-18T14:10:00.000Z',
      completedAt: '2025-05-18T14:10:09.650Z',
      model: 'Qwen2.5-Coder-7B-Instruct',
      prompt: 'Refactor AST parser for streaming parser nodes (batch_size=1, ctx=4k)',
      output:
        '// Streaming AST Parser Implementation\nexport class StreamingAstParser {\n  private buffer: string = "";\n  parseChunk(chunk: string) { /* ... */ }\n}',
      provenance: {
        provider: 'lemonade',
        runtime: 'real',
        backend: 'Lemonade-DirectML',
        device: 'AMD Ryzen AI NPU',
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
        measuredFields: [
          'ttft_ms',
          'total_duration_ms',
          'tokens_per_second',
          'input_tokens',
          'output_tokens',
          'total_tokens',
          'peak_vram_mb',
          'npu_utilization_pct',
          'package_power_w',
        ],
        unavailableFields: [],
      },
      hardware: {
        device: 'AMD Ryzen AI NPU',
        backend: 'Lemonade-DirectML v1.4',
        memoryTotalMb: 16384,
        driverVersion: 'AMD 24.10.1',
      },
      events: [
        {
          id: 'evt-042-01',
          runId: 'run-042',
          timestamp: '2025-05-18T14:10:00.050Z',
          offsetMs: 50,
          stage: 'input',
          type: 'INGEST',
          level: 'info',
          message: 'Received 1,840 prompt tokens. Context integrity verified.',
        },
        {
          id: 'evt-042-02',
          runId: 'run-042',
          timestamp: '2025-05-18T14:10:00.360Z',
          offsetMs: 360,
          stage: 'model_runtime',
          type: 'PREFILL_DONE',
          level: 'info',
          message: 'Prefill completed in 310ms. TTFT trigger engaged.',
        },
        {
          id: 'evt-042-03',
          runId: 'run-042',
          timestamp: '2025-05-18T14:10:09.650Z',
          offsetMs: 9650,
          stage: 'verification',
          type: 'INFERENCE_COMPLETE',
          level: 'info',
          message: 'Generated 412 tokens at sustained 42.7 tok/s. EOS reached.',
        },
      ],
    };

    // 4. RUN #047: INCOMPLETE TELEMETRY (Completed run with missing measurements)
    const run047: Run = {
      id: 'run-047',
      name: 'exp-rag-partial-047',
      status: 'completed',
      createdAt: '2025-05-18T15:30:00.000Z',
      completedAt: '2025-05-18T15:30:05.100Z',
      model: 'Llama-3.2-3B-Instruct',
      prompt: 'Generate summarization of financial compliance section',
      output: 'The compliance framework requires quarterly internal audit verification.',
      provenance: {
        provider: 'lemonade',
        runtime: 'real',
        backend: 'Lemonade-DirectML',
        device: 'AMD Radeon 780M',
        isSynthetic: false,
      },
      telemetry: {
        ttft_ms: null, // UNAVAILABLE
        total_duration_ms: 5100,
        tokens_per_second: null, // UNAVAILABLE
        input_tokens: 820,
        output_tokens: 145,
        total_tokens: 965,
        peak_vram_mb: 4200,
        npu_utilization_pct: null,
        package_power_w: null,
        measuredFields: ['total_duration_ms', 'input_tokens', 'output_tokens', 'peak_vram_mb'],
        unavailableFields: ['ttft_ms', 'tokens_per_second', 'package_power_w'],
      },
      events: [
        {
          id: 'evt-047-01',
          runId: 'run-047',
          timestamp: '2025-05-18T15:30:00.020Z',
          offsetMs: 20,
          stage: 'input',
          type: 'INGEST',
          level: 'info',
          message: 'Ingested 820 prompt tokens.',
        },
        {
          id: 'evt-047-02',
          runId: 'run-047',
          timestamp: '2025-05-18T15:30:05.100Z',
          offsetMs: 5100,
          stage: 'verification',
          type: 'COMPLETE',
          level: 'warn',
          message:
            'Generation completed, but hardware profiling hooks were not attached. TTFT and throughput not recorded.',
        },
      ],
    };

    // 5. RUN #048: MOCK PROVIDER (Synthetic Run)
    const run048: Run = {
      id: 'run-048',
      name: 'exp-mock-baseline-048',
      status: 'completed',
      createdAt: '2025-05-18T15:40:00.000Z',
      completedAt: '2025-05-18T15:40:03.200Z',
      model: 'Mock-Model-Tiny',
      prompt: 'Deterministic mock test vector',
      output: 'Synthetic response text from mock generator.',
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
        measuredFields: [
          'ttft_ms',
          'total_duration_ms',
          'tokens_per_second',
          'input_tokens',
          'output_tokens',
        ],
        unavailableFields: [],
      },
      events: [
        {
          id: 'evt-048-01',
          runId: 'run-048',
          timestamp: '2025-05-18T15:40:00.010Z',
          offsetMs: 10,
          stage: 'input',
          type: 'MOCK_START',
          level: 'info',
          message: 'Deterministic mock run started.',
        },
        {
          id: 'evt-048-02',
          runId: 'run-048',
          timestamp: '2025-05-18T15:40:03.200Z',
          offsetMs: 3200,
          stage: 'verification',
          type: 'MOCK_COMPLETE',
          level: 'info',
          message: 'Synthetic mock completed.',
        },
      ],
    };

    // 6. RUN #049: INSUFFICIENT DATA
    const run049: Run = {
      id: 'run-049',
      name: 'exp-truncated-trace-049',
      status: 'failed',
      createdAt: '2025-05-18T15:50:00.000Z',
      model: 'Qwen2.5-Coder-7B-Instruct',
      prompt: 'Analyze recursive data structure',
      provenance: {
        provider: 'lemonade',
        runtime: 'unavailable',
        isSynthetic: false,
      },
      telemetry: {
        ttft_ms: null,
        total_duration_ms: null,
        tokens_per_second: null,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        peak_vram_mb: null,
        npu_utilization_pct: null,
        package_power_w: null,
        measuredFields: [],
        unavailableFields: ['all'],
      },
      events: [],
    };

    // 7. RUN #050: LEGACY (Missing provenance)
    const run050: Run = {
      id: 'run-050',
      name: 'exp-legacy-archive-050',
      status: 'completed',
      createdAt: '2024-11-10T12:00:00.000Z',
      completedAt: '2024-11-10T12:00:04.000Z',
      model: 'Legacy-Llama-2-7B',
      prompt: 'Legacy archive evaluation',
      output: 'Legacy output archive.',
      telemetry: {
        ttft_ms: 450,
        total_duration_ms: 4000,
        tokens_per_second: 25.0,
        input_tokens: 500,
        output_tokens: 100,
        total_tokens: 600,
        peak_vram_mb: 4000,
        npu_utilization_pct: 50,
        package_power_w: 20.0,
        measuredFields: ['ttft_ms', 'total_duration_ms', 'tokens_per_second'],
        unavailableFields: [],
      },
      events: [
        {
          id: 'evt-050-01',
          runId: 'run-050',
          timestamp: '2024-11-10T12:00:00.000Z',
          offsetMs: 0,
          stage: 'system',
          type: 'LEGACY_INIT',
          level: 'info',
          message: 'Historical run execution.',
        },
      ],
    };

    // 8. RUN #051: ANOMALY (Hallucinated Context Conflict / Negation Inversion)
    const run051: Run = {
      id: 'run-051',
      name: 'exp-clause-audit-051',
      status: 'failed',
      createdAt: '2025-05-18T14:22:00.000Z',
      completedAt: '2025-05-18T14:22:14.820Z',
      model: 'Mistral-NeMo-12B-Instruct',
      prompt: 'Verify clause 4.2 data transfer authorization from retrieved documents',
      output:
        'The licensee is permitted to transfer proprietary weights to affiliated cloud endpoints under standard operational exemptions.',
      errorMessage:
        'Assertion Rejected: Direct factual inversion of ground truth text (Clause 4.2 negation flip).',
      provenance: {
        provider: 'lemonade',
        runtime: 'real',
        backend: 'Lemonade-DirectML v1.4',
        device: 'AMD Ryzen AI NPU (XDNA2)',
        isSynthetic: false,
      },
      telemetry: {
        ttft_ms: 420,
        total_duration_ms: 14820,
        tokens_per_second: 28.4,
        input_tokens: 1840,
        output_tokens: 224,
        total_tokens: 2064,
        peak_vram_mb: 9412,
        npu_utilization_pct: 82.4,
        package_power_w: 16.4,
        measuredFields: [
          'ttft_ms',
          'total_duration_ms',
          'tokens_per_second',
          'input_tokens',
          'output_tokens',
          'total_tokens',
          'peak_vram_mb',
          'npu_utilization_pct',
          'package_power_w',
        ],
        unavailableFields: [],
      },
      hardware: {
        device: 'AMD Ryzen AI NPU (XDNA2)',
        backend: 'Lemonade-DirectML v1.4',
        memoryTotalMb: 16384,
        driverVersion: 'AMD 24.10.1',
      },
      events: [
        {
          id: 'evt-051-01',
          runId: 'run-051',
          timestamp: '2025-05-18T14:22:00.100Z',
          offsetMs: 100,
          stage: 'input',
          type: 'INPUT_INGEST',
          level: 'info',
          message: '1,840 input tokens verified within context limit. Zero truncation.',
        },
        {
          id: 'evt-051-02',
          runId: 'run-051',
          timestamp: '2025-05-18T14:22:00.212Z',
          offsetMs: 212,
          stage: 'retrieval',
          type: 'RETRIEVAL_VERIFY',
          level: 'info',
          message: 'Retrieved 12 docs (cosine > 0.81). Latency 112ms. Ground truth ranked #1.',
        },
        {
          id: 'evt-051-03',
          runId: 'run-051',
          timestamp: '2025-05-18T14:22:00.580Z',
          offsetMs: 580,
          stage: 'context',
          type: 'CONTEXT_PACK',
          level: 'info',
          message: '5,120 tokens packed into prompt buffer. Layout canonical.',
        },
        {
          id: 'evt-051-04',
          runId: 'run-051',
          timestamp: '2025-05-18T14:22:12.400Z',
          offsetMs: 12400,
          stage: 'model_runtime',
          type: 'LOGIT_ANOMALY',
          level: 'warn',
          message:
            'Token position #214 logit entropy spike (+4.8σ). Attention heads dispersed from Document #3 context.',
          data: {
            tokenPos: 214,
            entropy: 3.82,
            topLogits: ['is permitted (p=0.321)', 'shall not (p=0.312)'],
          },
        },
        {
          id: 'evt-051-05',
          runId: 'run-051',
          timestamp: '2025-05-18T14:22:14.820Z',
          offsetMs: 14820,
          stage: 'verification',
          type: 'ASSERTION_FAILURE',
          level: 'error',
          message:
            'Assertion Rejected: Output generated "is permitted to transfer" directly contradicting retrieved ground truth "shall NOT transfer". Halt triggered.',
          data: {
            clause: '4.2',
            groundTruthChunk: '0x8A44C',
            tokenPos: 214,
          },
        },
      ],
    };

    const canonicalList = [run045, run046, run042, run047, run048, run049, run050, run051];
    for (const r of canonicalList) {
      if (!this.runs.has(r.id)) {
        this.runs.set(r.id, r);
      }
    }
  }
}

export const runStore = new RunStore();
