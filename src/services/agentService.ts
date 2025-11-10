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
