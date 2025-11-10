import React, { useEffect, useState } from 'react'
import { getAgents } from '../../../services/agentService'

export default function Agentes() {
  const [agents, setAgents] = useState([])

  useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await getAgents()
        setAgents(data)
      } catch (error) {
        console.error('Erro ao buscar agentes:', error)
      }
    }
    fetchAgents()
  }, [])

  return (
    <div>
      <h1 className="text-gray-900 dark:text-white text-3xl font-bold mb-4">Agentes</h1>
      {agents.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Nenhum agente encontrado.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-white/10">
          {agents.map((agent: any) => (
            <li key={agent.id} className="py-3">
              <p className="text-gray-900 dark:text-white font-medium">{agent.nome}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{agent.modelo}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
