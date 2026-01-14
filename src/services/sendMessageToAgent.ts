import api from "./api";

export interface AgentMessageResponseV2 {
  response: string;
  session_id: string;
}

export async function sendMessageToAgent(
  agentId: string,
  message: string,
  sessionId?: string | null
): Promise<AgentMessageResponseV2> {
  const payload = {
    agent_id: agentId,
    user_id: "Weslley",              // padrão por enquanto
    session_id: sessionId ?? null,   // primeira mensagem vai null
    message: message,
  };

  console.log("📤 Payload enviado ao backend:", payload);

  const { data } = await api.post("/agent/run/v2", payload);

  console.log("📥 Resposta RAW do backend:", data);

  return data; // { response, session_id }
}
