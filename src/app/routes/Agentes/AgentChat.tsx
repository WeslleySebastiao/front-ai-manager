import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sendMessageToAgent } from "../../../services/sendMessageToAgent";
import ThemeToggle from "../../components/ThemeToggle";
import { MarkdownRenderer } from "../../components/markdown";

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
  const [sessionId, setSessionId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ✅ trava o scroll da página SOMENTE enquanto estiver no chat
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevHeight = document.body.style.height;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100dvh";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.height = prevHeight;
    };
  }, []);

  // ------------------------------
  // LOAD HISTORY FROM LOCALSTORAGE
  // ------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`chat-${agentId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages ?? []);
        setSessionId(parsed.sessionId ?? null);
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      }
    } catch {
      // se corromper, ignora
    }
  }, [agentId]);

  // ------------------------------
  // AUTO-SCROLL WHEN MESSAGES UPDATE
  // ------------------------------
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (agentId) {
      localStorage.setItem(
        `chat-${agentId}`,
        JSON.stringify({ messages, sessionId })
      );
    }
  }, [messages, agentId, sessionId]);

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
      const data = await sendMessageToAgent(agentId!, userMessage.text, sessionId);

      // ✅ guardar session_id devolvido pelo backend
      setSessionId(data.session_id);

      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "agent",
        text: data.response ?? "(sem resposta)",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      console.error(err);
      setError("Erro ao falar com o agente.");
    } finally {
      setTyping(false);
      setLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
    setSessionId(null);

    if (agentId) {
      localStorage.removeItem(`chat-${agentId}`);
    }
  }

  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <div className="-m-6 lg:-m-10">
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-transparent text-slate-900 dark:text-slate-100">
        {/* HEADER (TRAVADO) */}
        <header className="shrink-0 px-6 py-4 border-b border-slate-200/40 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            {/* ESQUERDA: Voltar + Título */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate("/agentes")}
                className="px-3 py-2 text-sm rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-100"
              >
                ← Voltar
              </button>

              <h1 className="text-lg font-semibold truncate">
                Chat com agente{" "}
                <span className="text-slate-500 dark:text-slate-400">#{agentId}</span>
              </h1>

              {(loading || typing) && (
                <span className="hidden sm:inline text-xs text-blue-500 animate-pulse">
                  Agente digitando...
                </span>
              )}
            </div>

            {/* DIREITA: Limpar chat + ThemeToggle */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleClearChat}
                className="px-3 py-2 text-sm rounded-lg bg-slate-100/80 hover:bg-slate-200/80 text-slate-800 dark:bg-white/10 dark:hover:bg-white/15 dark:text-slate-100"
              >
                Limpar chat
              </button>

              <ThemeToggle />
            </div>
          </div>

          {/* typing no mobile */}
          {(loading || typing) && (
            <div className="sm:hidden mt-2 text-xs text-blue-500 animate-pulse">
              Agente digitando...
            </div>
          )}
        </header>

        {/* MESSAGES (ÚNICO SCROLL) */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "min-w-0 max-w-[85%] sm:max-w-[75%]",
                    "rounded-2xl px-4 py-2 text-sm shadow-sm",
                    "break-words overflow-hidden",
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-slate-100 text-slate-900 rounded-bl-md dark:bg-slate-800/70 dark:text-slate-100 border border-slate-200/50 dark:border-white/10",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "text-[10px] uppercase tracking-wide mb-1 flex items-center justify-between gap-4",
                      msg.sender === "user"
                        ? "text-blue-100/80"
                        : "text-slate-500 dark:text-slate-400",
                    ].join(" ")}
                  >
                    <span>{msg.sender === "user" ? "Você" : "Agente"}</span>
                    <span className="text-[9px] opacity-80 normal-case tracking-normal">
                      {msg.time}
                    </span>
                  </div>

                  {msg.sender === "agent" ? (
                    <div
                      className="
                        mt-1 min-w-0
                        [&_pre]:max-w-full [&_pre]:overflow-x-auto
                        [&_pre]:rounded-lg [&_pre]:p-3
                        [&_code]:break-words
                      "
                    >
                      <MarkdownRenderer content={msg.text} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {/* TYPING DOTS */}
            {typing && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl text-xs flex gap-1 border border-slate-200/40 dark:border-white/10">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </main>

        {/* ERROR (TRAVADO, ACIMA DO INPUT) */}
        {error && (
          <div className="shrink-0 mx-auto w-full max-w-3xl px-6 pb-2">
            <div className="px-3 py-2 text-xs text-red-600 bg-red-50/80 border border-red-200 rounded-xl dark:text-red-400 dark:bg-red-950/30 dark:border-red-900">
              {error}
            </div>
          </div>
        )}

        {/* INPUT (TRAVADO) */}
        <footer className="shrink-0 px-6 py-5">
          <div className="mx-auto w-full max-w-3xl">
            <form onSubmit={handleSend}>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-black/20 backdrop-blur-md px-3 py-2">
                <input
                  type="text"
                  className="flex-1 bg-transparent px-2 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Digite sua mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                >
                  {loading ? "···" : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
}
