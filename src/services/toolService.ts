import api from "./api";

export async function getTools() {
  const response = await api.get("/list_tools");
  return response.data;
}