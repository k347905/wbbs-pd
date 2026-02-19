export interface Settings {
  api_base_url: string;
  service_name: string;
  client_id: string;
  client_secret: string;
  poll_interval_sec: number;
  poll_timeout_sec: number;
}

export interface CheckInput {
  series: string;
  number: string;
  firstname: string;
  lastname: string;
}

export interface BatchCreate {
  name: string;
  checks: CheckInput[];
}

export interface BatchRead {
  id: number;
  name: string;
  status: string;
  created_at: string;
  total: number;
  completed: number;
}

export interface CheckRead {
  id: number;
  batch_id: number;
  batch_name: string | null;
  series_obfuscated: string;
  number_obfuscated: string;
  firstname_obfuscated: string;
  lastname_obfuscated: string;
  api_request_id: string | null;
  api_result_status: string | null;
  actual_label: string | null;
  request_sent_at: string | null;
  response_received_at: string | null;
  duration_ms: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface ConfusionMatrixData {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  entity_not_found: number;
  accuracy: number;
  precision_val: number;
  recall: number;
  f1: number;
  total_labeled: number;
}

export interface LogEntry {
  id: number;
  check_id: number;
  direction: string;
  body: string;
  timestamp: string;
}

export interface TimingStats {
  avg_ms: number;
  min_ms: number;
  max_ms: number;
  p50_ms: number;
  p95_ms: number;
  total_completed: number;
}
