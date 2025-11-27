import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgentes() {
      try {
        const response = await api.get("/agent");
        console.log("📡 Dados recebidos de /agent:", response.data);

        // Garante que SEMPRE seja array:
        const lista =
          Array.isArray(response.data)
            ? response.data
            : response.data?.agents ||
              response.data?.items ||
              response.data?.data ||
              [];

        setAgentes(lista);
      } catch (error) {
        console.error("❌ Erro ao buscar agentes:", error);
        setAgentes([]); // evita quebra
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
            onClick={() => navigate(`/agentes/${agente.id}`)}
            className="cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1F27]/60 p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {agente.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {agente.description}
            </p>

            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-200">Modelo:</span>{" "}
                <span className="text-gray-600 dark:text-gray-400">{agente.model}</span>
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-200">Provider:</span>{" "}
                <span className="text-gray-600 dark:text-gray-400">{agente.provider}</span>
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-200">Temperatura:</span>{" "}
                <span className="text-gray-600 dark:text-gray-400">{agente.temperature}</span>
              </p>
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-200">Tokens Máx:</span>{" "}
                <span className="text-gray-600 dark:text-gray-400">{agente.max_tokens}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}