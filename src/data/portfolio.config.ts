// ============================================================
//  PORTFOLIO CONFIG — edite aqui para atualizar a landing page
// ============================================================

export const profile = {
  name: "Weslley da Costa Sebastião",
  title: "Analista de TI Jr.",
  titleHighlight: "& AI Engineer",
  bio: "Desenvolvedor focado em Inteligência Artificial e arquitetura de sistemas. Atuo na criação de plataformas de agentes, APIs escaláveis e soluções que transformam problemas reais em produtos inteligentes. Experiência com orquestração de LLMs, integrações corporativas e desenvolvimento full stack orientado a performance e simplicidade.",
  avatar: null as string | null,
  ctaResume: "Ver Currículo",
  ctaLogin: "Acessar Coordina",
}

export type ProjectStatus = "Em produção" | "Em desenvolvimento" | "Arquivado"

export type Project = {
  id: number
  name: string
  description: string
  tags: string[]
  link: string
  highlight: boolean
  status: ProjectStatus
}

export const projects: Project[] = [

    {
    id: 1,
    name: "Coordina",
    description:
      "Interface web e backend para gerenciamento de agentes e conversas. Permite controle de sessões, testes de prompts, monitoramento de respostas e configuração de comportamento dos agentes.",
    tags: ["React", "Vite", "TailwindCSS", "TypeScript"],
    link: "https://github.com/",
    highlight: true,
    status: "Em desenvolvimento",
  },
  {
    id: 2,
    name: "A2A Orchestrator",
    description:
      "Orquestrador inteligente para comunicação entre agentes. Responsável por roteamento de intenções, gestão de contexto, controle de sessões e execução distribuída de tarefas entre múltiplos agentes.",
    tags: [
      "Python",
      "LLM",
      "Orquestração",
      "Redis",
      "Arquitetura de Microserviços"
    ],
    link: "https://github.com/",
    highlight: true,
    status: "Arquivado",
  },

    {
    id: 3,
    name: "Luna AI Platform",
    description:
      "Plataforma corporativa para criação, execução e orquestração de agentes de IA. Suporte a múltiplos modelos, integrações com serviços internos, gerenciamento de sessões, memória, autenticação e arquitetura A2A (Agent-to-Agent).",
    tags: [
      "Python",
      "FastAPI",
      "LLM",
      "Azure",
      "Redis",
      "Arquitetura de Agentes",
      "APIs REST"
    ],
    link: "",
    highlight: true,
    status: "Em desenvolvimento",
  }
]

export type SocialIcon = "github" | "linkedin" | "mail"

export type Social = {
  label: string
  url: string
  icon: SocialIcon
}

export const socials: Social[] = [
  { label: "GitHub",   url: "https://github.com/WeslleySebastiao", icon: "github" },
  { label: "LinkedIn", url: "https://www.linkedin.com/in/weslleysebastiao/", icon: "linkedin" },
  { label: "Email",    url: "mailto:weslley.sebastiao@gmail.com", icon: "mail" },
]

export const skills: string[] = [
  "Python",
  "FastAPI",
  "Node.js",
  "React",
  "TypeScript",
  "SQL Server",
  "PostgreSQL",
  "Azure",
  "LLM / AI",
  "Arquitetura de Agentes",
  "Orquestração de IA",
  "REST APIs",
  "Microserviços",
  "Git"
]
