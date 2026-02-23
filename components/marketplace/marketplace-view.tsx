"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
const statusFilters: StatusFilter[] = ["All", "Mock", "Beta", "Verified"];

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

  const handleAddToBuilder = (agent: AgentCatalogItem) => {
    queueMarketplaceAgent(agent.id);
    setNotice(`Queued \"${agent.name}\" for the Process Builder.`);
  };

  return (
    <main className="page-shell">
      <section className="market-hero">
        <p className="page-eyebrow">Agent Marketplace</p>
        <h1 className="page-title">Insurance worker catalog for your value chain.</h1>
        <p className="page-copy">
          Browse specialized agents, wire them to data sources, then orchestrate them
          in process flows for Sales, Underwriting, Claims, and more.
        </p>
        <div className="hero-actions">
          <Link href="/builder" className="btn btn--primary">
            Open Builder
          </Link>
          <Link href="/process-library" className="btn btn--ghost">
            Process Library
          </Link>
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
              placeholder="Search agents or capabilities"
              aria-label="Search agents"
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

          <div className="agent-grid">
            {filteredAgents.map((agent) => (
              <article key={agent.id} className="agent-card">
                <div className="agent-card__meta">
                  <span className={`status-tag status-tag--${agent.status.toLowerCase()}`}>
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
        </div>

        <aside className="market-side card-surface">
          <h2 className="side-title">Connectors</h2>
          <p className="side-copy">
            Connect each worker to platforms like Gmail, S3, APIs, policy core, and
            payment rails.
          </p>

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
            Build Broker Flow
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
