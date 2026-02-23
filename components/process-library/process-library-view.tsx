"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { valueChainAccent, valueChainOrder } from "@/lib/mock-data";
import { listStoredProcesses, removeStoredProcessById } from "@/lib/storage";
import type { StoredProcess, ValueChain } from "@/lib/types";

const stageNarrative: Record<ValueChain, string> = {
  "Inbox Intake": "Entry-point processes for inbound broker communication.",
  "Document Parsing": "Workflows that normalize and classify submission artifacts.",
  "Submission Structuring": "Templates that shape extracted data into canonical submission objects.",
  Validation: "Checks for completeness, confidence, and appetite alignment.",
  "Broker Follow-Up": "Operational loops to request and chase missing submission data.",
  "Underwriter Handoff": "Decision-ready packaging and routing into underwriting queues."
};

function formatUpdatedAt(isoDate: string) {
  return new Date(isoDate).toLocaleString();
}

export function ProcessLibraryView() {
  const [processes, setProcesses] = useState<StoredProcess[]>([]);

  const loadProcesses = useCallback(() => {
    setProcesses(listStoredProcesses());
  }, []);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const grouped = useMemo(() => {
    const map = new Map<ValueChain, StoredProcess[]>();

    valueChainOrder.forEach((valueChain) => {
      map.set(valueChain, []);
    });

    processes.forEach((process) => {
      const existing = map.get(process.valueChain);
      if (!existing) {
        return;
      }
      existing.push(process);
    });

    return map;
  }, [processes]);

  const libraryStats = useMemo(() => {
    const totalNodes = processes.reduce((sum, process) => sum + process.nodeCount, 0);
    const totalConnections = processes.reduce(
      (sum, process) => sum + process.edgeCount,
      0
    );
    const followUpHeavy = processes.filter((process) => process.edgeCount >= 5).length;

    return {
      processCount: processes.length,
      totalNodes,
      totalConnections,
      followUpHeavy
    };
  }, [processes]);

  return (
    <main className="page-shell">
      <section className="library-hero card-surface">
        <p className="page-eyebrow">Playbook Library</p>
        <h1 className="page-title">Saved intake playbooks grouped by underwriting stage.</h1>
        <p className="page-copy">
          Versioned process templates for submission intake. Open any playbook in the
          Intake Builder to continue iterating.
        </p>
        <div className="hero-actions">
          <Link href="/builder" className="btn btn--primary">
            New Intake Playbook
          </Link>
          <button type="button" className="btn btn--ghost" onClick={loadProcesses}>
            Refresh
          </button>
        </div>
        <div className="hero-kpis">
          <div className="hero-kpi">
            <span className="hero-kpi__value">{libraryStats.processCount}</span>
            <span className="hero-kpi__label">Saved playbooks</span>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi__value">{libraryStats.totalNodes}</span>
            <span className="hero-kpi__label">Total modules</span>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi__value">{libraryStats.followUpHeavy}</span>
            <span className="hero-kpi__label">Loop-heavy templates</span>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi__value">{libraryStats.totalConnections}</span>
            <span className="hero-kpi__label">Total transitions</span>
          </div>
        </div>
      </section>

      {processes.length === 0 ? (
        <section className="empty-state card-surface">
          <h2>No intake playbooks saved yet</h2>
          <p>
            Build your first underwriting intake flow in the Intake Builder and save it
            as a reusable playbook.
          </p>
          <Link href="/builder" className="btn btn--primary">
            Go to Builder
          </Link>
        </section>
      ) : null}

      <section className="library-grid">
        {valueChainOrder.map((valueChain) => {
          const items = grouped.get(valueChain) ?? [];
          if (items.length === 0) {
            return null;
          }

          return (
            <section key={valueChain} className="library-group card-surface">
              <div className="library-group__header">
                <div>
                  <h2>{valueChain}</h2>
                  <p className="library-group__copy">{stageNarrative[valueChain]}</p>
                </div>
                <span>{items.length} playbook(s)</span>
              </div>

              <div className="library-cards">
                {items.map((process) => (
                  <article
                    key={process.id}
                    className="library-card"
                    style={
                      {
                        "--library-accent": valueChainAccent[valueChain]
                      } as CSSProperties
                    }
                  >
                    <h3>{process.name}</h3>
                    <p>
                      v{process.version} | {process.nodeCount} modules | {process.edgeCount}{" "}
                      transitions
                    </p>
                    <p>Updated: {formatUpdatedAt(process.updatedAt)}</p>

                    <div className="library-card__actions">
                      <Link href={`/builder?id=${process.id}`} className="btn btn--primary">
                        Open in Builder
                      </Link>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          removeStoredProcessById(process.id);
                          loadProcesses();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
