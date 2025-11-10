import React from 'react'
import ExecutionListItem from './ExecutionListItem'

const executions = [
  { id: 1, agent: 'Agente Alpha', status: 'Concluído', description: 'Tarefa de Processamento de Dados', time: '2 min ago' },
  { id: 2, agent: 'Agente Beta', status: 'Concluído', description: 'Análise de Sentimento de Mídia Social', time: '5 min ago' },
  { id: 3, agent: 'Agente Gamma', status: 'Falhou', description: 'Geração de Relatório de Vendas', time: '12 min ago' },
  { id: 4, agent: 'Agente Delta', status: 'Em Andamento', description: 'Monitoramento de Rede', time: '15 min ago' },
]

export default function ExecutionList() {
  return (
    <div className="mt-6 rounded-xl shadow bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
      <div className="p-6">
        <p className="text-gray-900 dark:text-white text-lg font-bold">Últimas Execuções</p>
        <p className="text-gray-600 dark:text-gray-400 text-base">Um resumo das execuções mais recentes dos agentes.</p>
      </div>
      <div className="flex flex-col divide-y divide-gray-200 dark:divide-white/10">
        {executions.map((ex) => (
          <ExecutionListItem key={ex.id} {...ex} />
        ))}
      </div>
    </div>
  )
}
