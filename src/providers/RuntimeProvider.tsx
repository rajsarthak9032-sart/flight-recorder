/**
 * Runtime Provider
 * Milestone 5: Global state for Lemonade Connection, Inference Runtime, Runs, and Failure Diagnostics
 */

import type { Run, RunDiagnostics } from '../../packages/shared/src/types.js';

export interface RuntimeContextValue {
  lemonadeServer: {
    connected: boolean;
    host: string;
    port: number;
    latencyMs: number;
  };
  inferenceRuntime: {
    state: 'ready' | 'blocked' | 'unavailable' | 'checking';
    backend: string;
    device: string;
    detail: string;
  };
  activeRun: Run | null;
  activeDiagnostics: RunDiagnostics | null;
  runs: Run[];
  isLoading: boolean;
  refreshRuns: () => Promise<void>;
  selectRun: (id: string) => Promise<void>;
}

// In the browser / vanilla script integration, this can be accessed via window.RuntimeContext
export const defaultRuntimeState: RuntimeContextValue = {
  lemonadeServer: {
    connected: true,
    host: '127.0.0.1',
    port: 8899,
    latencyMs: 4,
  },
  inferenceRuntime: {
    state: 'ready',
    backend: 'Lemonade-DirectML',
    device: 'AMD Ryzen AI NPU (XDNA2)',
    detail: 'DirectML driver operational.',
  },
  activeRun: null,
  activeDiagnostics: null,
  runs: [],
  isLoading: false,
  refreshRuns: async () => {},
  selectRun: async () => {},
};
