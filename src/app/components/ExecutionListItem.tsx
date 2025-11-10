import React from 'react'


type Props = {
  agent: string
  status: string
  description: string
  time: string
}

export default function ExecutionListItem({ agent, status, description, time }: Props) {
  const color =
    status === 'Concluído' ? 'green' : status === 'Falhou' ? 'red' : 'gray'
  const icon =
    status === 'Concluído' ? 'check_circle' : status === 'Falhou' ? 'error' : 'sync'

  return (
    <div className="flex items-center gap-4 px-6 min-h-[72px] py-3 justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150">
      <div className="flex items-center gap-4">
        <div className={`text-${color}-500 flex items-center justify-center rounded-lg bg-${color}-500/10 shrink-0 size-12`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-gray-900 dark:text-white text-base font-medium leading-normal">{agent} - {status}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">{description}</p>
        </div>
      </div>
      <div className="shrink-0">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">{time}</p>
      </div>
    </div>
  )
}
