"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  agentCatalog,
  connectorCatalog,
  valueChainAccent,
  valueChainOrder
} from "@/lib/mock-data";
import { queueMarketplaceAgent } from "@/lib/storage";
import type { AgentCatalogItem, AgentStatus, ValueChain } from "@/lib/types";

type ValueChainFilter = ValueChain | "All";
type StatusFilter = AgentStatus | "All";

const valueChainFilters: ValueChainFilter[] = ["All", ...valueChainOrder];
const statusFilters: StatusFilter[] = ["All", "Design", "Pilot", "Production"];

const roiBenchmarks = [
  { label: "Intake triage time", value: "-62%" },
  { label: "Missing-info cycle", value: "1.8d -> 6h" },
  { label: "Submission handoff SLA", value: "< 2h" }
];

export function MarketplaceView() {
  const router = useRouter();
  const [activeValueChain, setActiveValueChain] = useState<ValueChainFilter>("All");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeAgent, setActiveAgent] = useState<AgentCatalogItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const connectorNameById = useMemo(() => {
    return new Map(connectorCatalog.map((connector) => [connector.id, connector.name]));
  }, []);

  const filteredAgents = useMemo(() => {
    return agentCatalog.filter((agent) => {
      const valueChainMatch =
        activeValueChain === "All" || agent.valueChains.includes(activeValueChain);
      const statusMatch = activeStatus === "All" || agent.status === activeStatus;

      const normalized = searchTerm.trim().toLowerCase();
      if (!normalized) {
        return valueChainMatch && statusMatch;
      }

      const searchable = [
        agent.name,
        agent.summary,
        ...agent.capabilities,
        ...agent.valueChains
      ]
        .join(" ")
        .toLowerCase();

      return valueChainMatch && statusMatch && searchable.includes(normalized);
    });
  }, [activeStatus, activeValueChain, searchTerm]);

  const marketplaceStats = useMemo(() => {
    const totalAgents = agentCatalog.length;
    const productionAgents = agentCatalog.filter(
      (agent) => agent.status === "Production"
    ).length;
    const stageCoverage = new Set(agentCatalog.flatMap((agent) => agent.valueChains))
      .size;

    return { totalAgents, productionAgents, stageCoverage };
  }, []);

  const handleAddToBuilder = (agent: AgentCatalogItem) => {
    queueMarketplaceAgent(agent.id);
    setNotice(`Queued "${agent.name}" for the intake builder canvas.`);
  };

  return (
    <main className="page-shell">
      <section className="market-hero card-surface">
        <p className="page-eyebrow">GenTech Insurance OS</p>
        <h1 className="page-title">Submission Intake Modules for Underwriting Teams.</h1>
        <p className="page-copy">
          Start with the underwriting intake wedge: capture broker email submissions,
          normalize documents, close missing-information loops, and hand over
          decision-ready packets to underwriters.
        </p>
        <div className="hero-actions">
          <Link href="/builder" className="btn btn--primary">
            Open Intake Builder
          </Link>
          <Link href="/process-library" className="btn btn--ghost">
            View Playbooks
          </Link>
        </div>
        <div className="hero-kpis">
          <div className="hero-kpi">
            <span className="hero-kpi__value">{marketplaceStats.totalAgents}</span>
            <span className="hero-kpi__label">Intake modules</span>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi__value">{marketplaceStats.productionAgents}</span>
            <span className="hero-kpi__label">Production-ready</span>
          </div>
          <div className="hero-kpi">
            <span className="hero-kpi__value">{marketplaceStats.stageCoverage}</span>
            <span className="hero-kpi__label">Intake stages covered</span>
          </div>
        </div>
      </section>

      <section className="market-layout">
        <div className="market-main">
          <div className="filter-strip">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="text-input"
              placeholder="Search modules, capabilities, or stages"
              aria-label="Search modules"
            />
          </div>

          <div className="chip-row">
            {valueChainFilters.map((chain) => (
              <button
                key={chain}
                type="button"
                className={`chip ${activeValueChain === chain ? "is-active" : ""}`}
                onClick={() => setActiveValueChain(chain)}
              >
                {chain}
              </button>
            ))}
          </div>

          <div className="chip-row">
            {statusFilters.map((status) => (
              <button
                key={status}
                type="button"
                className={`chip ${activeStatus === status ? "is-active" : ""}`}
                onClick={() => setActiveStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {notice ? <p className="inline-notice">{notice}</p> : null}

          <p className="results-line">
            Showing {filteredAgents.length} of {agentCatalog.length} module cards
          </p>

          <div className="agent-grid">
            {filteredAgents.map((agent) => (
              <article
                key={agent.id}
                className="agent-card"
                style={
                  {
                    "--agent-accent": valueChainAccent[agent.valueChains[0]]
                  } as CSSProperties
                }
              >
                <div className="agent-card__meta">
                  <span
                    className={`status-tag status-tag--${agent.status.toLowerCase()}`}
                  >
                    {agent.status}
                  </span>
                </div>

                <h3 className="agent-card__title">{agent.name}</h3>
                <p className="agent-card__summary">{agent.summary}</p>

                <div className="pill-row">
                  {agent.valueChains.map((chain) => (
                    <span
                      key={chain}
                      className="tone-pill"
                      style={{ borderColor: valueChainAccent[chain] }}
                    >
                      {chain}
                    </span>
                  ))}
                </div>

                <div className="pill-row">
                  {agent.capabilities.slice(0, 3).map((capability) => (
                    <span key={capability} className="mono-pill">
                      {capability}
                    </span>
                  ))}
                </div>

                <div className="agent-card__metrics">
                  <span>{agent.requiredConnectors.length} connectors</span>
                  <span>{agent.outputs.length} outputs</span>
                </div>

                <div className="agent-card__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setActiveAgent(agent)}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => handleAddToBuilder(agent)}
                  >
                    Add to Builder
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredAgents.length === 0 ? (
            <section className="empty-search card-surface">
              <h2>No modules match this filter</h2>
              <p>Try widening stage or status filters to explore more options.</p>
            </section>
          ) : null}
        </div>

        <aside className="market-side card-surface">
          <h2 className="side-title">ROI control panel</h2>
          <p className="side-copy">
            Keep the wedge measurable: submission intake is the first operating layer of
            the broader GenTech Insurance OS vision.
          </p>

          <div className="roi-grid">
            {roiBenchmarks.map((benchmark) => (
              <div key={benchmark.label} className="roi-item">
                <p className="roi-item__value">{benchmark.value}</p>
                <p className="roi-item__label">{benchmark.label}</p>
              </div>
            ))}
          </div>

          <h3 className="side-subtitle">Connector readiness</h3>
          <div className="connector-list">
            {connectorCatalog.slice(0, 8).map((connector) => (
              <div key={connector.id} className="connector-item">
                <p className="connector-item__title">{connector.name}</p>
                <p className="connector-item__meta">{connector.type}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => router.push("/builder")}
          >
            Launch Intake Blueprint
          </button>
        </aside>
      </section>

      {activeAgent ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-card__header">
              <h2>{activeAgent.name}</h2>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setActiveAgent(null)}
              >
                Close
              </button>
            </div>

            <p className="modal-copy">{activeAgent.summary}</p>

            <h3 className="modal-subtitle">Capabilities</h3>
            <div className="pill-row">
              {activeAgent.capabilities.map((capability) => (
                <span key={capability} className="mono-pill">
                  {capability}
                </span>
              ))}
            </div>

            <h3 className="modal-subtitle">Required connectors</h3>
            <ul className="modal-list">
              {activeAgent.requiredConnectors.map((connectorId) => (
                <li key={connectorId}>
                  {connectorNameById.get(connectorId) ?? connectorId}
                </li>
              ))}
            </ul>

            <h3 className="modal-subtitle">Outputs</h3>
            <ul className="modal-list">
              {activeAgent.outputs.map((output) => (
                <li key={output}>{output}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </main>
  );
}
