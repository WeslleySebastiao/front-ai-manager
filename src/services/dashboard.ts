// services/dashboard.ts
import api from "./api";
import {
  LastRunsResponse,
  TotalsByAgentResponse,
  DashboardOverviewNested,
} from "./dashboard.types";
import { normalizeOverview } from "./normalizeOverview";

export async function getDashboardOverview(
  agentId?: string | null
): Promise<DashboardOverviewNested> {
  const { data } = await api.get("/dashboard/overview", {
    params: agentId ? { agent_id: agentId } : undefined,
  });
  return normalizeOverview(data);
}

export async function getTotalsByAgent(): Promise<TotalsByAgentResponse> {
  const { data } = await api.get("/dashboard/totals-by-agent");
  return data;
}

export async function getLastRuns(params?: {
  limit?: number;
  agent_id?: string;
  status?: string;
}): Promise<LastRunsResponse> {
  const { data } = await api.get("/dashboard/last-runs", { params });
  return data;
}
