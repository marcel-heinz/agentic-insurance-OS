import type { BuilderDraft, StoredProcess } from "@/lib/types";

const PROCESS_STORAGE_KEY = "agentic-os.processes.v1";
const DRAFT_STORAGE_KEY = "agentic-os.builder-draft.v1";
const MARKETPLACE_QUEUE_KEY = "agentic-os.marketplace-queue.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function listStoredProcesses(): StoredProcess[] {
  const processes = readJson<StoredProcess[]>(PROCESS_STORAGE_KEY, []);
  return processes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getStoredProcessById(processId: string): StoredProcess | null {
  const process = listStoredProcesses().find((item) => item.id === processId);
  return process ?? null;
}

export function upsertStoredProcess(process: StoredProcess) {
  const current = listStoredProcesses().filter((item) => item.id !== process.id);
  current.unshift(process);
  writeJson(PROCESS_STORAGE_KEY, current);
}

export function removeStoredProcessById(processId: string) {
  const next = listStoredProcesses().filter((item) => item.id !== processId);
  writeJson(PROCESS_STORAGE_KEY, next);
}

export function saveBuilderDraft(draft: BuilderDraft) {
  writeJson(DRAFT_STORAGE_KEY, draft);
}

export function loadBuilderDraft(): BuilderDraft | null {
  return readJson<BuilderDraft | null>(DRAFT_STORAGE_KEY, null);
}

export function queueMarketplaceAgent(agentId: string) {
  const queue = readJson<string[]>(MARKETPLACE_QUEUE_KEY, []);
  if (!queue.includes(agentId)) {
    queue.push(agentId);
  }
  writeJson(MARKETPLACE_QUEUE_KEY, queue);
}

export function consumeMarketplaceAgentQueue(): string[] {
  const queue = readJson<string[]>(MARKETPLACE_QUEUE_KEY, []);
  if (!isBrowser()) {
    return [];
  }

  window.localStorage.removeItem(MARKETPLACE_QUEUE_KEY);
  return queue;
}
