import React, { useEffect, useMemo, useState } from "react";
import { getDashboardOverview, getTotalsByAgent, getLastRuns } from "../../services/dashboard";

type Status = "success" | "error" | "timeout" | string;

function formatNumber(n?: number | null) {
  if (n == null) return "-";
  return new Intl.NumberFormat("pt-BR").format(n);
}

function formatUsd(n?: number | null) {
  if (n == null) return "-";
  return `$ ${Number(n).toFixed(6)}`;
}

function formatMs(ms?: number | null) {
  if (ms == null) return "-";
  const v = Number(ms);
  if (v >= 1000) return `${(v / 1000).toFixed(2)}s`;
  return `${Math.round(v)}ms`;
}

function timeAgo(iso?: string | null) {
  if (!iso) return "-";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);

  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;

  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;

  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

function statusBadge(status: Status) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border";

  if (status === "success")
    return `${base} border-emerald-500/30 text-emerald-300 bg-emerald-500/10`;
  if (status === "error")
    return `${base} border-rose-500/30 text-rose-300 bg-rose-500/10`;
  if (status === "timeout")
    return `${base} border-amber-500/30 text-amber-300 bg-amber-500/10`;

  return `${base} border-slate-500/30 text-slate-300 bg-slate-500/10`;
}

function pctBadge(pct?: number | null) {
  const v = pct ?? 0;
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border";

  // você pode ajustar esses thresholds
  if (v <= 1)
    return `${base} border-emerald-500/30 text-emerald-300 bg-emerald-500/10`;
  if (v <= 5)
    return `${base} border-amber-500/30 text-amber-300 bg-amber-500/10`;
  return `${base} border-rose-500/30 text-rose-300 bg-rose-500/10`;
}

type OverviewState = {
  totals: {
    runs_total: number;
    errors_total: number;
    error_rate_pct_total: number;
    avg_latency_ms_total: number;
    p95_latency_ms_total: number;
    total_tokens_total: number;
    cost_usd_total: number;
  } | null;
  last_run: null | {
    id: string;
    created_at: string;
    status: string;
    duration_ms: number;
    agent_id: string;
  };
  most_expensive: null | {
    id: string;
    cost_usd: number;
    total_tokens: number;
    duration_ms: number;
    created_at: string;
    agent_id: string;
  };
};

type TotalsByAgentItem = {
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

type LastRunItem = {
  id: string;
  created_at: string;
  finished_at?: string | null;
  agent_id: string;
  user_id?: string | null;
  session_id?: string | null;
  status: Status;
  duration_ms?: number | null;
  model?: string | null;
  total_tokens?: number | null;
  cost_usd?: number | null;
  error_type?: string | null;
  error_message?: string | null;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewState>({
    totals: null,
    last_run: null,
    most_expensive: null,
  });
  const [byAgent, setByAgent] = useState<TotalsByAgentItem[]>([]);
  const [lastRuns, setLastRuns] = useState<LastRunItem[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");

      try {
        const [ov, agents, runs] = await Promise.all([
          getDashboardOverview(null),
          getTotalsByAgent(),
          getLastRuns({ limit: 30 }),
        ]);

        setOverview({
          totals: ov?.totals ?? null,
          last_run: (ov as any)?.last_run ?? null,
          most_expensive: (ov as any)?.most_expensive ?? null,
        });

        setByAgent((agents as any)?.items ?? []);
        setLastRuns((runs as any)?.items ?? []);
      } catch (e: any) {
        console.error("Erro ao carregar dashboard:", e);
        setError(e?.message ?? "Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const agentesCount = byAgent.length;

  const totals = overview.totals;

  // Se a view por agente tiver tokens input/output, dá pra somar aqui para exibir global
  const tokensInOut = useMemo(() => {
    let prompt = 0;
    let completion = 0;
    for (const a of byAgent) {
      prompt += a.prompt_tokens_total ?? 0;
      completion += a.completion_tokens_total ?? 0;
    }
    return { prompt, completion };
  }, [byAgent]);

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>;
  }

  return (
    <>
      {/* HEADER */}
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Visão geral (all-time) + logs recentes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 rounded-lg text-sm font-medium
              bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10
              text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
          >
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl p-4 border border-rose-500/20 bg-rose-500/10 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {/* CARDS — Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Número de Agentes</p>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">{agentesCount}</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Runs (total)</p>
          </div>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">
            {formatNumber(totals?.runs_total)}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Erros (total)</p>
            <span className={pctBadge(totals?.error_rate_pct_total)}>
              {(totals?.error_rate_pct_total ?? 0).toFixed(2)}%
            </span>
          </div>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">
            {formatNumber(totals?.errors_total)}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Custo total (USD)</p>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">
            {formatUsd(totals?.cost_usd_total)}
          </p>
        </div>
      </div>

      {/* CARDS — Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Latência média</p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold">
            {formatMs(totals?.avg_latency_ms_total)}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Latência P95</p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold">
            {formatMs(totals?.p95_latency_ms_total)}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Tokens (total)</p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold">
            {formatNumber(totals?.total_tokens_total)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            IN: {formatNumber(tokensInOut.prompt)} • OUT: {formatNumber(tokensInOut.completion)}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Última execução</p>

          {overview.last_run ? (
            <>
              <div className="flex items-center justify-between">
                <span className={statusBadge(overview.last_run.status)}>{overview.last_run.status}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(overview.last_run.created_at)}
                </span>
              </div>

              <p className="text-gray-900 dark:text-white text-lg font-bold mt-1">
                {formatMs(overview.last_run.duration_ms)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Agente: <span className="font-medium">{overview.last_run.agent_id}</span>
              </p>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>
          )}
        </div>
      </div>

      {/* CARDS — Linha 3 (sinal: mais caro) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Resposta mais cara (all-time)</p>

          {overview.most_expensive ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <p className="text-gray-900 dark:text-white text-3xl font-bold">
                  {formatUsd(overview.most_expensive.cost_usd)}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(overview.most_expensive.created_at)}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-70">Agente</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{overview.most_expensive.agent_id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-70">Tokens</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatNumber(overview.most_expensive.total_tokens)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-70">Duração</p>
                  <p className="text-gray-900 dark:text-white font-semibold">{formatMs(overview.most_expensive.duration_ms)}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Dica rápida</p>
          <p className="text-gray-900 dark:text-white text-lg font-semibold">
            All-time por enquanto. Detalhes depois, se Deus quiser.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Se quiser depois, a gente adiciona drill-down por agente e filtros de log (porque sofrimento sem filtro não dá).
          </p>
        </div>
      </div>

      {/* TABELA — Totais por agente */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 dark:text-white text-xl font-black">Totais por agente</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ordenado por custo (API)</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20">
          <table className="min-w-full text-sm">
            <thead className="text-gray-600 dark:text-gray-400">
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left p-4">Agente</th>
                <th className="text-right p-4">Runs</th>
                <th className="text-right p-4">Erros</th>
                <th className="text-right p-4">Erro %</th>
                <th className="text-right p-4">Média</th>
                <th className="text-right p-4">P95</th>
                <th className="text-right p-4">Tokens IN</th>
                <th className="text-right p-4">Tokens OUT</th>
                <th className="text-right p-4">Custo</th>
              </tr>
            </thead>

            <tbody className="text-gray-900 dark:text-white">
              {byAgent.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-500 dark:text-gray-400" colSpan={9}>
                    Nenhum dado de agente.
                  </td>
                </tr>
              ) : (
                byAgent.map((a) => (
                  <tr key={a.agent_id} className="border-b border-gray-200/70 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="p-4 font-semibold">{a.agent_id}</td>
                    <td className="p-4 text-right">{formatNumber(a.runs_total)}</td>
                    <td className="p-4 text-right">{formatNumber(a.errors_total)}</td>
                    <td className="p-4 text-right">
                      <span className={pctBadge(a.error_rate_pct_total ?? 0)}>
                        {(a.error_rate_pct_total ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-4 text-right">{formatMs(a.avg_latency_ms_total ?? null)}</td>
                    <td className="p-4 text-right">{formatMs(a.p95_latency_ms_total ?? null)}</td>
                    <td className="p-4 text-right">{formatNumber(a.prompt_tokens_total ?? null)}</td>
                    <td className="p-4 text-right">{formatNumber(a.completion_tokens_total ?? null)}</td>
                    <td className="p-4 text-right font-bold">{formatUsd(a.cost_usd_total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOGS — Últimas execuções */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 dark:text-white text-xl font-black">Últimas execuções</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">limit=30</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20">
          <table className="min-w-full text-sm">
            <thead className="text-gray-600 dark:text-gray-400">
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left p-4">Quando</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Agente</th>
                <th className="text-right p-4">Duração</th>
                <th className="text-right p-4">Tokens</th>
                <th className="text-right p-4">Custo</th>
                <th className="text-left p-4">Erro</th>
              </tr>
            </thead>

            <tbody className="text-gray-900 dark:text-white">
              {lastRuns.length === 0 ? (
                <tr>
                  <td className="p-4 text-gray-500 dark:text-gray-400" colSpan={7}>
                    Nenhum run encontrado.
                  </td>
                </tr>
              ) : (
                lastRuns.map((r) => (
                  <tr key={r.id} className="border-b border-gray-200/70 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="p-4">
                      <div className="font-medium">{timeAgo(r.created_at)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.created_at).toISOString()}</div>
                    </td>
                    <td className="p-4">
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </td>
                    <td className="p-4 font-semibold">{r.agent_id}</td>
                    <td className="p-4 text-right">{formatMs(r.duration_ms ?? null)}</td>
                    <td className="p-4 text-right">{formatNumber(r.total_tokens ?? null)}</td>
                    <td className="p-4 text-right">{r.cost_usd != null ? formatUsd(r.cost_usd) : "-"}</td>
                    <td className="p-4">
                      {r.status === "error" || r.status === "timeout" ? (
                        <div className="text-xs text-rose-200">
                          <div className="font-semibold">{r.error_type ?? "Error"}</div>
                          <div className="text-rose-200/80 line-clamp-2">{r.error_message ?? "-"}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
