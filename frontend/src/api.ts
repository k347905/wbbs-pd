import type {
  Settings,
  BatchCreate,
  BatchRead,
  CheckRead,
  ConfusionMatrixData,
  LogEntry,
  TimingStats,
} from "./types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${resp.status}: ${text}`);
  }
  return resp.json();
}

// Settings
export const getSettings = () => request<Settings>("/settings");

export const updateSettings = (data: Partial<Settings>) =>
  request<Settings>("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });

// Checks
export const createBatch = (data: BatchCreate) =>
  request<BatchRead>("/checks/batch", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const uploadCSV = async (file: File, name: string): Promise<BatchRead> => {
  const form = new FormData();
  form.append("file", file);
  form.append("name", name);
  const resp = await fetch(BASE + "/checks/upload-csv", {
    method: "POST",
    body: form,
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
};

export const listBatches = () => request<BatchRead[]>("/checks/batches");

// Results
export const listResults = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<CheckRead[]>("/results" + qs);
};

// Labels
export const updateLabel = (checkId: number, label: string) =>
  request<{ ok: boolean }>(`/labels/${checkId}`, {
    method: "PATCH",
    body: JSON.stringify({ actual_label: label }),
  });

// Metrics
export const getConfusionMatrix = (includeEnf = false) =>
  request<ConfusionMatrixData>(
    `/metrics/confusion-matrix?include_enf_as_invalid=${includeEnf}`
  );

// Logs
export const listLogs = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<LogEntry[]>("/logs" + qs);
};

export const getTimingStats = () => request<TimingStats | null>("/logs/timing");
