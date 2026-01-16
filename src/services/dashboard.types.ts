// services/dashboard.types.ts
export type DashboardTotals = {
  runs_total: number;
  errors_total: number;
  error_rate_pct_total: number;
  avg_latency_ms_total: number;
  p95_latency_ms_total: number;
  total_tokens_total: number;
  cost_usd_total: number;
  // se você incluir depois:
  // prompt_tokens_total?: number;
  // completion_tokens_total?: number;
};

export type DashboardRun = {
  id: string;
  created_at: string;
  finished_at?: string | null;
  agent_id: string;
  user_id?: string | null;
  session_id?: string | null;
  status: "success" | "error" | "timeout" | string;
  duration_ms?: number | null;
  model?: string | null;
  total_tokens?: number | null;
  cost_usd?: number | null;
  error_type?: string | null;
  error_message?: string | null;
};

export type DashboardOverviewNested = {
  agent_id: string | null;
  totals: DashboardTotals;
  most_expensive?: {
    id: string;
    cost_usd: number;
    total_tokens: number;
    duration_ms: number;
    created_at: string;
    agent_id: string;
  } | null;
  last_run?: {
    id: string;
    created_at: string;
    status: string;
    duration_ms: number;
    agent_id: string;
  } | null;
};

// Caso a API retorne “flat totals”
export type DashboardOverviewFlat = DashboardTotals;

export type TotalsByAgentItem = {
  agent_id: string;
  runs_total: number;
  errors_total: number;
  error_rate_pct_total?: number;
  avg_latency_ms_total?: number;
  p95_latency_ms_total?: number;
  prompt_tokens_total?: number;
  completion_tokens_total?: number;
  total_tokens_total?: number;
  cost_usd_total: number;
};

export type TotalsByAgentResponse = { items: TotalsByAgentItem[] };
export type LastRunsResponse = { items: DashboardRun[] };
