import React, { useEffect, useMemo, useState } from "react";
import { MarkdownRenderer } from "../../components/markdown";

import {
  listReviewedPRsByRepo,
  listReviewedRepos,
  getLatestReview,
  listPRHistory,
  getReviewByJob,
} from "../../../services/reviewsService";
import type {
  LatestReviewResponse,
  ReviewedPR,
  ReviewedRepo,
  Severity,
  ReviewFinding,
  ReviewJob,
} from "../../../types/reviews";

type PRListState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; prs: ReviewedPR[] };

type LatestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: LatestReviewResponse };

type HistoryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; jobs: ReviewJob[] };

const SEVERITIES: Severity[] = ["BLOCKER", "MAJOR", "MINOR", "NIT"];

function severityLabel(s: Severity) {
  if (s === "BLOCKER") return "Blocker";
  if (s === "MAJOR") return "Major";
  if (s === "MINOR") return "Minor";
  return "Nit";
}

function severityTone(s: Severity) {
  switch (s) {
    case "BLOCKER":
      return {
        ring: "ring-red-500/20 dark:ring-red-400/20",
        bg: "bg-red-500/10 dark:bg-red-400/10",
        text: "text-red-700 dark:text-red-300",
        chip: "border-red-500/20 bg-red-500/10 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300",
        bar: "bg-red-500/60 dark:bg-red-400/60",
        icon: "text-red-600 dark:text-red-300",
      };
    case "MAJOR":
      return {
        ring: "ring-orange-500/20 dark:ring-orange-400/20",
        bg: "bg-orange-500/10 dark:bg-orange-400/10",
        text: "text-orange-700 dark:text-orange-300",
        chip: "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300",
        bar: "bg-orange-500/60 dark:bg-orange-400/60",
        icon: "text-orange-600 dark:text-orange-300",
      };
    case "MINOR":
      return {
        ring: "ring-amber-500/20 dark:ring-amber-400/20",
        bg: "bg-amber-500/10 dark:bg-amber-400/10",
        text: "text-amber-700 dark:text-amber-300",
        chip: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
        bar: "bg-amber-500/60 dark:bg-amber-400/60",
        icon: "text-amber-600 dark:text-amber-300",
      };
    default:
      return {
        ring: "ring-sky-500/20 dark:ring-sky-400/20",
        bg: "bg-sky-500/10 dark:bg-sky-400/10",
        text: "text-sky-700 dark:text-sky-300",
        chip: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
        bar: "bg-sky-500/60 dark:bg-sky-400/60",
        icon: "text-sky-600 dark:text-sky-300",
      };
  }
}

function statusTone(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s.includes("complete") || s.includes("success") || s === "completed") {
    return {
      chip: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300",
      icon: "check_circle",
    };
  }
  if (s.includes("error") || s.includes("fail")) {
    return {
      chip: "border-red-500/25 bg-red-500/10 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300",
      icon: "cancel",
    };
  }
  return {
    chip: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300",
    icon: "hourglass_top",
  };
}

function groupFindings(findings: ReviewFinding[]) {
  return findings.reduce<Record<Severity, ReviewFinding[]>>(
    (acc, f) => {
      acc[f.severity].push(f);
      return acc;
    },
    { BLOCKER: [], MAJOR: [], MINOR: [], NIT: [] }
  );
}

function formatDuration(ms?: number | null) {
  if (!ms || ms <= 0) return null;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem.toFixed(0)}s`;
}

export default function PRReviews() {
  const [repos, setRepos] = useState<ReviewedRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [reposError, setReposError] = useState<string | null>(null);

  const [openRepo, setOpenRepo] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ repo: string; pr: number } | null>(
    null
  );

  const [prsByRepo, setPrsByRepo] = useState<Record<string, PRListState>>({});
  const [latest, setLatest] = useState<LatestState>({ status: "idle" });
  const [history, setHistory] = useState<HistoryState>({ status: "idle" });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // repos
  useEffect(() => {
    (async () => {
      try {
        setReposLoading(true);
        setReposError(null);
        const data = await listReviewedRepos(50, 0);
        setRepos(data.repos ?? []);
      } catch (e: any) {
        setReposError(e?.message ?? "Erro ao carregar repositórios");
      } finally {
        setReposLoading(false);
      }
    })();
  }, []);

  // ao selecionar PR -> history + latest
  useEffect(() => {
    if (!selected) {
      setLatest({ status: "idle" });
      setHistory({ status: "idle" });
      setSelectedJobId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLatest({ status: "loading" });
        setHistory({ status: "loading" });
        setSelectedJobId(null);

        const hist = await listPRHistory(selected.repo, selected.pr, 20, 0);
        if (cancelled) return;

        const jobs = hist.jobs ?? [];
        setHistory({ status: "ready", jobs });

        const data = await getLatestReview(selected.repo, selected.pr);
        if (cancelled) return;

        setLatest({ status: "ready", data });

        if (data.job?.id) setSelectedJobId(data.job.id);
        else if (jobs[0]?.id) setSelectedJobId(jobs[0].id);
      } catch (e: any) {
        if (cancelled) return;
        setLatest({
          status: "error",
          message: e?.message ?? "Erro ao carregar análise do PR",
        });
        setHistory({
          status: "error",
          message: e?.message ?? "Erro ao carregar histórico",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected?.repo, selected?.pr]);

  async function handleToggleRepo(repo_full_name: string) {
    setOpenRepo((curr) => (curr === repo_full_name ? null : repo_full_name));

    const currentState = prsByRepo[repo_full_name];
    if (currentState && currentState.status !== "idle") return;

    setPrsByRepo((prev) => ({
      ...prev,
      [repo_full_name]: { status: "loading" },
    }));

    try {
      const data = await listReviewedPRsByRepo(repo_full_name, 50, 0);
      setPrsByRepo((prev) => ({
        ...prev,
        [repo_full_name]: { status: "ready", prs: data.prs ?? [] },
      }));
    } catch (e: any) {
      setPrsByRepo((prev) => ({
        ...prev,
        [repo_full_name]: {
          status: "error",
          message: e?.message ?? "Erro ao carregar PRs",
        },
      }));
    }
  }

  async function handleSelectJob(jobId: string) {
    try {
      setSelectedJobId(jobId);
      setLatest({ status: "loading" });
      const data = await getReviewByJob(jobId);
      setLatest({ status: "ready", data });
    } catch (e: any) {
      setLatest({
        status: "error",
        message: e?.message ?? "Erro ao carregar análise do job",
      });
    }
  }

  const selectedTitle = useMemo(() => {
    if (!selected) return "Selecione um PR";
    return `${selected.repo} • PR #${selected.pr}`;
  }, [selected]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            PR Reviews
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Selecione um repositório e depois um PR para visualizar a análise.
          </p>
        </div>
      </div>

      {/* ✅ SELEÇÃO (TOP) */}
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Repositórios analisados
          </p>
        </div>

        <div className="p-2">
          {reposLoading && (
            <p className="px-2 py-3 text-sm text-gray-600 dark:text-gray-400">
              Carregando repositórios...
            </p>
          )}

          {!reposLoading && reposError && (
            <div className="px-2 py-3 text-sm text-red-600">{reposError}</div>
          )}

          {!reposLoading && !reposError && repos.length === 0 && (
            <p className="px-2 py-3 text-sm text-gray-600 dark:text-gray-400">
              Nenhum repositório encontrado.
            </p>
          )}

          {!reposLoading &&
            !reposError &&
            repos.map((r) => {
              const isOpen = openRepo === r.repo_full_name;
              const prsState =
                prsByRepo[r.repo_full_name] ?? ({ status: "idle" } as const);

              return (
                <div key={r.repo_full_name} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleToggleRepo(r.repo_full_name)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left rounded-lg
                               hover:bg-gray-100/70 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {r.repo_full_name}
                      </p>
                      {r.last_review_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Última análise:{" "}
                          {new Date(r.last_review_at).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3">
                      {prsState.status === "loading" && (
                        <p className="py-2 text-sm text-gray-600 dark:text-gray-400">
                          Carregando PRs...
                        </p>
                      )}

                      {prsState.status === "error" && (
                        <p className="py-2 text-sm text-red-600">
                          {prsState.message}
                        </p>
                      )}

                      {prsState.status === "ready" && prsState.prs.length === 0 && (
                        <p className="py-2 text-sm text-gray-600 dark:text-gray-400">
                          Nenhum PR encontrado.
                        </p>
                      )}

                      {prsState.status === "ready" && prsState.prs.length > 0 && (
                        <div className="mt-2 flex flex-col gap-2">
                          {prsState.prs.map((pr) => {
                            const active =
                              selected?.repo === r.repo_full_name &&
                              selected?.pr === pr.pr_number;

                            return (
                              <button
                                key={pr.pr_number}
                                type="button"
                                onClick={() =>
                                  setSelected({
                                    repo: r.repo_full_name,
                                    pr: pr.pr_number,
                                  })
                                }
                                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border transition-colors
                                  ${
                                    active
                                      ? "border-primary/40 bg-primary/15 text-primary"
                                      : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-white/10"
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center rounded-md border border-gray-200 dark:border-white/10 px-2 py-0.5 text-xs">
                                    PR #{pr.pr_number}
                                  </span>
                                  <span className="text-sm">Selecionar</span>
                                </div>

                                <span className="material-symbols-outlined text-base opacity-70">
                                  chevron_right
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ✅ ANÁLISE (BOTTOM - largura total) */}
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Review Details
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {selected && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  History
                </span>

                <select
                  value={selectedJobId ?? ""}
                  onChange={(e) => handleSelectJob(e.target.value)}
                  disabled={history.status !== "ready" || history.jobs.length === 0}
                  className="text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/20
                             text-gray-800 dark:text-gray-100 px-3 py-2 outline-none"
                >
                  {history.status === "loading" && (
                    <option value="">Carregando...</option>
                  )}
                  {history.status === "error" && (
                    <option value="">Erro no histórico</option>
                  )}
                  {history.status === "ready" && history.jobs.length === 0 && (
                    <option value="">Sem histórico</option>
                  )}
                  {history.status === "ready" &&
                    history.jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.created_at
                          ? new Date(j.created_at).toLocaleString()
                          : j.id.slice(0, 8)}{" "}
                        • {j.status ?? "job"}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {latest.status === "ready" &&
              (() => {
                const tone = statusTone(latest.data.job?.status);
                return (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${tone.chip}`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {tone.icon}
                    </span>
                    {latest.data.job?.status ?? "ready"}
                  </span>
                );
              })()}
          </div>
        </div>

        {!selected && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Escolha um repositório e clique em um PR para carregar a análise.
          </p>
        )}

        {selected && latest.status === "loading" && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Carregando análise do PR...
          </p>
        )}

        {selected && latest.status === "error" && (
          <div className="mt-3 text-sm text-red-600">{latest.message}</div>
        )}

        {selected && latest.status === "ready" && (
          <LatestPanel data={latest.data} />
        )}
      </div>
    </div>
  );
}

function LatestPanel({ data }: { data: LatestReviewResponse }) {
  const duration =
    formatDuration((data.job as any)?.duration_ms) ||
    (data.job?.created_at && data.job?.finished_at
      ? (() => {
          const a = new Date(data.job.created_at).getTime();
          const b = new Date(data.job.finished_at).getTime();
          const ms = b - a;
          return formatDuration(ms);
        })()
      : null);

  if (!data.report) {
    return (
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 p-5">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">hourglass_top</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Análise em processamento
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Existe um job criado, mas o report ainda não ficou pronto.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoCard label="Status" value={data.job?.status ?? "running"} />
          <InfoCard label="Duração" value={duration ?? "—"} />
          <InfoCard label="Job ID" value={data.job?.id ?? "—"} mono />
        </div>
      </div>
    );
  }

  const grouped = groupFindings(data.findings ?? []);

  const summary =
    (data.report as any)?.summary_md ??
    (data.report as any)?.result_json?.summary_md ??
    "";

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(() => {
          const st = statusTone(data.job?.status);
          return (
            <InfoCard
              label="Status"
              value={data.job?.status ?? "completed"}
              icon={st.icon}
              tone={{
                bar: st.chip.includes("emerald")
                  ? "bg-emerald-500/60 dark:bg-emerald-400/60"
                  : st.chip.includes("red")
                  ? "bg-red-500/60 dark:bg-red-400/60"
                  : "bg-sky-500/60 dark:bg-sky-400/60",
                bg: "",
                ring: "",
              }}
            />
          );
        })()}

        <InfoCard
          label="Duration"
          value={duration ?? "—"}
          icon="timer"
          tone={{
            bar: "bg-violet-500/60 dark:bg-violet-400/60",
            bg: "",
            ring: "",
          }}
        />

        <InfoCard
          label="Findings"
          value={`${(data.findings ?? []).length}`}
          icon="search"
          tone={{
            bar:
              (data.findings ?? []).length > 0
                ? "bg-amber-500/60 dark:bg-amber-400/60"
                : "bg-emerald-500/60 dark:bg-emerald-400/60",
            bg: "",
            ring: "",
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map((s) => {
          const t = severityTone(s);
          return (
            <span
              key={s}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${t.chip}`}
            >
              <span className={`material-symbols-outlined text-base ${t.icon}`}>
                {s === "BLOCKER"
                  ? "dangerous"
                  : s === "MAJOR"
                  ? "error"
                  : s === "MINOR"
                  ? "warning"
                  : "info"}
              </span>
              {severityLabel(s)}: {data.counts?.[s] ?? 0}
            </span>
          );
        })}
      </div>

      {/* ✅ SUMMARY */}
      <div
        className="rounded-xl border border-gray-200 dark:border-white/10
                   bg-gradient-to-b from-white/60 to-white/30
                   dark:from-white/10 dark:to-white/5
                   p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-700 dark:text-gray-200">
            article
          </span>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            PR Review Summary
          </p>
        </div>

        <div className="mt-3">
          {summary?.trim() ? (
            <MarkdownRenderer content={summary} />
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Sem resumo disponível.
            </p>
          )}
        </div>
      </div>

      {/* ✅ FINDINGS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Findings
          </h3>
        </div>

        {SEVERITIES.every((s) => grouped[s].length === 0) ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Nenhum finding reportado.
          </p>
        ) : (
          SEVERITIES.map((s) =>
            grouped[s].length ? (
              <div
                key={s}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5"
              >
                <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {severityLabel(s)}
                  </p>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {grouped[s].length} item(s)
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {grouped[s].map((f) => (
                    <FindingItem key={f.id} finding={f} />
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </div>

      {data.tests_suggested?.length ? (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 p-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">science</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Tests suggested
            </p>
          </div>

          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            {data.tests_suggested.map((t, idx) => (
              <li key={`${idx}-${t}`}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({
  label,
  value,
  mono,
  tone,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: { bar: string; bg: string; ring: string };
  icon?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white/40 dark:bg-white/5 p-4
                  shadow-sm ring-1 ring-transparent ${tone?.ring ?? ""}`}
    >
      {tone && <span className={`absolute left-0 top-0 h-full w-1 ${tone.bar}`} />}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p
            className={`mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100 ${
              mono ? "font-mono text-sm break-all" : ""
            }`}
          >
            {value}
          </p>
        </div>

        {icon ? (
          <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FindingItem({ finding }: { finding: ReviewFinding }) {
  const t = severityTone(finding.severity);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-white/10
                  bg-white/50 dark:bg-black/10 p-4 shadow-sm ring-1 ring-transparent ${t.ring}`}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${t.bar}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {finding.title?.trim() ? finding.title : "Finding"}
          </p>

          {(finding as any).file_path && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
              {(finding as any).file_path}
              {finding.line_start != null && finding.line_end != null
                ? `:${finding.line_start}-${finding.line_end}`
                : ""}
            </p>
          )}
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${t.chip}`}
        >
          {finding.severity}
        </span>
      </div>

      {finding.evidence && (
        <div className="mt-3">
          <p className={`text-xs font-semibold ${t.text}`}>Evidence</p>
          <pre
            className={`mt-1 whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-200 rounded-lg border
                        border-gray-200 dark:border-white/10 bg-white/40 dark:bg-black/20 p-3 overflow-auto`}
          >
            {finding.evidence}
          </pre>
        </div>
      )}

      {finding.recommendation && (
        <div className="mt-3">
          <p className={`text-xs font-semibold ${t.text}`}>Recommendation</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {finding.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
