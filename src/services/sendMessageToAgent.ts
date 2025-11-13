import api from "./api";

export interface AgentMessageResponse {
  result: string;
  agent_id: string;
}

export async function sendMessageToAgent(
  agentId: string,
  message: string
): Promise<AgentMessageResponse> {
  const { data } = await api.post("/agent/run", {
    agent_id: agentId,
    prompt: message,
  });

  return data;
}

