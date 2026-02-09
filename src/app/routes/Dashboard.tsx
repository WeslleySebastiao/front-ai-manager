import React, { useEffect, useMemo, useState } from "react";
import { getDashboardOverview, getTotalsByAgent, getLastRuns } from "../../services/dashboard";

type Status = "success" | "error" | "timeout" | string;

// ──────────────────────────────────────────────
// Helpers de formatação
// ──────────────────────────────────────────────

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
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border";
  if (status === "success") return `${base} border-emerald-500/30 text-emerald-300 bg-emerald-500/10`;
  if (status === "error") return `${base} border-rose-500/30 text-rose-300 bg-rose-500/10`;
  if (status === "timeout") return `${base} border-amber-500/30 text-amber-300 bg-amber-500/10`;
  return `${base} border-slate-500/30 text-slate-300 bg-slate-500/10`;
}

// ──────────────────────────────────────────────
// ✅ MUDANÇA: helper para exibir nome do agente.
//
// Agora o backend retorna agent_name junto com agent_id.
// Esta função escolhe o melhor display: nome se disponível,
// UUID truncado como fallback (agentes deletados).
// ──────────────────────────────────────────────
function displayAgent(agentName?: string | null, agentId?: string | null): string {
  if (agentName) return agentName;
  if (agentId) return agentId.slice(0, 8) + "…";
  return "-";
}

// ──────────────────────────────────────────────
// Thresholds semânticos
// ──────────────────────────────────────────────

type ThresholdTone = { badge: string; text: string };

const TONE_GREEN: ThresholdTone = { badge: "border-emerald-500/30 text-emerald-300 bg-emerald-500/10", text: "text-emerald-400" };
const TONE_YELLOW: ThresholdTone = { badge: "border-amber-500/30 text-amber-300 bg-amber-500/10", text: "text-amber-400" };
const TONE_RED: ThresholdTone = { badge: "border-rose-500/30 text-rose-300 bg-rose-500/10", text: "text-rose-400" };
const TONE_NEUTRAL: ThresholdTone = { badge: "border-slate-500/30 text-slate-300 bg-slate-500/10", text: "text-slate-400" };

function errorRateTone(pct?: number | null): ThresholdTone {
  const v = pct ?? 0;
  if (v < 10) return TONE_GREEN;
  if (v < 20) return TONE_YELLOW;
  return TONE_RED;
}

function successRateTone(pct?: number | null): ThresholdTone {
  const v = pct ?? 0;
  if (v >= 90) return TONE_GREEN;
  if (v >= 80) return TONE_YELLOW;
  return TONE_RED;
}

function latencyTone(ms?: number | null): ThresholdTone {
  if (ms == null) return TONE_NEUTRAL;
  const sec = ms / 1000;
  if (sec < 10) return TONE_GREEN;
  if (sec < 25) return TONE_YELLOW;
  return TONE_RED;
}

function latencyLabel(ms?: number | null): string {
  if (ms == null) return "";
  const sec = ms / 1000;
  if (sec < 10) return "● Saudável";
  if (sec < 25) return "● Atenção";
  return "● Crítico";
}

function ThresholdBadge({ value, tone }: { value: string; tone: ThresholdTone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${tone.badge}`}>
      {value}
    </span>
  );
}

// ──────────────────────────────────────────────
// Componentes visuais
// ──────────────────────────────────────────────

function MiniBar({ segments, heightClass = "h-2" }: { segments: { value: number; className: string }[]; heightClass?: string }) {
  const total = segments.reduce((acc, s) => acc + (s.value ?? 0), 0) || 1;
  return (
    <div className={`w-full rounded-full overflow-hidden ${heightClass} bg-gray-200/50 dark:bg-white/10`}>
      <div className="flex h-full w-full">
        {segments.map((s, idx) => (
          <div key={idx} className={s.className} style={{ width: `${Math.max(0, (s.value / total) * 100)}%` }} />
        ))}
      </div>
    </div>
  );
}

function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  const w = 160; const h = 40;
  if (!values?.length) return <div className={`h-10 ${className}`} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1e-9, max - min);
  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * (w - 2) + 1;
    const y = h - 1 - ((v - min) / range) * (h - 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label="sparkline">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" className="text-sky-500/70 dark:text-sky-400/70" />
    </svg>
  );
}

function TrendBadge({ deltaPct, higherIsBetter = true }: { deltaPct: number | null; higherIsBetter?: boolean }) {
  if (deltaPct == null) {
    return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border border-slate-500/30 text-slate-300 bg-slate-500/10">—</span>;
  }
  const isUp = deltaPct >= 0;
  const isGood = higherIsBetter ? deltaPct >= 0 : deltaPct <= 0;
  const cls = isGood ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10" : "border-rose-500/30 text-rose-300 bg-rose-500/10";
  const sign = deltaPct > 0 ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${cls}`}>
      <span className="material-symbols-outlined text-[14px] leading-none">{isUp ? "trending_up" : "trending_down"}</span>
      {sign}{Math.abs(deltaPct).toFixed(1)}%
    </span>
  );
}

// ──────────────────────────────────────────────
// Types — ✅ atualizados com agent_name
// ──────────────────────────────────────────────

type OverviewState = {
  totals: {
    runs_total: number; errors_total: number; error_rate_pct_total: number;
    avg_latency_ms_total: number; p75_latency_ms_total: number;
    total_tokens_total: number; cost_usd_total: number;
  } | null;
  last_run: null | {
    id: string; created_at: string; status: string; duration_ms: number;
    agent_id: string; agent_name?: string | null;
  };
  most_expensive: null | {
    id: string; cost_usd: number; total_tokens: number; duration_ms: number;
    created_at: string; agent_id: string; agent_name?: string | null;
  };
};

type TotalsByAgentItem = {
  agent_id: string;
  agent_name?: string | null;  // ✅ NOVO
  runs_total: number; errors_total: number;
  error_rate_pct_total?: number; avg_latency_ms_total?: number;
  p75_latency_ms_total?: number; prompt_tokens_total?: number;
  completion_tokens_total?: number; total_tokens_total?: number;
  cost_usd_total: number;
};

type LastRunItem = {
  id: string; created_at: string; finished_at?: string | null;
  agent_id: string; user_id?: string | null; session_id?: string | null;
  status: Status; duration_ms?: number | null; model?: string | null;
  total_tokens?: number | null; cost_usd?: number | null;
  error_type?: string | null; error_message?: string | null;
};

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewState>({ totals: null, last_run: null, most_expensive: null });
  const [byAgent, setByAgent] = useState<TotalsByAgentItem[]>([]);
  const [lastRuns, setLastRuns] = useState<LastRunItem[]>([]);
  const [error, setError] = useState<string>("");

  // ──────────────────────────────────────────────
  // ✅ MUDANÇA: Mapa de lookup agent_id → agent_name.
  //
  // Construído a partir do byAgent que agora já vem com agent_name
  // do backend (via view atualizada). Usado para resolver nomes
  // na tabela de últimas execuções, que ainda retorna só agent_id.
  // ──────────────────────────────────────────────
  const agentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of byAgent) {
      if (a.agent_name) map.set(a.agent_id, a.agent_name);
    }
    return map;
  }, [byAgent]);

  function agentLabel(id?: string | null): string {
    if (!id) return "-";
    return agentNameMap.get(id) ?? id.slice(0, 8) + "…";
  }

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        const [ov, agents, runs] = await Promise.all([
          getDashboardOverview(null),
          getTotalsByAgent(),
          getLastRuns({ limit: 20 }),
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
    let prompt = 0, completion = 0;
    for (const a of byAgent) { prompt += a.prompt_tokens_total ?? 0; completion += a.completion_tokens_total ?? 0; }
    return { prompt, completion };
  }, [byAgent]);

  const trends = useMemo(() => {
    const sorted = [...lastRuns].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const last10 = sorted.slice(-10);
    const prev10 = sorted.slice(-20, -10);
    function avg(arr: number[]) { if (!arr.length) return null; return arr.reduce((a, b) => a + b, 0) / arr.length; }
    const lastL = avg(last10.map((r) => r.duration_ms ?? 0).filter((v) => v > 0));
    const prevL = avg(prev10.map((r) => r.duration_ms ?? 0).filter((v) => v > 0));
    const latencyDeltaPct = lastL != null && prevL != null && prevL > 0 ? ((lastL - prevL) / prevL) * 100 : null;
    const spark = sorted.slice(-20).map((r) => r.duration_ms ?? 0).filter((v) => v >= 0);
    return { latencyDeltaPct, spark };
  }, [lastRuns]);

  const successRate = useMemo(() => {
    const runs = totals?.runs_total ?? 0;
    const errors = totals?.errors_total ?? 0;
    if (runs === 0) return null;
    return ((runs - errors) / runs) * 100;
  }, [totals]);

  const recentErrors = useMemo(() => {
    return lastRuns
      .filter((r) => r.status === "error" || r.status === "timeout")
      .slice(0, 3)
      .map((r) => ({
        id: r.id, agent_id: r.agent_id,
        error_type: r.error_type ?? "Unknown",
        error_message: r.error_message ?? "Sem detalhes",
        time: timeAgo(r.created_at), status: r.status,
      }));
  }, [lastRuns]);

  const topAgent = useMemo(() => {
    if (!byAgent.length) return null;
    return [...byAgent].sort((a, b) => b.runs_total - a.runs_total)[0];
  }, [byAgent]);

  const topModel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of lastRuns) { const m = r.model ?? "unknown"; counts[m] = (counts[m] ?? 0) + 1; }
    let best = "", bestCount = 0;
    for (const [model, count] of Object.entries(counts)) { if (count > bestCount) { best = model; bestCount = count; } }
    return best ? { model: best, count: bestCount, total: lastRuns.length } : null;
  }, [lastRuns]);

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>;

  return (
    <>
      {/* HEADER */}
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <div>
          <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Visão geral (all-time) + logs recentes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5">
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl p-4 border border-rose-500/20 bg-rose-500/10 text-rose-200 text-sm">{error}</div>
      )}

      {/* ════════════════════════════════════════════
          LINHA 1 — Agentes + Runs (lado a lado)
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Número de Agentes</p>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">{agentesCount}</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Runs (total)</p>
            {successRate != null && <ThresholdBadge value={`${successRate.toFixed(1)}% ok`} tone={successRateTone(successRate)} />}
          </div>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">{formatNumber(totals?.runs_total)}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Latência recente (ms)</p>
            <Sparkline values={trends.spark.slice(-12)} className="h-10 w-40" />
          </div>
        </div>
      </div>

      {/* Erros — largura total */}
      <div className="mt-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Erros (total)</p>
            <ThresholdBadge value={`${(totals?.error_rate_pct_total ?? 0).toFixed(2)}%`} tone={errorRateTone(totals?.error_rate_pct_total)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white text-4xl font-bold">{formatNumber(totals?.errors_total)}</p>
              {(() => {
                const runsTotal = totals?.runs_total ?? 0;
                const errorCount = totals?.errors_total ?? 0;
                const successCount = Math.max(0, runsTotal - errorCount);
                return (
                  <div className="mt-3 space-y-2">
                    <MiniBar heightClass="h-3" segments={[
                      { value: successCount, className: "bg-emerald-500/60 dark:bg-emerald-400/60" },
                      { value: errorCount, className: "bg-rose-500/60 dark:bg-rose-400/60" },
                    ]} />
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span>success: {successCount}</span><span>error: {errorCount}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            {recentErrors.length > 0 && (
              <div className="flex-1 border-t sm:border-t-0 sm:border-l border-gray-200/30 dark:border-white/5 pt-3 sm:pt-0 sm:pl-6 space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Erros recentes</p>
                {recentErrors.map((err) => (
                  <div key={err.id} className="flex items-start gap-2 text-xs">
                    <span className="material-symbols-outlined text-rose-400 text-[14px] mt-0.5 shrink-0">
                      {err.status === "timeout" ? "schedule" : "error"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{err.error_type}</span>
                        <span className="text-gray-500 dark:text-gray-400 shrink-0">{err.time}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">{err.error_message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          LINHA 2 — Latência, Tokens, Custo
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Latência média</p>
            <TrendBadge deltaPct={trends.latencyDeltaPct} higherIsBetter={false} />
          </div>
          <p className="text-gray-900 dark:text-white text-3xl font-bold">{formatMs(totals?.avg_latency_ms_total)}</p>
          {totals?.avg_latency_ms_total != null && (
            <p className={`text-xs font-medium mt-1 ${latencyTone(totals.avg_latency_ms_total).text}`}>{latencyLabel(totals.avg_latency_ms_total)}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Latência P75</p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold">{formatMs(totals?.p75_latency_ms_total)}</p>
          {totals?.p75_latency_ms_total != null && (
            <p className={`text-xs font-medium mt-1 ${latencyTone(totals.p75_latency_ms_total).text}`}>{latencyLabel(totals.p75_latency_ms_total)}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Tokens (total)</p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold">{formatNumber(totals?.total_tokens_total)}</p>
          <div className="mt-1 space-y-2">
            <MiniBar segments={[
              { value: tokensInOut.prompt, className: "bg-violet-500/60 dark:bg-violet-400/60" },
              { value: tokensInOut.completion, className: "bg-sky-500/60 dark:bg-sky-400/60" },
            ]} />
            <p className="text-xs text-gray-500 dark:text-gray-400">IN: {formatNumber(tokensInOut.prompt)} • OUT: {formatNumber(tokensInOut.completion)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Custo total (USD)</p>
          <p className="text-gray-900 dark:text-white text-3xl font-bold">{formatUsd(totals?.cost_usd_total)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">* estimativa baseada nos totals</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          LINHA 3 — Última execução, Mais cara, Agente top, Modelo top
          ✅ Todos usando agent_name do backend
          ════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Última execução</p>
          {overview.last_run ? (
            <>
              <div className="flex items-center justify-between">
                <span className={statusBadge(overview.last_run.status)}>{overview.last_run.status}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(overview.last_run.created_at)}</span>
              </div>
              <p className="text-gray-900 dark:text-white text-lg font-bold mt-1">{formatMs(overview.last_run.duration_ms)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                Agente: <span className="font-medium">{displayAgent(overview.last_run.agent_name, overview.last_run.agent_id)}</span>
              </p>
            </>
          ) : <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>}
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Resposta mais cara</p>
          {overview.most_expensive ? (
            <>
              <p className="text-gray-900 dark:text-white text-2xl font-bold">{formatUsd(overview.most_expensive.cost_usd)}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <p>Tokens: <span className="text-gray-900 dark:text-white font-medium">{formatNumber(overview.most_expensive.total_tokens)}</span></p>
                <p>Duração: <span className="text-gray-900 dark:text-white font-medium">{formatMs(overview.most_expensive.duration_ms)}</span></p>
                <p className="truncate">Agente: <span className="font-medium text-gray-900 dark:text-white">{displayAgent(overview.most_expensive.agent_name, overview.most_expensive.agent_id)}</span></p>
              </div>
            </>
          ) : <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>}
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Agente mais ativo</p>
          {topAgent ? (
            <>
              <p className="text-gray-900 dark:text-white text-2xl font-bold truncate">{displayAgent(topAgent.agent_name, topAgent.agent_id)}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <p>Runs: <span className="text-gray-900 dark:text-white font-medium">{formatNumber(topAgent.runs_total)}</span></p>
                <p>Erros: <span className="text-gray-900 dark:text-white font-medium">{formatNumber(topAgent.errors_total)}</span></p>
                <p>Custo: <span className="text-gray-900 dark:text-white font-medium">{formatUsd(topAgent.cost_usd_total)}</span></p>
              </div>
            </>
          ) : <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>}
        </div>

        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Modelo mais usado</p>
          {topModel ? (
            <>
              <p className="text-gray-900 dark:text-white text-2xl font-bold">{topModel.model}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <p>Usado em <span className="text-gray-900 dark:text-white font-medium">{topModel.count}</span> de <span className="text-gray-900 dark:text-white font-medium">{topModel.total}</span> runs recentes</p>
                <p>({((topModel.count / topModel.total) * 100).toFixed(0)}% dos runs)</p>
              </div>
            </>
          ) : <p className="text-gray-500 dark:text-gray-400 text-sm">Sem dados</p>}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          TABELA — Totais por agente — ✅ mostra agent_name
          ════════════════════════════════════════════ */}
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
                <th className="text-right p-4">P75</th>
                <th className="text-right p-4">Tokens IN</th>
                <th className="text-right p-4">Tokens OUT</th>
                <th className="text-right p-4">Custo</th>
              </tr>
            </thead>
            <tbody className="text-gray-900 dark:text-white">
              {byAgent.length === 0 ? (
                <tr><td className="p-4 text-gray-500 dark:text-gray-400" colSpan={9}>Nenhum dado de agente.</td></tr>
              ) : byAgent.map((a) => (
                <tr key={a.agent_id} className="border-b border-gray-200/70 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="p-4 font-semibold">{displayAgent(a.agent_name, a.agent_id)}</td>
                  <td className="p-4 text-right">{formatNumber(a.runs_total)}</td>
                  <td className="p-4 text-right">{formatNumber(a.errors_total)}</td>
                  <td className="p-4 text-right">
                    <ThresholdBadge value={`${(a.error_rate_pct_total ?? 0).toFixed(2)}%`} tone={errorRateTone(a.error_rate_pct_total)} />
                  </td>
                  <td className="p-4 text-right">{formatMs(a.avg_latency_ms_total ?? null)}</td>
                  <td className="p-4 text-right">{formatMs(a.p75_latency_ms_total ?? null)}</td>
                  <td className="p-4 text-right">{formatNumber(a.prompt_tokens_total ?? null)}</td>
                  <td className="p-4 text-right">{formatNumber(a.completion_tokens_total ?? null)}</td>
                  <td className="p-4 text-right font-bold">{formatUsd(a.cost_usd_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          TABELA — Últimas execuções — ✅ mostra nomes via lookup
          ════════════════════════════════════════════ */}
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
                <tr><td className="p-4 text-gray-500 dark:text-gray-400" colSpan={7}>Nenhum run encontrado.</td></tr>
              ) : lastRuns.slice(0, 20).map((r) => (
                <tr key={r.id} className="border-b border-gray-200/70 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="p-4">
                    <div className="font-medium">{timeAgo(r.created_at)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.created_at).toISOString()}</div>
                  </td>
                  <td className="p-4"><span className={statusBadge(r.status)}>{r.status}</span></td>
                  {/* ✅ Usa agentLabel (lookup via byAgent) para resolver nome */}
                  <td className="p-4 font-semibold">{agentLabel(r.agent_id)}</td>
                  <td className="p-4 text-right">{formatMs(r.duration_ms ?? null)}</td>
                  <td className="p-4 text-right">{formatNumber(r.total_tokens ?? null)}</td>
                  <td className="p-4 text-right">{r.cost_usd != null ? formatUsd(r.cost_usd) : "-"}</td>
                  <td className="p-4">
                    {r.status === "error" || r.status === "timeout" ? (
                      <div className="text-xs text-rose-200">
                        <div className="font-semibold">{r.error_type ?? "Error"}</div>
                        <div className="text-rose-200/80 line-clamp-2">{r.error_message ?? "-"}</div>
                      </div>
                    ) : <span className="text-xs text-gray-500 dark:text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}