import React from "react";
import { useEffect, useState } from "react";
import api from "../../../services/api";

interface Agente {
  id: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  prompt: string;
  temperature: number;
  max_tokens: number;
}

export default function Agentes() {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgentes() {
      try {
        const response = await api.get("/agent");
        console.log("📡 Dados recebidos de /agentes:", response.data);
        setAgentes(response.data);
      } catch (error) {
        console.error("❌ Erro ao buscar agentes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAgentes();
  }, []);

  if (loading) {
    return (
      <div className="text-gray-600 dark:text-gray-300 text-center py-10">
        Carregando agentes...
      </div>
    );
  }

  if (agentes.length === 0) {
    return (
      <div className="text-gray-600 dark:text-gray-300 text-center py-10">
        Nenhum agente encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Agentes Ativos
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentes.map((agente) => (
          <div
            key={agente.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1F27]/60 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {agente.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {agente.description}
            </p>

            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Modelo:</span>{" "}
                {agente.model}
              </p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Provider:</span>{" "}
                {agente.provider}
              </p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Temperatura:</span>{" "}
                {agente.temperature}
              </p>
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Tokens Máx:</span>{" "}
                {agente.max_tokens}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}