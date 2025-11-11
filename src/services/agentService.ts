import api from './api'

export async function getAgents() {
  const response = await api.get('/agent')
  return response.data
}

export async function getAgent(id) {
  const response = await api.get(`/agent/${id}`)
  return response.data
}

export async function createAgent(agentData) {
  const response = await api.post('/agent', agentData)
  return response.data
}

export async function deleteAgent(id) {
  const response = await api.delete(`/agentes/${id}`)
  return response.data
}

export async function createAgente(data: {
  name: string
  description: string
  provider: string
  model: string
  tools: string[]
  prompt: string
  temperature: int
  max_tokens: float
}) {
  const response = await api.post('/agent', data)
  return response.data
}
