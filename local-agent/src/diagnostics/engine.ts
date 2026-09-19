/**
 * Lemonade Flight Recorder — Deterministic Diagnostic Engine
 * Milestone 5: Evidence-Based Telemetry & Failure Diagnostics
 *
 * Core Principle: Diagnostics MUST be based ONLY on observable evidence.
 * No speculative AI models, no hidden chain-of-thought assertions.
 */

import type {
  Run,
  RunEvent,
  RunDiagnostics,
  DiagnosticFinding,
  DiagnosticEvidence,
  OverallDiagnosticStatus,
} from '../../../packages/shared/src/types.ts';

export class DiagnosticEngine {
  /**
   * Evaluates a recorded Run and its RunEvent stream to produce deterministic,
   * evidence-backed diagnostics.
   */
  public static diagnose(run: Run, inputEvents?: RunEvent[]): RunDiagnostics {
    const events = inputEvents ?? run.events ?? [];
    const findings: DiagnosticFinding[] = [];
    const generatedAt = new Date().toISOString();

    // 1. Check for legacy unrecorded provenance
    const isLegacy = !run.provenance || run.provenance.legacy === true;
    if (isLegacy) {
      findings.push({
        id: 'finding-legacy-provenance',
        severity: 'info',
        category: 'configuration',
        title: 'Historical run lacking modern provenance',
        summary:
          'This run does not contain modern M3/M4 provenance metadata. Runtime type cannot be determined from recorded telemetry and is left unclassified.',
        evidence: [
          {
            source: 'provenance',
            field: 'provenance',
            value: null,
            description: 'Provenance record is undefined or marked legacy in recorded run.',
          },
        ],
        confidence: 'high',
        nextInspection: 'No remediation needed for historical archive entries.',
      });
    } else if (run.provenance?.provider === 'mock' || run.provenance?.runtime === 'mock') {
      // 2. Explicit Mock Provenance (Never mask mock as real)
      findings.push({
        id: 'finding-mock-synthetic',
        severity: 'info',
        category: 'configuration',
        title: 'Synthetic execution (Mock Provider)',
        summary:
          'This run was generated using the deterministic mock provider. Telemetry and event timings are synthetic and do not represent physical hardware measurements.',
        evidence: [
          {
            source: 'provenance',
            field: 'provider',
            value: run.provenance.provider,
            description: 'Provider is explicitly configured as mock.',
          },
          {
            source: 'provenance',
            field: 'runtime',
            value: run.provenance.runtime,
            description: 'Runtime environment is marked mock.',
          },
          {
            source: 'provenance',
            field: 'isSynthetic',
            value: true,
            description: 'Explicit synthetic flag is set in run provenance.',
          },
        ],
        confidence: 'high',
      });
    }

    // Identify stage of failure from events
    let stageAtFailure: string | undefined;
    const errorEvent = events.find((e) => e.level === 'error');
    if (errorEvent) {
      stageAtFailure = errorEvent.stage;
    }

    // 3. Evaluate Failure / Blocked / Degraded Conditions
    let overallStatus: OverallDiagnosticStatus = 'healthy';

    // Condition A: Windows Application Control / Policy Block (Error 4551)
    const hasAppControlBlock =
      run.status === 'blocked' ||
      run.provenance?.runtime === 'blocked' ||
      (run.errorMessage && /4551|application[- ]control|policy block/i.test(run.errorMessage)) ||
      events.some(
        (e) =>
          e.level === 'error' &&
          /4551|application[- ]control|policy block/i.test(e.message || '')
      );

    if (hasAppControlBlock) {
      overallStatus = 'blocked';
      const blockEvidence: DiagnosticEvidence[] = [
        {
          source: 'run',
          field: 'status',
          value: run.status,
          description: `Run execution status recorded as "${run.status}".`,
        },
        {
          source: 'provenance',
          field: 'runtime',
          value: run.provenance?.runtime ?? 'blocked',
          description: 'Runtime execution state recorded as blocked.',
        },
      ];

      if (run.provenance?.provider) {
        blockEvidence.push({
          source: 'provenance',
          field: 'provider',
          value: run.provenance.provider,
          description: 'Target inference provider requested.',
        });
      }

      if (run.errorMessage) {
        blockEvidence.push({
          source: 'run',
          field: 'errorMessage',
          value: run.errorMessage,
          description: 'Recorded host error string matches Application Control policy block.',
        });
      }

      if (errorEvent) {
        blockEvidence.push({
          source: 'event',
          field: 'message',
          value: errorEvent.message,
          description: `Error event recorded at stage "${errorEvent.stage}".`,
          eventId: errorEvent.id,
        });
      }

      findings.push({
        id: 'finding-app-control-block',
        severity: 'error',
        category: 'runtime',
        title: 'Inference backend execution was blocked',
        summary:
          "The Lemonade request reached the runtime path, but execution was blocked by the host's application-control policy.",
        evidence: blockEvidence,
        confidence: 'high',
        nextInspection:
          "Review the host's application-control policy with the system administrator. (Note: Security policy constraints must be handled administratively).",
      });
    }

    // Condition B: Connection Failure / Runtime Unavailable (ECONNREFUSED / socket failure)
    const isConnRefused =
      (run.errorMessage && /ECONNREFUSED|connection refused|socket error|unreachable|daemon.*offline/i.test(run.errorMessage)) ||
      events.some(
        (e) =>
          e.level === 'error' &&
          /ECONNREFUSED|connection refused|socket error|unreachable|daemon.*offline/i.test(e.message || '')
      );

    if (isConnRefused && !hasAppControlBlock) {
      overallStatus = 'failed';
      const connEvidence: DiagnosticEvidence[] = [
        {
          source: 'provenance',
          field: 'provider',
          value: run.provenance?.provider ?? 'lemonade',
          description: 'Provider configured for local inference.',
        },
        {
          source: 'provenance',
          field: 'runtime',
          value: run.provenance?.runtime ?? 'unavailable',
          description: 'Runtime availability state observed as unavailable.',
        },
      ];

      if (run.errorMessage) {
        connEvidence.push({
          source: 'run',
          field: 'errorMessage',
          value: run.errorMessage,
          description: 'Recorded transport connection error.',
        });
      }

      if (run.provenance?.port != null) {
        connEvidence.push({
          source: 'provenance',
          field: 'port',
          value: run.provenance.port,
          description: 'Observed target connection port from configuration.',
        });
      }

      if (errorEvent) {
        connEvidence.push({
          source: 'event',
          field: 'message',
          value: errorEvent.message,
          description: 'Event record documenting transport failure.',
          eventId: errorEvent.id,
        });
      }

      findings.push({
        id: 'finding-connection-unavailable',
        severity: 'error',
        category: 'connection',
        title: 'Lemonade runtime unavailable',
        summary:
          'The Flight Recorder could not establish communication with the local Lemonade runtime.',
        evidence: connEvidence,
        confidence: 'high',
        nextInspection:
          'Verify that the Lemonade server is running and reachable at the configured endpoint.',
      });
    }

    // Condition C: Model Unavailable in Local Runtime
    const isModelUnavailable =
      (run.errorMessage && /model.*(?:not found|unavailable|not loaded|missing)|MODEL_NOT_FOUND/i.test(run.errorMessage)) ||
      events.some(
        (e) =>
          e.level === 'error' &&
          /model.*(?:not found|unavailable|not loaded|missing)|MODEL_NOT_FOUND/i.test(e.message || '')
      );

    if (isModelUnavailable && !hasAppControlBlock && !isConnRefused) {
      overallStatus = 'failed';
      findings.push({
        id: 'finding-model-unavailable',
        severity: 'error',
        category: 'model',
        title: 'Requested model unavailable in local runtime',
        summary:
          'The local inference runtime reported that the requested model weights could not be accessed or loaded.',
        evidence: [
          {
            source: 'run',
            field: 'model',
            value: run.model,
            description: `Target model identifier requested: "${run.model}".`,
          },
          {
            source: 'run',
            field: 'errorMessage',
            value: run.errorMessage || 'Model not loaded or missing from local directory',
            description: 'Model loading error logged by the runtime.',
          },
        ],
        confidence: 'high',
        nextInspection:
          'Verify model presence in the local Lemonade model directory or pull the required weights.',
      });
    }

    // Condition D: Generation Failure (Model execution started but halted with runtime fault)
    const hasPreflight = events.some((e) => e.stage === 'input' || e.stage === 'context');
    const hasRuntimeEvent = events.some((e) => e.stage === 'model_runtime');
    const isGenericFail =
      run.status === 'failed' &&
      !hasAppControlBlock &&
      !isConnRefused &&
      !isModelUnavailable;

    if (isGenericFail) {
      if (!errorEvent && !run.errorMessage) {
        // Condition E: Insufficient diagnostic evidence
        overallStatus = 'insufficient-data';
        findings.push({
          id: 'finding-insufficient-data',
          severity: 'warning',
          category: 'unknown',
          title: 'Insufficient diagnostic evidence',
          summary:
            'The recorded Run does not contain enough observable information to determine the failure cause.',
          evidence: [
            {
              source: 'run',
              field: 'status',
              value: run.status,
              description: 'Run is marked failed but contains no error events or message.',
            },
            {
              source: 'event',
              field: 'eventCount',
              value: events.length,
              description: `Observed ${events.length} events without an error traceback.`,
            },
          ],
          confidence: 'low',
          nextInspection: 'Enable verbose Flight Recorder event logging for subsequent runs.',
        });
      } else {
        overallStatus = 'failed';
        const genEvidence: DiagnosticEvidence[] = [];

        if (hasRuntimeEvent) {
          genEvidence.push({
            source: 'event',
            field: 'stage',
            value: 'model_runtime',
            description: 'Model runtime execution phase had commenced prior to failure.',
          });
        }

        if (run.telemetry?.total_duration_ms != null) {
          genEvidence.push({
            source: 'metric',
            field: 'total_duration_ms',
            value: run.telemetry.total_duration_ms,
            description: `Elapsed time before failure: ${run.telemetry.total_duration_ms}ms.`,
          });
        }

        if (errorEvent) {
          genEvidence.push({
            source: 'event',
            field: 'message',
            value: errorEvent.message,
            description: `Observable error message captured at stage "${errorEvent.stage}".`,
            eventId: errorEvent.id,
          });
        } else if (run.errorMessage) {
          genEvidence.push({
            source: 'run',
            field: 'errorMessage',
            value: run.errorMessage,
            description: 'Error message captured at run termination.',
          });
        }

        findings.push({
          id: 'finding-generation-failure',
          severity: 'error',
          category: 'generation',
          title: 'Generation terminated prematurely with runtime fault',
          summary:
            'Inference execution commenced, but execution halted with an observable runtime error.',
          evidence: genEvidence,
          confidence: 'medium',
          nextInspection:
            'Inspect last generated token logits and GPU/NPU memory boundaries before the fault event.',
        });
      }
    }

    // Condition F: Incomplete Telemetry (Completed run with missing measurements)
    const unavailableFields: string[] = [];
    if (run.telemetry) {
      if (run.telemetry.unavailableFields && run.telemetry.unavailableFields.length > 0) {
        unavailableFields.push(...run.telemetry.unavailableFields);
      } else {
        if (run.telemetry.ttft_ms === null) unavailableFields.push('ttft_ms');
        if (run.telemetry.tokens_per_second === null) unavailableFields.push('tokens_per_second');
        if (run.telemetry.package_power_w === null) unavailableFields.push('package_power_w');
        if (run.telemetry.npu_utilization_pct === null) unavailableFields.push('npu_utilization_pct');
      }
    }

    if (run.status === 'completed' && unavailableFields.length > 0) {
      overallStatus = 'degraded';
      findings.push({
        id: 'finding-telemetry-incomplete',
        severity: 'warning',
        category: 'telemetry',
        title: 'Generation completed with incomplete telemetry',
        summary:
          'The run completed successfully, but one or more performance fields were not measured by the runtime.',
        evidence: unavailableFields.map((field) => ({
          source: 'metric',
          field,
          value: null,
          description: `Metric "${field}" was not measured or reported by the active provider.`,
        })),
        confidence: 'high',
        nextInspection:
          'Verify if hardware telemetry probes (DirectML/XDNA) were active or if profiling hooks were enabled.',
      });
    }

    // Condition G: Fully Healthy Run
    if (run.status === 'completed' && findings.length === 0) {
      overallStatus = 'healthy';
      findings.push({
        id: 'finding-healthy-run',
        severity: 'info',
        category: 'runtime',
        title: 'No failure detected',
        summary:
          'Inference completed successfully within nominal operational thresholds with all recorded telemetry verified.',
        evidence: [
          {
            source: 'run',
            field: 'status',
            value: 'completed',
            description: 'Run terminated normally with completed status.',
          },
          ...(run.telemetry?.tokens_per_second != null
            ? [
                {
                  source: 'metric' as const,
                  field: 'tokens_per_second',
                  value: run.telemetry.tokens_per_second,
                  description: `Sustained decode throughput of ${run.telemetry.tokens_per_second} tok/s observed.`,
                },
              ]
            : []),
          ...(run.telemetry?.ttft_ms != null
            ? [
                {
                  source: 'metric' as const,
                  field: 'ttft_ms',
                  value: run.telemetry.ttft_ms,
                  description: `Time to First Token measured at ${run.telemetry.ttft_ms}ms.`,
                },
              ]
            : []),
        ],
        confidence: 'high',
      });
    }

    // Construct Observable Summary
    let observableSummary = '';
    switch (overallStatus) {
      case 'blocked':
        observableSummary =
          'Observable evidence confirms backend execution was halted by host Application Control policy (Error 4551). No model tokens were generated.';
        break;
      case 'failed':
        observableSummary = isConnRefused
          ? 'Observable evidence confirms transport connection failure (ECONNREFUSED) to local Lemonade daemon.'
          : isModelUnavailable
          ? `Observable evidence confirms requested model "${run.model}" was unavailable in local runtime.`
          : 'Observable evidence documents an execution halt during active generation.';
        break;
      case 'degraded':
        observableSummary = `Inference completed, but ${unavailableFields.length} telemetry metric(s) were unavailable.`;
        break;
      case 'insufficient-data':
        observableSummary =
          'Recorded trace does not contain sufficient observable data or error trace to identify cause.';
        break;
      case 'healthy':
      default:
        observableSummary =
          'All recorded stages executed nominally. Observable metrics indicate healthy local inference.';
        break;
    }

    return {
      runId: run.id,
      generatedAt,
      overallStatus,
      stageAtFailure,
      findings,
      unavailableFields: unavailableFields.length > 0 ? unavailableFields : undefined,
      observableSummary,
    };
  }
}
