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

  if (v <= 1)
    return `${base} border-emerald-500/30 text-emerald-300 bg-emerald-500/10`;
  if (v <= 5)
    return `${base} border-amber-500/30 text-amber-300 bg-amber-500/10`;
  return `${base} border-rose-500/30 text-rose-300 bg-rose-500/10`;
}

/**
 * ✅ Barrinha de proporção (sem chart lib)
 * - segments: [{ value, className }]
 */
function MiniBar({
  segments,
  heightClass = "h-2",
}: {
  segments: { value: number; className: string }[];
  heightClass?: string;
}) {
  const total = segments.reduce((acc, s) => acc + (s.value ?? 0), 0) || 1;
  return (
    <div className={`w-full rounded-full overflow-hidden ${heightClass} bg-gray-200/50 dark:bg-white/10`}>
      <div className="flex h-full w-full">
        {segments.map((s, idx) => (
          <div
            key={idx}
            className={s.className}
            style={{ width: `${Math.max(0, (s.value / total) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * ✅ Sparkline mini (SVG, sem lib)
 */
function Sparkline({
  values,
  className = "",
}: {
  values: number[];
  className?: string;
}) {
  const w = 160;
  const h = 40;
  if (!values?.length) {
    return <div className={`h-10 ${className}`} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1e-9, max - min);

  const points = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (w - 2) + 1;
      const y = h - 1 - ((v - min) / range) * (h - 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="sparkline"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
        className="text-sky-500/70 dark:text-sky-400/70"
      />
    </svg>
  );
}

function TrendBadge({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct == null) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border border-slate-500/30 text-slate-300 bg-slate-500/10">
        —
      </span>
    );
  }

  const up = deltaPct >= 0;
  const cls = up
    ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
    : "border-rose-500/30 text-rose-300 bg-rose-500/10";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${cls}`}>
      <span className="material-symbols-outlined text-[14px] leading-none">
        {up ? "trending_up" : "trending_down"}
      </span>
      {Math.abs(deltaPct).toFixed(1)}%
    </span>
  );
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
          getLastRuns({ limit: 20 }), // ✅ pegamos mais para tendência
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

  const tokensInOut = useMemo(() => {
    let prompt = 0;
    let completion = 0;
    for (const a of byAgent) {
      prompt += a.prompt_tokens_total ?? 0;
      completion += a.completion_tokens_total ?? 0;
    }
    return { prompt, completion };
  }, [byAgent]);

  // ✅ tendências simples a partir dos runs recentes
  const trends = useMemo(() => {
    const sorted = [...lastRuns].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    // últimos 5 vs 5 anteriores (se existir)
    const last5 = sorted.slice(-5);
    const prev5 = sorted.slice(-10, -5);

    function avg(arr: number[]) {
      if (!arr.length) return null;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    const lastLatency = avg(last5.map((r) => r.duration_ms ?? 0).filter((v) => v > 0));
    const prevLatency = avg(prev5.map((r) => r.duration_ms ?? 0).filter((v) => v > 0));
    const latencyDeltaPct =
      lastLatency != null && prevLatency != null && prevLatency > 0
        ? ((lastLatency - prevLatency) / prevLatency) * 100
        : null;

    const lastErrors = last5.filter((r) => r.status === "error" || r.status === "timeout").length;
    const prevErrors = prev5.filter((r) => r.status === "error" || r.status === "timeout").length;
    const lastErrRate = last5.length ? (lastErrors / last5.length) * 100 : null;
    const prevErrRate = prev5.length ? (prevErrors / prev5.length) * 100 : null;
    const errDeltaPct =
      lastErrRate != null && prevErrRate != null && prevErrRate > 0
        ? ((lastErrRate - prevErrRate) / prevErrRate) * 100
        : null;

    const spark = sorted
      .slice(-20)
      .map((r) => (r.duration_ms ?? 0))
      .filter((v) => v >= 0);

    return { latencyDeltaPct, errDeltaPct, spark };
  }, [lastRuns]);

  // ✅ proporções
  const errorCounts = useMemo(() => {
    const success = lastRuns.filter((r) => r.status === "success").length;
    const error = lastRuns.filter((r) => r.status === "error").length;
    const timeout = lastRuns.filter((r) => r.status === "timeout").length;
    return { success, error, timeout, total: lastRuns.length || 1 };
  }, [lastRuns]);

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
            <TrendBadge deltaPct={null} />
          </div>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">
            {formatNumber(totals?.runs_total)}
          </p>
          {/* mini spark */}
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimos runs</p>
            <Sparkline values={trends.spark.slice(-12)} className="h-10 w-40" />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">
              Erros (total)
            </p>

            <span className={pctBadge(totals?.error_rate_pct_total)}>
              {(totals?.error_rate_pct_total ?? 0).toFixed(2)}%
            </span>
          </div>

          <p className="text-gray-900 dark:text-white text-4xl font-bold">
            {formatNumber(totals?.errors_total)}
          </p>

          {/* ✅ barra: success (verde) vs error (vermelho) */}
          {(() => {
            const runsTotal = totals?.runs_total ?? 0;
            const errorCount = totals?.errors_total ?? 0;
            const successCount = Math.max(0, runsTotal - errorCount);

            return (
              <div className="mt-2 space-y-2">
                <MiniBar
                  heightClass="h-3"
                  segments={[
                    {
                      value: successCount,
                      className: "bg-emerald-500/60 dark:bg-emerald-400/60",
                    },
                    {
                      value: errorCount,
                      className: "bg-rose-500/60 dark:bg-rose-400/60",
                    },
                  ]}
                />

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>success: {successCount}</span>
                  <span>error: {errorCount}</span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Custo total (USD)</p>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">
            {formatUsd(totals?.cost_usd_total)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * estimativa baseada nos totals
          </p>
        </div>
      </div>

      {/* CARDS — Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Latência média</p>
            {/* pra latência, subir é ruim → mas aqui é só indicação */}
            <TrendBadge deltaPct={trends.latencyDeltaPct != null ? -trends.latencyDeltaPct : null} />
          </div>
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

        {/* ✅ TOKENS IN/OUT com proporção */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Tokens (total)</p>
            <TrendBadge deltaPct={null} />
          </div>

          <p className="text-gray-900 dark:text-white text-3xl font-bold">
            {formatNumber(totals?.total_tokens_total)}
          </p>

          <div className="mt-1 space-y-2">
            <MiniBar
              segments={[
                { value: tokensInOut.prompt, className: "bg-violet-500/60 dark:bg-violet-400/60" },
                { value: tokensInOut.completion, className: "bg-sky-500/60 dark:bg-sky-400/60" },
              ]}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              IN: {formatNumber(tokensInOut.prompt)} • OUT: {formatNumber(tokensInOut.completion)}
            </p>
          </div>
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

      {/* CARDS — Linha 3 */}
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
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Nota:</p>
          <p className="text-gray-900 dark:text-white text-lg font-semibold">
            All-time por enquanto. Detalhes depois, se Deus quiser.
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Nota: adiciona drill-down por agente e filtros de log (porque sofrimento sem filtro não dá).
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
                  <tr
                    key={a.agent_id}
                    className="border-b border-gray-200/70 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
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
          <p className="text-xs text-gray-500 dark:text-gray-400">limit=20</p>
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
                lastRuns.slice(0, 20).map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-200/70 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="p-4">
                      <div className="font-medium">{timeAgo(r.created_at)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(r.created_at).toISOString()}
                      </div>
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
