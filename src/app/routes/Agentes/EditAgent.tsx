import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AgentForm, { AgentFormState } from "../../components/AgentForm";
import { getAgentById, updateAgent, deleteAgent } from "../../../services/agentService";
import ConfirmDialog from "../../components/ConfirmDialog";


function normalizeAgentResponse(data: any) {
  // suporta: { agent: {...} } ou {...}
    return data?.agent ?? data;
}

function arraysEqualAsSet(a: string[], b: string[]) {
    const A = [...(a || [])].sort();
    const B = [...(b || [])].sort();
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
}

export default function EditarAgente() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loadingPage, setLoadingPage] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);


    const [initialForm, setInitialForm] = useState<AgentFormState>({
        name: "",
        description: "",
        provider: "openai",
        model: "gpt-4o",
        tools: [],
        prompt: "",
        temperature: 0.7,
        max_tokens: 1024,
    });


useEffect(() => {
    if (!id) {
        navigate("/agentes");
        return;
    }

    const agentId = id;

    async function fetchAgent() {
        setLoadingPage(true);
        setNotFound(false);
        setMessage("");

    try {
        const res = await getAgentById(agentId);
        const agent = normalizeAgentResponse(res);

        if (!agent) {
            setNotFound(true);
            return;
        }

        setInitialForm({
            name: agent.name ?? "",
            description: agent.description ?? "",
            provider: agent.provider ?? "openai",
            model: agent.model ?? "gpt-4o",
            tools: Array.isArray(agent.tools) ? agent.tools : [],
            prompt: agent.prompt ?? "",
            temperature: Number(agent.temperature ?? 0.7),
            max_tokens: Number(agent.max_tokens ?? 1024),
            });
        } catch (err: any) {
            if (err?.response?.status === 404) setNotFound(true);
            console.error("Erro ao buscar agente:", err?.response?.data || err);
        } finally {
            setLoadingPage(false);
        }
        }

    fetchAgent();
    }, [id, navigate]);

  // ✅ salvar (PATCH só do que mudou)
    const handleSubmit = async (current: AgentFormState) => {
        if (!id) return;

    setSaving(true);
    setMessage("");

    try {
        const patch: any = {};

        const nName = current.name.trim();
        const nDesc = current.description.trim();
        const nPrompt = current.prompt.trim();

        if (nName !== initialForm.name.trim()) patch.name = nName;
        if (nDesc !== initialForm.description.trim()) patch.description = nDesc;
        if (current.provider !== initialForm.provider) patch.provider = current.provider;
        if (current.model !== initialForm.model) patch.model = current.model;

        const curTools = Array.isArray(current.tools) ? current.tools : [];
        const iniTools = Array.isArray(initialForm.tools) ? initialForm.tools : [];
        if (!arraysEqualAsSet(curTools, iniTools)) patch.tools = curTools;

        if (nPrompt !== initialForm.prompt.trim()) patch.prompt = nPrompt;

        const curTemp = Number(current.temperature);
        const iniTemp = Number(initialForm.temperature);
        if (curTemp !== iniTemp) patch.temperature = curTemp;

        const curMax = Number(current.max_tokens);
        const iniMax = Number(initialForm.max_tokens);
        if (curMax !== iniMax) patch.max_tokens = curMax;

        if (Object.keys(patch).length === 0) {
            setMessage("Nenhuma alteração para salvar.");
            return;
        }

        await updateAgent(id, patch);
        setMessage("Agente atualizado com sucesso!");
        setTimeout(() => navigate("/agentes"), 900);
        } catch (err: any) {
        console.error("Erro ao atualizar agente:", err?.response?.data || err);
        setMessage("Falha ao atualizar o agente.");
        } finally {
        setSaving(false);
        }
    };

    // ✅ DELETE (o bloco que você fez)
    const handleDelete = () => {
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!id) return;

        setDeleting(true);
        setMessage("");

        try {
            await deleteAgent(id);
            setMessage("Agente deletado com sucesso!");
            setConfirmOpen(false);
            setTimeout(() => navigate("/agentes"), 800);
        } catch (err: any) {
            console.error("Erro ao deletar agente:", err?.response?.data || err);
            setMessage("Falha ao deletar o agente.");
        } finally {
            setDeleting(false);
        }
    };

    // ✅ estados de tela
    if (loadingPage) {
        return (
        <div className="text-gray-600 dark:text-gray-300 text-center py-10">
            Carregando agente...
        </div>
        );
    }

    if (notFound) {
        return (
        <div className="text-gray-600 dark:text-gray-300 text-center py-10 space-y-4">
            <p>Agente não encontrado.</p>
            <button
            onClick={() => navigate("/agentes")}
            className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary/90 transition-all"
            >
            Voltar
            </button>
        </div>
        );
    }

    // ✅ AQUI é onde você “coloca as alterações”:
    // passa onDanger / dangerLabel / dangerDisabled pro AgentForm
return (
    <>
        <AgentForm
            title="Editar Agente"
            submitLabel="Salvar Alterações"
            initialForm={initialForm}
            loading={saving}
            message={message}
            onSubmit={handleSubmit}
            onDanger={handleDelete}
            dangerLabel={deleting ? "Excluindo..." : "Excluir Agente"}
            dangerDisabled={deleting}
        />

        <ConfirmDialog
            open={confirmOpen}
            danger
            loading={deleting}
            title="Excluir agente"
            description={`Tem certeza que deseja excluir o agente "${initialForm.name}"? Essa ação não pode ser desfeita.`}
            confirmText="Sim, excluir"
            cancelText="Cancelar"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={confirmDelete}
        />
    </>
);
}
