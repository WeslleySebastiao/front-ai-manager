import React, { useState } from 'react'
import FormInput from '../../components/FormInput'
import FormSelect from '../../components/FormSelect'
import FormTextarea from '../../components/FormTextarea'
import CheckboxCard from '../../components/CheckboxCard'
import PrimaryButton from '../../components/PrimaryButton'
import { createAgent } from '../../../services/agentService'

export default function CriarNovoAgente() {
  const [tools, setTools] = useState({ web: false, calc: false, calendar: false })

  function toggleTool(key: keyof typeof tools, value: boolean) {
    setTools((t) => ({ ...t, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = new FormData(e.currentTarget as HTMLFormElement)

    const payload = {
      nome: data.get('nome') as string,
      modelo: data.get('modelo') as string,
      prompt: data.get('prompt') as string,
      ferramentas: Object.keys(tools).filter((k) => (tools as any)[k]),
    }

    try {
      await createAgent(payload)
      alert('Agente criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar agente:', error)
      alert('Erro ao criar agente. Veja o console.')
    }
  }

  return (
    <main className="flex-1 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-gray-900 dark:text-white text-4xl font-black mb-8">Criar Novo Agente</h1>

        <form className="space-y-8 bg-white dark:bg-[#1C1F27]/60 rounded-xl p-8 border border-gray-200 dark:border-[#3b4354]/40" onSubmit={handleSubmit}>
          <FormInput id="agent-name" name="nome" label="Nome" placeholder="Ex: Agente de Suporte ao Cliente" required />
          <FormSelect id="agent-model" name="modelo" label="Modelo" options={['GPT-4 Turbo', 'Claude 3 Sonnet', 'Gemini Pro']} />
          <FormTextarea id="agent-prompt" name="prompt" label="Prompt" placeholder="Descreva o comportamento, o papel e os objetivos do agente..." required />

          <div>
            <p className="text-gray-800 dark:text-white text-base font-medium pb-3">Ferramentas Permitidas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <CheckboxCard label="Busca na Web" checked={tools.web} onChange={(v) => toggleTool('web', v)} />
              <CheckboxCard label="Calculadora" checked={tools.calc} onChange={(v) => toggleTool('calc', v)} />
              <CheckboxCard label="API de Calendário" checked={tools.calendar} onChange={(v) => toggleTool('calendar', v)} />
            </div>
          </div>

          <div className="flex justify-end">
            <PrimaryButton type="submit">Salvar</PrimaryButton>
          </div>
        </form>
      </div>
    </main>
  )
}
