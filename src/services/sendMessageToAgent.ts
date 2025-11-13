import api from "./api";

export interface AgentMessageResponse {
  result: string;
  agent_id: string;
}

/**
 * Extrai texto de respostas do LangChain / ChatOpenAI
 * Independente se vier como:
 * - string
 * - BaseMessage
 * - { content: [{ text }] }
 * - { content: "..." }
 * - arrays misturados
 */
function extractText(result: any): string {
  if (!result) return "(sem resposta)";

  // 📌 Caso seja string direta
  if (typeof result === "string") return result;

  // 📌 Caso seja algo como { content: "texto" }
  if (typeof result.content === "string") {
    return result.content;
  }

  // 📌 Caso seja array de conteúdos do LangChain
  if (Array.isArray(result.content)) {
    return result.content
      .map((c: any) => {
        if (typeof c === "string") return c;
        if (c?.text) return c.text;
        if (c?.content) return c.content;
        return "";
      })
      .join("\n");
  }

  // 📌 Caso padrão — transformar objeto em texto
  return JSON.stringify(result, null, 2);
}

export async function sendMessageToAgent(
  agentId: string,
  message: string
): Promise<AgentMessageResponse> {
  const payload = {
    id: agentId,
    user_prompt: message,
  };

  console.log("📤 Payload enviado ao backend:", payload);

  const { data } = await api.post("/agent/run", payload);

  console.log("📥 Resposta RAW do backend:", data);

  // Extrair a string corretamente independente da estrutura
  const cleanedResult = extractText(data.result);

  console.log("✨ Mensagem limpa extraída:", cleanedResult);

  return {
    ...data,
    result: cleanedResult,
  };
}
