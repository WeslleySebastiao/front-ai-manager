// src/app/routes/Agentes/CriarNovoAgente/index.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AgentForm, { AgentFormState } from "../../components/AgentForm";
import { createAgente } from "../../../services/agentService";

export default function CriarNovoAgente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const initialForm: AgentFormState = {
    name: "",
    description: "",
    provider: "openai",
    model: "gpt-4o",
    tools: [],
    prompt: "",
    temperature: 0.7,
    max_tokens: 1024,
  };

  const handleSubmit = async (form: AgentFormState) => {
    setLoading(true);
    setMessage("");

    try {
      const payload = {
        id: null, // mantém como você já fazia
        name: form.name.trim(),
        description: form.description.trim(),
        provider: form.provider,
        model: form.model,
        prompt: form.prompt.trim(),
        temperature: Number(form.temperature),
        max_tokens: Number(form.max_tokens),
        tools: form.tools.length > 0 ? form.tools : [],
      };

      await createAgente(payload);
      setMessage("Agente criado com sucesso!");
      setTimeout(() => navigate("/agentes"), 1000);
    } catch (err: any) {
      console.error("Erro ao criar agente:", err?.response?.data || err);
      setMessage("Falha ao criar o agente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentForm
      title="Criar Novo Agente"
      submitLabel="Salvar Agente"
      initialForm={initialForm}
      loading={loading}
      message={message}
      onSubmit={handleSubmit}
    />
  );
}
