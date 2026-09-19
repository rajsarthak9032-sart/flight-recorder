/**
 * Lemonade Flight Recorder — Research Report Store
 * Milestone 7: Reproducible Research Reports Persistence and Canonical Seed Generation
 */

import fs from 'fs';
import path from 'path';
import type { ResearchReport } from '../../../packages/shared/src/types.ts';
import { experimentStore } from '../experiments/store.ts';
import { ReportEngine } from './engine.ts';

export class ReportStore {
  private reports: Map<string, ResearchReport> = new Map();
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath ?? path.resolve(process.cwd(), 'data', 'reports.json');
    this.initStore();
  }

  private initStore(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error('[ReportStore] Failed to create data directory:', err);
      }
    }

    if (fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: ResearchReport[] = JSON.parse(raw);
        for (const r of list) {
          this.reports.set(r.id, r);
        }
      } catch (err) {
        console.error('[ReportStore] Failed to parse existing reports file:', err);
      }
    }

    const countBefore = this.reports.size;
    this.seedCanonicalReports();
    if (this.reports.size > countBefore || !fs.existsSync(this.storagePath)) {
      this.persist();
    }
  }

  public getAll(): ResearchReport[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  public getById(id: string): ResearchReport | undefined {
    return this.reports.get(id);
  }

  public save(report: ResearchReport): void {
    this.reports.set(report.id, report);
    this.persist();
  }

  public delete(id: string): boolean {
    const deleted = this.reports.delete(id);
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
      const data = JSON.stringify(Array.from(this.reports.values()), null, 2);
      fs.writeFileSync(this.storagePath, data, 'utf-8');
    } catch (err) {
      console.error('[ReportStore] Failed to persist reports to disk:', err);
    }
  }

  public reload(): void {
    if (fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: ResearchReport[] = JSON.parse(raw);
        this.reports.clear();
        for (const r of list) {
          this.reports.set(r.id, r);
        }
      } catch (err) {
        console.error('[ReportStore] Failed to reload reports from disk:', err);
      }
    }
  }

  public clear(reseed = false): void {
    this.reports.clear();
    if (reseed) {
      this.seedCanonicalReports();
    }
    this.persist();
  }

  private seedCanonicalReports(): void {
    // Check if seed experiments exist and generate seed reports if missing
    try {
      if (!this.reports.has('rep-seed-001') && experimentStore.getById('exp-001')) {
        const rep1 = ReportEngine.generateFromExperiment('exp-001', {
          title: 'DirectML Silicon Throughput & Generation Baseline',
          description: 'Controlled statistical evaluation of Qwen2.5-Coder-7B-Instruct across 5 repeated inference trials on AMD Ryzen AI NPU.',
          objective: 'Establish a latency, TTFT, and throughput baseline with sample variance metrics on local DirectML acceleration.',
        });
        rep1.id = 'rep-seed-001';
        this.reports.set(rep1.id, rep1);
      }

      if (!this.reports.has('rep-seed-002') && experimentStore.getById('exp-002')) {
        const rep2 = ReportEngine.generateFromExperiment('exp-002', {
          title: 'Failure Diagnostics & Security Block Incident Audit',
          description: 'Multi-trial fault investigation capturing Windows Application Control binary blocking (Error 4551) and ECONNREFUSED states.',
          objective: 'Audit runtime fault classification and verify zero hallucination in failure diagnostic evidence logs.',
        });
        rep2.id = 'rep-seed-002';
        this.reports.set(rep2.id, rep2);
      }

      if (!this.reports.has('rep-demo-001') && experimentStore.getById('exp-004')) {
        const repDemo = ReportEngine.generateFromExperiment('exp-004', {
          title: 'Demonstration Suite: Synthetic Metrology & Replay Lineage',
          description: 'Deterministic showcase experiment demonstrating multi-trial aggregation, replay lineage tracking, and pairwise empirical comparisons.',
          objective: 'Demonstrate end-to-end report generation with explicit UNAVAILABLE semantics without claiming physical hardware execution.',
        });
        repDemo.id = 'rep-demo-001';
        this.reports.set(repDemo.id, repDemo);
      }
    } catch (err) {
      console.warn('[ReportStore] Could not auto-seed reports from experiments:', err);
    }
  }
}

export const reportStore = new ReportStore();
