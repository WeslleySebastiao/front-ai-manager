import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sendMessageToAgent } from "../../../services/sendMessageToAgent";

type ChatMessage = {
  id: string;
  sender: "user" | "agent";
  text: string;
};

export default function AgenteChat() {
  const { id: agentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!agentId) {
    return (
      <div className="p-4 text-slate-200">
        <p>Agente não encontrado.</p>
        <button
          className="mt-2 px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm"
          onClick={() => navigate("/agentes")}
        >
          Voltar
        </button>
      </div>
    );
  }

  // -------------------------
  // FUNÇÃO PRINCIPAL DO CHAT
  // -------------------------
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setError("");
    setLoading(true);

    // Mensagem do usuário
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const data = await sendMessageToAgent(agentId!, userMessage.text);

      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "agent",
        text: data.result ?? "(sem resposta)",
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error(err);
      setError("Erro ao falar com o agente. Veja o console/backend.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/agentes")}
            className="px-2 py-1 text-sm rounded hover:bg-slate-800"
          >
            ← Voltar
          </button>
          <h1 className="text-lg font-semibold">
            Chat com agente <span className="text-slate-400">#{agentId}</span>
          </h1>
        </div>
        {loading && (
          <span className="text-xs text-slate-400">Agente pensando...</span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            Envie uma mensagem para começar a conversa com o agente.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-800 text-slate-100 rounded-bl-sm"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wide text-slate-300 mb-1">
                {msg.sender === "user" ? "Você" : "Agente"}
              </div>
              {msg.text}
            </div>
          </div>
        ))}
      </main>

      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-950/40 border-t border-red-900">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="border-t border-slate-800 px-4 py-3 flex gap-2 items-center"
      >
        <input
          type="text"
          className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          placeholder="Digite sua mensagem para o agente..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}

