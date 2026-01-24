export type Severity = "BLOCKER" | "MAJOR" | "MINOR" | "NIT";

export type CountsBySeverity = Record<Severity, number>;

export type ReviewJob = {
  id: string;
  repo_full_name: string;
  pr_number: number;
  status?: string;        // pode variar no backend
  created_at?: string;
  finished_at?: string | null;
  duration_ms?: number | null;
};

export type ReviewReport = {
  id: string;
  job_id: string;
  summary?: string | null;
  created_at?: string;
};

export type ReviewFinding = {
  id: string;
  severity: Severity;
  file_path?: string | null;
  title?: string | null;

  // campos típicos pro "Evidence/Recommendation"
  evidence?: string | null;
  recommendation?: string | null;

  // se existir no backend:
  line_start?: number | null;
  line_end?: number | null;
};

export type LatestReviewResponse = {
  job: ReviewJob;
  report: ReviewReport | null;
  counts: CountsBySeverity;
  findings: ReviewFinding[];
  tests_suggested: string[];
};

export type ReviewedRepo = {
  repo_full_name: string;
  last_review_at?: string | null;
  prs_count?: number | null;
};

export type ListReposResponse = {
  limit: number;
  offset: number;
  repos: ReviewedRepo[];
};

export type ReviewedPR = {
  pr_number: number;
  last_job_id?: string | null;
  last_review_at?: string | null;
};

export type ListPRsResponse = {
  repo_full_name: string;
  limit: number;
  offset: number;
  prs: ReviewedPR[];
};

export type PRHistoryResponse = {
  repo_full_name: string;
  pr_number: number;
  limit: number;
  offset: number;
  jobs: ReviewJob[];
};
