"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { valueChainAccent, valueChainOrder } from "@/lib/mock-data";
import { listStoredProcesses, removeStoredProcessById } from "@/lib/storage";
import type { StoredProcess, ValueChain } from "@/lib/types";

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
        map.set(process.valueChain, [process]);
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

    return {
      processCount: processes.length,
      totalNodes,
      totalConnections
    };
  }, [processes]);

  return (
    <main className="page-shell">
      <section className="library-hero card-surface">
        <p className="page-eyebrow">Process Library</p>
        <h1 className="page-title">Saved flows grouped by insurance value chain.</h1>
        <p className="page-copy">
          Stored locally for now. Open any process in the builder to continue editing.
        </p>
        <div className="hero-actions">
          <Link href="/builder" className="btn btn--primary">
            New Process
          </Link>
          <button type="button" className="btn btn--ghost" onClick={loadProcesses}>
            Refresh
          </button>
        </div>
        <div className="hero-kpis">
          <div className="hero-kpi">
            <span className="hero-kpi__value">{libraryStats.processCount}</span>
            <span className="hero-kpi__label">Saved processes</span>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi__value">{libraryStats.totalNodes}</span>
            <span className="hero-kpi__label">Total nodes</span>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi__value">{libraryStats.totalConnections}</span>
            <span className="hero-kpi__label">Total connections</span>
          </div>
        </div>
      </section>

      {processes.length === 0 ? (
        <section className="empty-state card-surface">
          <h2>No saved processes yet</h2>
          <p>
            Build your first flow in the Process Builder and click <strong>Save
            Process</strong>.
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
                <h2>{valueChain}</h2>
                <span>{items.length} process(es)</span>
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
                      v{process.version} | {process.nodeCount} nodes | {process.edgeCount}{" "}
                      connections
                    </p>
                    <p>Updated: {formatUpdatedAt(process.updatedAt)}</p>

                    <div className="library-card__actions">
                      <Link
                        href={`/builder?id=${process.id}`}
                        className="btn btn--primary"
                      >
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
