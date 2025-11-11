import React, { useState } from "react";
import { createAgente } from "../../../services/agentService";
import { useNavigate } from "react-router-dom";

export default function CriarNovoAgente() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    provider: "openai",
    model: "gpt-4o",
    tools: [] as string[],
    prompt: "",
    temperature: 0.7,
    max_tokens: 1024,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleToolToggle(tool: string) {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        id: "", // o backend espera esse campo
        name: form.name.trim(),
        description: form.description.trim(),
        provider: form.provider,
        model: form.model,
        prompt: form.prompt.trim(),
        temperature: Number(form.temperature),
        max_tokens: Number(form.max_tokens),
        tools: form.tools.length > 0 ? form.tools : [], // garante lista
      };

      console.log("📦 Enviando payload:", payload);

      const response = await createAgente(payload);
      console.log("✅ Resposta do backend:", response);

      setMessage("✅ Agente criado com sucesso!");
      setTimeout(() => navigate("/agentes"), 1000);
    } catch (err: any) {
      console.error("❌ Erro ao criar agente:", err.response?.data || err);
      setMessage("❌ Falha ao criar o agente. Verifique o console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Criar Novo Agente
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-[#1C1F27]/60 p-6 rounded-xl border border-gray-200 dark:border-[#3b4354]/40 shadow-sm">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={3}
            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
          <select
            name="provider"
            value={form.provider}
            onChange={handleChange}
            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
          </select>
        </div>

        {/* Modelo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label>
          <select
            name="model"
            value={form.model}
            onChange={handleChange}
            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
          >
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</label>
          <textarea
            name="prompt"
            value={form.prompt}
            onChange={handleChange}
            rows={4}
            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
          />
        </div>

        {/* Tools */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ferramentas Permitidas</label>
          <div className="grid grid-cols-2 gap-2">
            {["web_search", "calculator", "calendar_api"].map((tool) => (
              <label key={tool} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.tools.includes(tool)}
                  onChange={() => handleToolToggle(tool)}
                  className="form-checkbox h-4 w-4 text-primary border-gray-400 dark:border-[#5a6376]"
                />
                <span className="text-gray-700 dark:text-gray-300">{tool}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Temperature & Tokens */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Temperatura</label>
            <input
              type="number"
              name="temperature"
              value={form.temperature}
              min="0"
              max="1"
              step="0.1"
              onChange={handleChange}
              className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tokens Máximos</label>
            <input
              type="number"
              name="max_tokens"
              value={form.max_tokens}
              onChange={handleChange}
              className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Agente"}
          </button>
        </div>

        {message && (
          <p className="text-center text-sm text-gray-700 dark:text-gray-300 mt-4">{message}</p>
        )}
      </form>
    </div>
  );
}
