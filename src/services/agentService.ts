import api from './api'

export type AgentPayload = {
  id?: string | null;
  name: string;
  description: string;
  provider: string;
  model: string;
  tools: string[];
  prompt: string;
  temperature: number;
  max_tokens: number;
};

export async function getAgents() {
  const response = await api.get('/agent')
  return response.data
}

export async function getAgent(agentId: string) {
  const response = await api.get(`/agent/${agentId}`)
  return response.data
}

export async function deleteAgent(agentId: string) {
  const response = await api.delete(`/agent/${agentId}`)
  return response.data
}

export async function getAgentById(agentId: string) {
  const res = await api.get(`/agent/${agentId}`);
  return res.data;
}

export async function updateAgent(agentId: string, patch: Partial<AgentPayload>) {
  const res = await api.patch(`/agent/${agentId}`, patch);
  return res.data;
}

export async function createAgente(data: {
  name: string;
  description: string;
  provider: string;
  model: string;
  tools: string[];
  prompt: string;
  temperature: number;
  max_tokens: number;
}) {
  const response = await api.post("/agent", data);
  return response.data;
}
