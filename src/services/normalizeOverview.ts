// services/normalizeOverview.ts
import type { DashboardOverviewNested, DashboardTotals } from "./dashboard.types";

export function normalizeOverview(data: any): DashboardOverviewNested {
  // Formato nested (do Postgres function)
  if (data?.totals) {
    return data as DashboardOverviewNested;
  }

  // Formato flat (totals direto no root)
  return {
    agent_id: null,
    totals: data as DashboardTotals,
    most_expensive: null,
    last_run: null,
  };
}
