import api from './api'

export async function getDashboardData() {
  try {
    // Busca apenas a lista de agentes (endpoint real)
    const agentsRes = await api.get('/agent')

    // Gera valores temporários para status e execuções
    const fakeStatus = 'online'
    const fakeExecucoes = Math.floor(Math.random() * 200) // só pra visual

    // Retorna dados compatíveis com o Dashboard
    return {
      agentes: agentsRes.data.length,
      mcpStatus: fakeStatus,
      execucoes24h: fakeExecucoes,
    }
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return {
      agentes: 0,
      mcpStatus: 'offline',
      execucoes24h: 0,
    }
  }
}
