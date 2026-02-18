import api from "./api";
import { supabase } from "../lib/supabase";

export interface AgentMessageResponseV2 {
  response: string;
  session_id: string;
}

export async function sendMessageToAgent(
  agentId: string,
  message: string,
  sessionId?: string | null
): Promise<AgentMessageResponseV2> {
  // ✅ Pega o user_id real da sessão do Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  const payload = {
    agent_id: agentId,
    user_id: userId,
    session_id: sessionId ?? null,
    message: message,
  };

  const { data } = await api.post("/agent/run/v2", payload);

  return data;
}