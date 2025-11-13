import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sendMessageToAgent } from "../../../services/sendMessageToAgent";

type ChatMessage = {
  id: string;
  sender: "user" | "agent";
  text: string;
  time: string;
};

export default function AgenteChat() {
  const { id: agentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ------------------------------
  // LOAD HISTORY FROM LOCALSTORAGE
  // ------------------------------
  useEffect(() => {
    if (!agentId) return;

    const saved = localStorage.getItem(`chat-${agentId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    }
  }, [agentId]);

  // ------------------------------
  // AUTO-SCROLL WHEN MESSAGES UPDATE
  // ------------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (agentId) {
      localStorage.setItem(`chat-${agentId}`, JSON.stringify(messages));
    }
  }, [messages, agentId]);

  if (!agentId) {
    return (
      <div className="p-4 text-slate-800 dark:text-slate-200">
        <p>Agente não encontrado.</p>
        <button
          className="mt-2 px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-sm dark:bg-slate-700 dark:hover:bg-slate-600"
          onClick={() => navigate("/agentes")}
        >
          Voltar
        </button>
      </div>
    );
  }

  // ------------------------------
  // SEND USER MESSAGE
  // ------------------------------
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setError("");

    const now = new Date();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: input.trim(),
      time,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTyping(true);
    setLoading(true);

    try {
      const data = await sendMessageToAgent(agentId!, userMessage.text);

      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "agent",
        text: data.result ?? "(sem resposta)",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error(err);
      setError("Erro ao falar com o agente. Veja o console/backend.");
    } finally {
      setTyping(false);
      setLoading(false);
    }
  }

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md bg-white/70 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/agentes")}
            className="px-2 py-1 text-sm rounded bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
          >
            ← Voltar
          </button>
          <h1 className="text-lg font-semibold">
            Chat com agente{" "}
            <span className="text-slate-500 dark:text-slate-400">
              #{agentId}
            </span>
          </h1>
        </div>

        {(loading || typing) && (
          <span className="text-xs text-blue-500 animate-pulse">
            Agente digitando...
          </span>
        )}
      </header>

      {/* MESSAGES */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-900 rounded-bl-sm dark:bg-slate-800 dark:text-slate-100"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wide text-slate-300 mb-1 flex items-center justify-between">
                {msg.sender === "user" ? "Você" : "Agente"}
                <span className="text-[9px] opacity-80">{msg.time}</span>
              </div>
              {msg.text}
            </div>
          </div>
        ))}

        {/* TYPING DOTS */}
        {typing && (
          <div className="flex justify-start">
            <div className="px-3 py-2 bg-slate-200 dark:bg-slate-800 rounded-2xl text-xs flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* ERROR BAR */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900">
          {error}
        </div>
      )}

      {/* INPUT BAR */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex gap-2 items-center bg-slate-50 dark:bg-slate-950 backdrop-blur-md"
      >
        <input
          type="text"
          className="flex-1 rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 
          focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600
          dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
        >
          {loading ? "···" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
