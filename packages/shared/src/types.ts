/**
 * Lemonade Flight Recorder — Shared Type Definitions
 * Milestone 6: Experiment Engine, Benchmarking, Failure Diagnostics & Telemetry
 */

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export type DiagnosticCategory =
  | 'connection'
  | 'runtime'
  | 'model'
  | 'backend'
  | 'input'
  | 'generation'
  | 'telemetry'
  | 'persistence'
  | 'configuration'
  | 'unknown';

export interface DiagnosticEvidence {
  source: 'run' | 'event' | 'metric' | 'provenance' | 'runtime' | 'hardware';
  field: string;
  value?: string | number | boolean | null;
  description: string;
  eventId?: string;
}

export interface DiagnosticFinding {
  id: string;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  title: string;
  summary: string;
  evidence: DiagnosticEvidence[];
  nextInspection?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export type OverallDiagnosticStatus =
  | 'healthy'
  | 'degraded'
  | 'failed'
  | 'blocked'
  | 'insufficient-data';

export interface RunDiagnostics {
  runId: string;
  generatedAt: string;
  overallStatus: OverallDiagnosticStatus;
  stageAtFailure?: string;
  findings: DiagnosticFinding[];
  unavailableFields?: string[];
  observableSummary: string;
}

export type RunStatus = 'running' | 'completed' | 'failed' | 'blocked' | 'aborted';

export type RuntimeEnvironment = 'real' | 'mock' | 'blocked' | 'unavailable' | 'unknown';

export type ProviderType = 'lemonade' | 'mock';

export interface Provenance {
  provider: ProviderType;
  runtime: RuntimeEnvironment;
  host?: string;
  port?: number;
  backend?: string;
  device?: string;
  verifiedAt?: string;
  isSynthetic: boolean;
  legacy?: boolean;
}

export interface MeasuredTelemetry {
  ttft_ms: number | null;
  total_duration_ms: number | null;
  tokens_per_second: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  peak_vram_mb: number | null;
  npu_utilization_pct: number | null;
  package_power_w: number | null;
  /** Explicit registry of which metric fields were physically or synthetically measured */
  measuredFields: string[];
  /** Explicit registry of which metric fields could not be measured by the runtime */
  unavailableFields: string[];
}

export type PipelineStage =
  | 'input'
  | 'retrieval'
  | 'context'
  | 'model_runtime'
  | 'verification'
  | 'system';

export interface RunEvent {
  id: string;
  runId: string;
  timestamp: string;
  offsetMs: number;
  stage: PipelineStage;
  type: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

export interface Run {
  id: string;
  name: string;
  status: RunStatus;
  createdAt: string;
  completedAt?: string;
  model: string;
  prompt: string;
  output?: string;
  errorMessage?: string;
  errorCode?: string | number;
  provenance?: Provenance;
  telemetry?: MeasuredTelemetry;
  replayOf?: string;
  experimentId?: string;
  trialIndex?: number;
  events?: RunEvent[];
  hardware?: {
    device: string;
    backend: string;
    memoryTotalMb?: number;
    driverVersion?: string;
  };
}

// --------------------------------------------------------------------------
// Milestone 6: Experiment Engine & Benchmarking Types
// --------------------------------------------------------------------------

export type MetricSemantics = 'MEASURED' | 'DERIVED' | 'UNAVAILABLE';

export interface StatisticalMetric {
  semantics: MetricSemantics;
  n: number;
  min: number | null;
  median: number | null;
  mean: number | null;
  max: number | null;
  stdDev: number | null;
  unit: string;
}

export type ExperimentStatus =
  | 'draft'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed';

export interface ExperimentWorkload {
  input: string;
  repeatCount: number;
  description?: string;
}

export interface ExperimentConfiguration {
  model: string;
  backend?: string;
  device?: string;
  provider?: ProviderType;
}

export interface ExperimentProvenanceSummary {
  real: number;
  mock: number;
  blocked: number;
  unavailable: number;
  legacy: number;
}

export interface ExperimentMetricsSummary {
  durationMs?: StatisticalMetric;
  ttftMs?: StatisticalMetric;
  tokensPerSecond?: StatisticalMetric;
  totalTokens?: StatisticalMetric;
  peakVramMb?: StatisticalMetric;
}

export interface ExperimentSummary {
  requestedTrials: number;
  completedTrials: number;
  failedTrials: number;
  blockedTrials: number;
  unavailableTrials: number;
  provenanceDistribution: ExperimentProvenanceSummary;
  metrics: ExperimentMetricsSummary;
  unavailableMetrics: string[];
  model: string;
  hardware?: {
    device: string;
    backend: string;
  };
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: ExperimentStatus;
  workload: ExperimentWorkload;
  configuration: ExperimentConfiguration;
  runIds: string[];
  summary?: ExperimentSummary;
}

// --------------------------------------------------------------------------
// Milestone 7: Reproducible Research Reports & Submission Showcase Types
// --------------------------------------------------------------------------

export type ProvenanceClassification =
  | 'REAL'
  | 'MOCK'
  | 'BLOCKED'
  | 'UNAVAILABLE'
  | 'LEGACY';

export interface ReportProvenanceItem {
  runId: string;
  trialIndex?: number;
  provider: ProviderType;
  runtime: RuntimeEnvironment;
  status: RunStatus;
  isSynthetic: boolean;
  classification: ProvenanceClassification;
  device?: string;
  backend?: string;
}

export interface ReportMeasurementItem {
  metric: string;
  value: number | string | null;
  unit: string;
  semantics: MetricSemantics;
  source: string;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface ReportTrialRow {
  trialIndex: number;
  runId: string;
  status: RunStatus;
  runtime: RuntimeEnvironment;
  provider: ProviderType;
  classification: ProvenanceClassification;
  durationMs: number | null;
  ttftMs: number | null;
  tokensPerSecond: number | null;
  totalTokens: number | null;
  peakVramMb: number | null;
  diagnosticsStatus?: OverallDiagnosticStatus;
  primaryFinding?: string;
}

export interface ReportDiagnosticItem {
  id: string;
  runId: string;
  trialIndex?: number;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  title: string;
  summary: string;
  evidence: DiagnosticEvidence[];
  nextInspection?: string;
}

export interface ReportReplayNode {
  runId: string;
  name: string;
  replayOf?: string;
  experimentId?: string;
  trialIndex?: number;
  status: RunStatus;
  classification: ProvenanceClassification;
}

export interface ReportComparisonItem {
  trialAId: string;
  trialBId: string;
  trialAName: string;
  trialBName: string;
  trialAIndex: number;
  trialBIndex: number;
  latencyDeltaMs: number | null;
  ttftDeltaMs: number | null;
  tpsDelta: number | null;
  vramDeltaMb: number | null;
  note?: string;
}

export interface ReportMethodology {
  workload: ExperimentWorkload | Record<string, unknown>;
  configuration: ExperimentConfiguration | Record<string, unknown>;
  repeatCount: number;
  trialOrdering: string;
  executionMode: string;
  measurementMethodology: string;
  aggregationMethodology: string;
}

export interface ReportEnvironment {
  provider: string;
  runtime: string;
  backend: string;
  hardware: {
    cpu?: string;
    gpu?: string;
    npu?: string;
    ram?: string;
    vram?: string;
    device?: string;
  };
  model: string;
  os: string;
  appVersion: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  description?: string;
  generatedAt: string;
  experimentId?: string;
  runIds: string[];

  executiveSummary: string;
  objective: string;
  methodology: ReportMethodology;
  environment: ReportEnvironment;

  provenance: {
    runs: ReportProvenanceItem[];
    distribution: ExperimentProvenanceSummary;
    isSyntheticOrUnverified: boolean;
  };

  measurements: {
    metrics: ReportMeasurementItem[];
    semantics: MetricSemantics;
  };

  statistics?: {
    metrics: ExperimentMetricsSummary;
    requestedTrials: number;
    completedTrials: number;
    failedTrials: number;
    blockedTrials: number;
    unavailableTrials: number;
  };

  trialMatrix: ReportTrialRow[];
  diagnostics: ReportDiagnosticItem[];
  replayLineage: ReportReplayNode[];
  comparisons: ReportComparisonItem[];

  limitations: string[];
  conclusion: string;
}

export interface ReproducibilityBundleManifest {
  manifestVersion: string;
  reportId: string;
  experimentId?: string;
  generatedAt: string;
  checksum: string;
  provenanceClassification: ProvenanceClassification;
  files: string[];
}

