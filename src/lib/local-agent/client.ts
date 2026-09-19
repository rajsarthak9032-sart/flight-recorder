/**
 * Frontend Client for Local Agent API
 * Milestone 5: Run retrieval, diagnostics querying, and telemetry streaming
 */

import type { Run, RunDiagnostics, RunEvent } from '../../../packages/shared/src/types.ts';

export class LocalAgentClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  public async getHealth(): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.baseUrl}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }

  public async getRuns(): Promise<Array<Partial<Run> & { diagnosticsSummary: Record<string, unknown> }>> {
    const res = await fetch(`${this.baseUrl}/api/runs`);
    if (!res.ok) throw new Error(`Failed to list runs: ${res.statusText}`);
    const data = await res.json();
    return data.runs;
  }

  public async getRun(id: string): Promise<{ run: Run; diagnostics: RunDiagnostics }> {
    const res = await fetch(`${this.baseUrl}/api/runs/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Failed to get run "${id}": ${res.statusText}`);
    return res.json();
  }

  public async getRunDiagnostics(id: string): Promise<RunDiagnostics> {
    const res = await fetch(`${this.baseUrl}/api/runs/${encodeURIComponent(id)}/diagnostics`);
    if (!res.ok) throw new Error(`Failed to get diagnostics for "${id}": ${res.statusText}`);
    return res.json();
  }

  public async getRunEvents(id: string): Promise<RunEvent[]> {
    const res = await fetch(`${this.baseUrl}/api/runs/${encodeURIComponent(id)}/events`);
    if (!res.ok) throw new Error(`Failed to get events for "${id}": ${res.statusText}`);
    const data = await res.json();
    return data.events;
  }

  public async createRun(payload: {
    model?: string;
    prompt: string;
    provider?: 'lemonade' | 'mock';
    runtime?: 'real' | 'mock';
  }): Promise<{ run: Run; diagnostics: RunDiagnostics }> {
    const res = await fetch(`${this.baseUrl}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to create run: ${res.statusText}`);
    return res.json();
  }

  public async replayRun(id: string): Promise<{ run: Run; diagnostics: RunDiagnostics }> {
    const res = await fetch(`${this.baseUrl}/api/runs/${encodeURIComponent(id)}/replay`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to replay run "${id}": ${res.statusText}`);
    return res.json();
  }
}

export const localAgentClient = new LocalAgentClient();
