// src/app/routes/Agentes/components/AgentForm.tsx
import React, { useEffect, useState } from "react";
import { getTools } from "../../services/toolService";

export type AgentFormState = {
    name: string;
    description: string;
    provider: string;
    model: string;
    tools: string[];
    prompt: string;
    temperature: number;
    max_tokens: number;
};

type Props = {
    title: string;
    submitLabel: string;
    initialForm: AgentFormState;
    loading?: boolean;
    message?: string;
    onSubmit: (form: AgentFormState) => Promise<void> | void;
    dangerLabel?: string;
    dangerDisabled?: boolean;
    onDanger?: () => void;
};

export default function AgentForm({
    title,
    submitLabel,
    initialForm,
    loading = false,
    message = "",
    onSubmit,
    dangerLabel,
    dangerDisabled = false,
    onDanger,
}: Props) {
  const [toolsAvailable, setToolsAvailable] = useState<
    { id: string; label: string; description?: string; icon?: string }[]
  >([]);

  const [form, setForm] = useState<AgentFormState>(initialForm);

  // quando initialForm mudar (ex.: carregou o agent no edit), atualiza o form
  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    // mantém números como string no input, mas converte no submit
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }) as any);
  }

  function handleToolToggle(tool: string) {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool],
    }));
  }

  useEffect(() => {
    async function fetchTools() {
      try {
        const response = await getTools();

        const toolsArray = Array.isArray(response?.tools) ? response.tools : [];

        const parsed = toolsArray.map((tool: any) => ({
          id: tool.name,
          label: tool.name,
          description: tool.schema?.description || "Sem descrição disponível.",
          icon: "build_circle",
        }));

        setToolsAvailable(parsed);
      } catch (err) {
        console.error("Erro ao carregar ferramentas:", err);
        setToolsAvailable([]);
      }
    }

    fetchTools();
  }, []);

  const handleInternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // normaliza números aqui
    const normalized: AgentFormState = {
      ...form,
      name: form.name ?? "",
      description: form.description ?? "",
      provider: form.provider ?? "openai",
      model: form.model ?? "gpt-4o",
      prompt: form.prompt ?? "",
      tools: Array.isArray(form.tools) ? form.tools : [],
      temperature: Number((form as any).temperature),
      max_tokens: Number((form as any).max_tokens),
    };

    await onSubmit(normalized);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>

      <form
        onSubmit={handleInternalSubmit}
        className="space-y-6 bg-white dark:bg-[#1C1F27]/60 p-6 rounded-xl border border-gray-200 dark:border-[#3b4354]/40 shadow-sm"
      >
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nome
          </label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descrição
          </label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Provider
          </label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Modelo
          </label>
          <select
            name="model"
            value={form.model}
            onChange={handleChange}
            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
          >
            <option value="gpt-5.2">GPT-5.2</option>
            <option value="gpt-5.2-pro">GPT-5.2 Pro</option>
            <option value="gpt-5.1">GPT-5.1</option>
            <option value="gpt-5-mini">GPT-5 mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            <option value="gemini-pro">Gemini Pro</option>
          </select>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Prompt
          </label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ferramentas Permitidas
          </label>

          {toolsAvailable.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma ferramenta disponível.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {toolsAvailable.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleToolToggle(tool.id)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-200 text-left 
                    ${
                      form.tools.includes(tool.id)
                        ? "border-primary bg-primary/10 dark:bg-primary/20 text-primary"
                        : "border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-700 dark:text-gray-300 hover:border-primary/50"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined ${
                        form.tools.includes(tool.id) ? "text-primary" : "text-gray-400"
                      }`}
                    >
                      {tool.icon}
                    </span>
                    <span className="text-base font-semibold leading-tight">
                      {tool.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Temperature & Tokens */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Temperatura
            </label>
            <input
              type="number"
              name="temperature"
              value={form.temperature as any}
              min="0"
              max="1"
              step="0.1"
              onChange={handleChange}
              className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tokens Máximos
            </label>
            <input
              type="number"
              name="max_tokens"
              value={form.max_tokens as any}
              onChange={handleChange}
              className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Botão e Mensagem */}
        <div className="flex justify-end gap-3">
            {onDanger && (
                <button 
                    type="button" 
                    disabled={dangerDisabled || loading} 
                    onClick={onDanger} 
                    className="px-6 py-3 rounded-lg border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                    {dangerLabel ?? "Excluir"}
                </button>
                )
            }     

            <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
                {loading ? "Salvando..." : submitLabel}
            </button>
        </div>

        {message && (
          <p className="text-center text-sm text-gray-700 dark:text-gray-300 mt-4">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
