// src/app/components/AgentForm.tsx
import React, { useEffect, useState } from "react";
import { getTools } from "../../services/toolService";

// ──────────────────────────────────────────────
// ✅ MUDANÇA: Mapa centralizado de modelos por provider.
//
// POR QUE: antes, todos os modelos apareciam independente do provider,
// permitindo combinações inválidas (ex: Anthropic + GPT-4o).
//
// Agora usamos um objeto como "fonte única de verdade" (single source of truth).
// Quando o provider muda, derivamos a lista de modelos a partir daqui.
// Isso segue o princípio de "impossibilitar estados inválidos" ao invés
// de apenas validá-los depois.
//
// Para adicionar um novo modelo ou provider no futuro, basta editar este objeto.
// ──────────────────────────────────────────────
const MODELS_BY_PROVIDER: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-5.2", label: "GPT-5.2" },
    { value: "gpt-5.2-pro", label: "GPT-5.2 Pro" },
    { value: "gpt-5.1", label: "GPT-5.1" },
    { value: "gpt-5-mini", label: "GPT-5 mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  anthropic: [
    { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
    { value: "claude-3-5-haiku", label: "Claude 3 Haiku" },
    { value: "claude-opus-4-5", label: "Claude Opus 4.5" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  ],
  google: [
    { value: "gemini-pro", label: "Gemini Pro" },
  ],
};

// Lista de providers derivada do mapa (evita duplicação)
const PROVIDERS = Object.keys(MODELS_BY_PROVIDER);

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

  // ──────────────────────────────────────────────
  // ✅ MUDANÇA: Derivar modelos disponíveis a partir do provider selecionado.
  //
  // Usamos um valor computado (não estado separado) porque a lista de modelos
  // é uma função direta do provider — armazená-la em estado separado criaria
  // risco de dessincronização.
  // ──────────────────────────────────────────────
  const availableModels = MODELS_BY_PROVIDER[form.provider] ?? [];

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }) as any);
  }

  // ──────────────────────────────────────────────
  // ✅ MUDANÇA: Handler específico para troca de provider.
  //
  // Quando o provider muda, precisamos verificar se o modelo atual
  // pertence ao novo provider. Se não pertencer, resetamos para o
  // primeiro modelo disponível. Isso evita estado inconsistente.
  //
  // Separamos em um handler próprio (em vez de tratar tudo no handleChange)
  // porque a lógica de cascata é específica dessa relação provider→modelo.
  // Isso segue o Single Responsibility Principle.
  // ──────────────────────────────────────────────
  function handleProviderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newProvider = e.target.value;
    const newModels = MODELS_BY_PROVIDER[newProvider] ?? [];

    // Verifica se o modelo atual existe no novo provider
    const currentModelExists = newModels.some((m) => m.value === form.model);

    setForm((prev) => ({
      ...prev,
      provider: newProvider,
      // Se o modelo atual não existe no novo provider, usa o primeiro disponível
      model: currentModelExists ? prev.model : (newModels[0]?.value ?? ""),
    }));
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

        {/* Provider — agora usa handleProviderChange para cascata */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Provider
          </label>
          <select
            name="provider"
            value={form.provider}
            onChange={handleProviderChange}
            className="mt-1 w-full p-3 rounded-lg border border-gray-300 dark:border-[#3b4354] bg-background-light dark:bg-[#101622] text-gray-900 dark:text-white"
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ MUDANÇA: Modelo agora é filtrado pelo provider selecionado.
            A lista vem de `availableModels`, que é derivada do mapa MODELS_BY_PROVIDER. */}
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
            {availableModels.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
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
          )}

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