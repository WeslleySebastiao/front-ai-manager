import React, { useEffect, useState } from 'react'
import { getDashboardData } from '../../services/dashboardService'

export default function Dashboard() {
  const [data, setData] = useState({ agentes: 0, mcpStatus: 'offline', execucoes24h: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const info = await getDashboardData()
        setData(info)
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
  }

  return (
    <>
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Número de Agentes */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Número de Agentes</p>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">{data.agentes}</p>
        </div>

        {/* Status do MCP */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">Status do MCP</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  data.mcpStatus === 'online' ? 'bg-green-400 opacity-75 animate-ping' : 'bg-red-400 opacity-50'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  data.mcpStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
                }`}
              ></span>
            </span>
            <p className="text-gray-900 dark:text-white text-2xl font-bold capitalize">
              {data.mcpStatus}
            </p>
          </div>
        </div>

        {/* Execuções Concluídas */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium">
            Execuções Concluídas (24h)
          </p>
          <p className="text-gray-900 dark:text-white text-4xl font-bold">{data.execucoes24h}</p>
        </div>
      </div>
    </>
  )
}
