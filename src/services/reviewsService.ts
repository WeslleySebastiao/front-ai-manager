import api from "./api"; // ajuste o caminho se necessário
import type {
  ListReposResponse,
  ListPRsResponse,
  PRHistoryResponse,
  LatestReviewResponse,
} from "../types/reviews";

const BASE = "/api/v1/reviews";

export async function listReviewedRepos(limit = 50, offset = 0) {
  const { data } = await api.get<ListReposResponse>(`${BASE}/repos`, {
    params: { limit, offset },
  });
  return data;
}

export async function listReviewedPRsByRepo(repo_full_name: string, limit = 50, offset = 0) {
  const { data } = await api.get<ListPRsResponse>(`${BASE}/prs`, {
    params: { repo_full_name, limit, offset },
  });
  return data;
}

export async function getLatestReview(repo_full_name: string, pr_number: number) {
  const { data } = await api.get<LatestReviewResponse>(`${BASE}/pr/latest`, {
    params: { repo_full_name, pr_number },
  });
  return data;
}

export async function listPRHistory(repo_full_name: string, pr_number: number, limit = 20, offset = 0) {
  const { data } = await api.get<PRHistoryResponse>(`${BASE}/pr/history`, {
    params: { repo_full_name, pr_number, limit, offset },
  });
  return data;
}

export async function getReviewByJob(job_id: string) {
  const { data } = await api.get<LatestReviewResponse>(`${BASE}/jobs/${job_id}`);
  return data;
}
