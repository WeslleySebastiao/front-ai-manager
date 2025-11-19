import api from './api'

export async function getDashboardData() {
  try {
    
    const agentsRes = await api.get('/agent')

    
    const fakeStatus = 'online'
    const fakeExecucoes = Math.floor(Math.random() * 200)

    
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
